import React, { useState } from "react";
import { Container, Table, Form, Button } from "react-bootstrap";
import { BsPlus, BsTrash } from "react-icons/bs";
import "bootstrap/dist/css/bootstrap.min.css";

const shiftPatterns = {
  MONDAY: ["08:00 - 20:00", "09:15 - 19:30", "10:00 - 19:30", "20:00 - 08:00"],
  TUESDAY: ["08:00 - 20:00", "09:15 - 19:30", "08:30 - 19:30", "20:00 - 08:00"],
  WEDNESDAY: ["08:00 - 20:00", "09:15 - 19:30", "10:30 - 19:30", "20:00 - 08:00"],
  THURSDAY: ["08:00 - 20:00", "09:15 - 19:30", "10:00 - 19:30", "20:00 - 08:00"],
  FRIDAY: ["08:00 - 20:00", "09:15 - 19:30", "10:00 - 19:30", "20:00 - 08:00"],
  SATURDAY: ["08:00 - 20:00", "09:15 - 19:30", "10:00 - 19:30", "20:00 - 08:00"],
  SUNDAY: ["08:00 - 20:00", "09:15 - 19:30", "10:00 - 19:30", "20:00 - 08:00"]
};

// Add this color mapping at the top of your file
const shiftColors = {
  "08:00 - 20:00": "#9dc6d8", // Light blue
  "09:15 - 19:30": "#b4eeb4", // Light green
  "10:00 - 19:30": "#fff3b8", // Light yellow
  "08:30 - 19:30": "#d3b8ff", // Light purple
  "10:30 - 19:30": "#ffd8b8", // Light orange
  "20:00 - 08:00": "#ffcccc"  // Light red (night shift)
};

const getShiftType = (shift) => {
  const [start] = shift.split(" - ");
  const startHour = parseInt(start.split(":")[0]);
  return startHour >= 20 || startHour < 8 ? "night" : "day";
};

const calculateHours = (shift) => {
  const [start, end] = shift.split(" - ").map(time => time.trim());
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  
  let duration = (endHour + (endHour < startHour ? 24 : 0)) - startHour;
  duration += (endMin - startMin) / 60;
  return duration;
};

