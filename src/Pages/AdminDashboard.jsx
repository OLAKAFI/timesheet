import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Nav, Button, Table, Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaMoneyBillWave, FaClock, FaArrowLeft, FaArrowRight, FaBuilding, FaFileContract, FaMoneyCheckAlt, FaEdit } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from "recharts";

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!location.state?.user?.isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    setUser(location.state.user);
  }, [location, navigate]);

  // Sample data for charts
  const attendanceData = [
    { name: 'Mon', present: 65, absent: 5, late: 10 },
    { name: 'Tue', present: 70, absent: 3, late: 7 },
    { name: 'Wed', present: 80, absent: 2, late: 8 },
    { name: 'Thu', present: 75, absent: 4, late: 6 },
    { name: 'Fri', present: 85, absent: 1, late: 4 },
    { name: 'Sat', present: 60, absent: 8, late: 12 },
  ];

  const departmentData = [
    { name: 'Sales', value: 30, color: '#0088FE' },
    { name: 'Engineering', value: 25, color: '#00C49F' },
    { name: 'Marketing', value: 20, color: '#FFBB28' },
    { name: 'Support', value: 15, color: '#FF8042' },
    { name: 'Operations', value: 10, color: '#8884D8' },
  ];

  if (!user) return null;

  return (
    <Container fluid className="admin-dashboard p-0">

      {/* Admin Header */}
      <div className="dashboard-header text-white p-3 p-md-4 mb-3 mb-md-4">
        <Row className="align-items-center my-3">
          <Col xs={12} lg={8} className="text-center text-lg-start mb-3 mb-lg-0">
            <h1 className="mb-0 h4 h1-lg fw-bold">
              <i className="bi bi-shield-check"></i>
              ADMIN DASHBOARD
            </h1>
            <p className="text-white fs-6 fs-lg-5 opacity-90">Welcome, {user.displayName}</p>
          </Col>
          <Col xs={12} lg={4} className="text-center text-lg-end">
            
            <Badge bg="warning" text="dark" className="me-3">
              ADMIN
            </Badge>
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={() => navigate("/")}
            >
              <i className="bi bi-box-arrow-right me-1"></i>Logout
            </Button>
          </Col>
        </Row>
      </div>

      {/* Admin Navigation */}
      <Nav variant="pills" className="admin-nav bg-light p-3">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          >
            <i className="bi bi-speedometer2 me-2"></i>Dashboard
          </Nav.Link>
        </Nav.Item>
        {user.permissions?.includes("rota") && (
          <Nav.Item>
            <Nav.Link 
              active={activeTab === "rota"}
              onClick={() => setActiveTab("rota")}
            >
              <i className="bi bi-calendar-week me-2"></i>Rota Management
            </Nav.Link>
          </Nav.Item>
        )}
        {user.permissions?.includes("users") && (
          <Nav.Item>
            <Nav.Link 
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
            >
              <i className="bi bi-people me-2"></i>User Management
            </Nav.Link>
          </Nav.Item>
        )}
        {user.permissions?.includes("analytics") && (
          <Nav.Item>
            <Nav.Link 
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
            >
              <i className="bi bi-graph-up me-2"></i>Analytics
            </Nav.Link>
          </Nav.Item>
        )}
        {user.permissions?.includes("settings") && (
          <Nav.Item>
            <Nav.Link 
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            >
              <i className="bi bi-gear me-2"></i>Settings
            </Nav.Link>
          </Nav.Item>
        )}
      </Nav>

      {/* Dashboard Content */}
      <Container className="py-4">
        {activeTab === "dashboard" && (
          <>
            {/* Stats Overview */}
            <Row className="mb-4 g-3">
              <Col md={3}>
                <Card className="stat-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted">Total Users</h6>
                        <h3 className="mb-0">1,254</h3>
                      </div>
                      <div className="stat-icon bg-primary">
                        <i className="bi bi-people text-white"></i>
                      </div>
                    </div>
                    <small className="text-success">
                      <i className="bi bi-arrow-up me-1"></i>12% from last week
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="stat-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted">Active Today</h6>
                        <h3 className="mb-0">892</h3>
                      </div>
                      <div className="stat-icon bg-success">
                        <i className="bi bi-check-circle text-white"></i>
                      </div>
                    </div>
                    <small className="text-success">
                      <i className="bi bi-arrow-up me-1"></i>8% from yesterday
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="stat-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted">Hours Logged</h6>
                        <h3 className="mb-0">4,582</h3>
                      </div>
                      <div className="stat-icon bg-info">
                        <i className="bi bi-clock text-white"></i>
                      </div>
                    </div>
                    <small className="text-success">
                      <i className="bi bi-arrow-up me-1"></i>15% from last week
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="stat-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted">Pending Approvals</h6>
                        <h3 className="mb-0">23</h3>
                      </div>
                      <div className="stat-icon bg-warning">
                        <i className="bi bi-exclamation-triangle text-white"></i>
                      </div>
                    </div>
                    <small className="text-danger">
                      <i className="bi bi-arrow-down me-1"></i>3 since yesterday
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Charts */}
            <Row className="mb-4">
              <Col lg={8}>
                <Card className="h-100">
                  <Card.Header>
                    <h6 className="mb-0">Weekly Attendance Overview</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="present" fill="#28a745" name="Present" />
                        <Bar dataKey="late" fill="#ffc107" name="Late" />
                        <Bar dataKey="absent" fill="#dc3545" name="Absent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="h-100">
                  <Card.Header>
                    <h6 className="mb-0">Department Distribution</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={departmentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity */}
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Recent User Activity</h6>
                <Button variant="outline-primary" size="sm">
                  View All
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>User</th>
                      <th>Action</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe</td>
                      <td>Clock In</td>
                      <td>08:30 AM</td>
                      <td><Badge bg="success">On Time</Badge></td>
                    </tr>
                    <tr>
                      <td>Jane Smith</td>
                      <td>Clock Out</td>
                      <td>05:15 PM</td>
                      <td><Badge bg="warning">Early</Badge></td>
                    </tr>
                    <tr>
                      <td>Bob Johnson</td>
                      <td>Leave Request</td>
                      <td>10:00 AM</td>
                      <td><Badge bg="info">Pending</Badge></td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </>
        )}

        {activeTab === "rota" && (
          <Card>
            <Card.Header>
              <h5 className="mb-0">Rota Management</h5>
            </Card.Header>
            <Card.Body>
              <p>Rota management content goes here...</p>
              {/* Add your rota management interface */}
            </Card.Body>
          </Card>
        )}
      </Container>
    </Container>
  );
};

export default AdminDashboard;