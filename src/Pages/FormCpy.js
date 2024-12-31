import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form as BootstrapForm, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../style/form.css"; // Custom CSS for additional styling


// for savetofirebase
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth"; // Firebase auth

// import to authenticate current users
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "../AuthProvider";

// firestore import
import firestore from "../firebaseConfig";

const Form = () => {
  const { user, loading } = useAuth();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [contractHours, setContractHours] = useState(40);
  const [contractType, setContractType] = useState("");
  const [days, setDays] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(11.95);
  const [carryForward, setCarryForward] = useState(0); // Carry forward hours for overtime or time owed
  const [previousCarryForward, setPreviousCarryForward] = useState(0); // Carry-forward from the previous month

  const [expectedHours, setExpectedHours] = useState(0);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const workingDaysInWeek = 5;


  const [authenticated, setAuthenticated] = useState(true); // Declare authenticated state


  // persistence solution
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const [formState, setFormState] = useState({
    days: Array.from({ length: 31 }, () => ({
      timeStart: "",
      timeEnd: "",
      notes: "",
    })),
  });


  const navigate = useNavigate();


  // Load carry forward data from local storage for the current month
  const loadCarryForward = (month, year) => {
    const previousMonth = month === 0 ? 11 : month - 1;
    const previousYear = month === 0 ? year - 1 : year;

    const previousKey = `carry-forward-${previousYear}-${previousMonth}`;
    const carryForwardValue = parseFloat(localStorage.getItem(previousKey)) || 0;

    setPreviousCarryForward(carryForwardValue);
  };


  // Carry-forward logic
  useEffect(() => {
    const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const previousKey = `carry-forward-${previousYear}-${previousMonth}`;
    const carryForwardValue = parseFloat(localStorage.getItem(previousKey)) || 0;
    setPreviousCarryForward(carryForwardValue);
  }, [selectedMonth, selectedYear]);



  // Save current month's carry forward to local storage
  const saveCarryForward = (value) => {
    const key = `carry-forward-${selectedYear}-${selectedMonth}`;
    localStorage.setItem(key, value.toFixed(2));
  };



  // Fix for imediate update contract hours
  useEffect(() => {
    // Recalculate expected hours based on updated contractHours
    const updatedExpectedHours = calculateExpectedHours();
    setExpectedHours(updatedExpectedHours);
  
    // Recalculate annual expected hours
    const updatedAnnualExpectedHours = calculateAnnualExpectedHours();
    setAnnualExpectedHours(updatedAnnualExpectedHours);
  
    // Update annual and monthly pay based on new contractHours
    const updatedAnnualPay = (updatedAnnualExpectedHours * hourlyRate).toFixed(2);
    setAnnualPay(updatedAnnualPay);
  
    const updatedMonthlyPay = (updatedAnnualPay / 12).toFixed(2);
    setMonthlyPay(updatedMonthlyPay);
  
    // Optionally log updates for debugging
    console.log(`Contract Hours: ${contractHours}`);
    console.log(`Expected Hours: ${updatedExpectedHours}`);
    console.log(`Annual Expected Hours: ${updatedAnnualExpectedHours}`);
    console.log(`Annual Pay: £${updatedAnnualPay}`);
    console.log(`Monthly Pay: £${updatedMonthlyPay}`);
  }, [contractHours, hourlyRate]);
  


  useEffect(() => {
    generateDays(selectedMonth, selectedYear);
    setExpectedHours(calculateExpectedHours());
    loadCarryForward(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);


  

  // save to firebase
  const saveToFirestore = async () => {
      if (!user) {
          console.warn("No authenticated user. Cannot save data.");
          return;
      }

      const key = `user-data-${selectedYear}-${selectedMonth + 1}`;
      const userDocRef = doc(db, "userInputs", user.uid);
      const newData = {
          [key]: { days, carryForward },
      };

      try {
          await setDoc(userDocRef, newData, { merge: true });
          console.log("Data successfully saved to Firestore:", newData);
      } catch (error) {
          console.error("Error saving data to Firestore:", error);
      }
  };
  


  // Firestore Load Logic
  const loadFromFirestore = async (month,year) => {
    if (!user) return;
  
    const key = `user-data-${year}-${month + 1}`;
    const userDocRef = doc(db, "userInputs", user.uid);
  
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const savedData = userDoc.data()[key];
        if (savedData) {
          // Load data into state if found
          setDays(savedData.days || []);
          setCarryForward(savedData.carryForward || 0);
        } else {
          // Generate empty days if no data is found
          generateEmptyDays(selectedMonth, selectedYear)
        }
      } else {
        // Generate empty days if user document doesn't exist
        generateEmptyDays(selectedMonth, selectedYear)
      }
    } catch (error) {
      console.error("Error loading data from Firestore:", error);
    }
  };
  



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        loadFromFirestore();
      } else {
        navigate("/");
      }
    });
  
    return () => unsubscribe(); // Cleanup listener on unmount
  }, [navigate]);
  



  // Handle logout
  const handleSignOut = async () => {
    try {
      if (user) {
        await saveToFirestore(); // Save data before logout
        console.log("saved on logout.")
      }
      await signOut(auth);
      console.log("Logged out successfully.");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  
  
  

  // Modified generateDays to avoid overwriting state unnecessarily
  const generateDays = (month, year) => {
    if (days.length > 0) return; // Prevent overwriting existing data
    const numDays = new Date(year, month + 1, 0).getDate();
    const newDays = Array.from({ length: numDays }, (_, index) => ({
      day: index + 1,
      timeStart: "",
      timeEnd: "",
      timeDifference: "",
    }));
    setDays(newDays);
  };

  // generate days with empty inputs to display when no data is saved /can be loaded from firestore
  const generateEmptyDays = (month, year) => {
    // Assuming you want to generate an empty form for the whole month
    const numberOfDays = new Date(year, month, 0).getDate(); // Get number of days in the selected month
    const emptyDays = Array.from({ length: numberOfDays }, (_, index) => ({
      timeStart: "",
      timeEnd: "",
      day: index + 1,
    }));
  
    // Update the state with empty form data
    setDays(emptyDays);
    setCarryForward(0);  // Reset carry forward if needed
  };

  // When month or year changes, fetch data from Firestore
  useEffect(() => {
    if (user) {
      loadFromFirestore(selectedMonth, selectedYear);
    }
  }, [user, selectedMonth, selectedYear]);


  // Prevent overwriting when switching between months/years
  const handleMonthYearChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    // Load Firestore data for the new selection
    loadFromFirestore(month, year);
  };
  

  const calculateTotalWorkingDays = (month, year) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    for (let i = 1; i <= numDays; i++) {
      const day = new Date(year, month, i).getDay();
      if (day !== 0 && day !== 6) workingDays++; // Exclude Sundays (0) and Saturdays (6)
    }
    return workingDays;
  };

  const calculateDifference = (timeStart, timeEnd) => {
    if (!timeStart || !timeEnd) return "";

    const [startHours, startMinutes] = timeStart.split(":").map(Number);
    const [endHours, endMinutes] = timeEnd.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    let differenceMinutes =
      endTotalMinutes >= startTotalMinutes
        ? endTotalMinutes - startTotalMinutes
        : 24 * 60 - startTotalMinutes + endTotalMinutes;

    return (differenceMinutes / 60).toFixed(2);
  };


  // handle contract hours change
  const handleContractHoursChange = (value) => {
    setContractHours(value);  // Only update local state, no Firestore save 
  };


  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSaveToFirestore = debounce(saveToFirestore, 500);


  // handleinput change
  const handleInputChange = (index, field, value) => {
    const updatedDays = days.map((day, dayIndex) => {
      if (dayIndex === index) {
        const updatedDay = { ...day, [field]: value };
        if (field === "timeStart" || field === "timeEnd") {
          updatedDay.timeDifference = calculateDifference(updatedDay.timeStart, updatedDay.timeEnd);
        }
        return updatedDay;
      }
      return day;
    });
    setDays(updatedDays);

    // Update carry-forward and save to Firestore
    const overtimeOrTimeOwed = totalHours - expectedHours + carryForward;
    setCarryForward(overtimeOrTimeOwed);

    debouncedSaveToFirestore();
  };
  
  
  
  const totalDaysWithInput = days.filter(
    (day) => day.timeStart && day.timeEnd
  ).length;


  const totalHours = days
    .filter((day) => day.timeDifference)
    .reduce((acc, day) => acc + parseFloat(day.timeDifference), 0);


  useEffect(() => {
    if (user && days.length === 0) {
      // Only load data if user is authenticated and no data is currently loaded
      loadFromFirestore();
    }
  }, [user, selectedMonth, selectedYear, days]);

  const netTimeOwedOrOvertime = Math.abs(totalHours - expectedHours + previousCarryForward);
  

  useEffect(() => {
    saveCarryForward(netTimeOwedOrOvertime);
  }, [netTimeOwedOrOvertime]);

  useEffect(() => {
    const overtimeOrTimeOwed = totalHours - expectedHours + carryForward;
    setCarryForward(overtimeOrTimeOwed);
    // saveToLocalStorage();
    saveToFirestore();
  }, [days, expectedHours]);


  // NEW
  // Calculate and update the carry-forward (time owed or overtime) when the hours are updated
  useEffect(() => {
    const netTimeOwedOrOvertime = Math.abs(totalHours - expectedHours + previousCarryForward);
    setCarryForward(netTimeOwedOrOvertime);  // Update carry-forward state
    saveCarryForward(netTimeOwedOrOvertime);  // Save to localStorage for persistence
  }, [totalHours, expectedHours, previousCarryForward]);



  const calculateExpectedHours = () => {
    const totalWorkingDays = calculateTotalWorkingDays(selectedMonth, selectedYear);
    const hoursPerDay = contractHours / workingDaysInWeek;
    return (hoursPerDay * totalWorkingDays).toFixed(2);
  };

 

  // To calculate the total expected hours monthly for estimating the annual and monthly basic pay
  const calculateExpectedHoursForMonth = (month, year) => {
    const totalWorkingDays = calculateTotalWorkingDays(month, year);
    const hoursPerDay = contractHours / workingDaysInWeek;
    return totalWorkingDays * hoursPerDay;
  };


  // To calculate the total expected hours annually for calculating the annual and monthly basic pay
  const calculateAnnualExpectedHours = () => {
    let totalHours = 0;
    for (let month = 0; month < 12; month++) {
      totalHours += calculateExpectedHoursForMonth(month, selectedYear);
    }
    return totalHours.toFixed(2);
  };


  // Recalculate annual and monthly pay functions
  const [annualExpectedHours, setAnnualExpectedHours] = useState(0);
  const [annualPay, setAnnualPay] = useState(0);
  const [monthlyPay, setMonthlyPay] = useState(0);

  useEffect(() => {
    const updatedAnnualExpectedHours = calculateAnnualExpectedHours();
    setAnnualExpectedHours(updatedAnnualExpectedHours);

    const updatedAnnualPay = (updatedAnnualExpectedHours * hourlyRate).toFixed(2);
    setAnnualPay(updatedAnnualPay);

    setMonthlyPay((updatedAnnualPay / 12).toFixed(2));
  }, [selectedYear, contractHours, hourlyRate]);

  useEffect(() => {
    generateDays(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);


  // const grossPay = (parseFloat(monthlyPay) + (hourlyRate * previousCarryForward)).toFixed(2);
  const grossPay = previousCarryForward > 0
  ? (parseFloat(monthlyPay) + (hourlyRate * previousCarryForward)).toFixed(2)
  : parseFloat(monthlyPay).toFixed(2);

  console.log(`Gross Pay: $${grossPay}`);


  

  return (
    <div className="bg-primary min-vh-100 d-flex justify-content-center align-items-center py-5">
      <Container className="bg-light p-4 rounded shadow-lg my-5">
        <h2 className="text-center mb-4">Calendar Time Difference Calculator</h2>
        
        {/* Input Form Section */}
        {/* Contract Details Inputs */}
        <Row className="mb-4">
          <Col md={6}>
            <BootstrapForm.Group controlId="contractTypeSelector">
              <BootstrapForm.Label>Contract Type</BootstrapForm.Label>
              <BootstrapForm.Select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
              >
                <option value="">Select Contract Type</option>
                <option value="Contract">Contract</option>
                <option value="Bank">Bank</option>
              </BootstrapForm.Select>
            </BootstrapForm.Group>
          </Col>
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Contracted Hours</BootstrapForm.Label>
              <BootstrapForm.Control
                type="number"
                value={contractHours}
                // onChange={(e) => setContractHours(Number(e.target.value))}
                onChange={(e) => handleContractHoursChange(e.target.value)}
                placeholder="Enter contract hours"
              />
            </BootstrapForm.Group>
          </Col>
        </Row>

        {/* Month and Year Selectors Inputs */}
        <Row className="mb-5">
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Month</BootstrapForm.Label>
              <BootstrapForm.Select
                value={selectedMonth}
                // onChange={(e) => setSelectedMonth(Number(e.target.value))}
                onChange={(e) => handleMonthYearChange(Number(e.target.value), selectedYear)}
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
                // onChange={(e) => setSelectedYear(Number(e.target.value))}
                onChange={(e) => handleMonthYearChange(selectedMonth, Number(e.target.value))}
              />
            </BootstrapForm.Group>
          </Col>
        </Row>

        {/* Hourly Rate Inputs */}
        <Row className="mb-4">
          <Col md={6}>
            <BootstrapForm.Group>
              <BootstrapForm.Label>Hourly Rate</BootstrapForm.Label>
              <BootstrapForm.Control
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                min="1"
              />
            </BootstrapForm.Group>
          </Col>
        </Row>



        {/* Responsive Calendar Grid */}


        <div className="calendar-container my-5">
          {/* Weekday Header */}
          <div
            className="calendar-header d-grid"
            style={{
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className="bg-white text-dark py-2 mx-1 rounded border border-2 border-dark weekday"
                style={{
                  fontSize: "0.9rem",
                  wordWrap: "break-word",
                  minWidth: "40px",
                  gap:'20px'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className="calendar-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px",
            }}
          >
            {days.map((day, index) => {
              const isComplete = day.timeStart && day.timeEnd;
              return (
                <div
                  key={index}
                  className={`calendar-day p-2 rounded text-center ${
                    isComplete ? "bg-success text-white" : "bg-secondary text-white"
                  }`}
                  style={{
                    minWidth: "40px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <h6 className="fw-bold" style={{ fontSize: "1rem" }}>
                    {day.day}
                  </h6>
                  <BootstrapForm.Control
                    type="time"
                    value={day.timeStart}
                    onChange={(e) => handleInputChange(index, "timeStart", e.target.value)}
                    className="mb-2 time-input"
                  />
                  <BootstrapForm.Control
                    type="time"
                    value={day.timeEnd}
                    onChange={(e) => handleInputChange(index, "timeEnd", e.target.value)}
                    className="mb-2 time-input"
                  />
                  <p
                    className="fw-bold"
                    style={{
                      fontSize: "0.9rem",
                      wordWrap: "break-word",
                      maxWidth: "100%",
                    }}
                  >
                    {day.timeDifference ? `${day.timeDifference} hrs` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>






        {/* Summary Section */}
        {/* Hours Summary */}
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

        {/* Overtime or Time Owed Summary*/}
        <Row className="mt-3">
          <Col>
            <Card
              className={`text-center shadow ${
                totalHours - expectedHours > 0 ? "bg-success text-white" : "bg-danger text-white"
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

        {/* Pay Summary */}
        <Row className="mt-4">
          <Col md={6}>
            <Card className="text-center bg-primary text-white shadow">
              <Card.Body>
                <Card.Title>Monthly Basic Pay</Card.Title>
                <Card.Text>£{monthlyPay}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center bg-secondary text-white shadow">
              <Card.Body>
                <Card.Title>Annual Basic Pay</Card.Title>
                <Card.Text>£{annualPay}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col>
            <Card 
              className={`text-center shadow ${
                previousCarryForward.toFixed(2)> 0 ? "bg-success text-white" : "bg-danger text-white"
              }`}
            >
              <Card.Body>
                <Card.Title>{previousCarryForward.toFixed(2)> 0 > 0 ? "Previous Month Overtime" : "Previous Month Time Owed"}</Card.Title>
                <Card.Text>{previousCarryForward.toFixed(2)} hrs</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card 
              className={`text-center shadow ${
                netTimeOwedOrOvertime.toFixed(2)> 0 ? "bg-success text-white" : "bg-danger text-white"
              }`}
            >
              <Card.Body>
                <Card.Title>{netTimeOwedOrOvertime.toFixed(2)> 0 > 0 ? "Total Overtime" : "Total Time Owed"}</Card.Title>
                <Card.Text>{netTimeOwedOrOvertime.toFixed(2)} hrs</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col>
            <Card 
              className='text-center shadow'
            >
              <Card.Body>
                <Card.Title>Monthly Gross Pay</Card.Title>
                <Card.Text>£{grossPay}</Card.Text>
              </Card.Body>
            </Card>
          </Col>


        </Row>
        <Row>
          <Col>
            <button onClick={handleSignOut}>Sign Out</button>
          </Col>
        </Row>




        
      </Container>
    </div>
  );
};

export default Form;