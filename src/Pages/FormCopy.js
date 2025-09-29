import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form as BootstrapForm, Card, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaSignOutAlt, FaClock, FaMoneyBillWave, FaCalendarAlt, FaArrowRight, FaCalculator } from "react-icons/fa";

// ... (all your existing imports remain the same)
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

const FormCopy = () => {
  // ... (all your existing state and logic remains the same)
   const { user, loading } = useAuth();
  
    const [isInitializing, setIsInitializing] = useState(true); // Tracks initialization status
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [contractHours, setContractHours] = useState();
    const [contractType, setContractType] = useState("Contract");
    
    // Add new state for company
    const [company, setCompany] = useState("My Company");
    const [days, setDays] = useState([]);
    const [hourlyRate, setHourlyRate] = useState(12.60);
    const [carryForward, setCarryForward] = useState(0); // Carry forward hours for overtime or time owed
    const [previousCarryForward, setPreviousCarryForward] = useState(0); // Carry-forward from the previous month
  
    const [expectedHours, setExpectedHours] = useState(0);
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const workingDaysInWeek = 5;
  
  
    const [authenticated, setAuthenticated] = useState(true); // Declare authenticated state

    // Determine if we should show detailed pay items
    const showDetailedPay = contractType === "Contract" && company === "My Company";

    
    // Determine what to show in Hours Summary
    const showExpectedHours = contractType !== "Bank";
    const showOvertime = contractType !== "Bank";
  
  
    // persistence solution
    const [selectedMonthYear, setSelectedMonthYear] = useState("");
  
  
    const navigate = useNavigate();

    // Extra insurance to scroll to top
    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);
  
  
  
    // Initilized Data Copy
    // const initializeData = async () => {
    //   console.log("Initializing data for:", selectedMonth + 1, selectedYear);
    
    //   if (!user) {
    //     console.warn("No authenticated user. Skipping initialization.");
    //     return;
    //   }
    
    //   setIsInitializing(true); // Begin initialization process
    
    //   // Attempt to load Firestore data
    //   const firestoreData = await loadFromFirestore(selectedMonth, selectedYear);
  
    //   if (firestoreData) {
    //     console.log("Firestore data loaded successfully:", firestoreData);
    //     // If Firestore data exists, update the state with the loaded data
    //     setDays(firestoreData.days || []);
    //     setCarryForward(firestoreData.carryForward || 0);
    //   } else {
    //     console.log("No Firestore data found. Generating empty days.");
    //     // If no Firestore data exists, generate empty days
    //     generateDays(selectedMonth, selectedYear);
    //   }
  
    //   setIsInitializing(false); // Mark initialization as complete
    // };

    // In your Form component - Update the initializeData function
      const initializeData = async () => {
        console.log("Initializing data for:", selectedMonth + 1, selectedYear);
        
        if (!user) {
          console.warn("No authenticated user. Skipping initialization.");
          return;
        }
        
        setIsInitializing(true);
        
        // Attempt to load Firestore data
        const firestoreData = await loadFromFirestore(selectedMonth, selectedYear);
        const userDocRef = doc(db, "userInputs", user.uid);

        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const savedData = userDoc.data();
            // Load contract hours if they exist
            if (savedData.contractHours !== undefined) {
              setContractHours(savedData.contractHours);
            }
            // Load company if it exists
            if (savedData.company) {
              setCompany(savedData.company);
            }
            // Load contract type if it exists
            if (savedData.contractType) {
              setContractType(savedData.contractType);
            }
            // Load hourly rate if it exists - ADD THIS
            if (savedData.hourlyRate !== undefined) {
              setHourlyRate(savedData.hourlyRate);
            }
          }
        } catch (error) {
          console.error("Error loading data:", error);
        }

        if (firestoreData) {
          setDays(firestoreData.days || []);
          setCarryForward(firestoreData.carryForward || 0);
        } else {
          generateDays(selectedMonth, selectedYear);
        }

        setIsInitializing(false);
     };

     // Add this useEffect to your Form component
      useEffect(() => {
        if (user && hourlyRate !== undefined && !isInitializing) {
          debouncedSaveToFirestore();
        }
      }, [hourlyRate]);
        
  
  
    // LoadFromFirestore logic
    const loadFromFirestore = async (month, year) => {
      console.log("Loading data from Firestore for:", month + 1, year);
    
      if (!user) {
        console.warn("No authenticated user. Cannot load data.");
        return null;
      }
    
      const key = `user-data-${year}-${month + 1}`;
      const userDocRef = doc(db, "userInputs", user.uid);
    
      try {
        const userDoc = await getDoc(userDocRef);
    
        if (userDoc.exists()) {
          const savedData = userDoc.data()[key];
          if (savedData) {
            console.log("Firestore data found:", savedData);
            // setDays(savedData.days || []);
            // setCarryForward(savedData.carryForward || 0);
            return savedData; // Data successfully loaded
          }
        }
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
      }
    
      console.warn("No data found in Firestore for this month/year.");
      return null; // Data not found
    };
  
  
    // generate days with empty inputs to display when no data is saved /can be loaded from firestore
    const generateDays = (month, year) => {
      // if (days.length > 0) return; // Prevent overwriting existing data
      // Calculate the number of days in the current month
      const numDays = new Date(year, month + 1, 0).getDate();
    
      // Get the last day of the previous month
      const previousMonthLastDate = new Date(year, month, 0);
      const previousMonthLastDay = previousMonthLastDate.getDay();
    
      // Determine the starting weekday for the new month
      // The next day after the previous month's last day
      const startingDayIndex = (previousMonthLastDay + 1) % 7;
    
      // Generate the days for the current month
      const newDays = Array.from({ length: numDays }, (_, index) => {
        const weekdayIndex = (startingDayIndex + index) % 7; // Calculate weekday index
        const dayName = daysOfWeek[weekdayIndex];
    
        return {
          day: index + 1,
          weekday: dayName, // Get the name of the weekday
          timeStart: "",
          timeEnd: "",
          timeDifference: "",
        };
      });
    
      setDays(newDays); // Update the days state
      console.log("Generated days for the calendar:", newDays);
    };
  
    // Handle Month and YearChange
    const handleMonthYearChange = (month, year) => {
      setSelectedMonth(month);
      setSelectedYear(year);
      // Load Firestore data for the new selection
      // loadFromFirestore(month, year);
      // initializeData(); // Reinitialize data for the new month/year
    };
  
    
    // save to firebase
    // const saveToFirestore = async () => {
    //   if (!user || isInitializing) {
    //     console.warn("No authenticated user. Cannot save data.");
    //     return;
    //   }
    
    //   const key = `user-data-${selectedYear}-${selectedMonth + 1}`;
    //   const userDocRef = doc(db, "userInputs", user.uid);
    //   const updatedData = {
    //     [key]: { days, carryForward },
    //   };
    
    //   try {
    //     await setDoc(userDocRef, updatedData, { merge: true });
    //     console.log("Data successfully updated in Firestore:", updatedData);
    //   } catch (error) {
    //     console.error("Error saving data to Firestore:", error);
    //   }
    // };

      // In your Form component - Update the saveToFirestore function to include all contract details
      const saveToFirestore = async () => {
        if (!user || isInitializing) {
          console.warn("No authenticated user. Cannot save data.");
          return;
        }

        const key = `user-data-${selectedYear}-${selectedMonth + 1}`;
        const userDocRef = doc(db, "userInputs", user.uid);
        
        // Include ALL contract details in the saved data
        const updatedData = {
          [key]: { 
            days, 
            carryForward 
          },
          company: company || "My Company", // Ensure company is always saved
          contractType: contractType || "Contract", // Ensure contract type is always saved
          contractHours: contractHours || 0,
          hourlyRate: hourlyRate || 12.60, // Ensure hourly rate is always saved
        };

        try {
          await setDoc(userDocRef, updatedData, { merge: true });
          console.log("✅ Data successfully updated in Firestore:", updatedData);
        } catch (error) {
          console.error("❌ Error saving data to Firestore:", error);
        }
      };



    // basis to remove

    // Add this useEffect to save contract hours when changed
    useEffect(() => {
      if (user && contractHours !== undefined) {
        saveToFirestore();
      }
    }, [contractHours]);
  
    // Initialize data when user or month/year changes
    useEffect(() => {
      if (user) {
        initializeData();
      }
    }, [user, selectedMonth, selectedYear]);
  
  
    // In your Form component
    useEffect(() => {
      if (!user) {
        navigate("/");
        return;
      }
      initializeData();
    }, [user, selectedMonth, selectedYear]);
  
  
  
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
  
  
      
      // // Save updates to Firestore using debounce
      debouncedSaveToFirestore();
  
    
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
  
  
    
    // When month or year changes, fetch data from Firestore
    useEffect(() => {
      if (user) {
          loadFromFirestore(selectedMonth, selectedYear);
      }
    }, [user, selectedMonth, selectedYear]);
  
    
    
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          loadFromFirestore(); // Pass selectedMonth and selectedYear
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
    
  
  
    // generate empty days
    const generateEmptyDays = (month, year) => {
      if (days.length === 0) return; // Prevent overwriting existing data
      // Calculate the number of days in the current month
      const numDays = new Date(year, month + 1, 0).getDate();
    
      // Get the last day of the previous month
      const previousMonthLastDate = new Date(year, month, 0);
      const previousMonthLastDay = previousMonthLastDate.getDay();
    
      // Determine the starting weekday for the new month
      // If the previous month's last day is a workday (Mon-Fri), continue from there
      let startingDayIndex = (previousMonthLastDay + 1) % 7; // Next day after previous month's last day
      while (startingDayIndex === 0 || startingDayIndex === 6) {
        // Skip weekends (Sunday=0, Saturday=6)
        startingDayIndex = (startingDayIndex + 1) % 7;
      }
    
      // Generate the days for the current month
      const emptyDays = Array.from({ length: numDays }, (_, index) => {
        const weekdayIndex = (startingDayIndex + index) % 7; // Calculate weekday index
        const dayName = daysOfWeek[weekdayIndex];
    
        return {
          day: index + 1,
          weekday: dayName, // Get the name of the weekday
          timeStart: "",
          timeEnd: "",
          timeDifference: "",
        };
      });
    
      setDays(emptyDays); // Update the days state
      setCarryForward(0); // Reset carry forward
      console.log("Generated emptydays for the calendar:", emptyDays);
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

    // Update the company and contract type change handlers to save immediately
    const handleCompanyChange = (value) => {
      setCompany(value);
      // Save immediately when company changes
      setTimeout(() => saveToFirestore(), 100);
    };

    const handleContractTypeChange = (value) => {
      setContractType(value);
      // Save immediately when contract type changes
      setTimeout(() => saveToFirestore(), 100);
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
      const overtimeOrTimeOwed = totalHours - expectedHours;
      setCarryForward(overtimeOrTimeOwed);
  
      debouncedSaveToFirestore();
    };
    
    
    
    const totalDaysWithInput = days.filter(
      (day) => day.timeStart && day.timeEnd
    ).length;
  
  
    const totalHours = days
      .filter((day) => day.timeDifference)
      .reduce((acc, day) => acc + parseFloat(day.timeDifference), 0);
  
    
    
    const netTimeOwedOrOvertime = totalHours - expectedHours;
    
  
    useEffect(() => {
      saveCarryForward(netTimeOwedOrOvertime);
    }, [netTimeOwedOrOvertime]);
  
    useEffect(() => {
      const overtimeOrTimeOwed = totalHours - expectedHours;
      setCarryForward(overtimeOrTimeOwed);
      // saveToLocalStorage();
      saveToFirestore();
    }, [days, expectedHours]);
  
  
    // NEW
    // Calculate and update the carry-forward (time owed or overtime) when the hours are updated
    useEffect(() => {
      const netTimeOwedOrOvertime = totalHours - expectedHours;
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
  
  
    // Create a function for calculating gross pay
    const calculateGrossPay = () => {
      // For "Other Company" or "Bank" contract type
      if (company === "Other Company" || 
          (company === "My Company" && contractType === "Bank")) {
        return (totalHours * hourlyRate).toFixed(2);
      }
      
      // For "My Company" with "Contract" type
      return previousCarryForward > 0
    ? (parseFloat(monthlyPay) + (hourlyRate * previousCarryForward)).toFixed(2)
    : parseFloat(monthlyPay).toFixed(2);
    };

    // Calculate gross pay using the function
    const grossPay = calculateGrossPay();


  
    // Format time input
    const formatTimeInput = (value, index, field) => {
      // Remove non-numeric characters
      let cleanValue = value.replace(/\D/g, "");
    
      if (cleanValue.length > 4) return; // Prevent extra input
    
      // Auto-insert colon after 2nd digit (HH:MM format)
      if (cleanValue.length >= 3) {
        cleanValue = `${cleanValue.slice(0, 2)}:${cleanValue.slice(2)}`;
      }
    
      handleInputChange(index, field, cleanValue);
    };

  return (
  <div className="dashboard-container">
        <Container fluid className="px-3 px-md-4 py-3 h-100">
          {/* Header Section - Same as before */}
          <div className="dashboard-header rounded-4 p-3 p-md-4 mb-3 mb-md-4 text-white">
            <Row className="align-items-center">
              <Col xs={12} lg={8} className="text-center text-lg-start mb-3 mb-lg-0">
                <h1 className="h4 h1-lg fw-bold mb-2 mb-lg-3">
                  
                  SHIFTROOM EXPLORER
                </h1>
                <p className="mb-0 fs-6 fs-lg-5 opacity-90">
                  Track your working hours and your earnings
                </p>
              </Col>
              <Col xs={12} lg={4} className="text-center text-lg-end">
                <Button 
                  variant="light" 
                  onClick={() => navigate("/dashboard/metrics")}
                  className="fw-bold responsive-btn"
                  style={{
                    borderRadius: '12px',
                    padding: '8px 16px',
                    color: '#006D7D',
                    transition: 'all 0.3s ease',
                    width: 'auto',
                    minWidth: '140px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  Get More Insight
                  <FaArrowRight className="ms-2" />
                </Button>
              </Col>
            </Row>
          </div>

          {/* Main Content - Optimized for Viewport Height */}
          <Row className="main-content-row g-3">
            {/* Left Panel - Input Controls */}
            <Col lg={4} className="left-panel">
              <Card className="border-0 shadow-sm h-100 rounded-3">
                <Card.Body className="p-4">
                  <h3 className="h4 fw-bold mb-4" style={{ color: '#006D7D' }}>
                    <FaCalendarAlt className="me-2" />
                    Contract Details
                  </h3>

                  {/* Your existing form controls remain the same */}
                  <BootstrapForm.Group className="mb-4">
                    <BootstrapForm.Label className="fw-medium text-muted">Company</BootstrapForm.Label>
                    <BootstrapForm.Select
                      value={company}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      className="py-3 px-3 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                    >
                      <option value="My Company">My Company</option>
                      <option value="Other Company">Other Company</option>
                    </BootstrapForm.Select>
                  </BootstrapForm.Group>
                  
                  {/* ... other form controls ... */}
                  <BootstrapForm.Group className="mb-4">
                    <BootstrapForm.Label className="fw-medium text-muted">Contract Type</BootstrapForm.Label>
                    <BootstrapForm.Select
                      value={contractType}
                      onChange={(e) => handleContractTypeChange(e.target.value)}
                      className="py-3 px-3 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                    >
                      <option value="">Select Contract Type</option>
                      <option value="Contract">Contract</option>
                      <option value="Bank">Bank</option>
                    </BootstrapForm.Select>
                  </BootstrapForm.Group>

                  {/* Contract Hours */}
                  <BootstrapForm.Group className="mb-4">
                    <BootstrapForm.Label className="fw-medium text-muted">Contracted Hours</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type="number"
                      value={contractHours}
                      onChange={(e) => handleContractHoursChange(e.target.value)}
                      placeholder="Enter contract hours"
                      className="py-3 px-3 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                    />
                  </BootstrapForm.Group>

                  {/* Month Selector */}
                  <BootstrapForm.Group className="mb-4">
                    <BootstrapForm.Label className="fw-medium text-muted">Month</BootstrapForm.Label>
                    <BootstrapForm.Select
                      value={selectedMonth}
                      onChange={(e) => handleMonthYearChange(Number(e.target.value), selectedYear)}
                      className="py-3 px-3 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                    >
                      {Array.from({ length: 12 }, (_, index) => (
                        <option key={index} value={index}>
                          {new Date(0, index).toLocaleString("default", { month: "long" })}
                        </option>
                      ))}
                    </BootstrapForm.Select>
                  </BootstrapForm.Group>

                  {/* Year Selector */}
                  <BootstrapForm.Group className="mb-4">
                    <BootstrapForm.Label className="fw-medium text-muted">Year</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type="number"
                      value={selectedYear}
                      onChange={(e) => handleMonthYearChange(selectedMonth, Number(e.target.value))}
                      className="py-3 px-3 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                    />
                  </BootstrapForm.Group>

                  {/* Hourly Rate */}
                  <BootstrapForm.Group>
                    <BootstrapForm.Label className="fw-medium text-muted">Hourly Rate (£)</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      min="1"
                      className="py-3 px-3 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                    />
                  </BootstrapForm.Group>
                  
                </Card.Body>
              </Card>
            </Col>

          {/* Right Panel - Calendar Grid */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-3 mb-4">
              <Card.Body className="p-4">
                <h3 className="h4 fw-bold mb-4" style={{ color: '#006D7D' }}>
                  <FaClock className="me-2" />
                  Timesheet Calendar - {new Date(0, selectedMonth).toLocaleString("default", { month: "long" })} {selectedYear}
                </h3>
                
        
                {/* Weekday Header */}
                  <div
                      className="calendar-header d-grid mb-4"
                      style={{
                          gridTemplateColumns: "repeat(7, 1fr)",
                          textAlign: "center",
                          fontWeight: "600",
                          gap: "8px"
                      }}
                  >
                      {daysOfWeek.map((day, index) => {
                          const isWeekend = day === "Saturday" || day === "Sunday";
                          return (
                              <div
                                  key={index}
                                  className="py-2 rounded-3"
                                  style={{
                                      background: isWeekend 
                                          ? 'linear-gradient(135deg, #94a3b8, #64748b)' 
                                          : 'linear-gradient(135deg, #006D7D, #5E7CE2)',
                                      color: 'white',
                                      fontSize: "0.85rem",
                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                  }}
                              >
                                  {day.substring(0, 3)}
                              </div>
                          );
                      })}
                  </div>

                {/* Days Grid */}
                <div
                  className="calendar-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "8px",
                  }}
                >
                  {/* Empty placeholders */}
                  {days.length > 0 &&
                    Array.from({ length: daysOfWeek.indexOf(days[0]?.weekday) }).map((_, idx) => (
                      <div
                        key={`empty-${idx}`}
                        className="calendar-day"
                        style={{ height: "80px", backgroundColor: "transparent" }}
                      />
                    ))}

                  {/* Render Days */}
                  {days.map((day, index) => {
                    const isComplete = day.timeStart && day.timeEnd;
                    return (
                      <div
                        key={index}
                        className={`calendar-day p-1 rounded-3 d-flex flex-column justify-content-between ${
                            isComplete ? "border-success" : ""
                        } ${day.weekday === "Saturday" || day.weekday === "Sunday" ? "weekend" : ""}`}
                        style={{
                            minHeight: "30px",
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        {/* Top section - Day number and hours badge */}
                        <div className="d-flex justify-content-between align-items-start flex-shrink-0">
                            <div className="day-number fw-bold">
                                {day.day}
                            </div>
                            {day.timeDifference && (
                                <div 
                                    className="hours-badge badge rounded-pill fw-normal"
                                >
                                    {parseFloat(day.timeDifference).toFixed(2)}h
                                </div>
                            )}
                        </div>
                        
                        {/* Time inputs section */}
                        <div className="d-flex flex-column justify-content-end flex-grow-1 gap-1">
                            <BootstrapForm.Control
                                type="text"
                                placeholder="00:00"
                                maxLength="5"
                                inputMode="numeric"
                                value={day.timeStart}
                                onChange={(e) => formatTimeInput(e.target.value, index, "timeStart")}
                                onDoubleClick={() => handleInputChange(index, "timeStart", "")}
                                className="time-input"
                                aria-label={`Start time for day ${day.day}`}
                            />
                            <BootstrapForm.Control
                                type="text"
                                placeholder="00:00"
                                maxLength="5"
                                inputMode="numeric"
                                value={day.timeEnd}
                                onChange={(e) => formatTimeInput(e.target.value, index, "timeEnd")}
                                onDoubleClick={() => handleInputChange(index, "timeEnd", "")}
                                className="time-input"
                                aria-label={`End time for day ${day.day}`}
                            />
                        </div>
                    </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>

            {/* Summary Section */}
            <Row>
              <Col md={6} className="mb-4">
                <Card className="border-0 shadow-sm h-100 rounded-3">
                  <Card.Body className="p-4">
                    <h3 className="h4 fw-bold mb-4" style={{ color: '#006D7D' }}>
                      Hours Summary
                    </h3>
                    
                    <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                      <span className="text-muted">Days Worked:</span>
                      <span className="fw-medium">{totalDaysWithInput}</span>
                    </div>
                    
                    {/* Conditionally show Expected Hours */}
                    {showExpectedHours && (
                      <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                        <span className="text-muted">Expected Hours:</span>
                        <span className="fw-medium">{expectedHours} hrs</span>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                      <span className="text-muted">Total Hours:</span>
                      <span className="fw-medium">
                        {Number.isInteger(totalHours) 
                          ? totalHours 
                          : totalHours.toFixed(2)
                        } hrs
                      </span>
                    </div>
                    
                    {/* Conditionally show Overtime/Time Owed */}
                    {showOvertime && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">
                          {totalHours - expectedHours > 0 ? "Overtime:" : "Time Owed:"}
                        </span>
                        <span className={`fw-bold ${totalHours - expectedHours > 0 ? 'text-success' : 'text-danger'}`}>
                          {Math.abs(totalHours - expectedHours).toFixed(2)} hrs
                        </span>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} className="mb-4">
                <Card className="border-0 shadow-sm h-100 rounded-3">
                  <Card.Body className="p-4">
                    <h3 className="h4 fw-bold mb-4" style={{ color: '#006D7D' }}>
                      <FaMoneyBillWave className="me-2" />
                      Pay Summary
                    </h3>
                    
                    {/* Conditionally render detailed pay items */}
                    {showDetailedPay && (
                      <>
                        <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                          <span className="text-muted">Monthly Basic:</span>
                          <span className="fw-medium">£{monthlyPay}</span>
                        </div>
                        
                        <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                          <span className="text-muted">Annual Basic:</span>
                          <span className="fw-medium">£{annualPay}</span>
                        </div>
                        
                        <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                          <span className="text-muted">
                            {previousCarryForward > 0 ? "Previous Overtime:" : "Previous Time Owed:"}
                          </span>
                          <span className={`fw-medium ${previousCarryForward > 0 ? 'text-success' : 'text-danger'}`}>
                            {Math.abs(previousCarryForward).toFixed(2)} hrs
                          </span>
                        </div>
                      </>
                    )}
                    
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Gross Pay:</span>
                      <span className="fw-bold text-success">£{grossPay}</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FormCopy;