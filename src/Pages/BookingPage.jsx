import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Form as BootstrapForm, 
  Card, 
  Button, 
  Alert,
  Spinner,
  Badge
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
  FaUserClock
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
  getDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useParams, useNavigate } from "react-router-dom";
import { sendBookingConfirmationEmail } from '../emailService';

const BookingPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [userProfile, setUserProfile] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [bookedSlot, setBookedSlot] = useState(null);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    guestName: "",
    guestEmail: "",
    notes: ""
  });

  // Security validation
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
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  // Load user profile and availability
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setError("Invalid booking link: No user ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Loading data for user:", userId);
        
        // Try to load user profile from Firestore
        const userProfileRef = doc(db, "userProfiles", userId);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (userProfileSnap.exists()) {
          setUserProfile(userProfileSnap.data());
          console.log("User profile loaded:", userProfileSnap.data());
        } else {
          setError("Calendar owner not found. Please check the booking link.");
          setIsLoading(false);
          return;
        }

        // Load existing appointments for this user (next 30 days only)
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        const q = query(
          collection(db, "appointments"),
          where("userId", "==", userId),
          where("date", ">=", today),
          where("date", "<=", futureDateStr),
          orderBy("date", "asc"),
          orderBy("startTime", "asc")
        );

        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            const appointmentsData = [];
            querySnapshot.forEach((doc) => {
              appointmentsData.push({ id: doc.id, ...doc.data() });
            });
            setAppointments(appointmentsData);
            setIsLoading(false);
            console.log("Appointments loaded:", appointmentsData.length);
          },
          (error) => {
            console.error("Error loading appointments:", error);
            // Don't set error here - we can still show the form with limited functionality
            setAppointments([]);
            setIsLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load booking page. Please check the link and try again.");
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Helper functions for time conversion
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Generate available time slots for selected date
  const generateAvailableSlots = useCallback(() => {
    if (!userProfile) return [];

    const slots = [];
    const dateStr = selectedDate;
    
    // Get existing appointments for selected date
    const dayAppointments = appointments.filter(apt => apt.date === dateStr);
    
    // Use default working hours if userProfile doesn't have them
    const workStart = timeToMinutes(userProfile.workingHours?.start || "09:00");
    const workEnd = timeToMinutes(userProfile.workingHours?.end || "17:00");
    const slotDuration = userProfile.defaultDuration || 60;
    
    // Generate slots from working hours (every 30 minutes)
    for (let time = workStart; time <= workEnd - slotDuration; time += 30) {
      const slotStart = minutesToTime(time);
      const slotEnd = minutesToTime(time + slotDuration);
      
      // Check if this slot conflicts with existing appointments
      const hasConflict = dayAppointments.some(appointment => {
        const aptStart = timeToMinutes(appointment.startTime);
        const aptEnd = timeToMinutes(appointment.endTime);
        return time < aptEnd && (time + slotDuration) > aptStart;
      });
      
      if (!hasConflict) {
        // Only show slots in the future
        const slotDateTime = new Date(`${selectedDate}T${slotStart}`);
        if (slotDateTime > new Date()) {
          slots.push({
            start: slotStart,
            end: slotEnd,
            display: `${slotStart} - ${slotEnd}`
          });
        }
      }
    }
    
    return slots;
  }, [selectedDate, appointments, userProfile]);

  // Update available slots when dependencies change
  useEffect(() => {
    const slots = generateAvailableSlots();
    setAvailableSlots(slots);
    setSelectedSlot(null);
  }, [generateAvailableSlots]);

  // Handle booking form changes
  const handleBookingChange = (field, value) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: sanitizeInput(value)
    }));
  };

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  // Submit booking
  const handleSubmitBooking = async () => {
    // Validation
    if (!bookingForm.guestName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!validateEmail(bookingForm.guestEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    // Check if slot is still available (prevent double-booking)
    const currentSlots = generateAvailableSlots();
    const isSlotStillAvailable = currentSlots.some(slot => 
      slot.start === selectedSlot.start && slot.end === selectedSlot.end
    );

    if (!isSlotStillAvailable) {
      alert("Sorry, this time slot is no longer available. Please select another time.");
      setSelectedSlot(null);
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        title: `Meeting with ${sanitizeInput(bookingForm.guestName)}`,
        description: sanitizeInput(bookingForm.notes) || "",
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        guests: [bookingForm.guestEmail],
        location: "To be determined",
        meetingType: "in-person",
        color: "#006D7D",
        userId: userId,
        guestName: sanitizeInput(bookingForm.guestName),
        guestEmail: bookingForm.guestEmail,
        isBooking: true,
        status: "pending",
        createdAt: new Date(),
        createdBy: "external",
        duration: userProfile?.defaultDuration || 60,
        updatedAt: new Date(),
        approved: false
      };

      console.log("Creating booking with data:", bookingData);
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, "appointments"), bookingData);
      console.log("Booking created with ID:", docRef.id);
      
      // Send confirmation email
      try {
        await sendBookingConfirmationEmail({
          ...bookingData,
          id: docRef.id
        });
        console.log("Confirmation email sent successfully");
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the booking if email fails
      }
      
      // Store the booked slot for the success page
      setBookedSlot(selectedSlot);
      setBookingSuccess(true);
      
    } catch (error) {
      console.error("Error creating booking:", error);
      console.error("Error details:", error.code, error.message);
      
      // More specific error messages
      if (error.code === 'permission-denied') {
        alert("Permission denied. Please check if the booking link is valid.");
      } else if (error.code === 'invalid-argument') {
        alert("Invalid data. Please check your information and try again.");
      } else {
        alert("Error creating booking. Please try again.");
      }
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
      notes: ""
    });
  };

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

  // Error state
  if (error && !userProfile) {
    return (
      <Container className="min-vh-100 d-flex align-items-center">
        <Row className="w-100 justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-5">
                <FaExclamationTriangle size={64} className="text-danger mb-4" />
                <h2 className="mb-3">Unable to Load Booking Page</h2>
                <p className="text-muted mb-4">{error}</p>
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
                  Your meeting request for <strong>{selectedDate}</strong> at <strong>{bookedSlot?.start}</strong> has been received.
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Show error alert but still show the form if we have userProfile */}
      {error && (
        <Alert variant="warning" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error} You can still try to book an appointment.
        </Alert>
      )}

      <Row className="g-4">
        {/* Date and Time Selection */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <FaClock className="me-2" />
                Select Date & Time
              </h5>
            </Card.Header>
            <Card.Body>
              {/* Date Selection */}
              <div className="mb-4">
                <BootstrapForm.Label className="fw-medium">Select Date</BootstrapForm.Label>
                <BootstrapForm.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time Slots */}
              <div>
                <BootstrapForm.Label className="fw-medium">
                  Available Time Slots {availableSlots.length > 0 && `(${availableSlots.length} available)`}
                </BootstrapForm.Label>
                {availableSlots.length === 0 ? (
                  <Alert variant="warning" className="mb-0">
                    <FaExclamationTriangle className="me-2" />
                    No available slots for this date. Please try another date.
                  </Alert>
                ) : (
                  <div className="slots-grid">
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={selectedSlot === slot ? "primary" : "outline-primary"}
                        className="slot-btn m-1"
                        onClick={() => handleSlotSelect(slot)}
                      >
                        {slot.display}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Booking Form */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Your Information
              </h5>
            </Card.Header>
            <Card.Body>
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
                  placeholder="Any additional information about the meeting..."
                />
              </BootstrapForm.Group>

              {/* Booking Summary */}
              {selectedSlot && (
                <Card className="bg-light border-0 mb-4">
                  <Card.Body>
                    <h6 className="mb-2">Booking Summary</h6>
                    <div className="small text-muted">
                      <div><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</div>
                      <div><strong>Time:</strong> {selectedSlot.start} - {selectedSlot.end}</div>
                      <div><strong>Duration:</strong> {userProfile?.defaultDuration || 60} minutes</div>
                      <div><strong>With:</strong> {userProfile?.name || 'Calendar Owner'}</div>
                    </div>
                  </Card.Body>
                </Card>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmitBooking}
                disabled={isSubmitting || !selectedSlot}
                className="w-100"
              >
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer Info */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 bg-light">
            <Card.Body className="text-center">
              <p className="text-muted mb-0 small">
                You will receive a confirmation email with meeting details after booking.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BookingPage;