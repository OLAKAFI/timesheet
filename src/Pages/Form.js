import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form as BootstrapForm, Card, Button, Alert, Modal, Table } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaSignOutAlt, FaClock, FaMoneyBillWave, FaCalendarAlt, FaArrowRight, FaArrowLeft, FaCalculator, FaHospital, FaPrint } from "react-icons/fa";

import "../style/form.css";

// for savetofirebase
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  deleteDoc 
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth";

// import to authenticate current users
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "../AuthProvider";




const Form = () => {
  const { user, loading } = useAuth();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [contractHours, setContractHours] = useState();
  const [contractType, setContractType] = useState("Contract");
  const [company, setCompany] = useState("My Company");
  const [days, setDays] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(12.60);
  const [carryForward, setCarryForward] = useState(0);
  const [previousCarryForward, setPreviousCarryForward] = useState(0);
  const [expectedHours, setExpectedHours] = useState(0);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const workingDaysInWeek = 5;
  const [authenticated, setAuthenticated] = useState(true);
  

  // NHS Specific State
  const [nhsBand, setNhsBand] = useState("5");
  const [nhsStep, setNhsStep] = useState(1);
  const [nhsEmploymentType, setNhsEmploymentType] = useState("full-time"); // "full-time" or "part-time"
  const [nhsWeeklyHours, setNhsWeeklyHours] = useState(37.5); // Default full-time hours
  const [nhsEnhancements, setNhsEnhancements] = useState({
    evening: 0,
    night: 0,
    saturday: 0,
    sunday: 0,
    bankHoliday: 0
  });
  const [nhsAutoApplyMessage, setNhsAutoApplyMessage] = useState('');
  const [showNHSBreakdown, setShowNHSBreakdown] = useState(false);

  // Print Functionality State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Annual and monthly pay state
  const [annualExpectedHours, setAnnualExpectedHours] = useState(0);
  const [annualPay, setAnnualPay] = useState(0);
  const [monthlyPay, setMonthlyPay] = useState(0);

  // NHS Pay Scales 2023/24
  const nhsPayScales = {
    '2': [22383, 22816, 23247, 23686, 24126, 24565],
    '3': [22816, 23247, 23686, 24126, 24565],
    '4': [25147, 25692, 26260, 26873, 27492, 28106],
    '5': [28407, 29257, 30154, 31099, 32091, 33082],
    '6': [35392, 36583, 37890, 39298, 40712, 42118],
    '7': [43742, 45265, 46874, 48546, 50256],
    '8a': [50952, 52789, 54638, 56504, 58349]
  };


  // ADDED FUNCTIONS
  // Add this function to sync shifts (simplified version)
  // Add this function to your Form.jsx for better shift synchronization
  const syncShiftsToFirestore = async () => {
    if (!user) return;

    try {
      const shiftsCollection = collection(db, "shifts");
      
      // First, get all existing shifts for this user and month
      const existingShiftsQuery = query(
        shiftsCollection,
        where("userId", "==", user.uid),
        where("year", "==", selectedYear),
        where("month", "==", selectedMonth + 1)
      );
      
      const existingSnapshot = await getDocs(existingShiftsQuery);
      const existingShiftsMap = new Map();
      
      existingSnapshot.forEach(doc => {
        const shift = doc.data();
        const key = `${shift.date}-${shift.startTime}-${shift.endTime}`;
        existingShiftsMap.set(key, doc.id);
      });
      
      // Prepare new shifts
      const newShifts = days
        .filter(day => {
          // Only include days with valid time entries
          return day.timeStart && 
                day.timeEnd && 
                day.timeDifference && 
                parseFloat(day.timeDifference) > 0;
        })
        .map(day => {
          const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
          
          return {
            userId: user.uid,
            date: dateKey,
            startTime: day.timeStart,
            endTime: day.timeEnd,
            duration: parseFloat(day.timeDifference),
            year: selectedYear,
            month: selectedMonth + 1,
            day: day.day,
            weekday: day.weekday,
            company: company,
            createdAt: new Date(),
            updatedAt: new Date(),
            isShift: true
          };
        });
      
      // Determine which shifts need to be added, updated, or deleted
      const shiftsToAdd = [];
      const shiftsToUpdate = [];
      const shiftKeysToDelete = new Set(existingShiftsMap.keys());
      
      newShifts.forEach(shift => {
        const key = `${shift.date}-${shift.startTime}-${shift.endTime}`;
        
        if (existingShiftsMap.has(key)) {
          // Shift exists, mark for update
          shiftsToUpdate.push({
            id: existingShiftsMap.get(key),
            data: shift
          });
          shiftKeysToDelete.delete(key);
        } else {
          // New shift, mark for addition
          shiftsToAdd.push(shift);
        }
      });
      
      // Delete shifts that are no longer needed
      const deletePromises = Array.from(shiftKeysToDelete).map(async (key) => {
        const docId = existingShiftsMap.get(key);
        if (docId) {
          await deleteDoc(doc(db, "shifts", docId));
        }
      });
      
      // Update existing shifts
      const updatePromises = shiftsToUpdate.map(async ({ id, data }) => {
        await updateDoc(doc(db, "shifts", id), data);
      });
      
      // Add new shifts
      const addPromises = shiftsToAdd.map(shift => {
        return addDoc(shiftsCollection, shift);
      });
      
      // Execute all operations
      await Promise.all([...deletePromises, ...updatePromises, ...addPromises]);
      
      console.log(`✅ Synced shifts: ${shiftsToAdd.length} added, ${shiftsToUpdate.length} updated, ${shiftKeysToDelete.size} deleted`);
      
    } catch (error) {
      console.error("❌ Error syncing shifts:", error);
    }
  };


  // Determine calculation modes
  const isNHS = company === "NHS";
  const showDetailedPay = contractType === "Contract" && company === "My Company";
  const showExpectedHours = contractType !== "Bank" && !isNHS;
  const showOvertime = contractType !== "Bank" && !isNHS;
  const showContractHours = company === "My Company" && contractType === "Contract";

  const navigate = useNavigate();

  // ==================== NHS CALCULATION FUNCTIONS ====================

  // Calculate NHS Hourly Rate
  const calculateNHSHourlyRate = () => {
    const annualSalary = nhsPayScales[nhsBand][nhsStep - 1] || nhsPayScales[nhsBand][0];
    return (annualSalary / 52 / 37.5).toFixed(2);
  };

  // Calculate NHS Monthly Basic Hours based on employment type
  const calculateNHSMonthlyBasicHours = () => {
    if (nhsEmploymentType === "full-time") {
      // NHS full-time standard is 37.5 hours per week
      return (37.5 * 52) / 12; // 162.5 hours per month
    } else {
      // Part-time: calculate based on weekly hours
      return (nhsWeeklyHours * 52) / 12;
    }
  };

  // Calculate NHS Monthly Basic Pay
  const calculateNHSMonthlyBasicPay = () => {
    const annualSalary = nhsPayScales[nhsBand][nhsStep - 1] || nhsPayScales[nhsBand][0];
    if (nhsEmploymentType === "full-time") {
      return annualSalary / 12;
    } else {
      // For part-time, calculate pro-rata based on weekly hours
      const fullTimeSalary = annualSalary;
      const partTimeRatio = nhsWeeklyHours / 37.5;
      return (fullTimeSalary * partTimeRatio) / 12;
    }
  };

  // Calculate NHS Overtime Hours
  const calculateNHSOvertimeHours = () => {
    const monthlyBasicHours = calculateNHSMonthlyBasicHours();
    return Math.max(0, totalHours - monthlyBasicHours);
  };

  // Calculate NHS Overtime Pay properly
  const calculateNHSOvertimePay = () => {
    const baseRate = parseFloat(calculateNHSHourlyRate());
    const monthlyBasicHours = calculateNHSMonthlyBasicHours();
    const totalHoursWorked = totalHours;
    
    if (totalHoursWorked <= monthlyBasicHours) return 0;

    const overtimeHours = totalHoursWorked - monthlyBasicHours;
    let totalOvertimePay = 0;

    // Process each day to determine overtime rates based on actual NHS rules
    days.forEach(day => {
      if (day.timeStart && day.timeEnd && day.timeDifference) {
        const dayHours = parseFloat(day.timeDifference);
        if (dayHours > 0) {
          const isWeekend = day.weekday === "Saturday" || day.weekday === "Sunday";
          const isBankHoliday = false; // You might want to make this configurable
          
          // Get time categorization for proper overtime calculation
          const category = categorizeNHSTime(day, day.timeStart, day.timeEnd);
          
          // Calculate overtime rate based on NHS rules
          let overtimeRateMultiplier = 1.0;
          
          if (isBankHoliday) {
            // Bank holiday: all hours at double time
            overtimeRateMultiplier = 2.0;
          } else if (isWeekend) {
            // Weekend: time and a half
            overtimeRateMultiplier = 1.5;
          } else {
            // Weekday overtime rules
            // First 2 hours at time and a half, then double time
            // For monthly calculation, we need to track this per day
            overtimeRateMultiplier = 1.5; // Simplified for monthly view
            // In a more detailed implementation, you'd track the first 2 hours separately
          }
          
          // Only apply overtime rates to hours beyond the basic monthly allocation
          // This is a simplified approach - you might want more sophisticated allocation
          const basicHoursPerDay = monthlyBasicHours / 22; // Approximate working days per month
          const dayOvertimeHours = Math.max(0, dayHours - basicHoursPerDay);
          
          if (dayOvertimeHours > 0) {
            totalOvertimePay += dayOvertimeHours * baseRate * overtimeRateMultiplier;
          }
        }
      }
    });

    return totalOvertimePay;
  };

  // Enhanced NHS Pay Calculation with Detailed Breakdown
  const calculateDetailedNHSGrossPay = () => {
    const baseRate = parseFloat(calculateNHSHourlyRate());
    const monthlyBasicHours = calculateNHSMonthlyBasicHours();
    const monthlyBasicPay = calculateNHSMonthlyBasicPay();
    const overtimeHours = calculateNHSOvertimeHours();
    const overtimePay = calculateNHSOvertimePay();
    
    // ENHANCEMENT RATES (the actual rates used for calculations)
    const eveningRate = baseRate * 0.30; // 30% extra
    const nightRate = baseRate * 0.60;   // 60% extra
    const saturdayRate = baseRate * 0.30; // 30% extra
    const sundayRate = baseRate * 0.60;   // 60% extra
    const bankHolidayRate = baseRate * 1.00; // 100% extra
    
    // For NHS, we calculate all hours at the appropriate rates
    // Standard hours are up to the monthly basic hours
    const standardHours = Math.min(totalHours, monthlyBasicHours);
    const standardPay = standardHours * baseRate;
    
    // ENHANCEMENT CALCULATIONS - ONLY THE ADDITIONAL PERCENTAGE AMOUNT
    const eveningPay = nhsEnhancements.evening * eveningRate;
    const nightPay = nhsEnhancements.night * nightRate;
    const saturdayPay = nhsEnhancements.saturday * saturdayRate;
    const sundayPay = nhsEnhancements.sunday * sundayRate;
    const bankHolidayPay = nhsEnhancements.bankHoliday * bankHolidayRate;
    
    // Total pay is basic pay plus all enhancement extras plus overtime
    const totalPay = monthlyBasicPay + eveningPay + nightPay + saturdayPay + 
                    sundayPay + bankHolidayPay + overtimePay;
    
    return {
      baseRate,
      monthlyBasicHours,
      monthlyBasicPay,
      standardHours,
      standardPay,
      eveningPay,
      nightPay,
      saturdayPay,
      sundayPay,
      bankHolidayPay,
      overtimeHours,
      overtimePay,
      totalPay: totalPay.toFixed(2),
      totalEnhancements: (eveningPay + nightPay + saturdayPay + sundayPay + bankHolidayPay).toFixed(2),
      // Enhancement rates for display
      enhancementRates: {
        evening: eveningRate,
        night: nightRate,
        saturday: saturdayRate,
        sunday: sundayRate,
        bankHoliday: bankHolidayRate
      },
      breakdown: {
        basic: { hours: monthlyBasicHours, pay: monthlyBasicPay },
        standard: { hours: standardHours, pay: standardPay },
        evening: { hours: nhsEnhancements.evening, pay: eveningPay, rate: eveningRate },
        night: { hours: nhsEnhancements.night, pay: nightPay, rate: nightRate },
        saturday: { hours: nhsEnhancements.saturday, pay: saturdayPay, rate: saturdayRate },
        sunday: { hours: nhsEnhancements.sunday, pay: sundayPay, rate: sundayRate },
        bankHoliday: { hours: nhsEnhancements.bankHoliday, pay: bankHolidayPay, rate: bankHolidayRate },
        overtime: { hours: overtimeHours, pay: overtimePay }
      }
    };
  };

  // Calculate NHS Gross Pay with enhancements (backward compatibility)
  const calculateNHSGrossPay = () => {
    const detailedPay = calculateDetailedNHSGrossPay();
    return {
      baseRate: detailedPay.baseRate,
      standardPay: detailedPay.standardPay,
      eveningPay: detailedPay.eveningPay,
      nightPay: detailedPay.nightPay,
      saturdayPay: detailedPay.saturdayPay,
      sundayPay: detailedPay.sundayPay,
      bankHolidayPay: detailedPay.bankHolidayPay,
      overtimePay: detailedPay.overtimePay,
      totalPay: detailedPay.totalPay,
      totalEnhancements: detailedPay.totalEnhancements
    };
  };

  // NHS Time Categorization Functions
  const categorizeNHSTime = (day, timeStart, timeEnd) => {
    if (!timeStart || !timeEnd) return null;

    const startHour = parseInt(timeStart.split(':')[0]);
    const weekday = day.weekday;
    
    // Check if it's a bank holiday (you might want to make this configurable)
    const isBankHoliday = false;
    
    if (isBankHoliday) {
      return 'bankHoliday';
    }
    
    if (weekday === 'Sunday') {
      return 'sunday';
    }
    
    if (weekday === 'Saturday') {
      return 'saturday';
    }
    
    // Weekday categorizations
    if (startHour >= 18 && startHour < 20) {
      return 'evening';
    }
    
    if ((startHour >= 20 && startHour <= 23) || (startHour >= 0 && startHour < 6)) {
      return 'night';
    }
    
    return 'standard';
  };

  // Auto-calculate NHS enhancements from calendar data
  const calculateNHSEnhancementsFromCalendar = () => {
    const enhancements = {
      evening: 0,
      night: 0,
      saturday: 0,
      sunday: 0,
      bankHoliday: 0
    };

    days.forEach(day => {
      if (day.timeStart && day.timeEnd && day.timeDifference) {
        const category = categorizeNHSTime(day, day.timeStart, day.timeEnd);
        const hours = parseFloat(day.timeDifference);
        
        if (category && category !== 'standard') {
          enhancements[category] += hours;
        }
      }
    });

    return enhancements;
  };

  // Auto-apply NHS enhancements button handler
  const handleAutoApplyNHSEnhancements = () => {
    if (!isNHS) return;
    
    const autoEnhancements = calculateNHSEnhancementsFromCalendar();
    setNhsEnhancements(autoEnhancements);
    
    setNhsAutoApplyMessage('NHS enhancements automatically calculated from your calendar entries!');
    setTimeout(() => setNhsAutoApplyMessage(''), 3000);
  };

  // ==================== PRINT FUNCTIONALITY ====================

  const handlePrintTimesheet = () => {
    const printData = {
      month: new Date(0, selectedMonth).toLocaleString("default", { month: "long" }),
      year: selectedYear,
      company,
      contractType,
      contractHours,
      hourlyRate: isNHS ? calculateNHSHourlyRate() : hourlyRate,
      days: days.filter(day => day.timeStart && day.timeEnd),
      totalHours,
      expectedHours: showExpectedHours ? expectedHours : null,
      grossPay,
      nhsDetails: isNHS ? calculateDetailedNHSGrossPay() : null,
      nhsEnhancements: isNHS ? nhsEnhancements : null,
      nhsEmploymentType: isNHS ? nhsEmploymentType : null,
      nhsWeeklyHours: isNHS ? nhsWeeklyHours : null,
      summary: {
        daysWorked: totalDaysWithInput,
        overtimeOrTimeOwed: netTimeOwedOrOvertime,
        previousCarryForward
      }
    };
    
    setPrintData(printData);
    setShowPrintModal(true);
  };

  // ==================== EXISTING HELPER FUNCTIONS ====================

  // Add helper function to generate days from shifts
  const generateDaysFromShifts = (shifts) => {
    const numDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    const previousMonthLastDate = new Date(selectedYear, selectedMonth, 0);
    const previousMonthLastDay = previousMonthLastDate.getDay();
    
    const startingDayIndex = (previousMonthLastDay + 1) % 7;
    
    const newDays = Array.from({ length: numDays }, (_, index) => {
      const weekdayIndex = (startingDayIndex + index) % 7;
      const dayName = daysOfWeek[weekdayIndex];
      const dayNumber = index + 1;
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      const shift = shifts[dateKey];

      return {
        day: dayNumber,
        weekday: dayName,
        timeStart: shift ? shift.startTime : "",
        timeEnd: shift ? shift.endTime : "",
        timeDifference: shift ? shift.duration.toString() : "",
      };
    });
    
    console.log("Generated days from existing shifts:", newDays.filter(d => d.timeStart));
    return newDays;
  };

  // Initialize Data
  // const initializeData = async () => {
  //   console.log("Initializing data for:", selectedMonth + 1, selectedYear);
    
  //   if (!user) {
  //     console.warn("No authenticated user. Skipping initialization.");
  //     return;
  //   }
    
  //   setIsInitializing(true);
    
  //   const firestoreData = await loadFromFirestore(selectedMonth, selectedYear);
  //   const userDocRef = doc(db, "userInputs", user.uid);

  //   try {
  //     const userDoc = await getDoc(userDocRef);
  //     if (userDoc.exists()) {
  //       const savedData = userDoc.data();
        
  //       // Load contract hours
  //       if (savedData.contractHours !== undefined) {
  //         setContractHours(savedData.contractHours);
  //       }
        
  //       // Load company and related data
  //       if (savedData.company) {
  //         setCompany(savedData.company);
          
  //         // Load NHS specific data if company is NHS
  //         if (savedData.company === "NHS") {
  //           if (savedData.nhsBand) setNhsBand(savedData.nhsBand);
  //           if (savedData.nhsStep) setNhsStep(savedData.nhsStep);
  //           if (savedData.nhsEmploymentType) setNhsEmploymentType(savedData.nhsEmploymentType);
  //           if (savedData.nhsWeeklyHours) setNhsWeeklyHours(savedData.nhsWeeklyHours);
  //           if (savedData.nhsEnhancements) setNhsEnhancements(savedData.nhsEnhancements);
  //         }
  //       }
        
  //       // Load contract type
  //       if (savedData.contractType) {
  //         setContractType(savedData.contractType);
  //       }
        
  //       // Load hourly rate
  //       if (savedData.hourlyRate !== undefined) {
  //         setHourlyRate(savedData.hourlyRate);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error loading data:", error);
  //   }

  //   if (firestoreData) {
  //     setDays(firestoreData.days || []);
  //     setCarryForward(firestoreData.carryForward || 0);
  //   } else {
  //     generateDays(selectedMonth, selectedYear);
  //   }

  //   setIsInitializing(false);
  // };

  // Update the initializeData function to load existing shifts
  const initializeData = async () => {
    console.log("Initializing data for:", selectedMonth + 1, selectedYear);
    
    if (!user) {
      console.warn("No authenticated user. Skipping initialization.");
      return;
    }
    
    setIsInitializing(true);
    
    const firestoreData = await loadFromFirestore(selectedMonth, selectedYear);
    const userDocRef = doc(db, "userInputs", user.uid);

    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const savedData = userDoc.data();
        
        // Load contract hours
        if (savedData.contractHours !== undefined) {
          setContractHours(savedData.contractHours);
        }
        
        // Load company and related data
        if (savedData.company) {
          setCompany(savedData.company);
          
          // Load NHS specific data if company is NHS
          if (savedData.company === "NHS") {
            if (savedData.nhsBand) setNhsBand(savedData.nhsBand);
            if (savedData.nhsStep) setNhsStep(savedData.nhsStep);
            if (savedData.nhsEmploymentType) setNhsEmploymentType(savedData.nhsEmploymentType);
            if (savedData.nhsWeeklyHours) setNhsWeeklyHours(savedData.nhsWeeklyHours);
            if (savedData.nhsEnhancements) setNhsEnhancements(savedData.nhsEnhancements);
          }
        }
        
        // Load contract type
        if (savedData.contractType) {
          setContractType(savedData.contractType);
        }
        
        // Load hourly rate
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
      // Try to load shifts and populate days
      const existingShifts = await loadExistingShifts();
      if (Object.keys(existingShifts).length > 0) {
        const generatedDays = generateDaysFromShifts(existingShifts);
        setDays(generatedDays);
      } else {
        generateDays(selectedMonth, selectedYear);
      }
    }

    setIsInitializing(false);
  };




  // Load From Firestore
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
          return savedData;
        }
      }
    } catch (error) {
      console.error("Error loading data from Firestore:", error);
    }
  
    console.warn("No data found in Firestore for this month/year.");
    return null;
  };

  // Generate Days
  const generateDays = (month, year) => {
    const numDays = new Date(year, month + 1, 0).getDate();
  
    const previousMonthLastDate = new Date(year, month, 0);
    const previousMonthLastDay = previousMonthLastDate.getDay();
  
    const startingDayIndex = (previousMonthLastDay + 1) % 7;
  
    const newDays = Array.from({ length: numDays }, (_, index) => {
      const weekdayIndex = (startingDayIndex + index) % 7;
      const dayName = daysOfWeek[weekdayIndex];
  
      return {
        day: index + 1,
        weekday: dayName,
        timeStart: "",
        timeEnd: "",
        timeDifference: "",
      };
    });
  
    setDays(newDays);
    console.log("Generated days for the calendar:", newDays);
  };

  // Handle Month and Year Change
  const handleMonthYearChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Save to Firestore
  // const saveToFirestore = async () => {
  //   if (!user || isInitializing) {
  //     console.warn("No authenticated user. Cannot save data.");
  //     return;
  //   }

  //   const key = `user-data-${selectedYear}-${selectedMonth + 1}`;
  //   const userDocRef = doc(db, "userInputs", user.uid);
    
  //   const updatedData = {
  //     [key]: { 
  //       days, 
  //       carryForward 
  //     },
  //     company: company || "My Company",
  //     contractType: contractType || "Contract",
  //     contractHours: contractHours || 0,
  //     hourlyRate: hourlyRate || 12.60,
  //   };

  //   if (company === "NHS") {
  //     updatedData.nhsBand = nhsBand;
  //     updatedData.nhsStep = nhsStep;
  //     updatedData.nhsEmploymentType = nhsEmploymentType;
  //     updatedData.nhsWeeklyHours = nhsWeeklyHours;
  //     updatedData.nhsEnhancements = nhsEnhancements;
  //   }

  //   try {
  //     await setDoc(userDocRef, updatedData, { merge: true });
  //     console.log("✅ Data successfully updated in Firestore");
  //   } catch (error) {
  //     console.error("❌ Error saving data to Firestore:", error);
  //   }
  // };

  // Update the saveToFirestore function to include shift sync
  // const saveToFirestore = async () => {
  //   if (!user || isInitializing) {
  //     console.warn("No authenticated user. Cannot save data.");
  //     return;
  //   }

  //   const key = `user-data-${selectedYear}-${selectedMonth + 1}`;
  //   const userDocRef = doc(db, "userInputs", user.uid);
    
  //   const updatedData = {
  //     [key]: { 
  //       days, 
  //       carryForward 
  //     },
  //     company: company || "My Company",
  //     contractType: contractType || "Contract",
  //     contractHours: contractHours || 0,
  //     hourlyRate: hourlyRate || 12.60,
  //     lastSync: new Date().toISOString()
  //   };

  //   if (company === "NHS") {
  //     updatedData.nhsBand = nhsBand;
  //     updatedData.nhsStep = nhsStep;
  //     updatedData.nhsEmploymentType = nhsEmploymentType;
  //     updatedData.nhsWeeklyHours = nhsWeeklyHours;
  //     updatedData.nhsEnhancements = nhsEnhancements;
  //   }

  //   try {
  //     await setDoc(userDocRef, updatedData, { merge: true });
  //     console.log("✅ Data successfully updated in Firestore");
      
  //     // Sync shifts after saving data
  //     await syncShiftsToFirestore();
  //   } catch (error) {
  //     console.error("❌ Error saving data to Firestore:", error);
  //   }
  // };

  // Update the saveToFirestore function
  const saveToFirestore = async () => {
    if (!user || isInitializing) {
      console.warn("No authenticated user. Cannot save data.");
      return;
    }

    const key = `user-data-${selectedYear}-${selectedMonth + 1}`;
    const userDocRef = doc(db, "userInputs", user.uid);
    
    const updatedData = {
      [key]: { 
        days, 
        carryForward 
      },
      company: company || "My Company",
      contractType: contractType || "Contract",
      contractHours: contractHours || 0,
      hourlyRate: hourlyRate || 12.60,
      lastSync: new Date().toISOString()
    };

    if (company === "NHS") {
      updatedData.nhsBand = nhsBand;
      updatedData.nhsStep = nhsStep;
      updatedData.nhsEmploymentType = nhsEmploymentType;
      updatedData.nhsWeeklyHours = nhsWeeklyHours;
      updatedData.nhsEnhancements = nhsEnhancements;
    }

    try {
      await setDoc(userDocRef, updatedData, { merge: true });
      console.log("✅ Data successfully updated in Firestore");
      
      // Sync shifts after saving data (debounced)
      const debouncedSync = setTimeout(() => {
        syncShiftsToFirestore();
      }, 1000);
      
      return () => clearTimeout(debouncedSync);
    } catch (error) {
      console.error("❌ Error saving data to Firestore:", error);
    }
  };


  // Add this useEffect to auto-sync shifts when days change
  useEffect(() => {
    if (!user || isInitializing) return;
    
    // Only sync if there are days with time entries
    const hasTimeEntries = days.some(day => day.timeStart && day.timeEnd);
    if (!hasTimeEntries) return;
    
    const debouncedSync = setTimeout(() => {
      syncShiftsToFirestore();
    }, 3000); // Longer delay to avoid excessive writes
    
    return () => clearTimeout(debouncedSync);
  }, [days, user]);


  // Add this function to load existing shifts
  const loadExistingShifts = async () => {
    if (!user) return;
    
    try {
      const shiftsCollection = collection(db, "shifts");
      const q = query(
        shiftsCollection,
        where("userId", "==", user.uid),
        where("year", "==", selectedYear),
        where("month", "==", selectedMonth + 1)
      );
      
      const querySnapshot = await getDocs(q);
      const existingShifts = {};
      
      querySnapshot.forEach(doc => {
        const shift = doc.data();
        existingShifts[`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(shift.day).padStart(2, '0')}`] = shift;
      });
      
      console.log(`📊 Loaded ${Object.keys(existingShifts).length} existing shifts`);
      return existingShifts;
    } catch (error) {
      console.error("❌ Error loading shifts:", error);
      return {};
    }
  };






  // Load Carry Forward
  const loadCarryForward = (month, year) => {
    const previousMonth = month === 0 ? 11 : month - 1;
    const previousYear = month === 0 ? year - 1 : year;

    const previousKey = `carry-forward-${previousYear}-${previousMonth}`;
    const carryForwardValue = parseFloat(localStorage.getItem(previousKey)) || 0;

    setPreviousCarryForward(carryForwardValue);
  };

  // Save Carry Forward
  const saveCarryForward = (value) => {
    const key = `carry-forward-${selectedYear}-${selectedMonth}`;
    localStorage.setItem(key, value.toFixed(2));
  };

  // Calculate Difference
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

  // Handle Contract Hours Change
  const handleContractHoursChange = (value) => {
    setContractHours(value);
  };

  // Handle Company Change
  const handleCompanyChange = (value) => {
    setCompany(value);
    if (value !== "NHS") {
      setNhsEnhancements({
        evening: 0,
        night: 0,
        saturday: 0,
        sunday: 0,
        bankHoliday: 0
      });
    }
    setTimeout(() => saveToFirestore(), 100);
  };

  // Handle Contract Type Change
  const handleContractTypeChange = (value) => {
    setContractType(value);
    setTimeout(() => saveToFirestore(), 100);
  };

  // Debounce Function
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSaveToFirestore = debounce(saveToFirestore, 500);

  // Handle Input Change
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

    const overtimeOrTimeOwed = totalHours - expectedHours;
    setCarryForward(overtimeOrTimeOwed);

    debouncedSaveToFirestore();
  };

  // Handle NHS Enhancement Changes
  const handleNhsEnhancementChange = (type, value) => {
    setNhsEnhancements(prev => ({
      ...prev,
      [type]: parseFloat(value) || 0
    }));
  };

  // Handle NHS Employment Type Change
  const handleNhsEmploymentTypeChange = (value) => {
    setNhsEmploymentType(value);
    if (value === "full-time") {
      setNhsWeeklyHours(37.5); // Reset to NHS standard full-time hours
    }
    setTimeout(() => saveToFirestore(), 100);
  };

  // Format Time Input
  const formatTimeInput = (value, index, field) => {
    let cleanValue = value.replace(/\D/g, "");
  
    if (cleanValue.length > 4) return;
  
    if (cleanValue.length >= 3) {
      cleanValue = `${cleanValue.slice(0, 2)}:${cleanValue.slice(2)}`;
    }
  
    handleInputChange(index, field, cleanValue);
  };

  // Generate Empty Days
  const generateEmptyDays = (month, year) => {
    if (days.length === 0) return;
    const numDays = new Date(year, month + 1, 0).getDate();
  
    const previousMonthLastDate = new Date(year, month, 0);
    const previousMonthLastDay = previousMonthLastDate.getDay();
  
    let startingDayIndex = (previousMonthLastDay + 1) % 7;
    while (startingDayIndex === 0 || startingDayIndex === 6) {
      startingDayIndex = (startingDayIndex + 1) % 7;
    }
  
    const emptyDays = Array.from({ length: numDays }, (_, index) => {
      const weekdayIndex = (startingDayIndex + index) % 7;
      const dayName = daysOfWeek[weekdayIndex];
  
      return {
        day: index + 1,
        weekday: dayName,
        timeStart: "",
        timeEnd: "",
        timeDifference: "",
      };
    });
  
    setDays(emptyDays);
    setCarryForward(0);
    console.log("Generated emptydays for the calendar:", emptyDays);
  };

  // Calculate Total Working Days
  const calculateTotalWorkingDays = (month, year) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    for (let i = 1; i <= numDays; i++) {
      const day = new Date(year, month, i).getDay();
      if (day !== 0 && day !== 6) workingDays++;
    }
    return workingDays;
  };

  // Calculate Expected Hours
  const calculateExpectedHours = () => {
    const totalWorkingDays = calculateTotalWorkingDays(selectedMonth, selectedYear);
    const hoursPerDay = contractHours / workingDaysInWeek;
    return (hoursPerDay * totalWorkingDays).toFixed(2);
  };

  // Calculate Expected Hours For Month
  const calculateExpectedHoursForMonth = (month, year) => {
    const totalWorkingDays = calculateTotalWorkingDays(month, year);
    const hoursPerDay = contractHours / workingDaysInWeek;
    return totalWorkingDays * hoursPerDay;
  };

  // Calculate Annual Expected Hours
  const calculateAnnualExpectedHours = () => {
    let totalHours = 0;
    for (let month = 0; month < 12; month++) {
      totalHours += calculateExpectedHoursForMonth(month, selectedYear);
    }
    return totalHours.toFixed(2);
  };

  // Calculate Gross Pay
  const calculateGrossPay = () => {
    if (isNHS) {
      const nhsPay = calculateNHSGrossPay();
      return nhsPay.totalPay;
    }
    
    if (company === "Other Company" || 
        (company === "My Company" && contractType === "Bank")) {
      return (totalHours * hourlyRate).toFixed(2);
    }
    
    return previousCarryForward > 0
      ? (parseFloat(monthlyPay) + (hourlyRate * previousCarryForward)).toFixed(2)
      : parseFloat(monthlyPay).toFixed(2);
  };

  // Handle Logout
  const handleSignOut = async () => {
    try {
      if (user) {
        await saveToFirestore();
        console.log("saved on logout.")
      }
      await signOut(auth);
      console.log("Logged out successfully.");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // ==================== CALCULATION VARIABLES ====================

  const totalDaysWithInput = days.filter(
    (day) => day.timeStart && day.timeEnd
  ).length;

  const totalHours = days
    .filter((day) => day.timeDifference)
    .reduce((acc, day) => acc + parseFloat(day.timeDifference), 0);

  const netTimeOwedOrOvertime = totalHours - expectedHours;

  const grossPay = calculateGrossPay();
  const nhsPayDetails = isNHS ? calculateNHSGrossPay() : null;
  const detailedNhsPay = isNHS ? calculateDetailedNHSGrossPay() : null;

  // NHS Specific Calculations
  const nhsMonthlyBasicHours = isNHS ? calculateNHSMonthlyBasicHours() : 0;
  const nhsMonthlyBasicPay = isNHS ? calculateNHSMonthlyBasicPay() : 0;
  const nhsOvertimeHours = isNHS ? calculateNHSOvertimeHours() : 0;
  const nhsOvertimePay = isNHS ? calculateNHSOvertimePay() : 0;

  // ==================== USE EFFECT HOOKS ====================

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Save hourly rate changes
  useEffect(() => {
    if (user && hourlyRate !== undefined && !isInitializing) {
      debouncedSaveToFirestore();
    }
  }, [hourlyRate]);

  // Initialize data when user or month/year changes
  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user, selectedMonth, selectedYear]);

  // Check authentication and initialize data
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    initializeData();
  }, [user, selectedMonth, selectedYear]);

  // Load carry forward on month/year change
  useEffect(() => {
    const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const previousKey = `carry-forward-${previousYear}-${previousMonth}`;
    const carryForwardValue = parseFloat(localStorage.getItem(previousKey)) || 0;
    setPreviousCarryForward(carryForwardValue);
  }, [selectedMonth, selectedYear]);

  // Save carry forward
  useEffect(() => {
    saveCarryForward(netTimeOwedOrOvertime);
  }, [netTimeOwedOrOvertime]);

  // Update carry forward when days or expected hours change
  useEffect(() => {
    const overtimeOrTimeOwed = totalHours - expectedHours;
    setCarryForward(overtimeOrTimeOwed);
    saveToFirestore();
  }, [days, expectedHours]);

  // Update carry forward state
  useEffect(() => {
    const netTimeOwedOrOvertime = totalHours - expectedHours;
    setCarryForward(netTimeOwedOrOvertime);
    saveCarryForward(netTimeOwedOrOvertime);
  }, [totalHours, expectedHours, previousCarryForward]);

  // Update contract hours effects
  useEffect(() => {
    const updatedExpectedHours = calculateExpectedHours();
    setExpectedHours(updatedExpectedHours);
  
    const updatedAnnualExpectedHours = calculateAnnualExpectedHours();
    setAnnualExpectedHours(updatedAnnualExpectedHours);
  
    const updatedAnnualPay = (updatedAnnualExpectedHours * hourlyRate).toFixed(2);
    setAnnualPay(updatedAnnualPay);

    debouncedSaveToFirestore();

    const updatedMonthlyPay = (updatedAnnualPay / 12).toFixed(2);
    setMonthlyPay(updatedMonthlyPay);
  
    console.log(`Contract Hours: ${contractHours}`);
    console.log(`Expected Hours: ${updatedExpectedHours}`);
    console.log(`Annual Expected Hours: ${updatedAnnualExpectedHours}`);
    console.log(`Annual Pay: £${updatedAnnualPay}`);
    console.log(`Monthly Pay: £${updatedMonthlyPay}`);
  }, [contractHours, hourlyRate]);

  // Generate days and load carry forward on month/year change
  useEffect(() => {
    generateDays(selectedMonth, selectedYear);
    setExpectedHours(calculateExpectedHours());
    loadCarryForward(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Load from Firestore when month or year changes
  useEffect(() => {
    if (user) {
        loadFromFirestore(selectedMonth, selectedYear);
    }
  }, [user, selectedMonth, selectedYear]);

  // Authentication state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        loadFromFirestore(selectedMonth, selectedYear);
      } else {
        navigate("/");
      }
    });
  
    return () => unsubscribe();
  }, [navigate]);

  // Update annual and monthly pay
  useEffect(() => {
    const updatedAnnualExpectedHours = calculateAnnualExpectedHours();
    setAnnualExpectedHours(updatedAnnualExpectedHours);

    const updatedAnnualPay = (updatedAnnualExpectedHours * hourlyRate).toFixed(2);
    setAnnualPay(updatedAnnualPay);

    setMonthlyPay((updatedAnnualPay / 12).toFixed(2));
  }, [selectedYear, contractHours, hourlyRate]);

  // Generate days on mount
  useEffect(() => {
    generateDays(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // ==================== COMPONENTS ====================

  // Print Modal Component
  const PrintModal = () => {
    if (!printData) return null;

    const handlePrint = () => {
      const printContent = document.getElementById('print-content');
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    };

    return (
      <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} size="xl" className="print-modal">
        <Modal.Header closeButton className="border-bottom-2 pb-3">
          <Modal.Title className="w-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <FaPrint className="me-2 text-primary" />
                <span className="h5 mb-0 fw-bold">Timesheet Summary</span>
              </div>
              <Button variant="success" onClick={handlePrint} className="d-flex align-items-center">
                <FaPrint className="me-2" />
                Print Now
              </Button>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="container-fluid p-4">
            <div id="print-content" className="print-content">
              {/* Print Styles */}
              <style>
                {`
                  @media print {
                    body { 
                      margin: 0; 
                      padding: 15px; 
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                      font-size: 12px;
                      line-height: 1.4;
                    }
                    .print-section { 
                      margin-bottom: 15px; 
                      break-inside: avoid; 
                    }
                    .print-header { 
                      text-align: center; 
                      border-bottom: 3px solid #2c5aa0; 
                      padding-bottom: 12px; 
                      margin-bottom: 20px; 
                      background: linear-gradient(135deg, #006D7D, #5E7CE2);
                      color: white;
                      padding: 20px;
                      border-radius: 8px;
                    }
                    .print-table { 
                      width: 100%; 
                      border-collapse: collapse; 
                      margin: 8px 0; 
                      font-size: 11px;
                    }
                    .print-table th, .print-table td { 
                      border: 1px solid #b0b0b0; 
                      padding: 6px 8px; 
                      text-align: left; 
                    }
                    .print-table th { 
                      background-color: #f0f0f0; 
                      font-weight: bold; 
                      color: #2c5aa0;
                    }
                    .print-summary { 
                      background: #f8f9fa; 
                      padding: 12px; 
                      border-radius: 6px; 
                      margin: 8px 0; 
                      border-left: 4px solid #006D7D;
                    }
                    .no-print { 
                      display: none !important; 
                    }
                    .page-break { 
                      page-break-before: always; 
                    }
                    .text-success { 
                      color: #198754 !important; 
                    }
                    .text-warning { 
                      color: #ffc107 !important; 
                    }
                    .text-danger { 
                      color: #dc3545 !important; 
                    }
                    .fw-bold { 
                      font-weight: bold !important; 
                    }
                    .print-grid {
                      display: grid;
                      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                      gap: 12px;
                      margin: 12px 0;
                    }
                    .print-card {
                      border: 1px solid #dee2e6;
                      border-radius: 6px;
                      padding: 10px;
                      background: white;
                    }
                  }
                  @media screen {
                    .print-content {
                      max-width: 100%;
                      overflow-x: auto;
                    }
                    .print-table {
                      min-width: 600px;
                    }
                  }
                `}
              </style>

              {/* Header */}
              <div className="print-header">
                <h2 className="mb-2" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {printData.month} {printData.year} - Timesheet Summary
                </h2>
                <div className="row justify-content-center">
                  <div className="col-auto">
                    <strong>Company:</strong> {printData.company}
                  </div>
                  <div className="col-auto">
                    <strong>Contract Type:</strong> {printData.contractType}
                  </div>
                  {printData.contractHours && (
                    <div className="col-auto">
                      <strong>Contract Hours:</strong> {printData.contractHours}
                    </div>
                  )}
                </div>
              </div>

              {/* NHS Specific Details */}
              {printData.company === "NHS" && printData.nhsDetails && (
                <div className="print-section">
                  <div className="print-grid">
                    <div className="print-card">
                      <h5 className="border-bottom pb-2 mb-3">Employee Information</h5>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span>NHS Band:</span>
                          <strong>Band {nhsBand}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Step:</span>
                          <strong>Step {nhsStep}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Employment Type:</span>
                          <strong>{printData.nhsEmploymentType === 'full-time' ? 'Full Time' : 'Part Time'}</strong>
                        </div>
                        {printData.nhsEmploymentType === 'part-time' && (
                          <div className="d-flex justify-content-between mb-1">
                            <span>Weekly Hours:</span>
                            <strong>{printData.nhsWeeklyHours}</strong>
                          </div>
                        )}
                        <div className="d-flex justify-content-between">
                          <span>Base Hourly Rate:</span>
                          <strong>£{printData.nhsDetails.baseRate}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="print-card">
                      <h5 className="border-bottom pb-2 mb-3">Hours Summary</h5>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Monthly Basic Hours:</span>
                          <strong>{printData.nhsDetails.monthlyBasicHours.toFixed(1)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Total Hours Worked:</span>
                          <strong>{printData.totalHours.toFixed(1)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Overtime Hours:</span>
                          <strong className="text-warning">{printData.nhsDetails.overtimeHours.toFixed(1)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Enhanced Hours:</span>
                          <strong className="text-success">
                            {(
                              printData.nhsEnhancements.evening + 
                              printData.nhsEnhancements.night + 
                              printData.nhsEnhancements.saturday + 
                              printData.nhsEnhancements.sunday + 
                              printData.nhsEnhancements.bankHoliday
                            ).toFixed(1)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="print-card">
                      <h5 className="border-bottom pb-2 mb-3">Pay Summary</h5>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Monthly Basic Pay:</span>
                          <strong>£{printData.nhsDetails.monthlyBasicPay.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Enhancement Pay:</span>
                          <strong className="text-success">+£{printData.nhsDetails.totalEnhancements}</strong>
                        </div>
                        {printData.nhsDetails.overtimeHours > 0 && (
                          <div className="d-flex justify-content-between mb-1">
                            <span>Overtime Pay:</span>
                            <strong className="text-warning">+£{printData.nhsDetails.overtimePay.toFixed(2)}</strong>
                          </div>
                        )}
                        <div className="d-flex justify-content-between border-top pt-1 mt-1">
                          <span className="fw-bold">Total Gross Pay:</span>
                          <strong className="text-success fs-6">£{printData.nhsDetails.totalPay}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NHS Enhancements Breakdown */}
                  <div className="mt-4">
                    <h5 className="border-bottom pb-2 mb-3">Detailed Pay Breakdown</h5>
                    <div className="table-responsive">
                      <table className="print-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Hours</th>
                            <th>Rate/Amount</th>
                            <th>Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Monthly Basic Pay</td>
                            <td>{printData.nhsDetails.monthlyBasicHours.toFixed(2)}</td>
                            <td>£{printData.nhsDetails.monthlyBasicPay.toFixed(2)}</td>
                            <td>£{printData.nhsDetails.monthlyBasicPay.toFixed(2)}</td>
                          </tr>
                          {printData.nhsEnhancements.evening > 0 && (
                            <tr>
                              <td>Evening Enhancement</td>
                              <td>{printData.nhsDetails.breakdown.evening.hours.toFixed(2)}</td>
                              <td>£{printData.nhsDetails.breakdown.evening.rate.toFixed(2)}/h</td>
                              <td>£{printData.nhsDetails.breakdown.evening.pay.toFixed(2)}</td>
                            </tr>
                          )}
                          {printData.nhsEnhancements.night > 0 && (
                            <tr>
                              <td>Night Enhancement</td>
                              <td>{printData.nhsDetails.breakdown.night.hours.toFixed(2)}</td>
                              <td>£{printData.nhsDetails.breakdown.night.rate.toFixed(2)}/h</td>
                              <td>£{printData.nhsDetails.breakdown.night.pay.toFixed(2)}</td>
                            </tr>
                          )}
                          {printData.nhsEnhancements.saturday > 0 && (
                            <tr>
                              <td>Saturday Enhancement</td>
                              <td>{printData.nhsDetails.breakdown.saturday.hours.toFixed(2)}</td>
                              <td>£{printData.nhsDetails.breakdown.saturday.rate.toFixed(2)}/h</td>
                              <td>£{printData.nhsDetails.breakdown.saturday.pay.toFixed(2)}</td>
                            </tr>
                          )}
                          {printData.nhsEnhancements.sunday > 0 && (
                            <tr>
                              <td>Sunday Enhancement</td>
                              <td>{printData.nhsDetails.breakdown.sunday.hours.toFixed(2)}</td>
                              <td>£{printData.nhsDetails.breakdown.sunday.rate.toFixed(2)}/h</td>
                              <td>£{printData.nhsDetails.breakdown.sunday.pay.toFixed(2)}</td>
                            </tr>
                          )}
                          {printData.nhsEnhancements.bankHoliday > 0 && (
                            <tr>
                              <td>Bank Holiday Enhancement</td>
                              <td>{printData.nhsDetails.breakdown.bankHoliday.hours.toFixed(2)}</td>
                              <td>£{printData.nhsDetails.breakdown.bankHoliday.rate.toFixed(2)}/h</td>
                              <td>£{printData.nhsDetails.breakdown.bankHoliday.pay.toFixed(2)}</td>
                            </tr>
                          )}
                          {printData.nhsDetails.overtimeHours > 0 && (
                            <tr>
                              <td>Overtime Pay</td>
                              <td>{printData.nhsDetails.breakdown.overtime.hours.toFixed(2)}</td>
                              <td>Variable (Based on day/time)</td>
                              <td>£{printData.nhsDetails.breakdown.overtime.pay.toFixed(2)}</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="fw-bold" style={{ background: '#e8f5e8' }}>
                            <td colSpan="3">Total Gross Pay</td>
                            <td className="text-success">£{printData.nhsDetails.totalPay}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Company Details */}
              {printData.company !== "NHS" && (
                <div className="print-section">
                  <div className="print-grid">
                    <div className="print-card">
                      <h5 className="border-bottom pb-2 mb-3">Hours Summary</h5>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Total Hours:</span>
                          <strong>{printData.totalHours.toFixed(2)}</strong>
                        </div>
                        {printData.expectedHours && (
                          <div className="d-flex justify-content-between mb-1">
                            <span>Expected Hours:</span>
                            <strong>{printData.expectedHours}</strong>
                          </div>
                        )}
                        <div className="d-flex justify-content-between mb-1">
                          <span>Days Worked:</span>
                          <strong>{printData.summary.daysWorked}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Hourly Rate:</span>
                          <strong>£{printData.hourlyRate}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="print-card">
                      <h5 className="border-bottom pb-2 mb-3">Pay Summary</h5>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Overtime/Time Owed:</span>
                          <span className={printData.summary.overtimeOrTimeOwed > 0 ? "text-success" : "text-danger"}>
                            {Math.abs(printData.summary.overtimeOrTimeOwed).toFixed(2)} hours
                          </span>
                        </div>
                        <div className="d-flex justify-content-between border-top pt-1 mt-1">
                          <span className="fw-bold">Gross Pay:</span>
                          <strong className="text-success fs-6">£{printData.grossPay}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shift Details Table */}
              <div className="print-section page-break mt-4">
                <h5 className="border-bottom pb-2 mb-3">Shift Details</h5>
                <div className="table-responsive">
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Hours</th>
                        {printData.company === "NHS" && <th>Category</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {printData.days.map((day, index) => {
                        const nhsCategory = printData.company === "NHS" ? 
                          categorizeNHSTime(day, day.timeStart, day.timeEnd) : null;
                        
                        return (
                          <tr key={index}>
                            <td>{day.day} {printData.month}</td>
                            <td>{day.weekday}</td>
                            <td>{day.timeStart || '-'}</td>
                            <td>{day.timeEnd || '-'}</td>
                            <td>{day.timeDifference ? parseFloat(day.timeDifference).toFixed(2) : '-'}</td>
                            {printData.company === "NHS" && (
                              <td>
                                {nhsCategory && nhsCategory !== 'standard' ? 
                                  nhsCategory.charAt(0).toUpperCase() + nhsCategory.slice(1) : 
                                  'Standard'
                                }
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="print-section no-print mt-4 pt-3 border-top">
                <div className="text-center">
                  <p className="text-muted small mb-1">
                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </p>
                  <p className="text-muted small">
                    Enhancement rates are additional amounts only. Base rate is included in monthly basic pay.
                  </p>
                </div>
              </div>
            </div>

            {/* Print Instructions */}
            <div className="no-print mt-4">
              <Alert variant="info" className="small">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <strong>Print Instructions:</strong> For best results, use landscape orientation and check "Background graphics" 
                    in your printer settings. The shift details will start on a new page.
                  </div>
                  <div className="col-md-4 text-end">
                    <Button variant="success" onClick={handlePrint} size="sm" className="me-2">
                      <FaPrint className="me-1" />
                      Print Summary
                    </Button>
                    <Button variant="secondary" onClick={() => setShowPrintModal(false)} size="sm">
                      Close
                    </Button>
                  </div>
                </div>
              </Alert>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  // NHS Breakdown Modal Component
  const NHSBreakdownModal = () => {
    if (!detailedNhsPay) return null;
    
    return (
      <Modal show={showNHSBreakdown} onHide={() => setShowNHSBreakdown(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHospital className="me-2 text-success" />
            NHS Pay Breakdown
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row mb-4">
            <div className="col-md-6">
              <Card className="border-0 bg-light">
                <Card.Body>
                  <h6 className="fw-bold">Base Information</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>NHS Band:</span>
                    <span className="fw-bold">Band {nhsBand}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Incremental Step:</span>
                    <span className="fw-bold">Step {nhsStep}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Employment Type:</span>
                    <span className="fw-bold">{nhsEmploymentType === 'full-time' ? 'Full Time' : 'Part Time'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Base Hourly Rate:</span>
                    <span className="fw-bold">£{detailedNhsPay.baseRate}</span>
                  </div>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-6">
              <Card className="border-0 bg-light">
                <Card.Body>
                  <h6 className="fw-bold">Summary</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Monthly Basic Hours:</span>
                    <span className="fw-bold">{detailedNhsPay.monthlyBasicHours.toFixed(2)}h</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Hours:</span>
                    <span className="fw-bold">{totalHours.toFixed(2)}h</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Overtime Hours:</span>
                    <span className="fw-bold text-warning">{detailedNhsPay.overtimeHours.toFixed(2)}h</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Gross Pay:</span>
                    <span className="fw-bold text-success">£{detailedNhsPay.totalPay}</span>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>

          <h6 className="fw-bold mb-3">Detailed Breakdown</h6>
          <div className="table-responsive">
            <Table className="table-sm">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Hours</th>
                  <th>Rate/Amount</th>
                  <th>Pay</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Monthly Basic Pay</td>
                  <td>{detailedNhsPay.monthlyBasicHours.toFixed(2)}h</td>
                  <td>£{detailedNhsPay.monthlyBasicPay.toFixed(2)}</td>
                  <td>£{detailedNhsPay.monthlyBasicPay.toFixed(2)}</td>
                </tr>
                {nhsEnhancements.evening > 0 && (
                  <tr className="table-warning">
                    <td>Evening Enhancement</td>
                    <td>{detailedNhsPay.breakdown.evening.hours.toFixed(2)}h</td>
                    <td>£{detailedNhsPay.breakdown.evening.rate.toFixed(2)}/h</td>
                    <td>£{detailedNhsPay.breakdown.evening.pay.toFixed(2)}</td>
                  </tr>
                )}
                {nhsEnhancements.night > 0 && (
                  <tr className="table-info">
                    <td>Night Enhancement</td>
                    <td>{detailedNhsPay.breakdown.night.hours.toFixed(2)}h</td>
                    <td>£{detailedNhsPay.breakdown.night.rate.toFixed(2)}/h</td>
                    <td>£{detailedNhsPay.breakdown.night.pay.toFixed(2)}</td>
                  </tr>
                )}
                {nhsEnhancements.saturday > 0 && (
                  <tr className="table-primary">
                    <td>Saturday Enhancement</td>
                    <td>{detailedNhsPay.breakdown.saturday.hours.toFixed(2)}h</td>
                    <td>£{detailedNhsPay.breakdown.saturday.rate.toFixed(2)}/h</td>
                    <td>£{detailedNhsPay.breakdown.saturday.pay.toFixed(2)}</td>
                  </tr>
                )}
                {nhsEnhancements.sunday > 0 && (
                  <tr className="table-success">
                    <td>Sunday Enhancement</td>
                    <td>{detailedNhsPay.breakdown.sunday.hours.toFixed(2)}h</td>
                    <td>£{detailedNhsPay.breakdown.sunday.rate.toFixed(2)}/h</td>
                    <td>£{detailedNhsPay.breakdown.sunday.pay.toFixed(2)}</td>
                  </tr>
                )}
                {nhsEnhancements.bankHoliday > 0 && (
                  <tr className="table-danger">
                    <td>Bank Holiday Enhancement</td>
                    <td>{detailedNhsPay.breakdown.bankHoliday.hours.toFixed(2)}h</td>
                    <td>£{detailedNhsPay.breakdown.bankHoliday.rate.toFixed(2)}/h</td>
                    <td>£{detailedNhsPay.breakdown.bankHoliday.pay.toFixed(2)}</td>
                  </tr>
                )}
                {detailedNhsPay.overtimeHours > 0 && (
                  <tr className="table-secondary">
                    <td>Overtime Pay</td>
                    <td>{detailedNhsPay.breakdown.overtime.hours.toFixed(2)}h</td>
                    <td>Variable (Based on day/time)</td>
                    <td>£{detailedNhsPay.breakdown.overtime.pay.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="fw-bold">
                  <td colSpan="3">Total Gross Pay</td>
                  <td className="text-success">£{detailedNhsPay.totalPay}</td>
                </tr>
              </tfoot>
            </Table>
          </div>

          <div className="mt-3 p-3 bg-light rounded">
            <h6 className="fw-bold">NHS Enhancement Rates</h6>
            <div className="row small">
              <div className="col-md-6">
                <div className="d-flex justify-content-between mb-1">
                  <span>Evening (Mon-Fri 6pm-8pm):</span>
                  <span className="fw-bold">£{detailedNhsPay.enhancementRates.evening.toFixed(2)}/h</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Night (Mon-Fri 8pm-6am):</span>
                  <span className="fw-bold">£{detailedNhsPay.enhancementRates.night.toFixed(2)}/h</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-between mb-1">
                  <span>Saturday:</span>
                  <span className="fw-bold">£{detailedNhsPay.enhancementRates.saturday.toFixed(2)}/h</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Sunday & Bank Holidays:</span>
                  <span className="fw-bold">£{detailedNhsPay.enhancementRates.sunday.toFixed(2)}/h & £{detailedNhsPay.enhancementRates.bankHoliday.toFixed(2)}/h</span>
                </div>
              </div>
            </div>
            <div className="mt-2 p-2 bg-white rounded">
              <small className="text-muted">
                <strong>Note:</strong> Enhancement rates shown are the additional amounts only. 
                The base rate of £{detailedNhsPay.baseRate}/h is already included in your monthly basic pay.
                Overtime is calculated separately based on NHS rules considering time and day of week.
              </small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNHSBreakdown(false)}>
            Close
          </Button>
          <Button variant="success" onClick={handlePrintTimesheet}>
            <FaPrint className="me-2" />
            Print Full Summary
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // NHS Pay Scale Information Component
  const NHSPayScaleInfo = () => (
    <Card className="border-0 bg-success bg-opacity-10 my-3">
      <Card.Body className="p-3">
        <h6 className="fw-bold mb-2">NHS Pay Information</h6>
        <div className="row small">
          <div className="col-6">
            <div className="d-flex justify-content-between mb-1">
              <span>Basic Annual Pay:</span>
              <span className="fw-bold">£{nhsPayScales[nhsBand][nhsStep - 1]?.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>Monthly Basic:</span>
              <span className="fw-bold">£{nhsMonthlyBasicPay.toFixed(2)}</span>
            </div>
          </div>
          <div className="col-6">
            <div className="d-flex justify-content-between mb-1">
              <span>Basic Hours:</span>
              <span className="fw-bold">{nhsMonthlyBasicHours.toFixed(1)}h/m</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Hourly Rate:</span>
              <span className="fw-bold">£{calculateNHSHourlyRate()}</span>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // ==================== RENDER COMPONENT ====================

  return (
    <div className="dashboard-container">
      <Container fluid className="px-3 px-md-4 py-3 h-100">
        {/* Header Section */}
        {/* <div className="dashboard-header rounded-4 p-3 p-md-4 mb-3 mb-md-4 text-white">
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
                    onClick={() => navigate("/dashboard")}
                    className="fw-bold responsive-btn"
                    size="sm"
                >
                  Back to Dashboard
                </Button>
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
              >
                Get More Insight
                <FaArrowRight className="ms-2" />
              </Button>
            </Col>
          </Row>
        </div> */}

        {/* Header Section */}
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
              <div className="d-flex flex-wrap justify-content-center justify-content-lg-end gap-2">
                <Button 
                  variant="light" 
                  onClick={() => navigate("/dashboard")}
                  className="fw-bold responsive-btn"
                  style={{
                    borderRadius: '12px',
                    padding: '8px 16px',
                    color: '#006D7D',
                    transition: 'all 0.3s ease',
                    width: 'auto',
                    minWidth: '140px'
                  }}
                >
                  <FaArrowLeft className="me-2" />
                   Dashboard
                </Button>
                
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
                >
                  Get Insight
                  <FaArrowRight className="ms-2" />
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Main Content */}
        <Row className="main-content-row g-3">
          {/* Left Panel - Input Controls */}
          <Col lg={4} className="left-panel">
            <Card className="border-0 shadow-sm h-100 rounded-3">
              <Card.Body className="p-4">
                <h3 className="h4 fw-bold mb-4" style={{ color: '#006D7D' }}>
                  <FaCalendarAlt className="me-2" />
                  Contract Details
                </h3>

                {/* Month Selector */}
                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label className="fw-medium text-muted">Month</BootstrapForm.Label>
                  <BootstrapForm.Select
                    value={selectedMonth}
                    onChange={(e) => handleMonthYearChange(Number(e.target.value), selectedYear)}
                    className="py-2 border-1"
                  >
                    {Array.from({ length: 12 }, (_, index) => (
                      <option key={index} value={index}>
                        {new Date(0, index).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </BootstrapForm.Select>
                </BootstrapForm.Group>

                {/* Year Selector */}
                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label className="fw-medium text-muted">Year</BootstrapForm.Label>
                  <BootstrapForm.Control
                    type="number"
                    value={selectedYear}
                    onChange={(e) => handleMonthYearChange(selectedMonth, Number(e.target.value))}
                    className="py-2 border-1"
                  />
                </BootstrapForm.Group>

                {/* Company Selection with NHS Option */}
                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label className="fw-medium text-muted">Company</BootstrapForm.Label>
                  <BootstrapForm.Select
                    value={company}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="py-2 border-1"
                  >
                    <option value="My Company">My Company</option>
                    <option value="Other Company">Other Company</option>
                    <option value="NHS">NHS</option>
                  </BootstrapForm.Select>
                </BootstrapForm.Group>
                
                {/* NHS Specific Fields */}
                {isNHS && (
                  <>
                    <BootstrapForm.Group className="mb-3">
                      <BootstrapForm.Label className="fw-medium text-muted">
                        <FaHospital className="me-2 text-success" />
                        NHS Band
                      </BootstrapForm.Label>
                      <BootstrapForm.Select
                        value={nhsBand}
                        onChange={(e) => setNhsBand(e.target.value)}
                        className="py-2"
                      >
                        <option value="2">Band 2</option>
                        <option value="3">Band 3</option>
                        <option value="4">Band 4</option>
                        <option value="5">Band 5</option>
                        <option value="6">Band 6</option>
                        <option value="7">Band 7</option>
                        <option value="8a">Band 8a</option>
                      </BootstrapForm.Select>
                    </BootstrapForm.Group>

                    <BootstrapForm.Group className="mb-3">
                      <BootstrapForm.Label className="fw-medium text-muted">Incremental Step</BootstrapForm.Label>
                      <BootstrapForm.Select
                        value={nhsStep}
                        onChange={(e) => setNhsStep(parseInt(e.target.value))}
                        className="py-2"
                      >
                        {[1,2,3,4,5,6].map(step => (
                          <option key={step} value={step}>Step {step}</option>
                        ))}
                      </BootstrapForm.Select>
                      <BootstrapForm.Text className="text-muted">
                        Base Rate: £{calculateNHSHourlyRate()}/hour
                      </BootstrapForm.Text>
                    </BootstrapForm.Group>

                    {/* NHS Employment Type */}
                    <BootstrapForm.Group className="mb-3">
                      <BootstrapForm.Label className="fw-medium text-muted">Employment Type</BootstrapForm.Label>
                      <BootstrapForm.Select
                        value={nhsEmploymentType}
                        onChange={(e) => handleNhsEmploymentTypeChange(e.target.value)}
                        className="py-2"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                      </BootstrapForm.Select>
                    </BootstrapForm.Group>

                    {/* Part-time Weekly Hours Input */}
                    {nhsEmploymentType === "part-time" && (
                      <BootstrapForm.Group className="mb-3">
                        <BootstrapForm.Label className="fw-medium text-muted">Weekly Contracted Hours</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type="number"
                          value={nhsWeeklyHours}
                          onChange={(e) => setNhsWeeklyHours(parseFloat(e.target.value) || 0)}
                          className="py-2"
                          step="0.5"
                          min="0"
                          max="37.5"
                        />
                        <BootstrapForm.Text className="text-muted">
                          NHS full-time standard is 37.5 hours per week
                        </BootstrapForm.Text>
                      </BootstrapForm.Group>
                    )}

                    {/* NHS Pay Scale Info */}
                    <NHSPayScaleInfo />

                    {/* Auto-calculate Button */}
                    <div className="mb-3">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={handleAutoApplyNHSEnhancements}
                        className="w-100"
                      >
                        <FaCalculator className="me-2" />
                        Auto-Calculate from Calendar
                      </Button>
                      {nhsAutoApplyMessage && (
                        <Alert variant="success" className="mt-2 py-1 small">
                          {nhsAutoApplyMessage}
                        </Alert>
                      )}
                    </div>

                    {/* NHS Enhancements Section */}
                    <Card className="bg-light border-0 mb-3">
                      <Card.Body className="p-3">
                        <h6 className="fw-bold mb-3">NHS Enhancements</h6>
                        
                        <BootstrapForm.Group className="mb-2">
                          <BootstrapForm.Label className="small mb-1">
                            Bank Holiday Hours +100%
                          </BootstrapForm.Label>
                          <BootstrapForm.Control
                            type="number"
                            value={nhsEnhancements.bankHoliday}
                            onChange={(e) => handleNhsEnhancementChange('bankHoliday', e.target.value)}
                            className="py-1"
                            step="0.5"
                          />
                        </BootstrapForm.Group>

                        {/* Overtime is now auto-calculated separately */}
                        <div className="mb-2 p-2 bg-white rounded">
                          <div className="d-flex justify-content-between small">
                            <span>Overtime Hours (Auto):</span>
                            <span className="fw-bold text-warning">{nhsOvertimeHours.toFixed(2)}h</span>
                          </div>
                          <div className="d-flex justify-content-between small mt-1">
                            <span>Overtime Pay:</span>
                            <span className="fw-bold text-warning">£{nhsOvertimePay.toFixed(2)}</span>
                          </div>
                          <BootstrapForm.Text className="text-muted">
                            Calculated based on NHS overtime rules (time/day dependent)
                          </BootstrapForm.Text>
                        </div>
                      </Card.Body>
                    </Card>
                  </>
                )}

                {/* Existing Contract Type (hidden for NHS) */}
                {!isNHS && (
                  <BootstrapForm.Group className="mb-3">
                    <BootstrapForm.Label className="fw-medium text-muted">Contract Type</BootstrapForm.Label>
                    <BootstrapForm.Select
                      value={contractType}
                      onChange={(e) => handleContractTypeChange(e.target.value)}
                      className="py-2 border-1"
                    >
                      <option value="">Select Contract Type</option>
                      <option value="Contract">Contract</option>
                      <option value="Bank">Bank</option>
                    </BootstrapForm.Select>
                  </BootstrapForm.Group>
                )}

                {/* Contract Hours Input - Only show for My Company + Contract type */}
                {showContractHours && (
                  <BootstrapForm.Group className="mb-3">
                    <BootstrapForm.Label className="fw-medium text-muted">Contract Hours (per week)</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type="number"
                      value={contractHours}
                      onChange={(e) => handleContractHoursChange(Number(e.target.value))}
                      min="0"
                      className="py-2 border-1"
                    />
                    <BootstrapForm.Text className="text-muted">
                      Your weekly contracted hours used to calculate expected monthly hours
                    </BootstrapForm.Text>
                  </BootstrapForm.Group>
                )}

                {/* Hourly Rate (hidden for NHS since it's calculated) */}
                {!isNHS && (
                  <BootstrapForm.Group>
                    <BootstrapForm.Label className="fw-medium text-muted">Hourly Rate (£)</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      min="1"
                      className="py-2 border-1"
                    />
                  </BootstrapForm.Group>
                )}
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
                <div className="calendar-header d-grid mb-4" style={{gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: "600", gap: "8px"}}>
                  {daysOfWeek.map((day, index) => {
                    const isWeekend = day === "Saturday" || day === "Sunday";
                    return (
                      <div key={index} className="py-2 rounded-3" style={{
                        background: isWeekend ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 'linear-gradient(135deg, #006D7D, #5E7CE2)',
                        color: 'white', fontSize: "0.85rem", boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        {day.substring(0, 3)}
                      </div>
                    );
                  })}
                </div>

                {/* Days Grid */}
                <div className="calendar-grid" style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px"}}>
                  {/* Empty placeholders */}
                  {days.length > 0 && Array.from({ length: daysOfWeek.indexOf(days[0]?.weekday) }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="calendar-day" style={{ height: "80px", backgroundColor: "transparent" }} />
                  ))}

                  {/* Render Days */}
                  {days.map((day, index) => {
                    const isComplete = day.timeStart && day.timeEnd;
                    const nhsCategory = isNHS ? categorizeNHSTime(day, day.timeStart, day.timeEnd) : null;
                    
                    // Get NHS enhancement color coding
                    const getNHSCategoryColor = (category) => {
                      switch(category) {
                        case 'evening': return 'border-warning';
                        case 'night': return 'border-info';
                        case 'saturday': return 'border-primary';
                        case 'sunday': return 'border-success';
                        case 'bankHoliday': return 'border-danger';
                        default: return '';
                      }
                    };

                    const nhsBorderClass = nhsCategory ? getNHSCategoryColor(nhsCategory) : '';

                    return (
                      <div
                        key={index}
                        className={`calendar-day p-1 rounded-3 d-flex flex-column justify-content-between ${
                          isComplete ? "border-success" : ""
                        } ${nhsBorderClass} ${
                          day.weekday === "Saturday" || day.weekday === "Sunday" ? "weekend" : ""
                        }`}
                        style={{
                          minHeight: "30px",
                          transition: 'all 0.3s ease',
                          borderWidth: nhsBorderClass ? '2px' : '1px'
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
                              style={{
                                backgroundColor: nhsCategory ? 
                                  (nhsCategory === 'evening' ? '#ffc107' : 
                                   nhsCategory === 'night' ? '#0dcaf0' : 
                                   nhsCategory === 'saturday' ? '#0d6efd' : 
                                   nhsCategory === 'sunday' ? '#198754' : 
                                   nhsCategory === 'bankHoliday' ? '#dc3545' : '#6c757d') : '#6c757d',
                                color: nhsCategory && (nhsCategory === 'evening' || nhsCategory === 'night') ? '#000' : '#fff'
                              }}
                            >
                              {parseFloat(day.timeDifference).toFixed(2)}h
                              {nhsCategory && nhsCategory !== 'standard' && (
                                <small className="ms-1">
                                  {nhsCategory === 'evening' ? 'EVN' : 
                                   nhsCategory === 'night' ? 'NGT' : 
                                   nhsCategory === 'saturday' ? 'SAT' : 
                                   nhsCategory === 'sunday' ? 'SUN' : 
                                   nhsCategory === 'bankHoliday' ? 'BH' : ''}
                                </small>
                              )}
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
                    
                    {showExpectedHours && (
                      <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                        <span className="text-muted">Expected Hours:</span>
                        <span className="fw-medium">{expectedHours} hrs</span>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                      <span className="text-muted">Total Hours:</span>
                      <span className="fw-medium">
                        {Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(2)} hrs
                      </span>
                    </div>
                    
                    {/* NHS Specific Hours Summary */}
                    {isNHS && detailedNhsPay && (
                      <>
                        <div className="d-flex justify-content-between mb-2 pb-1 border-bottom">
                          <span className="text-muted small">Monthly Basic Hours:</span>
                          <span className="small">{detailedNhsPay.monthlyBasicHours.toFixed(1)}h</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2 pb-1 border-bottom">
                          <span className="text-muted small">Overtime Hours:</span>
                          <span className="small text-warning">{detailedNhsPay.overtimeHours.toFixed(1)}h</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                          <span className="text-muted small">Enhanced Hours:</span>
                          <span className="small text-success">
                            {(
                              nhsEnhancements.evening + nhsEnhancements.night + 
                              nhsEnhancements.saturday + nhsEnhancements.sunday + 
                              nhsEnhancements.bankHoliday
                            ).toFixed(1)}h
                          </span>
                        </div>
                      </>
                    )}

                    {showOvertime && !isNHS && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">
                          {totalHours - expectedHours > 0 ? "Overtime:" : "Time Owed:"}
                        </span>
                        <span className={`fw-bold ${totalHours - expectedHours > 0 ? 'text-success' : 'text-danger'}`}>
                          {Math.abs(totalHours - expectedHours).toFixed(2)} hrs
                        </span>
                      </div>
                    )}

                    {/* Print Button */}
                    <Button 
                      variant="outline-primary" 
                      onClick={handlePrintTimesheet}
                      className="mt-4 w-100"
                    >
                      <FaPrint className="me-2" />
                      Print Timesheet Summary
                    </Button>
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
                    
                    {/* NHS Pay Breakdown */}
                    {isNHS && detailedNhsPay ? (
                      <>
                        <div className="d-flex justify-content-between mb-2 pb-1 border-bottom">
                          <span className="text-muted small">Monthly Basic Pay:</span>
                          <span className="small">£{detailedNhsPay.monthlyBasicPay.toFixed(2)}</span>
                        </div>
                        
                        {/* Enhanced Hours Summary */}
                        {Object.entries(nhsEnhancements).some(([_, hours]) => hours > 0) && (
                          <div className="mb-2 pb-1 border-bottom">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-muted small">Enhancement Pay:</span>
                              <span className="small text-success">
                                +£{(detailedNhsPay.eveningPay + detailedNhsPay.nightPay + 
                                    detailedNhsPay.saturdayPay + detailedNhsPay.sundayPay + 
                                    detailedNhsPay.bankHolidayPay).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Overtime Pay */}
                        {detailedNhsPay.overtimeHours > 0 && (
                          <div className="d-flex justify-content-between mb-2 pb-1 border-bottom">
                            <span className="text-muted small">Overtime Pay:</span>
                            <span className="small text-warning">+£{detailedNhsPay.overtimePay.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                          <span className="text-muted">Gross Pay:</span>
                          <span className="fw-bold text-success">£{grossPay}</span>
                        </div>

                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          className="w-100 mt-3 py-1 small"
                          onClick={() => setShowNHSBreakdown(true)}
                        >
                          View Detailed Breakdown
                        </Button>
                      </>
                    ) : (
                      /* Existing pay summary for other companies */
                      <>
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
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* NHS Information Card */}
            {isNHS && detailedNhsPay && (
              <Card className="border-0 shadow-sm bg-info bg-opacity-10">
                <Card.Body className="p-3">
                  <h6 className="fw-bold mb-2">
                    <FaHospital className="me-2 text-success" />
                    NHS Enhancement Rates
                  </h6>
                  <div className="row small">
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Evening (6pm-8pm):</span>
                        <span className="fw-bold">£{detailedNhsPay.enhancementRates.evening.toFixed(2)}/h</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>Night (8pm-6am):</span>
                        <span className="fw-bold">£{detailedNhsPay.enhancementRates.night.toFixed(2)}/h</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Saturday:</span>
                        <span className="fw-bold">£{detailedNhsPay.enhancementRates.saturday.toFixed(2)}/h</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Sunday:</span>
                        <span className="fw-bold">£{detailedNhsPay.enhancementRates.sunday.toFixed(2)}/h</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>Bank Holiday:</span>
                        <span className="fw-bold">£{detailedNhsPay.enhancementRates.bankHoliday.toFixed(2)}/h</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Overtime:</span>
                        <span className="fw-bold">Variable (Based on day/time)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-white rounded">
                    <small className="text-muted">
                      <strong>Note:</strong> Enhancement rates shown are the additional amounts only. 
                      The base rate of £{detailedNhsPay.baseRate}/h is already included in your monthly basic pay.
                      Overtime is calculated separately based on NHS rules.
                    </small>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* NHS Breakdown Modal */}
      <NHSBreakdownModal />

      {/* Print Modal */}
      <PrintModal />
    </div>
  );
};

export default Form;