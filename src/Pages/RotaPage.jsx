import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
  Row,
  Col
} from "react-bootstrap";
import { 
  FaCalendarPlus, 
  FaEdit, 
  FaTrash,
  FaUserClock,
  FaPrint
} from "react-icons/fa";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import app from "../firebaseConfig";

const db = getFirestore(app);

const RotaPage = () => {
  const [shifts, setShifts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    employeeName: "",
    shiftDate: "",
    startTime: "09:00",
    endTime: "17:00",
    role: "Staff",
    department: "General"
  });

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const shiftsSnapshot = await getDocs(collection(db, "rota"));
      const shiftsList = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShifts(shiftsList);
    } catch (error) {
      console.error("Error loading shifts:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const shiftData = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: "scheduled"
      };

      if (editingShift) {
        // Update existing shift (you'd need updateDoc here)
        console.log("Update shift:", editingShift.id, shiftData);
      } else {
        await addDoc(collection(db, "rota"), shiftData);
      }

      setShowModal(false);
      setEditingShift(null);
      setFormData({
        employeeName: "",
        shiftDate: "",
        startTime: "09:00",
        endTime: "17:00",
        role: "Staff",
        department: "General"
      });
      loadShifts();
    } catch (error) {
      console.error("Error saving shift:", error);
    }
  };

  const handleDelete = async (shiftId) => {
    if (window.confirm("Are you sure you want to delete this shift?")) {
      try {
        await deleteDoc(doc(db, "rota", shiftId));
        loadShifts();
      } catch (error) {
        console.error("Error deleting shift:", error);
      }
    }
  };

  const calculateHours = (start, end) => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return totalMinutes / 60;
  };

  return (
    <Container fluid className="rota-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Rota Management</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary">
            <FaPrint className="me-2" />
            Print
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <FaCalendarPlus className="me-2" />
            Add Shift
          </Button>
        </div>
      </div>

      <Alert variant="info" className="mb-4">
        <FaUserClock className="me-2" />
        This page is only accessible to administrators. Here you can manage employee schedules.
      </Alert>

      <Row>
        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Rota Summary</h5>
            </Card.Header>
            <Card.Body>
              <p>Total Shifts: <strong>{shifts.length}</strong></p>
              <p>This Week: <strong>{shifts.filter(s => {
                const shiftDate = new Date(s.shiftDate);
                const now = new Date();
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                return shiftDate >= weekStart;
              }).length}</strong></p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={9}>
          <Card>
            <Card.Header>
              <h5>Shift Schedule</h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Shift Time</th>
                    <th>Hours</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(shift => (
                    <tr key={shift.id}>
                      <td>{shift.employeeName}</td>
                      <td>{new Date(shift.shiftDate).toLocaleDateString()}</td>
                      <td>{shift.startTime} - {shift.endTime}</td>
                      <td>{calculateHours(shift.startTime, shift.endTime).toFixed(1)}h</td>
                      <td>{shift.role}</td>
                      <td>{shift.department}</td>
                      <td>
                        <Badge bg={
                          shift.status === "completed" ? "success" :
                          shift.status === "in-progress" ? "warning" : "info"
                        }>
                          {shift.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => {
                              setEditingShift(shift);
                              setFormData(shift);
                              setShowModal(true);
                            }}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleDelete(shift.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Shift Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setEditingShift(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingShift ? "Edit Shift" : "Add New Shift"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Employee Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.employeeName}
                onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Shift Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.shiftDate}
                onChange={(e) => setFormData({...formData, shiftDate: e.target.value})}
                required
              />
            </Form.Group>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Assistant">Assistant</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingShift ? "Update Shift" : "Add Shift"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default RotaPage;