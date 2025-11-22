import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Form as BootstrapForm, 
  Card, 
  Button, 
  Modal, 
  Badge,
  Alert,
  ListGroup,
  Offcanvas,
  Collapse
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { 
  FaUser,
  FaTimes,
  FaEnvelope,
  FaCalendarAlt, 
  FaClock, 
  FaUserPlus, 
  FaVideo, 
  FaMapMarkerAlt,
  FaTrash,
  FaEdit,
  FaShare,
  FaCopy,
  FaCheckCircle,
  FaBars,
  FaPlus,
  FaArrowLeft,
  FaArrowRight,
  FaUsers,
  FaStickyNote,
  FaPhone,
  FaRegCalendarPlus,
  FaChevronDown,
  FaChevronUp,
  FaExpand,
  FaCompress,
  FaExclamationTriangle
} from "react-icons/fa";

// Firebase imports
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  onSnapshot, 
  query, 
  where,
  orderBy 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";

import { sendBookingApprovalEmail } from '../emailService';



// Security utility functions
const securityUtils = {
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;')
      .substring(0, 1000);
  },

  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validateUrl: (url) => {
    if (!url) return true;
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  },

  validateColor: (color) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  },

  validateTimeRange: (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return start < end;
  }
};

// FIXED: Memoized Appointment Modal Component
const AppointmentModal = React.memo(({ 
  showAppointmentModal, 
  appointmentForm, 
  handleAppointmentChange, 
  handleAddGuest, 
  handleRemoveGuest, 
  handleCreateAppointment, 
  isSaving, 
  editingAppointment, 
  setShowAppointmentModal, 
  resetAppointmentForm,
  handleDeleteAppointment 
}) => {
  const form = appointmentForm;

  // Security: Safe change handler
  const handleSafeChange = (field, value) => {
    let sanitizedValue = value;
    
    switch (field) {
      case 'title':
      case 'description':
      case 'location':
        sanitizedValue = securityUtils.sanitizeInput(value);
        break;
      case 'videoLink':
        if (value && !securityUtils.validateUrl(value)) {
          alert('Please enter a valid URL starting with http:// or https://');
          return;
        }
        sanitizedValue = value;
        break;
      case 'newGuest':
        sanitizedValue = value;
        break;
      case 'color':
        if (!/^#[0-9A-F]{6}$/i.test(value) && value !== '') {
          return;
        }
        sanitizedValue = value;
        break;
      default:
        sanitizedValue = value;
    }
    
    handleAppointmentChange(field, sanitizedValue);
  };

  // Security: Enhanced guest addition with validation
  const handleSafeAddGuest = () => {
    if (form.newGuest && securityUtils.validateEmail(form.newGuest.trim())) {
      handleAddGuest();
    } else {
      alert('Please enter a valid email address');
    }
  };

  // Security: Prevent XSS in display
  const safeDisplay = (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  if (!showAppointmentModal) return null;

  return (
    <Modal 
      show={showAppointmentModal} 
      onHide={() => {
        setShowAppointmentModal(false);
        resetAppointmentForm();
      }} 
      size="lg"
      aria-labelledby="appointment-modal-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="appointment-modal-title">
          <FaCalendarAlt className="me-2" />
          {editingAppointment ? 'Edit Appointment' : 'Create New Appointment'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <BootstrapForm.Group className="mb-3">
              <BootstrapForm.Label htmlFor="appointment-title" className="fw-medium">
                Title *
              </BootstrapForm.Label>
              <BootstrapForm.Control
                id="appointment-title"
                type="text"
                value={form.title}
                onChange={(e) => handleSafeChange('title', e.target.value)}
                placeholder="Meeting title"
                aria-required="true"
                autoFocus
                maxLength="100"
              />
            </BootstrapForm.Group>
          </Col>
          <Col md={6}>
            <BootstrapForm.Group className="mb-3">
              <BootstrapForm.Label htmlFor="appointment-color" className="fw-medium">
                Color
              </BootstrapForm.Label>
              <div className="d-flex align-items-center gap-2">
                <BootstrapForm.Control
                  id="appointment-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => handleSafeChange('color', e.target.value)}
                  aria-label="Choose appointment color"
                  style={{ width: '50px', height: '38px' }}
                />
                <div className="flex-grow-1">
                  <BootstrapForm.Control
                    type="text"
                    value={form.color}
                    onChange={(e) => handleSafeChange('color', e.target.value)}
                    placeholder="#006D7D"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    maxLength="7"
                  />
                </div>
              </div>
            </BootstrapForm.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <BootstrapForm.Group className="mb-3">
              <BootstrapForm.Label htmlFor="appointment-date" className="fw-medium">
                Date *
              </BootstrapForm.Label>
              <BootstrapForm.Control
                id="appointment-date"
                type="date"
                value={form.date}
                onChange={(e) => handleSafeChange('date', e.target.value)}
                aria-required="true"
                min={new Date().toISOString().split('T')[0]}
              />
            </BootstrapForm.Group>
          </Col>
          <Col md={3}>
            <BootstrapForm.Group className="mb-3">
              <BootstrapForm.Label htmlFor="appointment-start-time" className="fw-medium">
                Start Time *
              </BootstrapForm.Label>
              <BootstrapForm.Control
                id="appointment-start-time"
                type="time"
                value={form.startTime}
                onChange={(e) => handleSafeChange('startTime', e.target.value)}
                aria-required="true"
              />
            </BootstrapForm.Group>
          </Col>
          <Col md={3}>
            <BootstrapForm.Group className="mb-3">
              <BootstrapForm.Label htmlFor="appointment-end-time" className="fw-medium">
                End Time *
              </BootstrapForm.Label>
              <BootstrapForm.Control
                id="appointment-end-time"
                type="time"
                value={form.endTime}
                onChange={(e) => handleSafeChange('endTime', e.target.value)}
                aria-required="true"
              />
            </BootstrapForm.Group>
          </Col>
        </Row>

        <BootstrapForm.Group className="mb-3">
          <BootstrapForm.Label htmlFor="appointment-description" className="fw-medium">
            Description
          </BootstrapForm.Label>
          <BootstrapForm.Control
            id="appointment-description"
            as="textarea"
            rows={3}
            value={form.description}
            onChange={(e) => handleSafeChange('description', e.target.value)}
            placeholder="Meeting description or agenda..."
            aria-describedby="description-help"
            maxLength="500"
          />
          <BootstrapForm.Text id="description-help" className="text-muted">
            {form.description.length}/500 characters
          </BootstrapForm.Text>
        </BootstrapForm.Group>

        <BootstrapForm.Group className="mb-3">
          <BootstrapForm.Label htmlFor="meeting-type" className="fw-medium">
            Meeting Type
          </BootstrapForm.Label>
          <BootstrapForm.Select
            id="meeting-type"
            value={form.meetingType}
            onChange={(e) => handleSafeChange('meetingType', e.target.value)}
          >
            <option value="in-person">In Person</option>
            <option value="video">Video Call</option>
            <option value="phone">Phone Call</option>
          </BootstrapForm.Select>
        </BootstrapForm.Group>

        {form.meetingType === "video" && (
          <BootstrapForm.Group className="mb-3">
            <BootstrapForm.Label htmlFor="video-link" className="fw-medium">
              Video Link
            </BootstrapForm.Label>
            <BootstrapForm.Control
              id="video-link"
              type="url"
              value={form.videoLink}
              onChange={(e) => handleSafeChange('videoLink', e.target.value)}
              placeholder="https://meet.google.com/..."
              pattern="https?://.+"
            />
            <BootstrapForm.Text className="text-muted">
              Must be a valid URL starting with http:// or https://
            </BootstrapForm.Text>
          </BootstrapForm.Group>
        )}

        {form.meetingType === "in-person" && (
          <BootstrapForm.Group className="mb-3">
            <BootstrapForm.Label htmlFor="location" className="fw-medium">
              Location
            </BootstrapForm.Label>
            <BootstrapForm.Control
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => handleSafeChange('location', e.target.value)}
              placeholder="Meeting location"
              maxLength="100"
            />
          </BootstrapForm.Group>
        )}

        <BootstrapForm.Group className="mb-3">
          <BootstrapForm.Label htmlFor="guest-email" className="fw-medium">
            Guests
          </BootstrapForm.Label>
          <div className="d-flex gap-2 mb-2">
            <BootstrapForm.Control
              id="guest-email"
              type="email"
              value={form.newGuest}
              onChange={(e) => handleSafeChange('newGuest', e.target.value)}
              placeholder="Enter guest email"
              onKeyPress={(e) => e.key === 'Enter' && handleSafeAddGuest()}
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
            />
            <Button 
              variant="outline-primary" 
              onClick={handleSafeAddGuest}
              aria-label="Add guest"
            >
              <FaUserPlus />
            </Button>
          </div>
          
          {form.guests.length > 0 && (
            <ListGroup>
              {form.guests.map((guest, index) => (
                <ListGroup.Item 
                  key={index} 
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>{safeDisplay(guest)}</span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveGuest(index)}
                    aria-label={`Remove guest ${safeDisplay(guest)}`}
                  >
                    <FaTrash />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </BootstrapForm.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={() => {
            setShowAppointmentModal(false);
            resetAppointmentForm();
          }}
          disabled={isSaving}
        >
          Cancel
        </Button>
        {editingAppointment && (
          <Button 
            variant="danger" 
            onClick={() => handleDeleteAppointment(editingAppointment.id)}
            disabled={isSaving}
          >
            <FaTrash className="me-1" />
            Delete
          </Button>
        )}
        <Button 
          variant="primary" 
          onClick={() => handleCreateAppointment(false)}
          disabled={isSaving || !form.title.trim()}
        >
          {isSaving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {editingAppointment ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <FaCheckCircle className="me-1" />
              {editingAppointment ? 'Update' : 'Create'} Appointment
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
});



const AppointmentScheduler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showDayViewModal, setShowDayViewModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [viewMode, setViewMode] = useState("month");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 576);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 576 && window.innerWidth <= 768);
  const [copySuccess, setCopySuccess] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedAppointments, setExpandedAppointments] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingAppointments, setConflictingAppointments] = useState([]);
  const [pendingAppointment, setPendingAppointment] = useState(null);

  // FIXED: Use state for form to prevent flashing and improve performance
  const [appointmentForm, setAppointmentForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "10:00",
    guests: [],
    newGuest: "",
    location: "",
    meetingType: "in-person",
    videoLink: "",
    color: "#006D7D"
  });

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 576);
      setIsTablet(width >= 576 && width <= 768);
      if (width >= 768) {
        setShowMobileSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update selectedDate when month/year changes
  useEffect(() => {
    setSelectedDate(new Date(selectedYear, selectedMonth, 1));
  }, [selectedMonth, selectedYear]);

  // Load appointments from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("date", "asc"),
      orderBy("startTime", "asc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appointmentsData = [];
      querySnapshot.forEach((doc) => {
        appointmentsData.push({ id: doc.id, ...doc.data() });
      });
      setAppointments(appointmentsData);
    });

    return () => unsubscribe();
  }, [user]);

  // FIXED: Proper form state management without flashing
  const handleAppointmentChange = useCallback((field, value) => {
    setAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Add guest to appointment
  const handleAddGuest = () => {
    if (appointmentForm.newGuest && appointmentForm.newGuest.includes('@')) {
      setAppointmentForm(prev => ({
        ...prev,
        guests: [...prev.guests, prev.newGuest.trim()],
        newGuest: ""
      }));
    }
  };

  // Remove guest from appointment
  const handleRemoveGuest = (index) => {
    setAppointmentForm(prev => ({
      ...prev,
      guests: prev.guests.filter((_, i) => i !== index)
    }));
  };

  // Check for appointment conflicts
  const checkAppointmentConflicts = (appointmentData, excludeId = null) => {
    const { date, startTime, endTime } = appointmentData;
    
    return appointments.filter(appointment => {
      if (excludeId && appointment.id === excludeId) return false;
      if (appointment.date !== date) return false;
      
      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);
      const existingStart = timeToMinutes(appointment.startTime);
      const existingEnd = timeToMinutes(appointment.endTime);
      
      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Create new appointment - FIXED: Added security validation
  const handleCreateAppointment = async (overrideConflict = false) => {
    if (isSaving) return;
    
    const form = appointmentForm;
    
    // Security: Validate required fields
    if (!form.title.trim()) {
      alert("Please enter a title for the appointment");
      return;
    }

    // Security: Sanitize inputs
    const sanitizedForm = {
      ...form,
      title: securityUtils.sanitizeInput(form.title.trim()),
      description: securityUtils.sanitizeInput(form.description.trim()),
      location: securityUtils.sanitizeInput(form.location),
    };

    // Security: Validate color
    if (!securityUtils.validateColor(sanitizedForm.color)) {
      alert("Please select a valid color");
      return;
    }

    // Security: Validate URL for video calls
    if (sanitizedForm.meetingType === 'video' && sanitizedForm.videoLink && 
        !securityUtils.validateUrl(sanitizedForm.videoLink)) {
      alert("Please enter a valid video link URL");
      return;
    }

    // Security: Validate time range
    if (!securityUtils.validateTimeRange(sanitizedForm.startTime, sanitizedForm.endTime)) {
      alert("End time must be after start time");
      return;
    }

    // Security: Validate date is not in the past
    const selectedDate = new Date(sanitizedForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert("Cannot create appointments in the past");
      return;
    }

    // Check for conflicts
    const conflicts = checkAppointmentConflicts(
      sanitizedForm, 
      editingAppointment ? editingAppointment.id : null
    );

    if (conflicts.length > 0 && !overrideConflict) {
      setConflictingAppointments(conflicts);
      setPendingAppointment(sanitizedForm);
      setShowConflictModal(true);
      return;
    }

    setIsSaving(true);

    try {
      const appointmentData = {
        ...sanitizedForm,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingAppointment) {
        await updateDoc(doc(db, "appointments", editingAppointment.id), appointmentData);
        setAppointments(prev => prev.map(apt => 
          apt.id === editingAppointment.id 
            ? { ...apt, ...appointmentData }
            : apt
        ));
      } else {
        const result = await addDoc(collection(db, "appointments"), appointmentData);
        const newAppointment = { 
          id: result.id, 
          ...appointmentData 
        };
        setAppointments(prev => [...prev, newAppointment]);
      }

      setShowAppointmentModal(false);
      setShowConflictModal(false);
      resetAppointmentForm();
      
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("Error saving appointment. Please try again.");
    } finally {
      setIsSaving(false);
      setPendingAppointment(null);
    }
  };

  // Handle conflict resolution
  const handleConflictResolution = (action) => {
    if (action === 'reschedule') {
      setShowConflictModal(false);
    } else if (action === 'continue') {
      handleCreateAppointment(true);
    } else if (action === 'cancel') {
      setShowConflictModal(false);
      setPendingAppointment(null);
      setConflictingAppointments([]);
    }
  };

  // Edit existing appointment
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setAppointmentForm({
      title: appointment.title || "",
      description: appointment.description || "",
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      guests: appointment.guests || [],
      newGuest: "",
      location: appointment.location || "",
      meetingType: appointment.meetingType || "in-person",
      videoLink: appointment.videoLink || "",
      color: appointment.color || "#006D7D"
    });
    setShowAppointmentModal(true);
    setShowDayViewModal(false);
  };

  // Delete appointment
  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
        await deleteDoc(doc(db, "appointments", appointmentId));
      } catch (error) {
        console.error("Error deleting appointment:", error);
        alert("Error deleting appointment. Please try again.");
      }
    }
  };

  // Add this function to your AppointmentScheduler
  const createUserProfile = async () => {
    if (!user) return;
    
    try {
      const userProfileRef = doc(db, "userProfiles", user.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (!userProfileSnap.exists()) {
        // Create initial user profile
        await setDoc(userProfileRef, {
          name: user.displayName || user.email?.split('@')[0] || "Calendar Owner",
          email: user.email,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          defaultDuration: 60,
          workingHours: {
            start: "09:00",
            end: "17:00"
          },
          meetingTypes: ["in-person", "video", "phone"],
          createdAt: new Date()
        });
        console.log("User profile created");
      }
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  };

// Call this when user logs in
useEffect(() => {
  if (user) {
    createUserProfile();
  }
}, [user]);

  // Reset appointment form
  const resetAppointmentForm = () => {
    setAppointmentForm({
      title: "",
      description: "",
      date: selectedDay ? selectedDay.dateString : new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "10:00",
      guests: [],
      newGuest: "",
      location: "",
      meetingType: "in-person",
      videoLink: "",
      color: "#006D7D"
    });
    setEditingAppointment(null);
  };

  // Toggle appointment expansion
  const toggleAppointmentExpand = (appointmentId) => {
    setExpandedAppointments(prev => ({
      ...prev,
      [appointmentId]: !prev[appointmentId]
    }));
  };

  // Generate booking link
  const generateBookingLink = () => {
    // For production, use absolute URLs
    if (process.env.NODE_ENV === 'production') {
      return `https://shiftroom.co.uk/book/${user?.uid || 'user'}`;
    } else {
      // For development
      const baseUrl = window.location.origin;
      return `${baseUrl}/book/${user?.uid || 'user'}`;
    }
  };


  // Copy booking link to clipboard
  const handleCopyBookingLink = async () => {
    try {
      await navigator.clipboard.writeText(generateBookingLink());
      setCopySuccess("Booking link copied to clipboard!");
      setTimeout(() => setCopySuccess(""), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };


  // Get appointments for selected date
  const getAppointmentsForDate = useCallback((dateString) => {
    return appointments.filter(apt => apt.date === dateString);
  }, [appointments]);

  // Calendar navigation
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
      setSelectedMonth(newDate.getMonth());
      setSelectedYear(newDate.getFullYear());
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setSelectedDate(newDate);
  };

  // Helper function to get responsive values
  const getResponsiveValue = (mobileValue, tabletValue, desktopValue) => {
    if (isMobile) return mobileValue;
    if (isTablet) return tabletValue;
    return desktopValue;
  };

  // FIXED: Calendar generation - For mobile/tablet, show only current month days
  const generateCalendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // For mobile and tablet: Only show current month days
    if (isMobile || isTablet) {
      const days = [];
      
      // Add days from current month only
      for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const date = new Date(year, month, i);
        const dateString = date.toISOString().split('T')[0];
        const dayAppointments = getAppointmentsForDate(dateString);
        
        // Sort appointments by start time and take only the first two earliest
        const sortedAppointments = dayAppointments
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .slice(0, 2);
        
        days.push({
          date,
          dateString,
          day: i,
          isCurrentMonth: true,
          isPreviousMonth: false,
          isNextMonth: false,
          appointments: sortedAppointments
        });
      }
      
      return days;
    }
    
    // For desktop: Show full calendar with previous/next month days
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Add days from previous month - ONLY for the first week to fill the row
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      const date = new Date(year, month - 1, day);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        date,
        dateString,
        day,
        isCurrentMonth: false,
        isPreviousMonth: true,
        isNextMonth: false,
        appointments: []
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      const dateString = date.toISOString().split('T')[0];
      const dayAppointments = getAppointmentsForDate(dateString);
      
      // Sort appointments by start time and take only the first two earliest
      const sortedAppointments = dayAppointments
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, 2);
      
      days.push({
        date,
        dateString,
        day: i,
        isCurrentMonth: true,
        isPreviousMonth: false,
        isNextMonth: false,
        appointments: sortedAppointments
      });
    }
    
    // Calculate how many days we need to add to complete the last week
    const totalDaysSoFar = days.length;
    const daysNeeded = Math.ceil(totalDaysSoFar / 7) * 7 - totalDaysSoFar;
    
    // Add days from next month to complete the last week ONLY
    const nextMonth = month + 1;
    let nextMonthDay = 1;
    
    for (let i = 0; i < daysNeeded; i++) {
      const date = new Date(year, nextMonth, nextMonthDay);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        date,
        dateString,
        day: nextMonthDay,
        isCurrentMonth: false,
        isPreviousMonth: false,
        isNextMonth: true,
        appointments: []
      });
      nextMonthDay++;
    }
    
    return days;
  }, [selectedDate, getAppointmentsForDate, isMobile, isTablet]);

  // Handle day click - shows day view modal
  const handleDayClick = (day) => {
    // Get ALL appointments for this day (not just the first two)
    const allAppointmentsForDay = getAppointmentsForDate(day.dateString);
    setSelectedDay({
      ...day,
      allAppointments: allAppointmentsForDay
    });
    setShowDayViewModal(true);
  };

  // Handle new appointment for selected day
  const handleNewAppointmentForDay = () => {
    if (selectedDay) {
      resetAppointmentForm();
      setAppointmentForm(prev => ({
        ...prev,
        date: selectedDay.dateString
      }));
      setShowAppointmentModal(true);
      setShowDayViewModal(false);
    }
  };

  // Get upcoming appointments for next 24 hours
  const getUpcomingAppointments = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date + 'T' + appointment.startTime);
      return appointmentDate >= now && appointmentDate <= tomorrow;
    }).slice(0, 5);
  }, [appointments]);

  // Month and Year selection arrays
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Conflict Resolution Modal
  const ConflictResolutionModal = () => {
    if (!pendingAppointment) return null;

    return (
      <Modal 
        show={showConflictModal} 
        onHide={() => handleConflictResolution('cancel')}
        centered
        aria-labelledby="conflict-modal-title"
      >
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title id="conflict-modal-title" className="d-flex align-items-center">
            <FaExclamationTriangle className="text-warning me-2" />
            Scheduling Conflict Detected
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <strong>Time Conflict:</strong> The selected time overlaps with existing appointment(s).
          </Alert>
          
          <div className="mb-3">
            <strong>Your appointment:</strong>
            <div className="mt-1 p-2 bg-light rounded">
              <div><strong>Time:</strong> {pendingAppointment.startTime} - {pendingAppointment.endTime}</div>
              <div><strong>Date:</strong> {new Date(pendingAppointment.date).toLocaleDateString()}</div>
              {pendingAppointment.title && <div><strong>Title:</strong> {pendingAppointment.title}</div>}
            </div>
          </div>

          <div className="mb-3">
            <strong>Conflicting appointment(s):</strong>
            <ListGroup variant="flush" className="mt-2">
              {conflictingAppointments.map((appointment, index) => (
                <ListGroup.Item key={appointment.id} className="px-0">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-medium">{appointment.title}</div>
                      <div className="text-muted small">
                        {appointment.startTime} - {appointment.endTime}
                      </div>
                      {appointment.location && (
                        <div className="text-muted small">
                          <FaMapMarkerAlt className="me-1" />
                          {appointment.location}
                        </div>
                      )}
                    </div>
                    <Badge 
                      bg="light" 
                      text="dark"
                      style={{ 
                        backgroundColor: appointment.color || '#006D7D',
                        color: 'white'
                      }}
                    >
                      {appointment.meetingType === 'video' ? 'Video' : 
                       appointment.meetingType === 'phone' ? 'Phone' : 'In Person'}
                    </Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>

          <div className="text-muted small">
            Please choose how you would like to proceed:
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <div className="w-100 d-flex flex-column gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => handleConflictResolution('reschedule')}
              className="w-100"
            >
              Reschedule My Appointment
            </Button>
            <Button 
              variant="warning" 
              onClick={() => handleConflictResolution('continue')}
              className="w-100"
            >
              Continue Anyway (Keep Both)
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => handleConflictResolution('cancel')}
              className="w-100"
            >
              Cancel
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  };

  // Mobile Navigation Header
  const MobileHeader = () => (
    <div className="d-lg-none mb-3">
      <Card className="border-0 shadow-sm">
        <Card.Body className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              aria-label="Open menu"
            >
              <FaBars />
            </Button>
            <div className="text-center flex-grow-1 mx-2">
              <div className="fw-bold">
                {months[selectedMonth]} {selectedYear}
              </div>
              <small className="text-muted">
                {viewMode === 'month' ? 'Month View' : viewMode === 'week' ? 'Week View' : 'Day View'}
              </small>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetAppointmentForm();
                setShowAppointmentModal(true);
              }}
              aria-label="Create new appointment"
            >
              <FaPlus />
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );


  // Calendar Header Component
  const CalendarHeader = () => (

    <div className="d-none d-lg-block">
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            {/* Month/Year Selection */}
            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center">
              <div className="d-flex align-items-center gap-2">
                <BootstrapForm.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  size="sm"
                  style={{ minWidth: '120px' }}
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </BootstrapForm.Select>
                
                <BootstrapForm.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  size="sm"
                  style={{ minWidth: '100px' }}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </BootstrapForm.Select>
              </div>

              <div className="btn-group" role="group" aria-label="Calendar view options">
                <Button
                  variant={viewMode === "month" ? "primary" : "outline-primary"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  aria-pressed={viewMode === "month"}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === "week" ? "primary" : "outline-primary"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  aria-pressed={viewMode === "week"}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "day" ? "primary" : "outline-primary"}
                  size="sm"
                  onClick={() => setViewMode("day")}
                  aria-pressed={viewMode === "day"}
                >
                  Day
                </Button>
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigateDate(-1)}
                aria-label="Previous period"
              >
                <FaArrowLeft />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setSelectedMonth(today.getMonth());
                  setSelectedYear(today.getFullYear());
                }}
                aria-label="Go to today"
              >
                Today
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigateDate(1)}
                aria-label="Next period"
              >
                <FaArrowRight />
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  resetAppointmentForm();
                  setShowAppointmentModal(true);
                }}
                aria-label="Create new appointment"
                size="sm"
              >
                <FaPlus className="me-1" />
                New
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
      
    </div>
  );

  // Calendar Day Component
  const CalendarDay = React.memo(({ day, onDayClick, isMobile, isTablet }) => {
    const isToday = day.date.toDateString() === new Date().toDateString();
    
    // Responsive values
    const padding = getResponsiveValue("p-1", "p-1", "p-1");
    const minHeight = getResponsiveValue("70px", "100px", "100px");
    const fontSize = getResponsiveValue("0.75rem", "0.8rem", "0.85rem");
    const badgeFontSize = getResponsiveValue("0.6rem", "0.65rem", "0.65rem");
    const timeFontSize = getResponsiveValue("0.55rem", "0.6rem", "0.6rem");
    const badgeMinHeight = getResponsiveValue("22px", "26px", "28px");
    const badgePadding = getResponsiveValue("2px 3px", "3px", "4px");
    const badgeMargin = getResponsiveValue("1px", "2px", "4px");
    
    return (
      <div
        className={`calendar-day ${padding} border-end border-bottom ${
          !day.isCurrentMonth ? 'bg-light text-muted' : ''
        } ${isToday ? 'bg-primary bg-opacity-10 border-primary' : ''} ${
          day.isPreviousMonth ? 'previous-month-day' : day.isNextMonth ? 'next-month-day' : ''
        }`}
        style={{ 
          minHeight: minHeight,
          height: '100%',
          cursor: 'pointer',
          fontSize: fontSize,
          opacity: day.isCurrentMonth ? 1 : 0.4,
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={() => onDayClick(day)}
        role="gridcell"
        aria-label={`${day.date.getDate()} ${day.date.toLocaleDateString('en-US', { month: 'long' })} ${isToday ? ', Today' : ''}. ${day.appointments.length} appointments`}
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDayClick(day);
          }
        }}
      >
        <div className={`d-flex justify-content-between align-items-start ${
          isMobile ? 'mb-1' : isTablet ? 'mb-1' : 'mb-1'
        } flex-shrink-0`}>
          <span className={`fw-medium ${isToday ? 'text-primary' : ''} ${
            !day.isCurrentMonth ? 'text-muted' : ''
          }`}>
            {day.day}
          </span>
          {isToday && (
            <Badge bg="primary" pill className="ms-1" style={{ 
              fontSize: getResponsiveValue("0.5rem", "0.6rem", "0.6rem")
            }}>
              Today
            </Badge>
          )}
        </div>
        
        <div className="appointments-list flex-grow-1 d-flex flex-column gap-1" style={{ 
          overflow: 'hidden'
        }}>
          {day.appointments.map((appointment, idx) => (
            <div
              key={idx}
              className="appointment-badge small rounded text-white flex-shrink-0"
              style={{ 
                backgroundColor: appointment.color || '#006D7D',
                fontSize: badgeFontSize,
                border: `1px solid ${appointment.color || '#006D7D'}`,
                minHeight: badgeMinHeight,
                flexShrink: 0,
                padding: badgePadding,
                marginBottom: badgeMargin
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              role="button"
              tabIndex={0}
              aria-label={`Appointment: ${appointment.title} from ${appointment.startTime} to ${appointment.endTime}`}
            >
              <div className="fw-medium text-truncate" style={{ 
                fontSize: timeFontSize,
                lineHeight: getResponsiveValue('1', '1.2', '1.2')
              }}>
                {appointment.startTime} - {appointment.endTime}
              </div>
              <div className="text-truncate" style={{ 
                fontSize: timeFontSize,
                lineHeight: getResponsiveValue('1', '1.2', '1.2')
              }}>
                {appointment.title}
              </div>
            </div>
          ))}
          {/* Add empty space if less than 2 appointments to maintain consistent height */}
          {day.appointments.length < 2 && 
            Array.from({ length: 2 - day.appointments.length }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ 
                minHeight: badgeMinHeight, 
                flexShrink: 0 
              }} />
            ))
          }
        </div>
      </div>
    );
  });

  // Calendar Grid Component
  const CalendarGrid = () => {
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Calculate grid template columns based on screen size and content
    let gridTemplateColumns;
    let gridAutoRows;
    
    if (isMobile) {
      // Mobile: 7 days per row (full week)
      gridTemplateColumns = 'repeat(7, 1fr)';
      gridAutoRows = 'minmax(70px, 1fr)';
    } else if (isTablet) {
      // Tablet: Calculate columns based on number of days in view
      const daysCount = generateCalendarDays.length;
      const columns = daysCount <= 31 ? 7 : 5; // Adjust based on day count
      gridTemplateColumns = `repeat(${columns}, 1fr)`;
      gridAutoRows = 'minmax(100px, 1fr)';
    } else {
      // Desktop: 7 days per row
      gridTemplateColumns = 'repeat(7, 1fr)';
      gridAutoRows = 'minmax(100px, 1fr)';
    }

    return (
      <Card className="border-0 shadow-sm calendar-container">
        <Card.Body className={getResponsiveValue("p-2", "p-2", "p-3")}>
          {/* Week day headers - Only show on desktop */}
          {!isMobile && !isTablet && (
            <div 
              className="d-grid calendar-header" 
              style={{
                gridTemplateColumns: 'repeat(7, 1fr)',
                borderBottom: '2px solid #f8f9fa'
              }}
              role="row"
            >
              {weekDays.map(day => (
                <div 
                  key={day} 
                  className="text-center py-2 fw-bold text-muted small"
                  role="columnheader"
                  aria-label={day}
                >
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>
          )}

          {/* Calendar days grid */}
          <div 
            className="d-grid calendar-grid" 
            style={{
              gridTemplateColumns: gridTemplateColumns,
              gridAutoRows: gridAutoRows
            }}
            role="grid"
          >
            {generateCalendarDays.map((day, index) => (
              <CalendarDay 
                key={index} 
                day={day} 
                onDayClick={handleDayClick}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            ))}
          </div>
        </Card.Body>
      </Card>
    );
  };

  // Calculate pending bookings count
  const pendingBookingsCount = appointments.filter(apt => 
    apt.status === 'pending' && apt.isBooking
  ).length;

  // Add this notification near the top of your component
  {pendingBookingsCount > 0 && (
    <Alert variant="warning" className="mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <FaExclamationTriangle className="me-2" />
          You have <strong>{pendingBookingsCount}</strong> pending booking{pendingBookingsCount !== 1 ? 's' : ''} waiting for approval.
        </div>
        <Button 
          variant="outline-warning" 
          size="sm"
          onClick={() => {
            // Scroll to today or show pending bookings
            const today = new Date().toISOString().split('T')[0];
            setSelectedDate(today);
          }}
        >
          Review Bookings
        </Button>
      </div>
    </Alert>
  )}



 // Enhanced AppointmentCard component with approval workflow
  // In AppointmentScheduler.jsx - Update the AppointmentCard component
  // Enhanced AppointmentCard with proper status handling
  const AppointmentCard = ({ appointment, onEdit, onDelete, onApprove, onReject }) => {
    const isExpanded = expandedAppointments[appointment.id];
    const isPending = appointment.status === 'pending';
    const isApproved = appointment.status === 'approved' || appointment.status === 'confirmed';
    const isExternalBooking = appointment.isBooking;
    const hasAdditionalInfo = appointment.description || 
                            (appointment.guests && appointment.guests.length > 0) ||
                            (appointment.meetingType === 'in-person' && appointment.location) ||
                            (appointment.meetingType === 'video' && appointment.videoLink);

    return (
      <Card className={`border-0 shadow-sm mb-3 appointment-card ${isPending ? 'border-warning' : isApproved ? 'border-success' : ''}`}>
        <Card.Body className="p-3">
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="flex-grow-1 me-3">
              {/* Status Badges */}
              <div className="d-flex flex-wrap gap-1 mb-2">
                {isExternalBooking && (
                  <Badge bg="secondary">
                    <FaUserPlus className="me-1" />
                    External Booking
                  </Badge>
                )}
                {isPending && (
                  <Badge bg="warning" text="dark">
                    <FaExclamationTriangle className="me-1" />
                    Pending Approval
                  </Badge>
                )}
                {isApproved && (
                  <Badge bg="success">
                    <FaCheckCircle className="me-1" />
                    Approved
                  </Badge>
                )}
                {appointment.status === 'rejected' && (
                  <Badge bg="danger">
                    <FaTimes className="me-1" />
                    Rejected
                  </Badge>
                )}
              </div>
              
              <div className="d-flex align-items-center mb-2">
                <div 
                  className="color-indicator me-2 rounded"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: appointment.color || '#006D7D'
                  }}
                  aria-hidden="true"
                ></div>
                <h6 className="mb-0 fw-bold text-truncate appointment-title">
                  {appointment.title}
                </h6>
              </div>
              
              {/* Show guest name for external bookings */}
              {appointment.guestName && (
                <div className="mb-2">
                  <small className="text-muted">
                    <FaUser className="me-1" />
                    With: {appointment.guestName}
                  </small>
                  {appointment.guestEmail && (
                    <small className="text-muted ms-2">
                      <FaEnvelope className="me-1" />
                      {appointment.guestEmail}
                    </small>
                  )}
                </div>
              )}
              
              {/* Primary Information */}
              <div className="appointment-primary-info mb-2">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <Badge bg="primary" className="px-2 py-1 time-badge">
                    <FaClock className="me-1" style={{ fontSize: '0.7rem' }} />
                    <span className="fw-medium">{appointment.startTime} - {appointment.endTime}</span>
                  </Badge>
                  
                  <Badge 
                    bg={
                      appointment.meetingType === 'video' ? 'warning' :
                      appointment.meetingType === 'phone' ? 'info' : 'success'
                    } 
                    className="px-2 py-1 type-badge"
                  >
                    {appointment.meetingType === 'video' ? <FaVideo className="me-1" /> :
                    appointment.meetingType === 'phone' ? <FaPhone className="me-1" /> :
                    <FaMapMarkerAlt className="me-1" />}
                    <span className="text-capitalize">
                      {appointment.meetingType === 'video' ? 'Video Call' :
                      appointment.meetingType === 'phone' ? 'Phone Call' : 'In Person'}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Approval Actions for Pending Bookings ONLY */}
              {isPending && isExternalBooking && (
                <div className="approval-actions mb-3">
                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => onApprove(appointment)}
                      className="d-flex align-items-center"
                    >
                      <FaCheckCircle className="me-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onReject(appointment)}
                      className="d-flex align-items-center"
                    >
                      <FaTimes className="me-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Show approval info if approved */}
              {isApproved && appointment.approvedAt && (
                <div className="approved-info mb-2">
                  <small className="text-success">
                    <FaCheckCircle className="me-1" />
                    Approved on {new Date(appointment.approvedAt.seconds * 1000).toLocaleDateString()}
                  </small>
                </div>
              )}

              {/* Location/Video Link - Always visible */}
              {appointment.location && appointment.meetingType === 'in-person' && (
                <div className="location-info d-flex align-items-center mb-2 text-muted small">
                  <FaMapMarkerAlt className="me-1" style={{ fontSize: '0.8rem' }} />
                  <span className="location-text">{appointment.location}</span>
                </div>
              )}
              
              {appointment.videoLink && appointment.meetingType === 'video' && (
                <div className="video-info d-flex align-items-center mb-2 small">
                  <FaVideo className="me-1 text-warning" style={{ fontSize: '0.8rem' }} />
                  <a 
                    href={appointment.videoLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-warning text-decoration-none"
                  >
                    Join Video Call
                  </a>
                </div>
              )}
            </div>
            
            {/* Standard Action Buttons - Always show edit/delete */}
            <div className="d-flex flex-column gap-1 flex-shrink-0">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onEdit(appointment)}
                aria-label={`Edit appointment ${appointment.title}`}
                className="action-btn"
                style={{ width: '32px', height: '32px', padding: '0' }}
              >
                <FaEdit style={{ fontSize: '0.8rem' }} />
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete(appointment.id)}
                aria-label={`Delete appointment ${appointment.title}`}
                className="action-btn"
                style={{ width: '32px', height: '32px', padding: '0' }}
              >
                <FaTrash style={{ fontSize: '0.8rem' }} />
              </Button>
            </div>
          </div>

          {/* Rest of the component remains the same */}
           {/* See More Section */}
          {hasAdditionalInfo && (
            <div className="see-more-section">
              <Button
                variant="link"
                className="see-more-btn p-0 text-decoration-none d-flex align-items-center"
                onClick={() => toggleAppointmentExpand(appointment.id)}
                aria-expanded={isExpanded}
                aria-controls={`appointment-details-${appointment.id}`}
              >
                <span className="text-muted small me-1">
                  {isExpanded ? 'Show less' : 'See more details'}
                </span>
                {isExpanded ? 
                  <FaChevronUp className="text-muted" style={{ fontSize: '0.7rem' }} /> : 
                  <FaChevronDown className="text-muted" style={{ fontSize: '0.7rem' }} />
                }
              </Button>

              <Collapse in={isExpanded}>
                <div id={`appointment-details-${appointment.id}`} className="mt-2 appointment-details">
                  {/* Description */}
                  {appointment.description && (
                    <div className="description-section mb-3">
                      <div className="d-flex align-items-center mb-1">
                        <FaStickyNote className="me-2 text-muted" style={{ fontSize: '0.8rem' }} />
                        <small className="text-muted fw-bold">Notes</small>
                      </div>
                      <p className="small text-muted mb-0 description-text">
                        {appointment.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Guests */}
                  {appointment.guests && appointment.guests.length > 0 && (
                    <div className="guests-section mb-2">
                      <div className="d-flex align-items-center mb-1">
                        <FaUsers className="me-2 text-muted" style={{ fontSize: '0.8rem' }} />
                        <small className="text-muted fw-bold">Guests ({appointment.guests.length})</small>
                      </div>
                      <div className="guest-tags">
                        {appointment.guests.map((guest, guestIndex) => (
                          <Badge 
                            key={guestIndex} 
                            bg="light" 
                            text="dark" 
                            className="me-1 mb-1 px-2 py-1 small"
                            style={{ fontSize: '0.7rem' }}
                          >
                            {guest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Collapse>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };



  // Modern Day View Modal Component
  const DayViewModal = () => {
    if (!selectedDay) return null;

    const dayAppointments = selectedDay.allAppointments || [];
    const dayName = selectedDay.date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = selectedDay.date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const isToday = selectedDay.date.toDateString() === new Date().toDateString();

    // Calculate total hours and appointment stats
    const totalHours = dayAppointments.reduce((total, apt) => {
      const start = new Date(`2000-01-01T${apt.startTime}`);
      const end = new Date(`2000-01-01T${apt.endTime}`);
      return total + (end - start) / (1000 * 60 * 60);
    }, 0);

    return (
      <Modal 
        show={showDayViewModal} 
        onHide={() => setShowDayViewModal(false)} 
        size="lg"
        aria-labelledby="day-view-modal-title"
        className="modern-day-modal"
      >
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title id="day-view-modal-title" className="w-100">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-2">
                  {/* <div className={`date-indicator ${isToday ? 'today' : ''} me-3`}>
                    <div className="day-number">{selectedDay.date.getDate()}</div>
                    <div className="month-name">{selectedDay.date.toLocaleDateString('en-US', { month: 'short' })}</div>
                  </div> */}
                  <div>
                    <h4 className="mb-1 fw-bold day-name">{dayName}</h4>
                    <p className="text-muted mb-0 date-string">{dateString}</p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                {dayAppointments.length > 0 && (
                  <div className="quick-stats d-flex gap-3 mt-3">
                    <div className="stat-item text-center">
                      <div className="stat-number fw-bold text-primary">{dayAppointments.length}</div>
                      <div className="stat-label small text-muted">Appointments</div>
                    </div>
                    <div className="stat-item text-center">
                      <div className="stat-number fw-bold text-success">{totalHours.toFixed(1)}h</div>
                      <div className="stat-label small text-muted">Total Hours</div>
                    </div>
                    <div className="stat-item text-center">
                      <div className="stat-number fw-bold text-info">
                        {dayAppointments.filter(apt => apt.meetingType === 'in-person').length}
                      </div>
                      <div className="stat-label small text-muted">In Person</div>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                variant="primary"
                onClick={handleNewAppointmentForDay}
                aria-label={`Add new appointment for ${dateString}`}
                className="modern-primary-btn flex-shrink-0"
                size="sm"
              >
                <FaRegCalendarPlus className="me-2" />
                New Appointment
              </Button>
            </div>
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="pt-0">
          {dayAppointments.length === 0 ? (
            <div className="empty-state text-center py-5">
              <div className="empty-icon mb-4">
                <FaCalendarAlt size={48} className="text-muted opacity-25" />
              </div>
              <h5 className="text-muted mb-2">No Appointments Scheduled</h5>
              <p className="text-muted mb-4">You have a free day! Time to schedule something productive.</p>
              <Button
                variant="primary"
                onClick={handleNewAppointmentForDay}
                size="lg"
                className="modern-primary-btn"
              >
                <FaPlus className="me-2" />
                Schedule Your First Appointment
              </Button>
            </div>
          ) : (
            <div className="appointments-container">
              <div className="timeline-header d-flex justify-content-between align-items-center mb-4">
                <h6 className="mb-0 fw-bold">Daily Schedule</h6>
                <Badge bg="light" text="dark" className="px-3 py-2">
                  {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="appointments-list">
                {dayAppointments
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={handleEditAppointment}
                    onDelete={handleDeleteAppointment}
                    onApprove={handleApproveBooking}
                    onReject={handleRejectBooking}
                  />
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer className="border-top-0 pt-0">
          <div className="w-100 d-flex justify-content-between">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowDayViewModal(false)}
              className="flex-fill me-2"
            >
              Close
            </Button>
            <Button 
              variant="primary" 
              onClick={handleNewAppointmentForDay}
              className="flex-fill modern-primary-btn"
            >
              <FaPlus className="me-2" />
              Add Another Appointment
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  };

  // Upcoming Appointments Component - Next 24 hours only
  const UpcomingAppointments = () => (
    <Card className="border-0 shadow-sm ">
      <Card.Header className="bg-primary text-white py-2">
        <h6 className="mb-0">
          <FaClock className="me-2" />
          Next 24 Hours
        </h6>
      </Card.Header>
      <Card.Body className="py-2">
        {getUpcomingAppointments.length === 0 ? (
          <div className="text-center py-3">
            <FaClock size={24} className="text-muted mb-2 opacity-50" />
            <p className="text-muted mb-0 small">No appointments in the next 24 hours</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {getUpcomingAppointments.map(appointment => (
              <ListGroup.Item key={appointment.id} className="px-0 py-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="fw-medium small">{appointment.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Today at {appointment.startTime} - {appointment.endTime}
                    </div>
                    <div className="d-flex align-items-center mt-1">
                      <div 
                        className="color-dot me-2 rounded-circle"
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: appointment.color || '#006D7D'
                        }}
                      ></div>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {appointment.meetingType === 'video' ? 'Video Call' :
                         appointment.meetingType === 'phone' ? 'Phone Call' : 'In Person'}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditAppointment(appointment)}
                      style={{ width: '28px', height: '28px', padding: '0' }}
                    >
                      <FaEdit style={{ fontSize: '0.7rem' }} />
                    </Button>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );

  // In AppointmentScheduler.jsx - Add this to the BookingLinkSection
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadBookingPage = () => {
    if (!isPreloading) {
      setIsPreloading(true);
      // Preload the booking page component
      import('../Pages/BookingPage');
    }
  };
  // Booking Link Component
  const BookingLinkSection = () => (
    
    <Card className="border-0 shadow-sm ">
      <Card.Header className="bg-success text-white py-2">
        <h6 className="mb-0">
          <FaShare className="me-2" />
          Your Booking Link
        </h6>
      </Card.Header>
      <Card.Body className="py-2">
        <p className="text-muted small mb-2">
          Share this link with others to let them book appointments with you:
        </p>
        
        <div className="d-flex gap-2 mb-2">
          <BootstrapForm.Control
            type="text"
            value={generateBookingLink()}
            readOnly
            className="font-monospace small"
            size="sm"
            onMouseEnter={preloadBookingPage}
          />
          <Button variant="primary" onClick={handleCopyBookingLink} size="sm">
            <FaCopy className="me-1" />
            Copy
          </Button>
        </div>
        
          
        
        {copySuccess && (
          <Alert variant="success" className="py-2 small mb-2">
            <FaCheckCircle className="me-2" />
            {copySuccess}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );

  // Sidebar Content Component
  const SidebarContent = () => (
    <div className="d-flex flex-column gap-3 h-100">
      <BookingLinkSection />
      <UpcomingAppointments />
    </div>
  );

  // Add this function to your AppointmentScheduler component
  // const handleApproveBooking = async (appointment) => {
  //   if (!window.confirm(`Approve booking with ${appointment.guestName} on ${appointment.date} at ${appointment.startTime}?`)) {
  //     return;
  //   }

  //   try {
  //     // Update the appointment status to confirmed
  //     await updateDoc(doc(db, "appointments", appointment.id), {
  //       status: 'confirmed',
  //       approvedAt: new Date(),
  //       approvedBy: user.uid
  //     });

  //     // Send approval email
  //     try {
  //       await sendBookingApprovalEmail({
  //         guestName: appointment.guestName,
  //         guestEmail: appointment.guestEmail,
  //         date: appointment.date,
  //         startTime: appointment.startTime,
  //         endTime: appointment.endTime,
  //         duration: appointment.duration || 60,
  //         location: appointment.location,
  //         meetingType: appointment.meetingType,
  //         videoLink: appointment.videoLink,
  //         notes: appointment.description
  //       });
        
  //       alert('Booking approved and confirmation email sent!');
  //     } catch (emailError) {
  //       console.error('Failed to send approval email:', emailError);
  //       alert('Booking approved but failed to send confirmation email.');
  //     }

  //   } catch (error) {
  //     console.error('Error approving booking:', error);
  //     alert('Error approving booking. Please try again.');
  //   }
  // };




  // Add these state variables
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [approvalAction, setApprovalAction] = useState(''); // 'approve' or 'reject'
  // Approval handler
  const handleApproveBooking = async (appointment) => {
    setSelectedAppointment(appointment);
    setApprovalAction('approve');
    setShowApprovalModal(true);
  };

  // Rejection handler
  const handleRejectBooking = async (appointment) => {
    setSelectedAppointment(appointment);
    setApprovalAction('reject');
    setShowApprovalModal(true);
  };

  // Confirm approval/rejection
  // Updated approval handler with proper status
  const confirmApprovalAction = async () => {
    if (!selectedAppointment) return;

    try {
      if (approvalAction === 'approve') {
        // Update the appointment status to "approved"
        await updateDoc(doc(db, "appointments", selectedAppointment.id), {
          status: 'approved', // Changed from 'confirmed' to 'approved'
          approved: true,
          approvedAt: new Date(),
          approvedBy: user.uid,
          updatedAt: new Date()
        });

        console.log("📧 Attempting to send approval email to:", selectedAppointment.guestEmail);
        
        // Send approval email
        try {
          await sendBookingApprovalEmail({
            guestName: selectedAppointment.guestName,
            guestEmail: selectedAppointment.guestEmail,
            date: selectedAppointment.date,
            startTime: selectedAppointment.startTime,
            endTime: selectedAppointment.endTime,
            duration: selectedAppointment.duration || 60,
            location: selectedAppointment.location || 'To be determined',
            meetingType: selectedAppointment.meetingType || 'In Person',
            videoLink: selectedAppointment.videoLink || '',
            notes: selectedAppointment.description || ''
          });
          
          console.log("✅ Approval email sent successfully");
          alert('✅ Booking approved and confirmation email sent!');
        } catch (emailError) {
          console.error('❌ Failed to send approval email:', emailError);
          alert('✅ Booking approved but failed to send confirmation email.');
        }

      } else if (approvalAction === 'reject') {
        // Update the appointment status to rejected
        await updateDoc(doc(db, "appointments", selectedAppointment.id), {
          status: 'rejected',
          approved: false,
          rejectedAt: new Date(),
          rejectedBy: user.uid,
          updatedAt: new Date()
        });

        alert('❌ Booking rejected.');
      }

      setShowApprovalModal(false);
      setSelectedAppointment(null);
      setApprovalAction('');

    } catch (error) {
      console.error('❌ Error updating booking:', error);
      alert('Error processing booking. Please try again.');
    }
  };




  // Add Approval Modal Component
  const ApprovalModal = () => (
    <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>
          {approvalAction === 'approve' ? 'Approve Booking' : 'Reject Booking'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedAppointment && (
          <div>
            <p>
              {approvalAction === 'approve' 
                ? 'Are you sure you want to approve this booking? An approval email will be sent to the guest.'
                : 'Are you sure you want to reject this booking?'
              }
            </p>
            <div className="bg-light p-3 rounded">
              <strong>Booking Details:</strong>
              <div>With: {selectedAppointment.guestName}</div>
              <div>Email: {selectedAppointment.guestEmail}</div>
              <div>Date: {selectedAppointment.date}</div>
              <div>Time: {selectedAppointment.startTime} - {selectedAppointment.endTime}</div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
          Cancel
        </Button>
        <Button 
          variant={approvalAction === 'approve' ? 'success' : 'danger'}
          onClick={confirmApprovalAction}
        >
          {approvalAction === 'approve' ? 'Approve Booking' : 'Reject Booking'}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Mobile Sidebar - UPDATED: Only show on mobile and tablet
  const MobileSidebar = () => {
    // Only render on mobile or tablet
    if (!isMobile && !isTablet) {
      return null;
    }

    return (
      <Offcanvas 
        show={showMobileSidebar} 
        onHide={() => setShowMobileSidebar(false)}
        placement="start"
        responsive="lg"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="small">
            Appointment Tools
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>
    );
  };

  return (
    <div className="dashboard-container">
      <Container fluid className="px-2 px-md-3 py-2 py-md-3 h-100">
        {/* Header Section */}
        <div className="dashboard-header rounded-4 p-3 p-md-4 mb-2 mb-md-3 text-white">
          <Row className="align-items-center">
            <Col xs={12} lg={8} className="text-center text-lg-start mb-2 mb-lg-0">
              <h1 className="h4 h1-lg fw-bold mb-1 mb-lg-2">
                APPOINTMENT SCHEDULER
              </h1>
              <p className="mb-0 fs-6 fs-lg-5 opacity-90">
                Schedule and manage your appointments like Calendly
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
          </Row>
        </div>

        {/* Mobile Header */}
        <MobileHeader />

        {/* Main Content */}
        <Row className="g-2 g-md-3 h-100">
          {/* Sidebar only appears in desktop, hidden on tablet and mobile */}
          <Col lg={4} xl={3} className="d-none d-lg-block">
            <SidebarContent />
          </Col>

          {/* Main Calendar Area */}
          <Col lg={8} xl={9}>
            <CalendarHeader />
            <CalendarGrid />
          </Col>
        </Row>
      </Container>
      

      {/* Modals */}
      <AppointmentModal
        showAppointmentModal={showAppointmentModal}
        appointmentForm={appointmentForm}
        handleAppointmentChange={handleAppointmentChange}
        handleAddGuest={handleAddGuest}
        handleRemoveGuest={handleRemoveGuest}
        handleCreateAppointment={handleCreateAppointment}
        isSaving={isSaving}
        editingAppointment={editingAppointment}
        setShowAppointmentModal={setShowAppointmentModal}
        resetAppointmentForm={resetAppointmentForm}
        handleDeleteAppointment={handleDeleteAppointment}
      />
      <DayViewModal />
      <ConflictResolutionModal />
      <MobileSidebar />
      <ApprovalModal />
    </div>
  );
};

export default AppointmentScheduler;