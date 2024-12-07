import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form as BootstrapForm, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../style/form.css"; // Custom CSS for additional styling

const Form = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [contractHours, setContractHours] = useState(40);
  const [contractType, setContractType] = useState("");
  const [days, setDays] = useState([]);
  const [expectedHours, setExpectedHours] = useState(0);

  const workingDaysInWeek = 5;

  // Generate calendar days
  const generateDays = (month, year) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    const newDays = Array.from({ length: numDays }, (_, index) => ({
      day: index + 1,
      timeStart: "",
      timeEnd: "",
      timeDifference: "",
    }));
    setDays(newDays);
  };

  const calculateTotalWorkingDays = (month, year) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;

    for (let i = 1; i <= numDays; i++) {
      const day = new Date(year, month, i).getDay();
      if (day !== 0 && day !== 6) workingDays++; // Exclude Sunday (0) and Saturday (6)
    }

    return workingDays;
  };

  const calculateExpectedHours = () => {
    const totalWorkingDays = calculateTotalWorkingDays(selectedMonth, selectedYear);
    const hoursPerDay = contractHours / workingDaysInWeek;
    return (hoursPerDay * totalWorkingDays).toFixed(2);
  };

  const calculateDifference = (timeStart, timeEnd) => {
    if (!timeStart || !timeEnd) return "";

    const [startHours, startMinutes] = timeStart.split(":").map(Number);
    const [endHours, endMinutes] = timeEnd.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    let differenceMinutes;

    if (endTotalMinutes >= startTotalMinutes) {
      differenceMinutes = endTotalMinutes - startTotalMinutes;
    } else {
      differenceMinutes = 24 * 60 - startTotalMinutes + endTotalMinutes;
    }

    return (differenceMinutes / 60).toFixed(2);
  };

  const handleInputChange = (index, field, value) => {
    const updatedDays = days.map((day, dayIndex) => {
      if (dayIndex === index) {
        const updatedDay = { ...day, [field]: value };

        if (field === "timeStart" || field === "timeEnd") {
          updatedDay.timeDifference = calculateDifference(
            updatedDay.timeStart,
            updatedDay.timeEnd
          );
        }

        return updatedDay;
      }
      return day;
    });

    setDays(updatedDays);
  };

  const totalDaysWithInput = days.filter(
    (day) => day.timeStart && day.timeEnd
  ).length;

  const totalHours = days
    .filter((day) => day.timeDifference)
    .reduce((acc, day) => acc + parseFloat(day.timeDifference), 0)
    .toFixed(2);

  useEffect(() => {
    generateDays(selectedMonth, selectedYear);
    setExpectedHours(calculateExpectedHours());
  }, [selectedMonth, selectedYear, contractHours]);

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="bg-primary min-vh-100 d-flex justify-content-center align-items-center">
      <Container className="bg-light p-4 rounded shadow-lg">
        <h2 className="text-center mb-4">Calendar Time Difference Calculator</h2>

        {/* Contract Details */}
        <Row className="mb-4">
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Contract Type</BootstrapForm.Label>
              <BootstrapForm.Control
                type="text"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
              />
            </BootstrapForm.Group>
          </Col>
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Contracted Hours</BootstrapForm.Label>
              <BootstrapForm.Control
                type="number"
                value={contractHours}
                onChange={(e) => setContractHours(Number(e.target.value))}
              />
            </BootstrapForm.Group>
          </Col>
        </Row>

        {/* Month and Year Selectors */}
        <Row className="mb-5">
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Month</BootstrapForm.Label>
              <BootstrapForm.Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index} value={index}>
                    {new Date(0, index).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </BootstrapForm.Select>
            </BootstrapForm.Group>
          </Col>
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Year</BootstrapForm.Label>
              <BootstrapForm.Control
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              />
            </BootstrapForm.Group>
          </Col>
        </Row>

        {/* Responsive Calendar Grid */}
        <div className="calendar-container my-5">
          <div
            className="d-grid"
            style={{
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            {daysOfWeek.map((day, index) => (
              <div key={index} className="bg-white text-dark py-2 mx-1 rounded border border-2 border-dark">{day}</div>
            ))}
          </div>

          <div
            className="d-grid"
            style={{
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px",
            }}
          >
            {days.map((day, index) => {
              const isComplete = day.timeStart && day.timeEnd;
              return (
                <div
                  key={index}
                  className={`p-2 rounded text-center ${isComplete ? "bg-success text-white" : "bg-secondary text-white"}`}
                >
                  <h6 className="fw-bold">{day.day}</h6>
                  <BootstrapForm.Control
                    type="time"
                    value={day.timeStart}
                    onChange={(e) => handleInputChange(index, "timeStart", e.target.value)}
                    className="mb-2"
                  />
                  <BootstrapForm.Control
                    type="time"
                    value={day.timeEnd}
                    onChange={(e) => handleInputChange(index, "timeEnd", e.target.value)}
                    className="mb-2"
                  />
                  <p className="fw-bold">{day.timeDifference ? `${day.timeDifference} hrs` : ""}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Section */}
        <Row className="mt-4">
          <Col md={4} sm={12} className="mb-3">
            <Card className="text-center bg-info text-white shadow">
              <Card.Body>
                <Card.Title>Total Days Worked</Card.Title>
                <Card.Text>{totalDaysWithInput}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} sm={12} className="mb-3">
            <Card className="text-center bg-warning text-dark shadow">
              <Card.Body>
                <Card.Title>Expected Hours</Card.Title>
                <Card.Text>{expectedHours} hrs</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} sm={12} className="mb-3">
            <Card className="text-center bg-success text-white shadow">
              <Card.Body>
                <Card.Title>Total Hours Worked</Card.Title>
                <Card.Text>{totalHours} hrs</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Overtime or Time Owed */}
        <Row className="mt-3">
          <Col>
            <Card
              className={`text-center shadow ${
                totalHours - expectedHours > 0 ? "bg-primary text-white" : "bg-danger text-white"
              }`}
            >
              <Card.Body>
                <Card.Title>
                  {totalHours - expectedHours > 0 ? "Overtime" : "Time Owed"}
                </Card.Title>
                <Card.Text>
                  {Math.abs(totalHours - expectedHours).toFixed(2)} hrs
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Form;
