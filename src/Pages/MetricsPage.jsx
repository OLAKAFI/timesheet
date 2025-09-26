import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import { Container, Row, Col, Card, Button, Form, Alert, Nav } from 'react-bootstrap';
import { FaCalendarAlt, FaMoneyBillWave, FaClock, FaArrowLeft, FaArrowRight, FaBuilding, FaFileContract, FaMoneyCheckAlt, FaEdit } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import '../style/metrics.css';
import productivity from '../peakproductivity.jpg';
import earningtrend from '../earningtrend.jpeg';
import goalachieved from '../goalachieved.jpg';
import worklifebalance from '../worklifebalance.png';

const MetricsPage = () => {
  const [dashboardData, setDashboardData] = useState({
    summary: {
      daysWorked: 0,
      expectedHours: 0,
      totalHours: 0,
      overtime: 0,
      monthlyBasic: 0,
      annualBasic: 0,
      grossPay: 0,
      carryForward: 0
    },
    contractDetails: {
      company: "My Company",
      contractType: "Contract",
      contractHours: 0,
      hourlyRate: 0
    },
    weeklyData: [],
    shiftTypeData: [
      { name: 'Day', value: 0 },
      { name: 'Night', value: 0 },
      { name: 'Weekend', value: 0 }
    ],
    dailyData: [],
    monthlyTrend: [],
    earningsByDay: []
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [editMode, setEditMode] = useState({
    hourlyRate: false,
    company: false,
    contractType: false,
    contractHours: false
  });
  const [tempValues, setTempValues] = useState({
    hourlyRate: 0,
    company: "My Company",
    contractType: "Contract",
    contractHours: 0
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('payment');
  
  const navigate = useNavigate();

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const SHIFT_COLORS = ['#4CAF50', '#2196F3', '#FF9800'];

  // Determine what to show based on company and contract type
  const showDetailedPay = dashboardData.contractDetails.contractType === "Contract" && 
                         dashboardData.contractDetails.company === "My Company";
  
  const showExpectedHours = dashboardData.contractDetails.contractType !== "Bank";
  const showOvertime = dashboardData.contractDetails.contractType !== "Bank";
  const showPreviousOvertime = dashboardData.contractDetails.contractType !== "Bank";

  // Format numbers to 2 decimal places only when necessary
  const formatHours = (hours) => {
    return hours % 1 === 0 ? hours.toString() : hours.toFixed(2);
  };

  const formatMoney = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  // Calculate total weekdays in a year
  const calculateWeekdaysInYear = (year) => {
    let weekdays = 0;
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(year, month, day).getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
          weekdays++;
        }
      }
    }
    return weekdays;
  };

  // Handle logout
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Update contract details in Firebase
  const updateContractDetails = async (updates) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "userInputs", user.uid);
      await updateDoc(userDocRef, updates);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
      
      // Refresh the data
      fetchUserData();
    } catch (error) {
      console.error("Error updating contract details:", error);
      setSaveStatus('error');
    }
  };

  // Handle contract detail updates
  const handleContractDetailUpdate = (field, value) => {
    const updates = { [field]: value };
    setEditMode(prev => ({ ...prev, [field]: false }));
    updateContractDetails(updates);
  };

  // Save current month's overtime to Firestore for next month's calculation
  const saveCurrentMonthOvertime = async (year, month, overtime) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "userInputs", user.uid);
      const currentMonthKey = `user-data-${year}-${month}`;
      
      // Update the current month's data with the calculated overtime
      await updateDoc(userDocRef, {
        [`${currentMonthKey}.carryForward`]: parseFloat(overtime) || 0
      });
      
      console.log("💾 Saved current month overtime for next month:", {
        month: `${year}-${month}`,
        overtime: parseFloat(overtime) || 0
      });
    } catch (error) {
      console.error("❌ Error saving current month overtime:", error);
    }
  };

  // Fetch available months from Firestore
  const fetchAvailableMonths = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "userInputs", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("📊 Full Firestore data:", data);
        
        const months = Object.keys(data)
          .filter(key => key.startsWith('user-data'))
          .map(key => {
            const [,, year, month] = key.split('-');
            return { 
              year: parseInt(year), 
              month: parseInt(month) - 1, 
              key,
              hasData: true 
            };
          })
          .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });
        
        // Add current month if it's not in the list
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        const hasCurrentMonth = months.some(m => m.year === currentYear && m.month === currentMonth);
        if (!hasCurrentMonth) {
          months.unshift({
            year: currentYear,
            month: currentMonth,
            key: `user-data-${currentYear}-${currentMonth + 1}`,
            hasData: false
          });
        }
        
        setAvailableMonths(months);
        
        // If current month has data, select it; otherwise select the most recent month with data
        const monthToSelect = hasCurrentMonth 
          ? months.find(m => m.year === currentYear && m.month === currentMonth)
          : months.find(m => m.hasData) || months[0];
        
        if (monthToSelect) {
          setSelectedDate(new Date(monthToSelect.year, monthToSelect.month, 1));
        }
      } else {
        console.log("❌ No user data found in Firestore");
        const currentDate = new Date();
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      }
    } catch (error) {
      console.error("Error fetching available months:", error);
      const currentDate = new Date();
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    }
  };

  // Calculate working days in a month (excluding weekends)
  const calculateWorkingDays = (month, year) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    
    for (let i = 1; i <= numDays; i++) {
      const day = new Date(year, month, i).getDay();
      if (day !== 0 && day !== 6) workingDays++;
    }
    
    return workingDays;
  };

  // Calculate expected hours based on contract hours
  const calculateExpectedHours = (contractHours, workingDays) => {
    const workingDaysInWeek = 5;
    const hoursPerDay = contractHours / workingDaysInWeek;
    const expected = (hoursPerDay * workingDays).toFixed(2);
    return expected;
  };

  
  // Calculate gross pay based on contract type and company
  // Calculate gross pay based on contract type and company
  const calculateGrossPay = (monthData, contractDetails, totalHours, previousMonthOvertime) => {
    const { company, contractType, contractHours, hourlyRate } = contractDetails;
    
    console.log("🧮 Gross Pay Calculation:", {
      company,
      contractType,
      contractHours: parseFloat(contractHours),
      hourlyRate: parseFloat(hourlyRate),
      totalHours: parseFloat(totalHours),
      previousMonthOvertime: parseFloat(previousMonthOvertime)
    });
    
    // For "Bank" contract type OR "Other Company" - use total hours * hourly rate
    if (contractType === "Bank" || company === "Other Company") {
      const gross = (totalHours * hourlyRate).toFixed(2);
      console.log("🏦 Bank/Other Company calculation: Total Hours × Hourly Rate");
      return gross;
    }
    
    // For "Contract" contract type AND "My Company" - use annual calculation divided by 12
    if (contractType === "Contract" && company === "My Company") {
      const year = selectedDate.getFullYear();
      const totalWeekdaysInYear = calculateWeekdaysInYear(year);
      const dailyHours = contractHours / 5;
      const annualSalary = (totalWeekdaysInYear * dailyHours * hourlyRate);
      const monthlyBasic = (annualSalary / 12);
      
      // Use PREVIOUS month's overtime ONLY if it's greater than 0
      // Time owed (negative) does NOT reduce the gross pay
      let gross;
      if (previousMonthOvertime > 0) {
        gross = (parseFloat(monthlyBasic) + (hourlyRate * previousMonthOvertime)).toFixed(2);
        console.log("📊 Contract calculation with overtime: Monthly Basic + Previous Month Overtime");
        console.log("📊 Overtime details:", {
          monthlyBasic,
          previousMonthOvertime,
          overtimePay: hourlyRate * previousMonthOvertime,
          grossPay: gross
        });
      } else {
        // If previous month overtime is <= 0 (including time owed), gross pay equals monthly basic
        gross = parseFloat(monthlyBasic).toFixed(2);
        console.log("📊 Contract calculation regular: Monthly Basic (no previous month overtime)");
      }
      
      console.log("📊 Contract calculation details:", {
        totalWeekdaysInYear,
        dailyHours,
        annualSalary,
        monthlyBasic,
        previousMonthOvertime,
        grossPay: gross
      });
      
      return gross;
    }
    
    // Default fallback
    console.log("⚠️ Using default calculation");
    return (totalHours * hourlyRate).toFixed(2);
  };


  // Fetch user data from Firestore for the selected date
  // Fetch user data from Firestore for the selected date
  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const key = `user-data-${year}-${month}`;
      
      console.log("🔍 Fetching data for:", key);
      
      const userDocRef = doc(db, "userInputs", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("✅ User document data:", data);
        
        // Extract contract details
        const contractDetails = {
          company: data.company || "My Company",
          contractType: data.contractType || "Contract",
          contractHours: parseFloat(data.contractHours) || 0,
          hourlyRate: parseFloat(data.hourlyRate) || 12.60
        };
        
        // Set temp values for editing
        setTempValues(contractDetails);
        
        // Get previous month's data for overtime calculation
        let previousMonthData = null;
        const prevMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
        const prevYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth() + 1;
        const prevKey = `user-data-${prevYear}-${prevMonth}`;
        
        if (data[prevKey]) {
          previousMonthData = data[prevKey];
          console.log("📅 Previous month data found:", {
            key: prevKey,
            carryForward: previousMonthData.carryForward || 0,
            hasData: true
          });
        } else {
          console.log("📅 No previous month data found for:", prevKey);
        }
        
        // Get current month's data
        let currentMonthData = { days: [], carryForward: 0 };
        if (data[key]) {
          currentMonthData = data[key];
          console.log("✅ Current month data found:", {
            key,
            daysCount: currentMonthData.days ? currentMonthData.days.length : 0,
            existingCarryForward: currentMonthData.carryForward || 0
          });
        } else {
          console.log("❌ No current month data found, using empty data");
        }
        
        await processDashboardData(currentMonthData, contractDetails, year, month, previousMonthData);
      } else {
        console.log("❌ No user document found");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      setLoading(false);
    }
  };


  
  // Process the data for dashboard visualization
  // Process the data for dashboard visualization
  const processDashboardData = async (monthData, contractDetails, year, month, previousMonthData = null) => {
    console.log("🔄 Processing dashboard data...");
    
    const { contractHours, hourlyRate, company, contractType } = contractDetails;
    
    if (!monthData.days) monthData.days = [];
    
    // Calculate days worked
    const daysWorked = monthData.days.filter(day => day.timeStart && day.timeEnd).length;
    
    // Calculate total hours
    const totalHours = monthData.days.reduce((acc, day) => {
      return acc + (day.timeDifference ? parseFloat(day.timeDifference) : 0);
    }, 0);
    
    // Calculate expected hours (only for Contract type)
    const workingDays = calculateWorkingDays(selectedDate.getMonth(), selectedDate.getFullYear());
    const expectedHours = contractType === "Bank" ? 0 : calculateExpectedHours(contractHours, workingDays);
    
    // CORRECTED: Calculate overtime/time owed properly
    const hoursDifference = totalHours - parseFloat(expectedHours);
    const overtime = contractType === "Bank" ? 0 : hoursDifference;
    
    // Get PREVIOUS month's overtime/time owed for current month's calculation
    const previousMonthOvertime = previousMonthData ? parseFloat(previousMonthData.carryForward) || 0 : 0;
    
    // Calculate earnings using the new gross pay calculation
    const grossPay = calculateGrossPay(monthData, contractDetails, totalHours, previousMonthOvertime);
    
    // Calculate monthlyBasic and annualBasic based on contract type
    let monthlyBasic = 0;
    let annualBasic = 0;
    
    if (contractType === "Contract" && company === "My Company") {
      const totalWeekdaysInYear = calculateWeekdaysInYear(year);
      const dailyHours = contractHours / 5;
      annualBasic = (totalWeekdaysInYear * dailyHours * hourlyRate);
      monthlyBasic = annualBasic / 12;
    } else {
      monthlyBasic = parseFloat(expectedHours) * hourlyRate;
      annualBasic = monthlyBasic * 12;
    }

    // 🔥 CRITICAL FIX: Calculate the ACTUAL overtime to carry forward to next month
    // This is the current month's actual overtime that will be used for next month's calculation
    const actualOvertimeForNextMonth = overtime;

    console.log("📊 Overtime Calculation Details:", {
      totalHours,
      expectedHours: parseFloat(expectedHours),
      hoursDifference,
      currentMonthOvertime: overtime,
      previousMonthOvertimeUsed: previousMonthOvertime,
      actualOvertimeForNextMonth // This is what will be carried to next month
    });
    
    // Process chart data
    const weeklyData = processWeeklyData(monthData.days, hourlyRate);
    const shiftTypeData = processShiftTypeData(monthData.days);
    const dailyData = processDailyData(monthData.days);
    const earningsByDay = processEarningsByDay(monthData.days, hourlyRate);
    
    // 🔥 CRITICAL FIX: Save the current month's overtime to Firestore for next month
    await saveCurrentMonthOvertime(year, month, actualOvertimeForNextMonth);
    
    // Update dashboard data
    setDashboardData({
      summary: {
        daysWorked,
        expectedHours: parseFloat(expectedHours),
        totalHours,
        overtime, // Current month's overtime (for display)
        monthlyBasic,
        annualBasic,
        grossPay,
        carryForward: previousMonthOvertime // Previous month's overtime (used in calculation)
      },
      contractDetails,
      weeklyData,
      shiftTypeData,
      dailyData,
      monthlyTrend: [],
      earningsByDay
    });
    
    setLoading(false);
  };



  // Process data for weekly chart
  const processWeeklyData = (days, hourlyRate) => {
    const weeks = {};
    
    days.forEach(day => {
      if (!day.timeStart || !day.timeEnd) return;
      
      const weekNumber = Math.ceil(day.day / 7);
      
      if (!weeks[weekNumber]) {
        weeks[weekNumber] = { hours: 0, earnings: 0 };
      }
      
      const hours = parseFloat(day.timeDifference);
      weeks[weekNumber].hours += hours;
      weeks[weekNumber].earnings += hours * hourlyRate;
    });
    
    return Object.keys(weeks).map(week => ({
      week: `Week ${week}`,
      hours: parseFloat(weeks[week].hours.toFixed(2)),
      earnings: parseFloat(weeks[week].earnings.toFixed(2))
    }));
  };

  // Process shift type data
  const processShiftTypeData = (days) => {
    let dayShifts = 0;
    let nightShifts = 0;
    let weekendShifts = 0;
    
    days.forEach(day => {
      if (!day.timeStart) return;
      
      if (day.weekday === 'Saturday' || day.weekday === 'Sunday') {
        weekendShifts++;
        return;
      }
      
      const [startHour] = day.timeStart.split(':').map(Number);
      if (startHour >= 6 && startHour < 18) {
        dayShifts++;
      } else {
        nightShifts++;
      }
    });
    
    return [
      { name: 'Days', value: dayShifts },
      { name: 'Nights', value: nightShifts },
      { name: 'Weekends', value: weekendShifts }
    ];
  };

  // Process daily data for trends
  const processDailyData = (days) => {
    return days.map(day => ({
      day: day.day,
      hours: day.timeDifference ? parseFloat(day.timeDifference) : 0
    })).filter(day => day.hours > 0);
  };

  // Process earnings by day
  const processEarningsByDay = (days, hourlyRate) => {
    return days.map(day => ({
      day: day.day,
      earnings: day.timeDifference ? parseFloat(day.timeDifference) * hourlyRate : 0
    })).filter(day => day.earnings > 0);
  };

  // Navigation functions
  const prevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const hasDataForMonth = (year, month) => {
    return availableMonths.some(m => m.year === year && m.month === month && m.hasData);
  };

  const canNavigateToMonth = (year, month) => {
    const currentDate = new Date();
    const targetDate = new Date(year, month, 1);
    
    if (targetDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
      return true;
    }
    
    return hasDataForMonth(year, month);
  };

  // Toggle edit mode for contract details
  const toggleEditMode = (field) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Inside your component
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 576);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 576);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle input changes for contract details
  const handleTempValueChange = (field, value) => {
    setTempValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      fetchUserData();
    }
  }, [selectedDate]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="dashboard-container">
      <Container fluid className="px-3 px-md-4 py-3">
        {/* Header Section */}
        <div className="dashboard-header rounded-4 p-3 p-md-4 mb-3 mb-md-4 text-white">
          <Row className="align-items-center">
            <Col xs={12} lg={8} className="text-center text-lg-start mb-3 mb-lg-0">
              <h1 className="h4 h1-lg fw-bold mb-2 mb-lg-3">
                SHIFTROOM ANALYTICS
              </h1>
              <p className="mb-0 fs-6 fs-lg-5 opacity-90">
                Insights and analytics for your work schedule
              </p>
            </Col>
            <Col xs={12} lg={4} className="text-center text-lg-end">
              <div className="d-flex flex-column flex-md-row justify-content-center justify-content-lg-end gap-2 gap-md-3">
                <Button 
                  variant="light" 
                  onClick={() => navigate("/timesheet")}
                  className="fw-bold responsive-nav-btn"
                  style={{
                    borderRadius: '12px',
                    padding: '8px 16px',
                    color: '#006D7D',
                    transition: 'all 0.3s ease'
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
                  <FaArrowLeft className="me-1 me-md-2" />
                  <span>Back to Shift Explorer</span>
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Save Status Alert */}
        {saveStatus === 'success' && (
          <Alert variant="success" className="mb-3">
            ✅ Contract details updated successfully! Refreshing data...
          </Alert>
        )}
        {saveStatus === 'error' && (
          <Alert variant="danger" className="mb-3">
            ❌ Error updating contract details. Please try again.
          </Alert>
        )}

        <Row className="g-3">
          {/* Left Sidebar with calendar */}
          <Col lg={4} className="d-flex">
            <Card className="border-0 shadow-sm flex-grow-1">
              <Card.Body className="p-2 p-md-3">
                <h4 className="h5 mb-2 mb-md-3 text-center">
                  <FaCalendarAlt className="me-2" />
                  Calendar
                </h4>
                
                {/* Month Navigation */}
                <div className="d-flex justify-content-between align-items-center mb-2 mb-md-3">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={prevMonth}
                    disabled={!canNavigateToMonth(selectedDate.getFullYear(), selectedDate.getMonth() - 1)}
                    className="px-2 px-md-3"
                  >
                    <FaArrowLeft />
                  </Button>
                  
                  <h5 className="h6 mb-0 text-center px-2">
                    {selectedDate.toLocaleString('default', { month: 'long' })} {selectedDate.getFullYear()}
                  </h5>
                  
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={nextMonth}
                    disabled={!canNavigateToMonth(selectedDate.getFullYear(), selectedDate.getMonth() + 1)}
                    className="px-2 px-md-3"
                  >
                    <FaArrowRight />
                  </Button>
                </div>
                
                {/* Month Selection Dropdown */}
                <Form.Group className="mb-2 mb-md-3">
                  {/* <Form.Label className="small fw-bold">Select Month</Form.Label> */}
                  <Form.Select 
                    size="sm"
                    value={`${selectedDate.getFullYear()}-${selectedDate.getMonth()}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-');
                      setSelectedDate(new Date(parseInt(year), parseInt(month), 1));
                    }}
                  >
                    {availableMonths.map(({year, month, hasData}) => (
                      <option key={`${year}-${month}`} value={`${year}-${month}`}>
                        {new Date(year, month).toLocaleString('default', { month: 'long' })} {year}
                        {!hasData && " (No data)"}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                {/* Contract Details Editor */}
                <Card className="mb-2 mb-md-3 bg-light border-0">
                  <Card.Body className="p-2">
                    <h6 className="fw-bold mb-2 small">Contract Details</h6>
                    
                    {/* Hourly Rate */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small">Hourly Rate</span>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => toggleEditMode('hourlyRate')}
                        className="px-2"
                      >
                        <FaEdit size={12} />
                      </Button>
                    </div>
                    {editMode.hourlyRate ? (
                      <div className="d-flex gap-1">
                        <Form.Control
                          size="sm"
                          type="number"
                          step="0.01"
                          value={tempValues.hourlyRate}
                          onChange={(e) => handleTempValueChange('hourlyRate', parseFloat(e.target.value) || 0)}
                        />
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleContractDetailUpdate('hourlyRate', tempValues.hourlyRate)}
                          className="px-2"
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h5 className="text-info mb-0 h6">£{formatMoney(dashboardData.contractDetails.hourlyRate)}</h5>
                        <small className="text-muted">per hour</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Mini Calendar View */}
                <div className="mini-calendar-container mb-2 mb-md-3">
                  <div className="mini-calendar">
                    {renderMiniCalendar(selectedDate, dashboardData.dailyData)}
                  </div>
                </div>
                
                {/* Data Status */}
                <div className="p-2 bg-light rounded text-center">
                  <small className="text-muted">
                    {dashboardData.summary.daysWorked > 0 
                      ? `${dashboardData.summary.daysWorked} shifts recorded` 
                      : 'No data for this month'
                    }
                  </small>
                  {dashboardData.summary.carryForward !== 0 && (
                    <div className="mt-1">
                      <small className={`fw-bold ${
                        dashboardData.summary.carryForward > 0 ? "text-warning" : "text-danger"
                      }`}>
                        {dashboardData.summary.carryForward > 0 ? "+" : ""}{formatHours(dashboardData.summary.carryForward)}h from previous month
                        {dashboardData.summary.carryForward <= 0 && " (Time Owed)"}
                      </small>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Dashboard Content */}
          <Col lg={8} className="d-flex">
            <div className="flex-grow-1 d-flex flex-column">
              {/* Pill Tabs Navigation */}
              <Card className="mb-3 border-0 shadow-sm">
                <Card.Body className="py-2">
                  <Nav variant="pills" activeKey={activeTab} onSelect={setActiveTab} className="justify-content-center">
                    <Nav.Item>
                      <Nav.Link eventKey="payment" className="px-2 px-md-3 py-1 small">
                        Overview
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="charts" className="px-2 px-md-3 py-1 small">
                        Charts & Analytics
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="insights" className="px-2 px-md-3 py-1 small">
                        Insights
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Body>
              </Card>

              {/* Tab Content */}
              <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: '400px' }}>
                {activeTab === 'payment' && (
                  <div className="flex-grow-1 d-flex flex-column">
                    {/* Period Selector */}
                    <Card className="mb-3 border-0 shadow-sm">
                      <Card.Body className="py-2">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                          <h5 className="h6 mb-2 mb-md-0">Viewing Data For:</h5>
                          <div className="period-selector d-flex">
                            <Button 
                              size="sm"
                              variant={selectedPeriod === 'monthly' ? 'primary' : 'outline-primary'}
                              onClick={() => setSelectedPeriod('monthly')}
                              className="me-1 px-2 px-md-3"
                            >
                              Monthly
                            </Button>
                            <Button 
                              size="sm"
                              variant={selectedPeriod === 'quarterly' ? 'primary' : 'outline-primary'}
                              onClick={() => setSelectedPeriod('quarterly')}
                              className="me-1 px-2 px-md-3"
                            >
                              Quarterly
                            </Button>
                            <Button 
                              size="sm"
                              variant={selectedPeriod === 'yearly' ? 'primary' : 'outline-primary'}
                              onClick={() => setSelectedPeriod('yearly')}
                              className="px-2 px-md-3"
                            >
                              Yearly
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>

                    {/* Contract Details Summary Cards */}
                    <Row className="g-2 mb-3 flex-grow-0">
                      <Col xs={6} md={3} className="d-flex">
                        <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                          <Card.Body className="p-2">
                            <FaBuilding className="text-primary mb-1 summary-icon" size={20} />
                            <h3 className="text-muted summary-label small mb-1">Company</h3>
                            <h2 className="text-primary summary-value h6 mb-0">{dashboardData.contractDetails.company}</h2>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={6} md={3} className="d-flex">
                        <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                          <Card.Body className="p-2">
                            <FaFileContract className="text-success mb-1 summary-icon" size={20} />
                            <h3 className="text-muted summary-label small mb-1">Contract Type</h3>
                            <h2 className="text-success summary-value h6 mb-0">{dashboardData.contractDetails.contractType}</h2>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={6} md={3} className="d-flex">
                        <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                          <Card.Body className="p-2">
                            <FaClock className="text-warning mb-1 summary-icon" size={20} />
                            <h3 className="text-muted summary-label small mb-1">Contract Hours</h3>
                            <h2 className="text-warning summary-value h6 mb-0">{formatHours(dashboardData.contractDetails.contractHours)}h</h2>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={6} md={3} className="d-flex">
                        <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                          <Card.Body className="p-2">
                            <FaMoneyCheckAlt className="text-info mb-1 summary-icon" size={20} />
                            <h3 className="text-muted summary-label small mb-1">Hourly Rate</h3>
                            <h2 className="text-info summary-value h6 mb-0">£{formatMoney(dashboardData.contractDetails.hourlyRate)}</h2>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Work Summary Cards */}
                    <Row className="g-2 mb-3 flex-grow-0">
                      <Col xs={6} md={3} className="d-flex">
                        <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                          <Card.Body className="p-2">
                            <FaClock className="text-primary mb-1 summary-icon" size={20} />
                            <h3 className="text-muted summary-label small mb-1">Days Worked</h3>
                            <h2 className="text-primary summary-value h6 mb-0">{dashboardData.summary.daysWorked}</h2>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={6} md={3} className="d-flex">
                        <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                          <Card.Body className="p-2">
                            <FaClock className="text-success mb-1 summary-icon" size={20} />
                            <h3 className="text-muted summary-label small mb-1">Total Hours</h3>
                            <h2 className="text-success summary-value h6 mb-0">{formatHours(dashboardData.summary.totalHours)}h</h2>
                          </Card.Body>
                        </Card>
                      </Col>
                      
                      {/* Conditionally show Expected Hours or Pay Type Info */}
                      {showExpectedHours ? (
                        <Col xs={6} md={3} className="d-flex">
                          <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                            <Card.Body className="p-2">
                              <FaClock className="text-warning mb-1 summary-icon" size={20} />
                              <h3 className="text-muted summary-label small mb-1">Expected Hours</h3>
                              <h2 className="text-warning summary-value h6 mb-0">{formatHours(dashboardData.summary.expectedHours)}h</h2>
                            </Card.Body>
                          </Card>
                        </Col>
                      ) : (
                        <Col xs={6} md={3} className="d-flex">
                          <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                            <Card.Body className="p-2">
                              <FaFileContract className="text-info mb-1 summary-icon" size={20} />
                              <h3 className="text-muted summary-label small mb-1">Pay Type</h3>
                              <h2 className="text-info summary-value h6 mb-0">Hourly</h2>
                            </Card.Body>
                          </Card>
                        </Col>
                      )}
                      
                      {/* Conditionally show Overtime or Calculation Info */}
                      {showOvertime ? (
                      <Col xs={6} md={3} className="d-flex">
                        <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                          <Card.Body className="p-2">
                            <FaClock className={`${dashboardData.summary.overtime >= 0 ? "text-primary" : "text-danger"} mb-1 summary-icon`} size={20} />
                            <h3 className="text-muted summary-label small mb-1">
                              {dashboardData.summary.overtime >= 0 ? "Overtime" : "Time Owed"}
                            </h3>
                            <h2 className={`summary-value h6 mb-0 ${
                              dashboardData.summary.overtime >= 0 ? "text-primary" : "text-danger"
                            }`}>
                              {dashboardData.summary.overtime >= 0 ? "+" : ""}{formatHours(Math.abs(dashboardData.summary.overtime))}h
                            </h2>
                            <small className="text-muted">This month</small>
                          </Card.Body>
                        </Card>
                      </Col>
                      ) : (
                        <Col xs={6} md={3} className="d-flex">
                          <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                            <Card.Body className="p-2">
                              <FaMoneyCheckAlt className="text-success mb-1 summary-icon" size={20} />
                              <h3 className="text-muted summary-label small mb-1">Calculation</h3>
                              <h2 className="text-success summary-value h6 mb-0">Simple</h2>
                            </Card.Body>
                          </Card>
                        </Col>
                      )}

                      {/* Current Month Overtime Status */}
                      {/* <Col xs={6} md={3} className="d-flex">
                        <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                          <Card.Body className="p-2">
                            <FaClock className={`${dashboardData.summary.overtime >= 0 ? "text-primary" : "text-danger"} mb-1 summary-icon`} size={20} />
                            <h3 className="text-muted summary-label small mb-1">
                              {dashboardData.summary.overtime >= 0 ? "Overtime" : "Time Owed"}
                            </h3>
                            <h2 className={`summary-value h6 mb-0 ${
                              dashboardData.summary.overtime >= 0 ? "text-primary" : "text-danger"
                            }`}>
                              {dashboardData.summary.overtime >= 0 ? "+" : ""}{formatHours(Math.abs(dashboardData.summary.overtime))}h
                            </h2>
                            <small className="text-muted">This month</small>
                          </Card.Body>
                        </Card>
                      </Col> */}


                      {/* Previous Month Overtime Status */}
                      {/* {dashboardData.summary.carryForward !== 0 && showPreviousOvertime ? (
                        <Col xs={6} md={3} className="d-flex">
                          <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                            <Card.Body className="p-2">
                              <FaExclamationTriangle className={`${dashboardData.summary.carryForward > 0 ? "text-warning" : "text-danger"} mb-1 summary-icon`} size={20} />
                              <h3 className="text-muted summary-label small mb-1">
                                {dashboardData.summary.carryForward > 0 ? "Prev Month Overtime" : "Prev Month Time Owed"}
                              </h3>
                              <h2 className={`summary-value h6 my-3 ${
                                dashboardData.summary.carryForward > 0 ? "text-warning" : "text-danger"
                              }`}>
                                {dashboardData.summary.carryForward > 0 ? "+" : ""}{formatHours(Math.abs(dashboardData.summary.carryForward))}h
                              </h2>
                              
                            </Card.Body>
                          </Card>
                        </Col>
                      ): (
                        <Col xs={6} md={3} className="d-flex d-none">
                          <Card className="border-0 shadow-sm text-center summary-card flex-grow-1">
                            <Card.Body className="p-2">
                              <FaMoneyCheckAlt className="text-success mb-1 summary-icon" size={20} />
                              <h3 className="text-muted summary-label small mb-1">Calculation</h3>
                              <h2 className="text-success summary-value h6 mb-0">Simple</h2>
                            </Card.Body>
                          </Card>
                        </Col>
                      )} */}
                    </Row>

                    {/* Gross Pay Card */}
                    <Card className="border-0 shadow-sm summary-card mb-3 flex-grow-0">
                      <Card.Body className="text-center p-3">
                        <FaMoneyBillWave className="text-success mb-2" size={30} />
                        <h3 className="text-muted h6 mb-2">Gross Pay</h3>
                        <h1 className="text-success h2 fw-bold mb-2">£{formatMoney(dashboardData.summary.grossPay)}</h1>
                        <p className="text-muted small mb-0">
                          {dashboardData.contractDetails.contractType === "Bank" || 
                          dashboardData.contractDetails.company === "Other Company"
                            ? "Calculated as Total Hours × Hourly Rate"
                            : dashboardData.summary.carryForward > 0
                            ? "Monthly basic + previous month overtime"
                            : "Monthly basic (no previous month overtime)"
                          }
                        </p>
                      </Card.Body>
                    </Card>

                    {/* Detailed Pay Information - Conditionally shown */}
                    {/* {showDetailedPay && (
                      <Row className="mb-4">
                        <Col md={6} className="mb-3">
                          <Card className="h-100 border-0 shadow-sm">
                            <Card.Body>
                              <h5 className="mb-3">Detailed Pay Breakdown</h5>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Monthly Basic:</span>
                                <strong>£{formatMoney(dashboardData.summary.monthlyBasic)}</strong>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Annual Basic:</span>
                                <strong>£{formatMoney(dashboardData.summary.annualBasic)}</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Calculation Method:</span>
                                <strong>Annual Salary / 12</strong>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Card className="h-100 border-0 shadow-sm">
                            <Card.Body>
                              <h5 className="mb-3">Hours Comparison</h5>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Total Hours:</span>
                                <strong>{formatHours(dashboardData.summary.totalHours)}h</strong>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Expected Hours:</span>
                                <strong>{formatHours(dashboardData.summary.expectedHours)}h</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Overtime/Time Owed:</span>
                                <strong className={dashboardData.summary.overtime > 0 ? "text-primary" : "text-danger"}>
                                  {dashboardData.summary.overtime > 0 ? "+" : ""}{formatHours(dashboardData.summary.overtime)}h
                                </strong>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    )} */}
                  </div>
                )}

                {/* Charts and Insights tabs remain the same */}
                {activeTab === 'charts' && (
                  <div className="flex-grow-1 d-flex flex-column">
                    {/* Charts Row 1 */}
                    <Row className="g-2 mb-3 flex-grow-1">
                      <Col xl={7} className="d-flex">
                        <Card className="border-0 shadow-sm chart-card flex-grow-1">
                          <Card.Body className="d-flex flex-column p-3">
                            <h4 className="h5 mb-3">Weekly Hours & Earnings</h4>
                            <div className="flex-grow-1" style={{ minHeight: '250px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={dashboardData.weeklyData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="week" />
                                  <YAxis yAxisId="left" />
                                  <YAxis yAxisId="right" orientation="right" />
                                  <Tooltip 
                                    formatter={(value, name) => 
                                      name === 'Earnings (£)' ? [`£${formatMoney(value)}`, name] : [formatHours(value), name]
                                    } 
                                  />
                                  <Legend />
                                  <Bar yAxisId="left" dataKey="hours" fill="#8884d8" name="Hours Worked" />
                                  <Line yAxisId="right" type="monotone" dataKey="earnings" stroke="#ff7300" name="Earnings (£)" />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xl={5} className="d-flex">
                        <Card className="border-0 shadow-sm chart-card flex-grow-1">
                          <Card.Body className="d-flex flex-column p-2 p-md-3">
                            <h4 className="h5 mb-2 mb-md-3">Shift Distribution</h4>
                            <div className="flex-grow-1 position-relative" style={{ 
                              minHeight: isSmallMobile ? '200px' : isMobile ? '250px' : '300px' 
                            }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={isMobile ? { top: 10, right: 10, bottom: 30, left: 10 } : { top: 0, right: 0, bottom: 0, left: 0 }}>
                                  <Pie
                                    data={dashboardData.shiftTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => {
                                      if (isSmallMobile) {
                                        return `${(percent * 100).toFixed(0)}%`;
                                      } else if (isMobile) {
                                        // Shorten long names on mobile
                                        const shortName = name.length > 10 ? `${name.substring(0, 8)}...` : name;
                                        return `${shortName} ${(percent * 100).toFixed(0)}%`;
                                      }
                                      return `${name}: ${(percent * 100).toFixed(0)}%`;
                                    }}
                                    outerRadius={isSmallMobile ? 50 : isMobile ? 65 : 80}
                                    innerRadius={isMobile ? 15 : 0}
                                    fill="#8884d8"
                                    dataKey="value"
                                    isAnimationActive={!isSmallMobile} // Better performance on very small screens
                                  >
                                    {dashboardData.shiftTypeData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={SHIFT_COLORS[index % SHIFT_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  {/* Always show legend on mobile for better usability */}
                                  {isMobile && (
                                    <Legend 
                                      layout="horizontal"
                                      verticalAlign="bottom"
                                      align="center"
                                      wrapperStyle={{
                                        paddingTop: '15px',
                                        fontSize: isSmallMobile ? '11px' : '11px',
                                        marginBottom: isSmallMobile ? '20px' : '0'
                                      }}
                                    />
                                  )}
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Charts Row 2 */}
                    <Row className="g-2 flex-grow-1">
                      <Col md={6} className="d-flex">
                        <Card className="border-0 shadow-sm chart-card flex-grow-1">
                          <Card.Body className="d-flex flex-column p-3">
                            <h4 className="h5 mb-3">Daily Hours Trend</h4>
                            <div className="flex-grow-1" style={{ minHeight: '250px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboardData.dailyData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="day" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => [formatHours(value), 'Hours']} />
                                  <Area type="monotone" dataKey="hours" stroke="#ff7300" fill="#ff7300" fillOpacity={0.3} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6} className="d-flex">
                        <Card className="border-0 shadow-sm chart-card flex-grow-1">
                          <Card.Body className="d-flex flex-column p-3">
                            <h4 className="h5 mb-3">Earnings by Day</h4>
                            <div className="flex-grow-1" style={{ minHeight: '250px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData.earningsByDay}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="day" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => [`£${formatMoney(value)}`, 'Earnings']} />
                                  <Bar dataKey="earnings" fill="#82ca9d" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )}

                {activeTab === 'insights' && (
                  <div className="flex-grow-1 d-flex flex-column">
                    <Card className="border-0 shadow-sm flex-grow-1">
                      <Card.Body className="d-flex flex-column p-3">
                        <h4 className="h5 mb-3">Work Insights</h4>
                        <div className="flex-grow-1">
                          <Row className="g-3 h-100">
                            {/* Peak Productivity */}
                            <Col xs={12} lg={6} className="d-flex">
                              <div className="p-3 bg-light rounded-3 w-100 d-flex flex-column flex-md-row align-items-center">
                                <div className="flex-shrink-0 mb-3 mb-md-0 me-md-3 text-center">
                                  <img 
                                    src={productivity} 
                                    alt="productivity" 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '100px', width: 'auto' }}
                                  />
                                </div>
                                <div className="flex-grow-1 text-center text-md-start">
                                  <h5 className="h6 mb-2">Peak Productivity</h5>
                                  <p className="mb-0 small">
                                    {dashboardData.dailyData.length > 0 ? (
                                      <>
                                        Your most productive day was {" "}
                                        <strong>Day {" "} {findMaxDay(dashboardData.dailyData)}</strong> with{" "}
                                        <strong>{formatHours(findMaxHours(dashboardData.dailyData))} hours.</strong> 
                                      </>
                                    ) : (
                                      "No data available for productivity analysis."
                                    )}
                                  </p>
                                </div>
                              </div>
                            </Col>

                            {/* Earnings Trend */}
                            <Col xs={12} lg={6} className="d-flex">
                              <div className="p-3 bg-light rounded-3 w-100 d-flex flex-column flex-md-row align-items-center">
                                <div className="flex-shrink-0 mb-3 mb-md-0 me-md-3 text-center">
                                  <img 
                                    src={earningtrend} 
                                    alt="earning trends" 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '100px', width: 'auto' }}
                                  />
                                </div>
                                <div className="flex-grow-1 text-center text-md-start">
                                  <h5 className="h6 mb-2">Earnings Trend</h5>
                                  <p className="mb-0 small">
                                    {dashboardData.earningsByDay.length > 0 ? (
                                      <>
                                        Your highest earning day was 
                                        <strong> £{formatMoney(findMaxEarnings(dashboardData.earningsByDay))}</strong>.
                                      </>
                                    ) : (
                                      "No earnings data available."
                                    )}
                                  </p>

                                </div>
                              </div>
                            </Col>

                            {/* Work-Life Balance */}
                            <Col xs={12} lg={6} className="d-flex">
                              <div className="p-3 bg-light rounded-3 w-100 d-flex flex-column flex-md-row align-items-center">
                                <div className="flex-shrink-0 mb-3 mb-md-0 me-md-3 text-center">
                                  <img 
                                    src={worklifebalance} 
                                    alt="work life balance" 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '100px', width: 'auto' }}
                                  />
                                </div>
                                <div className="flex-grow-1 text-center text-md-start">
                                  <h5 className="h6 mb-2">Work-Life Balance</h5>
                                  <p className="mb-0 small">
                                    {dashboardData.summary.overtime > 0 ? (
                                      <>
                                        You worked{" "}
                                        <strong>{formatHours(dashboardData.summary.overtime)} hours</strong>  of overtime this month.
                                      </>
                                    ) : (
                                      "You had no overtime this month."
                                    )}
                                  </p>

                                </div>
                              </div>
                            </Col>

                            {/* Goal Progress */}
                            <Col xs={12} lg={6} className="d-flex">
                              <div className="p-3 bg-light rounded-3 w-100 d-flex flex-column flex-md-row align-items-center">
                                <div className="flex-shrink-0 mb-3 mb-md-0 me-md-3 text-center">
                                  <img 
                                    src={goalachieved} 
                                    alt="goal achieved" 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '100px', width: 'auto' }}
                                  />
                                </div>
                                <div className="flex-grow-1 text-center text-md-start">
                                  <h5 className="h6 mb-2">Goal Progress</h5>
                                  <p className="mb-0 small">
                                    {dashboardData.summary.expectedHours > 0 ? (
                                      <>
                                        You've completed{" "}
                                        <strong>
                                          {((dashboardData.summary.totalHours / dashboardData.summary.expectedHours) * 100).toFixed(0)}%
                                        </strong>{" "}
                                        of your expected hours.
                                      </>
                                    ) : (
                                      "No expected hours data available."
                                    )}
                                  </p>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

// Helper function to render mini calenders
const renderMiniCalendar = (date, dailyData) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Format numbers to 2 decimal places only when necessary
  const formatHours = (hours) => {
    return hours % 1 === 0 ? hours.toString() : hours.toFixed(2);
  };
  
  // Create array of days
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calenders-day empty"></div>);
  }
  
  // Add cells for each day of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const dayData = dailyData.find(d => d.day === i);
    const hasData = dayData && dayData.hours > 0;
    const isToday = new Date().getDate() === i && 
                   new Date().getMonth() === month && 
                   new Date().getFullYear() === year;
    
    days.push(
      <div 
        key={i} 
        className={`calenders-day ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''}`}
        title={hasData ? `Worked: ${formatHours(dayData.hours)} hours` : 'No shift'}
      >
        <span className="day-number">{i}</span>
        {hasData && <div className="data-indicator"></div>}
        {isToday && <div className="today-indicator"></div>}
      </div>
    );
  }
  
  return (
    <div className="mini-calenders-responsive">
      <div className="calenders-header-row text-dark">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="calenders-header">
            {day}
          </div>
        ))}
      </div>
      <div className="calenders-days-grid text-center">
        {days}
      </div>
    </div>
  );
};

// Helper function to find day with max hours
const findMaxDay = (dailyData) => {
  if (dailyData.length === 0) return 0;
  const max = dailyData.reduce((prev, current) => 
    (prev.hours > current.hours) ? prev : current
  );
  return max.day;
};

// Helper function to find max hours
const findMaxHours = (dailyData) => {
  if (dailyData.length === 0) return 0;
  const max = dailyData.reduce((prev, current) => 
    (prev.hours > current.hours) ? prev : current
  );
  return max.hours;
};

// Helper function to find max earnings
const findMaxEarnings = (earningsData) => {
  if (earningsData.length === 0) return 0;
  const max = earningsData.reduce((prev, current) => 
    (prev.earnings > current.earnings) ? prev : current
  );
  return max.earnings;
};

// Helper function to calculate time owed
const calculateTimeOwed = (expectedHours, totalHours) => {
  return Math.max(0, expectedHours - totalHours);
};

// Helper function to calculate overtime
const calculateOvertime = (expectedHours, totalHours) => {
  return Math.max(0, totalHours - expectedHours);
};

export default MetricsPage;
