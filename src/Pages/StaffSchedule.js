import React, { useState, useEffect } from "react";
import { Container, Table, Form, Button } from "react-bootstrap";
import { BsPlus, BsTrash } from "react-icons/bs";
import "bootstrap/dist/css/bootstrap.min.css";
import moment from "moment";



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

// Function to calculate the number of weekdays in the selected month, used for computing total monthly hours.
const getWeekdaysInMonth = (year, month) => {
  let weekdays = 0;
  const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = moment(`${year}-${month}-${day}`, "YYYY-MM-DD").day();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) weekdays++; // Excluding weekends
  }
  return weekdays;
};

const StaffSchedule = () => {
  const [staffList, setStaffList] = useState([{ name: "", hours: 0, totalWeekHours: 0 , avoidWeekends: false, allowNightShifts: false}]);
  const [shifts, setShifts] = useState({});
  const [unassignedShifts, setUnassignedShifts] = useState({});

  // State variables to track the selected month and year for dynamic calculation of working hours.
  const [selectedMonth, setSelectedMonth] = useState(moment().format("MM"));
  const [selectedYear, setSelectedYear] = useState(moment().format("YYYY"));
  
  // Effect hook to recalculate monthly hours whenever month, year, or staff list changes.
  useEffect(() => {
    updateMonthlyHours();
  }, [selectedMonth, selectedYear, staffList]);

  // Function to update total month hours based on the number of weekdays in the selected month.
  const updateMonthlyHours = () => {
    const weekdays = getWeekdaysInMonth(selectedYear, selectedMonth);
    setStaffList(staffList.map(staff => ({
      ...staff,
      totalMonthHours: staff.hours ? (staff.hours / 5) * weekdays : 0
    })));
  };

  const handleChange = (index, field, value) => {
    const updatedList = staffList.map((staff, i) =>
      i === index ? { ...staff, [field]: value } : staff
    );
    setStaffList(updatedList);
  };

  

  // ... (keep addRow, handleChange, removeRow functions the same)
  const addRow = () => {
    setStaffList([...staffList, { name: "", hours: 0, totalWeekHours: 0 }]);
  };

  // const handleChange = (index, field, value) => {
  //   const updatedList = staffList.map((staff, i) =>
  //     i === index ? { ...staff, [field]: value } : staff
  //   );
  //   setStaffList(updatedList);
  // };

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
          // if (currentHours + shiftHours >= staff.hours) continue;
          if (currentHours + shiftHours > maxHours) continue;
          
          // Prefrences check
          if (shiftType === "night" && !staff.allowNightShifts) continue; // Assign night shift only if allowed
          if (["SATURDAY", "SUNDAY"].includes(day) && staff.avoidWeekends) continue; // Skip weekends if avoided

          
  
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
      avoidWeekends: staff.avoidWeekends,
      allowNightShifts: staff.allowNightShifts,
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
  

  // MAIN CONTENT
  return (
    <Container className="mt-4 mb-5 px-3 px-md-5">
    <h2 className="text-center display-5 fw-bold my-4" style={{ color: "#592693" }}>
      STAFF DETAILS
    </h2>
    
    {/* Dropdowns for month & year selection */}
    <div className="d-flex flex-wrap gap-2 justify-content-center">
      <Form.Select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="w-auto"
      >
        {moment.months().map((month, index) => (
          <option key={index} value={String(index + 1).padStart(2, "0")}>
            {month}
          </option>
        ))}
      </Form.Select>
      <Form.Select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="w-auto"
      >
        {[...Array(5)].map((_, i) => {
          const year = moment().year() - 2 + i;
          return (
            <option key={year} value={year}>
              {year}
            </option>
          );
        })}
      </Form.Select>
    </div>

    {/* Staff Details Form */}
    <div className="my-4 ">
      {staffList.map((staff, index) => (
        <div key={index} className="d-flex flex-wrap gap-2 justify-content-center align-items-center mb-2">
          <Form.Control
            type="text"
            placeholder="Name"
            value={staff.name}
            onChange={(e) => handleChange(index, "name", e.target.value)}
            className="w-25"
          />
          <Form.Control
            type="number"
            placeholder="Hours"
            value={staff.hours}
            onChange={(e) => handleChange(index, "hours", parseFloat(e.target.value))}
            className="w-25"
          />
          <Form.Check
            type="checkbox"
            label="W-Off"
            checked={staff.avoidWeekends}
            onChange={(e) => handleChange(index, "avoidWeekends", e.target.checked)}
            className=""
          />
          <Form.Check
            type="checkbox"
            label="N-Off"
            checked={staff.allowNightShifts}
            onChange={(e) => handleChange(index, "allowNightShifts", e.target.checked)}
            className=""
          />
          <Button variant="danger" size="sm" onClick={() => removeRow(index)}>
            <BsTrash size={13}/>
          </Button>
        </div>
      ))}
      
      <div className="d-flex flex-wrap gap-2 justify-content-center">
       
        <Button className="mt-3 mb-4" style={{ backgroundColor: "#4D0FD8" }} onClick={addRow}>
          <BsPlus /> Add Staff
        </Button>

      </div>
      <div className="d-flex flex-wrap justify-content-center">
        <p className=""><span className="fw-bold">W-0ff</span> means Weekend Off <span className="ms-3 fw-bold">N-Off</span> <span> means opt in for night shifs </span></p>
      </div>
      
    </div>
    
    {/* Rota Table */}
    <section className="mt-5">
      <h2 className="text-center display-5 fw-bold my-4" style={{ color: "#592693" }}>STAFF ROTA</h2>
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th style={{ backgroundColor: "#9E7BB3" }}>NAME</th>
              <th style={{ backgroundColor: "#9E7BB3" }}>HOURS</th>
              {Object.keys(shiftPatterns).map((day) => (
                <th key={day} style={{ backgroundColor: "#9E7BB3" }}>{day}</th>
              ))}
              <th style={{ backgroundColor: "#9E7BB3" }}>WEEKLY HOURS</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff, index) => (
              <tr key={index}>
                <td className="fw-bold" style={{ backgroundColor: "#C8A2A9" }}>{staff.name}</td>
                <td className="fw-bold" style={{ backgroundColor: "#C8A2A9" }}>{staff.hours}</td>
                {Object.keys(shiftPatterns).map((day) => (
                  <td key={day} style={{ backgroundColor: "#C8A2A9" }}>
                    {shifts[day]?.[staff.name] && (
                      <div
                        style={{
                          backgroundColor: shiftColors[shifts[day][staff.name]],
                          padding: "5px",
                          borderRadius: "4px",
                        }}
                      >
                        {shifts[day][staff.name]}
                      </div>
                    )}
                  </td>
                ))}
                <td className="fw-bold" style={{ backgroundColor: "#C8A2A9" }}>{staff.totalWeekHours}</td>
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
                  <td colSpan="2" style={{  }}>BANK SHIFT</td>
                  {Object.keys(shiftPatterns).map(day => (
                    <td key={day} >
                      <div style={{ 
                      backgroundColor: shiftColors[shiftsForRow[day]],
                      padding: "5px",
                      borderRadius: "4px"
                    }}>
                        {shiftsForRow[day]}
                      </div>
                      
                    </td>
                  ))}
                  <td ></td>
                </tr>
              ) : null;
            })}
          </tbody>
        </Table>
      </div>

      <Button onClick={assignShifts} className="mt-3" style={{ backgroundColor: "#4D0FD8" }}>
        Assign / Reassign Shifts
      </Button>

    </section>
    
  </Container>
  );
};

export default StaffSchedule;