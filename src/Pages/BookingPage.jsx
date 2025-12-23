import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Form as BootstrapForm, 
  Card, 
  Button, 
  Alert,
  Spinner,
  Badge,
  Modal,
  Tabs,
  Tab
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUser,
  FaEnvelope,
  FaVideo, 
  FaMapMarkerAlt,
  FaCheckCircle,
  FaArrowLeft,
  FaExclamationTriangle,
  FaUserClock,
  FaTimes,
  FaInfoCircle,
  FaSun,
  FaCloudSun,
  FaMoon,
  FaEdit,
  FaPhone
} from "react-icons/fa";

// Firebase imports
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  doc,
  getDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useParams, useNavigate } from "react-router-dom";

const BookingPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [userProfile, setUserProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Set minimum date to today
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [bookedSlot, setBookedSlot] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [timeSelectionMethod, setTimeSelectionMethod] = useState("manual");
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    guestName: "",
    guestEmail: "",
    notes: "",
    meetingType: "in-person",
    duration: 60,
    manualStartTime: "",
    manualEndTime: ""
  });

  // Time blocks definition
  const timeBlocks = [
    { 
      id: "morning", 
      name: "Morning", 
      icon: FaSun,
      startHour: 6,
      endHour: 12,
      color: "warning",
      description: "6:00 AM - 12:00 PM"
    },
    { 
      id: "afternoon", 
      name: "Afternoon", 
      icon: FaCloudSun,
      startHour: 12,
      endHour: 18,
      color: "success",
      description: "12:00 PM - 6:00 PM"
    },
    { 
      id: "evening", 
      name: "Evening", 
      icon: FaMoon,
      startHour: 18,
      endHour: 24,
      color: "primary",
      description: "6:00 PM - 12:00 AM"
    }
  ];

  // Duration options
  const durationOptions = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" }
  ];

  // Helper functions
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTimeForDisplay = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(':').map(Number);
    const isPM = hours >= 12;
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      console.log("🔄 Loading data for user:", userId);
      
      if (!userId) {
        setError("Invalid booking link: No user ID provided");
        setIsLoading(false);
        return;
      }

      try {
        // Load user profile
        const userProfileRef = doc(db, "userProfiles", userId);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (userProfileSnap.exists()) {
          const profileData = userProfileSnap.data();
          console.log("✅ User profile loaded:", profileData.name);
          setUserProfile(profileData);
          
          // Set default duration if available
          if (profileData.defaultDuration) {
            setBookingForm(prev => ({
              ...prev,
              duration: profileData.defaultDuration
            }));
          }
        } else {
          setError("Calendar owner not found. Please check the booking link.");
          setIsLoading(false);
          return;
        }

        // Load appointments
        const today = new Date().toISOString().split('T')[0];
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("userId", "==", userId),
          where("date", ">=", today),
          orderBy("date", "asc"),
          orderBy("startTime", "asc")
        );

        const appointmentsUnsubscribe = onSnapshot(appointmentsQuery, 
          (querySnapshot) => {
            const appointmentsData = [];
            querySnapshot.forEach((doc) => {
              appointmentsData.push({ id: doc.id, ...doc.data() });
            });
            console.log("✅ Appointments loaded:", appointmentsData.length);
            setAppointments(appointmentsData);
          },
          (error) => {
            console.error("❌ Error loading appointments:", error);
            setAppointments([]);
          }
        );

        // Load shifts
        const shiftsQuery = query(
          collection(db, "shifts"),
          where("userId", "==", userId)
        );

        const shiftsUnsubscribe = onSnapshot(shiftsQuery, 
          (querySnapshot) => {
            const shiftsData = [];
            querySnapshot.forEach((doc) => {
              shiftsData.push({ id: doc.id, ...doc.data() });
            });
            console.log("✅ Shifts loaded:", shiftsData.length);
            setShifts(shiftsData);
            setIsLoading(false);
          },
          (error) => {
            console.error("❌ Error loading shifts:", error);
            setShifts([]);
            setIsLoading(false);
          }
        );

        return () => {
          appointmentsUnsubscribe();
          shiftsUnsubscribe();
        };

      } catch (error) {
        console.error("❌ Error loading user data:", error);
        setError("Failed to load booking page. Please check the link and try again.");
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Generate available time slots for the selected date
  useEffect(() => {
    if (!selectedDate || isLoading) return;
    
    const generateAvailableSlots = () => {
      setIsGeneratingSlots(true);
      
      try {
        // Get appointments and shifts for the selected date
        const dayAppointments = appointments.filter(apt => apt.date === selectedDate);
        const dayShifts = shifts.filter(shift => shift.date === selectedDate);
        
        // Combine all busy times
        const busyTimes = [];
        
        // Add appointments
        dayAppointments.forEach(apt => {
          busyTimes.push({
            start: timeToMinutes(apt.startTime),
            end: timeToMinutes(apt.endTime),
            type: 'appointment'
          });
        });
        
        // Add shifts
        dayShifts.forEach(shift => {
          busyTimes.push({
            start: timeToMinutes(shift.startTime),
            end: timeToMinutes(shift.endTime),
            type: 'shift'
          });
        });
        
        // Sort busy times by start time
        busyTimes.sort((a, b) => a.start - b.start);
        
        // Generate available slots (9 AM to 9 PM by default)
        const dayStart = 9 * 60; // 9:00 AM
        const dayEnd = 21 * 60;  // 9:00 PM
        const slotDuration = bookingForm.duration;
        const availableSlots = [];
        
        // If today, start from current time + 30 minutes
        const today = new Date().toISOString().split('T')[0];
        const isToday = selectedDate === today;
        const currentTime = isToday ? new Date().getHours() * 60 + new Date().getMinutes() + 30 : dayStart;
        const startTime = Math.max(dayStart, currentTime);
        
        // Generate 30-minute interval slots
        for (let time = startTime; time + slotDuration <= dayEnd; time += 30) {
          const slotStart = time;
          const slotEnd = time + slotDuration;
          
          // Check if slot overlaps with any busy time
          const hasConflict = busyTimes.some(busy => {
            return slotStart < busy.end && slotEnd > busy.start;
          });
          
          if (!hasConflict) {
            availableSlots.push({
              start: minutesToTime(slotStart),
              end: minutesToTime(slotEnd),
              startMinutes: slotStart,
              endMinutes: slotEnd,
              display: `${formatTimeForDisplay(minutesToTime(slotStart))} - ${formatTimeForDisplay(minutesToTime(slotEnd))}`,
              duration: slotDuration
            });
          }
        }
        
        console.log(`📅 Generated ${availableSlots.length} available slots for ${selectedDate}`);
        setAvailableTimeSlots(availableSlots);
        
      } catch (error) {
        console.error("❌ Error generating slots:", error);
        setAvailableTimeSlots([]);
      } finally {
        setIsGeneratingSlots(false);
      }
    };
    
    // Debounce slot generation
    const timer = setTimeout(generateAvailableSlots, 300);
    return () => clearTimeout(timer);
  }, [selectedDate, appointments, shifts, bookingForm.duration, isLoading]);

  // Check if a specific time slot is available
  const isSlotAvailable = useCallback((startTime, endTime) => {
    if (!startTime || !endTime) return false;
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Basic validation
    if (endMinutes <= startMinutes) return false;
    if (endMinutes - startMinutes !== bookingForm.duration) return false;
    
    // Check if today and time is in the past
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      if (startMinutes < currentMinutes) return false;
    }
    
    // Check conflicts with appointments
    const dayAppointments = appointments.filter(apt => apt.date === selectedDate);
    for (const apt of dayAppointments) {
      const aptStart = timeToMinutes(apt.startTime);
      const aptEnd = timeToMinutes(apt.endTime);
      if (startMinutes < aptEnd && endMinutes > aptStart) {
        return false;
      }
    }
    
    // Check conflicts with shifts
    const dayShifts = shifts.filter(shift => shift.date === selectedDate);
    for (const shift of dayShifts) {
      const shiftStart = timeToMinutes(shift.startTime);
      const shiftEnd = timeToMinutes(shift.endTime);
      if (startMinutes < shiftEnd && endMinutes > shiftStart) {
        return false;
      }
    }
    
    return true;
  }, [selectedDate, appointments, shifts, bookingForm.duration]);

  // Handle manual time validation
  const validateManualTime = () => {
    const { manualStartTime, manualEndTime, duration } = bookingForm;
    
    if (!manualStartTime || !manualEndTime) {
      return { valid: false, message: "Please enter both start and end time" };
    }
    
    const startMinutes = timeToMinutes(manualStartTime);
    const endMinutes = timeToMinutes(manualEndTime);
    
    // Basic time validation
    if (endMinutes <= startMinutes) {
      return { valid: false, message: "End time must be after start time" };
    }
    
    // Check duration matches
    const calculatedDuration = endMinutes - startMinutes;
    if (calculatedDuration !== duration) {
      return { 
        valid: false, 
        message: `Selected time must match the chosen duration (${duration} minutes). Please adjust your time selection.` 
      };
    }
    
    // Check if slot is available
    if (!isSlotAvailable(manualStartTime, manualEndTime)) {
      return { 
        valid: false, 
        message: "This time slot is not available. It conflicts with existing appointments or work shifts." 
      };
    }
    
    return { valid: true, message: "" };
  };

  // Handle form changes
  const handleBookingChange = (field, value) => {
    const newForm = {
      ...bookingForm,
      [field]: field === 'duration' ? parseInt(value) : sanitizeInput(value)
    };
    setBookingForm(newForm);
    
    // Clear selected slot if duration changes
    if (field === 'duration') {
      setSelectedSlot(null);
      setBookingForm(prev => ({
        ...prev,
        manualStartTime: "",
        manualEndTime: ""
      }));
    }
  };

  // Handle manual time input
  const handleManualTimeChange = (field, value) => {
    const newForm = {
      ...bookingForm,
      [field]: value
    };
    setBookingForm(newForm);
    
    // Auto-calculate end time when start time is entered
    if (field === 'manualStartTime' && value && !newForm.manualEndTime) {
      const startMinutes = timeToMinutes(value);
      const endMinutes = startMinutes + newForm.duration;
      const endTime = minutesToTime(endMinutes);
      
      setBookingForm(prev => ({
        ...prev,
        manualEndTime: endTime
      }));
      
      // Check availability
      if (isSlotAvailable(value, endTime)) {
        setSelectedSlot({
          start: value,
          end: endTime,
          display: `${formatTimeForDisplay(value)} - ${formatTimeForDisplay(endTime)}`,
          duration: newForm.duration
        });
      } else {
        setSelectedSlot(null);
      }
    } 
    // Check availability when both times are entered
    else if (newForm.manualStartTime && newForm.manualEndTime) {
      if (isSlotAvailable(newForm.manualStartTime, newForm.manualEndTime)) {
        setSelectedSlot({
          start: newForm.manualStartTime,
          end: newForm.manualEndTime,
          display: `${formatTimeForDisplay(newForm.manualStartTime)} - ${formatTimeForDisplay(newForm.manualEndTime)}`,
          duration: newForm.duration
        });
      } else {
        setSelectedSlot(null);
      }
    } else {
      setSelectedSlot(null);
    }
  };

  // Handle block slot selection
  const handleBlockSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setBookingForm(prev => ({
      ...prev,
      manualStartTime: slot.start,
      manualEndTime: slot.end
    }));
  };

  // Generate slots for time blocks
  const generateBlockSlots = useCallback((block) => {
    const slots = [];
    const slotDuration = bookingForm.duration;
    const startHour = block.startHour;
    const endHour = block.endHour;
    
    // Check if selected date is today
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;
    const currentTimeMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
    
    // Generate slots for the block (every 30 minutes)
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTimeMinutes = hour * 60 + minute;
        const endTimeMinutes = startTimeMinutes + slotDuration;
        
        // Skip if the slot would end after block end
        if (endTimeMinutes > endHour * 60) continue;
        
        // Skip if this slot is in the past (for today only)
        if (isToday && startTimeMinutes < currentTimeMinutes) continue;
        
        const slotStart = minutesToTime(startTimeMinutes);
        const slotEnd = minutesToTime(endTimeMinutes);
        
        // Check if slot is available
        if (isSlotAvailable(slotStart, slotEnd)) {
          slots.push({
            start: slotStart,
            end: slotEnd,
            startMinutes: startTimeMinutes,
            endMinutes: endTimeMinutes,
            display: `${formatTimeForDisplay(slotStart)} - ${formatTimeForDisplay(slotEnd)}`,
            duration: slotDuration
          });
        }
      }
    }
    
    return slots;
  }, [selectedDate, bookingForm.duration, isSlotAvailable]);

  // Submit booking
  const handleSubmitBooking = async () => {
    // Clear previous errors
    setError(null);
    
    // Validate form
    if (!bookingForm.guestName.trim()) {
      setError({ message: "Please enter your name", type: "warning" });
      return;
    }

    if (!validateEmail(bookingForm.guestEmail)) {
      setError({ message: "Please enter a valid email address", type: "warning" });
      return;
    }

    // Validate time slot
    if (!selectedSlot) {
      if (timeSelectionMethod === "manual") {
        const validation = validateManualTime();
        if (!validation.valid) {
          setError({ message: validation.message, type: "danger" });
          return;
        }
      } else {
        setError({ message: "Please select a time slot", type: "warning" });
        return;
      }
    }

    // Final slot availability check
    const finalStartTime = selectedSlot?.start || bookingForm.manualStartTime;
    const finalEndTime = selectedSlot?.end || bookingForm.manualEndTime;
    
    if (!isSlotAvailable(finalStartTime, finalEndTime)) {
      setError({ 
        message: "This time slot is no longer available. Please select another time.", 
        type: "danger" 
      });
      setSelectedSlot(null);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare booking data - FIXED: Proper field structure
      const bookingData = {
        // Core appointment fields
        title: `Meeting with ${sanitizeInput(bookingForm.guestName)}`,
        description: sanitizeInput(bookingForm.notes) || "",
        date: selectedDate,
        startTime: finalStartTime,
        endTime: finalEndTime,
        duration: bookingForm.duration,
        color: "#006D7D",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        
        // Guest information
        guestName: sanitizeInput(bookingForm.guestName),
        guestEmail: bookingForm.guestEmail,
        guests: [bookingForm.guestEmail],
        
        // Meeting type and location
        meetingType: bookingForm.meetingType,
        location: bookingForm.meetingType === "in-person" ? "Location to be confirmed" : "",
        
        // Video link - only include if video call
        ...(bookingForm.meetingType === "video" && { videoLink: "" }),
        
        // Booking metadata
        userId: userId,
        isBooking: true,
        status: "pending",
        approved: false,
        createdBy: "external"
      };

      console.log("📝 Creating booking:", bookingData);
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, "appointments"), bookingData);
      console.log("✅ Booking created with ID:", docRef.id);
      
      // Store the booked slot for the success page
      setBookedSlot({
        start: finalStartTime,
        end: finalEndTime,
        display: `${formatTimeForDisplay(finalStartTime)} - ${formatTimeForDisplay(finalEndTime)}`
      });
      setBookingSuccess(true);
      
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      console.error("Error details:", error.code, error.message);
      
      let errorMessage = "Error creating booking. Please try again.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check if the booking link is valid.";
      } else if (error.code === 'invalid-argument') {
        errorMessage = "Invalid data. Please check your information and try again.";
      } else if (error.message.includes('requires a valid videoLink')) {
        errorMessage = "Please provide a valid video link for video calls.";
      }
      
      setError({ message: errorMessage, type: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form for new booking
  const handleNewBooking = () => {
    setBookingSuccess(false);
    setBookedSlot(null);
    setSelectedSlot(null);
    setBookingForm({
      guestName: "",
      guestEmail: "",
      notes: "",
      meetingType: "in-person",
      duration: userProfile?.defaultDuration || 60,
      manualStartTime: "",
      manualEndTime: ""
    });
    setError(null);
  };

  // Info Modal component
  const InfoModal = () => (
    <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaInfoCircle className="me-2 text-primary" />
          Booking Information
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <h6>Time Selection Methods</h6>
          <p className="small text-muted">
            <strong>Manual Time Entry:</strong> Enter your preferred start and end time. End time is auto-calculated based on duration.
          </p>
          <p className="small text-muted">
            <strong>Time Blocks:</strong> Choose from pre-defined morning, afternoon, or evening blocks with available slots.
          </p>
        </div>
        
        <div className="mb-3">
          <h6>Availability</h6>
          <p className="small text-muted">
            Time slots that conflict with work shifts or existing appointments are automatically blocked.
            Available slots are shown in green.
          </p>
        </div>
        
        <div className="mb-3">
          <h6>Time Format</h6>
          <p className="small text-muted">
            All times are displayed in 12-hour format (AM/PM) for easy reading.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => setShowInfoModal(false)}>
          Got it!
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Loading state
  if (isLoading) {
    return (
      <Container className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3">Loading booking page...</p>
        </div>
      </Container>
    );
  }

  // Error state (critical)
  if (error && !userProfile) {
    return (
      <Container className="min-vh-100 d-flex align-items-center">
        <Row className="w-100 justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-5">
                <FaExclamationTriangle size={64} className="text-danger mb-4" />
                <h2 className="mb-3">Unable to Load Booking Page</h2>
                <p className="text-muted mb-4">{error.message}</p>
                
                <div className="d-flex gap-3 justify-content-center">
                  <Button 
                    variant="primary" 
                    onClick={() => window.location.reload()}
                    size="lg"
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate("/")}
                    size="lg"
                  >
                    Return Home
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Success state
  if (bookingSuccess) {
    return (
      <Container className="min-vh-100 d-flex align-items-center">
        <Row className="w-100 justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-5">
                <FaCheckCircle size={64} className="text-warning mb-4" />
                <h2 className="mb-3">Booking Request Sent!</h2>
                <p className="text-muted mb-4">
                  Your meeting request for <strong>{selectedDate}</strong> at <strong>{formatTimeForDisplay(bookedSlot?.start)}</strong> has been received.
                </p>
                <Alert variant="warning" className="mb-4">
                  <FaExclamationTriangle className="me-2" />
                  <strong>Pending Approval:</strong> The calendar owner needs to approve your booking. 
                  You'll receive a confirmation email once approved.
                </Alert>
                <p className="text-muted mb-4">
                  A confirmation email has been sent to <strong>{bookingForm.guestEmail}</strong>.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <Button 
                    variant="primary" 
                    onClick={handleNewBooking}
                    size="lg"
                  >
                    Book Another Meeting
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate("/")}
                    size="lg"
                  >
                    Return Home
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button 
            variant="outline-primary" 
            onClick={() => navigate("/")}
            className="mb-3"
          >
            <FaArrowLeft className="me-2" />
            Back to Home
          </Button>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="text-center py-4">
              <FaUserClock size={48} className="mb-3" />
              <h1 className="h2 mb-2">Book a Meeting</h1>
              <p className="mb-0 opacity-90">
                Schedule a meeting with {userProfile?.name || 'the calendar owner'}
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <Badge bg="light" text="dark">
                  <FaClock className="me-1" /> Available Slots
                </Badge>
                <Badge bg="light" text="dark">
                  Flexible Duration
                </Badge>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={() => setShowInfoModal(true)}
                  className="ms-2"
                >
                  <FaInfoCircle /> Info
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant={error.type || "danger"} className="mb-4" onClose={() => setError(null)} dismissible>
          <FaExclamationTriangle className="me-2" />
          {error.message}
        </Alert>
      )}

      <Row className="g-4">
        {/* Date, Duration & Time Selection */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <FaClock className="me-2" />
                Schedule Your Meeting
              </h5>
            </Card.Header>
            <Card.Body>
              {/* Date Selection */}
              <div className="mb-4">
                <BootstrapForm.Label className="fw-medium">Select Date</BootstrapForm.Label>
                <BootstrapForm.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null);
                    setBookingForm(prev => ({
                      ...prev,
                      manualStartTime: "",
                      manualEndTime: ""
                    }));
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="mb-2"
                />
                <small className="text-muted">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </small>
              </div>

              {/* Duration Selection */}
              <div className="mb-4">
                <BootstrapForm.Label className="fw-medium">
                  Appointment Duration
                </BootstrapForm.Label>
                <BootstrapForm.Select
                  value={bookingForm.duration}
                  onChange={(e) => handleBookingChange('duration', e.target.value)}
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </BootstrapForm.Select>
              </div>

              {/* Time Selection Method */}
              <div className="mb-4">
                <BootstrapForm.Label className="fw-medium">
                  Choose Time Selection Method
                </BootstrapForm.Label>
                <div className="btn-group w-100 mb-3" role="group">
                  <Button
                    variant={timeSelectionMethod === "manual" ? "primary" : "outline-primary"}
                    onClick={() => setTimeSelectionMethod("manual")}
                    className="flex-fill"
                  >
                    <FaEdit className="me-2" />
                    Enter Time Manually
                  </Button>
                  <Button
                    variant={timeSelectionMethod === "blocks" ? "primary" : "outline-primary"}
                    onClick={() => setTimeSelectionMethod("blocks")}
                    className="flex-fill"
                  >
                    <FaClock className="me-2" />
                    Choose Time Block
                  </Button>
                </div>
              </div>

              {/* Manual Time Input */}
              {timeSelectionMethod === "manual" && (
                <div className="mb-4">
                  <BootstrapForm.Label className="fw-medium">
                    Enter Start & End Time
                  </BootstrapForm.Label>
                  
                  <Row className="mb-3">
                    <Col>
                      <BootstrapForm.Group>
                        <BootstrapForm.Label className="small">Start Time</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type="time"
                          value={bookingForm.manualStartTime}
                          onChange={(e) => handleManualTimeChange('manualStartTime', e.target.value)}
                          step="900"
                          required
                        />
                      </BootstrapForm.Group>
                    </Col>
                    <Col>
                      <BootstrapForm.Group>
                        <BootstrapForm.Label className="small">End Time</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type="time"
                          value={bookingForm.manualEndTime}
                          readOnly
                          className="bg-light"
                        />
                      </BootstrapForm.Group>
                    </Col>
                  </Row>
                  
                  <Alert variant="info" className="small">
                    <FaInfoCircle className="me-2" />
                    End time is auto-calculated based on selected duration ({bookingForm.duration} minutes).
                    {isGeneratingSlots && (
                      <span className="ms-2">
                        <Spinner animation="border" size="sm" /> Checking availability...
                      </span>
                    )}
                  </Alert>
                  
                  {bookingForm.manualStartTime && bookingForm.manualEndTime && !selectedSlot && (
                    <Alert variant="danger" className="small mt-2">
                      <FaTimes className="me-2" />
                      This time slot is not available. Please choose a different time.
                    </Alert>
                  )}
                </div>
              )}

              {/* Time Blocks Selection */}
              {timeSelectionMethod === "blocks" && (
                <div>
                  <BootstrapForm.Label className="fw-medium">
                    Choose Time Block
                  </BootstrapForm.Label>
                  
                  <Tabs defaultActiveKey={timeBlocks[0].id} className="mb-3">
                    {timeBlocks.map(block => {
                      const BlockIcon = block.icon;
                      const blockSlots = generateBlockSlots(block);
                      
                      return (
                        <Tab 
                          key={block.id} 
                          eventKey={block.id} 
                          title={
                            <div className="text-center">
                              <BlockIcon className="mb-1" />
                              <div>{block.name}</div>
                              <small className="text-muted">{block.description}</small>
                            </div>
                          }
                        >
                          <div className="mt-3">
                            {isGeneratingSlots ? (
                              <div className="text-center py-4">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">Finding available slots...</p>
                              </div>
                            ) : blockSlots.length === 0 ? (
                              <Alert variant="warning" className="mb-0">
                                <FaExclamationTriangle className="me-2" />
                                No available slots in this time block. 
                                Try a different block, adjust the duration, or select another date.
                              </Alert>
                            ) : (
                              <div className="slots-grid">
                                {blockSlots.map((slot, index) => (
                                  <Button
                                    key={index}
                                    variant={selectedSlot === slot ? "primary" : "outline-primary"}
                                    className="slot-btn m-1"
                                    onClick={() => handleBlockSlotSelect(slot)}
                                    size="sm"
                                  >
                                    {slot.display}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </Tab>
                      );
                    })}
                  </Tabs>
                  
                  <Alert variant="info" className="small">
                    <FaInfoCircle className="me-2" />
                    Only available time slots are shown. Work shifts and existing appointments are automatically excluded.
                  </Alert>
                </div>
              )}

              {/* Selected Slot Display */}
              {selectedSlot && (
                <Card className="border-success mt-3">
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 text-success">Selected Time Slot</h6>
                        <p className="mb-0">
                          <strong>{formatTimeForDisplay(selectedSlot.start)} - {formatTimeForDisplay(selectedSlot.end)}</strong>
                          <span className="text-muted ms-2">({selectedSlot.duration} minutes)</span>
                        </p>
                      </div>
                      <Badge bg="success">
                        Available
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Booking Form */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Your Information & Meeting Details
              </h5>
            </Card.Header>
            <Card.Body>
              {/* Meeting Type Selection */}
              <div className="mb-4">
                <BootstrapForm.Label className="fw-medium">
                  Meeting Type
                </BootstrapForm.Label>
                <div className="btn-group w-100 mb-2" role="group">
                  <Button
                    variant={bookingForm.meetingType === "in-person" ? "primary" : "outline-primary"}
                    onClick={() => handleBookingChange('meetingType', 'in-person')}
                  >
                    <FaMapMarkerAlt className="me-1" />
                    In Person
                  </Button>
                  <Button
                    variant={bookingForm.meetingType === "video" ? "primary" : "outline-primary"}
                    onClick={() => handleBookingChange('meetingType', 'video')}
                  >
                    <FaVideo className="me-1" />
                    Video Call
                  </Button>
                  <Button
                    variant={bookingForm.meetingType === "phone" ? "primary" : "outline-primary"}
                    onClick={() => handleBookingChange('meetingType', 'phone')}
                  >
                    <FaPhone className="me-1" />
                    Phone Call
                  </Button>
                </div>
                <small className="text-muted">
                  {bookingForm.meetingType === "in-person" && "Location will be confirmed after booking approval"}
                  {bookingForm.meetingType === "video" && "Video link will be provided after booking approval"}
                  {bookingForm.meetingType === "phone" && "Phone number will be provided after booking approval"}
                </small>
              </div>

              <BootstrapForm.Group className="mb-3">
                <BootstrapForm.Label className="fw-medium">
                  Full Name *
                </BootstrapForm.Label>
                <BootstrapForm.Control
                  type="text"
                  value={bookingForm.guestName}
                  onChange={(e) => handleBookingChange('guestName', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3">
                <BootstrapForm.Label className="fw-medium">
                  Email Address *
                </BootstrapForm.Label>
                <BootstrapForm.Control
                  type="email"
                  value={bookingForm.guestEmail}
                  onChange={(e) => handleBookingChange('guestEmail', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
                <BootstrapForm.Text className="text-muted">
                  Confirmation and updates will be sent to this email
                </BootstrapForm.Text>
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-4">
                <BootstrapForm.Label className="fw-medium">
                  Additional Notes (Optional)
                </BootstrapForm.Label>
                <BootstrapForm.Control
                  as="textarea"
                  rows={3}
                  value={bookingForm.notes}
                  onChange={(e) => handleBookingChange('notes', e.target.value)}
                  placeholder="Purpose of meeting, specific topics to discuss, or any special requirements..."
                />
                <BootstrapForm.Text className="text-muted">
                  This helps the host prepare for your meeting
                </BootstrapForm.Text>
              </BootstrapForm.Group>

              {/* Booking Summary */}
              {selectedSlot && (
                <Card className="bg-light border-0 mb-4">
                  <Card.Body>
                    <h6 className="mb-3">Booking Summary</h6>
                    <div className="small">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Date:</span>
                        <strong>{new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Time:</span>
                        <strong>{formatTimeForDisplay(selectedSlot.start)} - {formatTimeForDisplay(selectedSlot.end)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Duration:</span>
                        <strong>{selectedSlot.duration} minutes</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Meeting Type:</span>
                        <strong className="text-capitalize">
                          {bookingForm.meetingType === "in-person" ? "In Person" : 
                           bookingForm.meetingType === "video" ? "Video Call" : "Phone Call"}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">With:</span>
                        <strong>{userProfile?.name || 'Calendar Owner'}</strong>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmitBooking}
                disabled={isSubmitting || !selectedSlot}
                className="w-100 py-3"
              >
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Processing Booking...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="me-2" />
                    {selectedSlot ? "Confirm Booking Request" : "Please Select a Time Slot"}
                  </>
                )}
              </Button>
              
              <div className="text-center mt-3">
                <small className="text-muted">
                  Your booking will be pending until approved by {userProfile?.name || 'the host'}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer Info */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 bg-light">
            <Card.Body>
              <Row className="text-center">
                <Col md={4} className="mb-3 mb-md-0">
                  <div className="d-flex flex-column align-items-center">
                    <FaClock className="text-primary mb-2" size={24} />
                    <h6 className="mb-1">Real-Time Availability</h6>
                    <p className="small text-muted mb-0">
                      Live checking for conflicts
                    </p>
                  </div>
                </Col>
                <Col md={4} className="mb-3 mb-md-0">
                  <div className="d-flex flex-column align-items-center">
                    <FaExclamationTriangle className="text-warning mb-2" size={24} />
                    <h6 className="mb-1">Conflict Prevention</h6>
                    <p className="small text-muted mb-0">
                      Work shifts and appointments blocked
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex flex-column align-items-center">
                    <FaCheckCircle className="text-success mb-2" size={24} />
                    <h6 className="mb-1">Instant Feedback</h6>
                    <p className="small text-muted mb-0">
                      Immediate slot validation
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Info Modal */}
      <InfoModal />
    </Container>
  );
};

export default BookingPage;