const StaffSchedule = () => {
  const [staffList, setStaffList] = useState([{ name: "", hours: 0, totalWeekHours: 0 }]);
  const [shifts, setShifts] = useState({});
  const [unassignedShifts, setUnassignedShifts] = useState({});

  // ... (keep addRow, handleChange, removeRow functions the same)
  const addRow = () => {
    setStaffList([...staffList, { name: "", hours: 0, totalWeekHours: 0 }]);
  };

  const handleChange = (index, field, value) => {
    const updatedList = staffList.map((staff, i) =>
      i === index ? { ...staff, [field]: value } : staff
    );
    setStaffList(updatedList);
  };

  const removeRow = (index) => {
    const updatedList = staffList.filter((_, i) => i !== index);
    setStaffList(updatedList);
  };

  const daysOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const getNextDay = (currentDay) => {
    const index = daysOrder.indexOf(currentDay);
    return index < daysOrder.length - 1 ? daysOrder[index + 1] : null;
  };
  
  const assignShifts = () => {
    let assignedShifts = {};
    let totalHours = {};
    let remainingShifts = {};
    const staffData = staffList.map(staff => ({
      ...staff,
      preferredType: null,
      consecutiveDays: 0,
      lastShiftDay: null,
      lastShiftType: null,
      assignedDays: new Set(),
      shifts: {}
    }));
  
    // Initialize data structures
    daysOrder.forEach(day => {
      assignedShifts[day] = {};
      remainingShifts[day] = [];
    });
  
    staffList.forEach(staff => {
      totalHours[staff.name] = 0;
    });
  
    // Process days in order to enable consecutive assignments
    daysOrder.forEach(day => {
      // Get previous day in sequence
      const prevDay = daysOrder[daysOrder.indexOf(day) - 1];
      
      // Prioritize staff with consecutive days first
      const priorityStaff = staffData
        .filter(staff => 
          staff.lastShiftDay === prevDay &&
          !staff.assignedDays.has(day) &&
          totalHours[staff.name] + calculateHours(shiftPatterns[day][0]) <= staff.hours + 8
        )
        .sort(() => Math.random() - 0.5); // Randomize within priority group
  
      // Then consider other available staff
      const otherStaff = staffData
        .filter(staff => 
          !staff.assignedDays.has(day) &&
          staff.lastShiftDay !== prevDay
        )
        .sort(() => Math.random() - 0.5);
  
      const allCandidates = [...priorityStaff, ...otherStaff];
  
      // Process shifts in random order
      const shuffledShifts = [...shiftPatterns[day]].sort(() => Math.random() - 0.5);
      
      shuffledShifts.forEach(shift => {
        const shiftType = getShiftType(shift);
        const shiftHours = calculateHours(shift);
        let assigned = false;
  
        for (const staff of allCandidates) {
          if (staff.assignedDays.has(day)) continue;
          
          const currentHours = totalHours[staff.name] || 0;
          const maxHours = staff.hours + 8;
          
          // Check hour capacity
          if (currentHours + shiftHours > maxHours) continue;
  
          // Check shift type transitions
          if (staff.lastShiftType && staff.lastShiftType !== shiftType) {
            const lastDayIndex = daysOrder.indexOf(staff.lastShiftDay);
            const currentDayIndex = daysOrder.indexOf(day);
            const dayDifference = currentDayIndex - lastDayIndex;
            
            if (dayDifference < 2) continue;
          }
  
          // Check consecutive day availability
          if (staff.lastShiftDay && staff.lastShiftDay !== prevDay) {
            const lastIndex = daysOrder.indexOf(staff.lastShiftDay);
            const currentIndex = daysOrder.indexOf(day);
            if (currentIndex - lastIndex > 1) continue;
          }
  
          // Assign the shift
          staff.assignedDays.add(day);
          staff.shifts[day] = shift;
          totalHours[staff.name] = currentHours + shiftHours;
          staff.preferredType = staff.preferredType || shiftType;
          staff.lastShiftDay = day;
          staff.lastShiftType = shiftType;
          staff.consecutiveDays = day === prevDay ? staff.consecutiveDays + 1 : 1;
          
          assignedShifts[day][staff.name] = shift;
          assigned = true;
          break;
        }
  
        if (!assigned) remainingShifts[day].push(shift);
      });
    });
  
    setStaffList(staffData.map(staff => ({
      name: staff.name,
      hours: staff.hours,
      totalWeekHours: totalHours[staff.name] || 0
    })));
    
    setShifts(assignedShifts);
    setUnassignedShifts(remainingShifts);
  };
  
  // Helper function
  const getPreviousDay = (currentDay) => {
    const index = daysOrder.indexOf(currentDay);
    return index > 0 ? daysOrder[index - 1] : null;
  };
  

  return (
    <Container className="mt-4">
      <h2 className="display-5 fw-bold text-center">STAFF ROTA</h2>
      <div className="my-4">
        {staffList.map((staff, index) => (
          <div key={index} className="d-flex align-items-center mb-2">
            <Form.Control
              type="text"
              placeholder="Staff Name"
              value={staff.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
              className="me-2"
            />
            <Form.Control
              type="number"
              placeholder="Contracted Hours"
              value={staff.hours}
              onChange={(e) => handleChange(index, "hours", parseFloat(e.target.value))}
              className="me-2"
            />
            <Button variant="danger" onClick={() => removeRow(index)}>
              <BsTrash />
            </Button>
          </div>
        ))}
        <Button variant="primary" onClick={addRow}>
          <BsPlus /> Add Staff
        </Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>NAME</th>
            <th>CONTRACT HOURS</th>
            {Object.keys(shiftPatterns).map(day => <th key={day}>{day}</th>)}
            <th>TOTAL WEEK HOURS</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff, index) => (
            <tr key={index}>
              <td>{staff.name}</td>
              <td>{staff.hours}</td>
              {Object.keys(shiftPatterns).map(day => (
                <td key={day}>
                  {shifts[day]?.[staff.name] && (
                    <div style={{ 
                      backgroundColor: shiftColors[shifts[day][staff.name]],
                      padding: "5px",
                      borderRadius: "4px"
                    }}>
                      {shifts[day][staff.name]}
                    </div>
                  )}
                </td>
              ))}
              <td className="fw-bold">{staff.totalWeekHours}</td>
            </tr>
          ))}

          {Array.from({ length: 4 }).map((_, rowIndex) => {
            const shiftsForRow = {};
            let hasShifts = false;
            Object.keys(shiftPatterns).forEach(day => {
              const shift = unassignedShifts[day]?.[rowIndex];
              shiftsForRow[day] = shift || '';
              if (shift) hasShifts = true;
            });

            return hasShifts ? (
              <tr key={`bank-${rowIndex}`} style={{ backgroundColor: "##909090", color:'blue' }}>
                <td colSpan="2" style={{ backgroundColor: "#909090", color:'white' }}>BANK SHIFT</td>
                {Object.keys(shiftPatterns).map(day => (
                  <td key={day} style={{ backgroundColor: "#909090" }}>
                    <div style={{ 
                    backgroundColor: shiftColors[shiftsForRow[day]],
                    padding: "5px",
                    borderRadius: "4px"
                  }}>
                      {shiftsForRow[day]}
                    </div>
                    
                  </td>
                ))}
                <td style={{ backgroundColor: "#909090" }}></td>
              </tr>
            ) : null;
          })}
        </tbody>
      </Table>
      <Button variant="secondary" onClick={assignShifts} className="mt-3">Reassign Shifts</Button>
    </Container>
  );
};

export default StaffSchedule;