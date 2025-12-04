import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    todayVisits: 0,
    pendingPayments: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch patients
      const patientsRes = await axios.get('/api/patients', config);
      const patients = patientsRes.data.data;

      // Calculate stats
      const totalPatients = patients.length;
      const activePatients = patients.filter(p => p.status === 'active').length;
      
      setStats({
        totalPatients,
        activePatients,
        todayVisits: 0, // Could be calculated from visits
        pendingPayments: 0 // Could be calculated from payments
      });

      // Get recent patients (last 5)
      setRecentPatients(patients.slice(0, 5));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <h1>Welcome, {user.name}! 👋</h1>
        <p>Role: {user.role.replace('_', ' ').toUpperCase()}</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Patients</h3>
          <div className="stat-value">{stats.totalPatients}</div>
        </div>
        <div className="stat-card">
          <h3>Active Patients</h3>
          <div className="stat-value">{stats.activePatients}</div>
        </div>
        <div className="stat-card">
          <h3>Today's Visits</h3>
          <div className="stat-value">{stats.todayVisits}</div>
        </div>
        <div className="stat-card">
          <h3>Pending Payments</h3>
          <div className="stat-value">{stats.pendingPayments}</div>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/patients/register" className="action-button">
          ➕ Register New Patient
        </Link>
        <Link to="/patients" className="action-button">
          📋 View All Patients
        </Link>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2>Recent Patients</h2>
        {recentPatients.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Insurance</th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map(patient => (
                <tr key={patient._id}>
                  <td>
                    <Link to={`/patients/${patient._id}`}>{patient.name}</Link>
                  </td>
                  <td>{patient.age}</td>
                  <td>{patient.sickness}</td>
                  <td>
                    <span className={`badge badge-${
                      patient.status === 'active' ? 'success' : 
                      patient.status === 'recovered' ? 'info' : 'warning'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td>{patient.insuranceProvider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No patients registered yet.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;