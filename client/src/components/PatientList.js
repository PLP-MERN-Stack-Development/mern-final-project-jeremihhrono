import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, statusFilter, patients]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get('/api/patients', config);
      setPatients(response.data.data);
      setFilteredPatients(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phoneNumber.includes(searchTerm) ||
        (patient.nationalId && patient.nationalId.includes(searchTerm))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    setFilteredPatients(filtered);
  };

  if (loading) {
    return <div className="loading">Loading patients...</div>;
  }

  return (
    <div className="container">
      <div className="patient-list-header">
        <h1>Patient Management</h1>
        <Link to="/patients/register" className="btn btn-primary">
          ➕ Register New Patient
        </Link>
      </div>

      <div className="card">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="recovered">Recovered</option>
            <option value="referred">Referred</option>
          </select>
        </div>

        <p style={{ marginBottom: '15px', color: '#666' }}>
          Showing {filteredPatients.length} of {patients.length} patients
        </p>

        {filteredPatients.length > 0 ? (
          <div>
            {filteredPatients.map(patient => (
              <div
                key={patient._id}
                className="patient-card"
                onClick={() => navigate(`/patients/${patient._id}`)}
              >
                <div className="patient-card-header">
                  <div>
                    <div className="patient-name">{patient.name}</div>
                    <span className={`badge badge-${
                      patient.status === 'active' ? 'success' : 
                      patient.status === 'recovered' ? 'info' : 'warning'
                    }`}>
                      {patient.status}
                    </span>
                  </div>
                  <div>
                    <span className="badge badge-info">
                      {patient.insuranceProvider}
                    </span>
                  </div>
                </div>
                
                <div className="patient-info">
                  <div>📞 {patient.phoneNumber}</div>
                  <div>🎂 {patient.age} years</div>
                  <div>⚕️ {patient.sickness}</div>
                  {patient.assignedWorker && (
                    <div>👨‍⚕️ {patient.assignedWorker.name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No patients found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientList;