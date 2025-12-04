import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function PatientDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitData, setVisitData] = useState({
    purpose: '',
    diagnosis: '',
    treatment: '',
    cost: ''
  });

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`/api/patients/${id}`, config);
      setPatient(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      setLoading(false);
    }
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.post(`/api/patients/${id}/visits`, visitData, config);
      alert('Visit recorded successfully!');
      setShowVisitForm(false);
      setVisitData({ purpose: '', diagnosis: '', treatment: '', cost: '' });
      fetchPatientDetails();
    } catch (error) {
      alert('Error recording visit: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading patient details...</div>;
  }

  if (!patient) {
    return <div className="container">Patient not found</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{patient.name}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(`/payments/${patient._id}`)}
          >
            💳 Make Payment
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/patients')}
          >
            ← Back to Patients
          </button>
        </div>
      </div>

      <div className="detail-section">
        <h3>Personal Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Age</div>
            <div className="detail-value">{patient.age} years</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Gender</div>
            <div className="detail-value">{patient.gender}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Phone Number</div>
            <div className="detail-value">{patient.phoneNumber}</div>
          </div>
          {patient.nationalId && (
            <div className="detail-item">
              <div className="detail-label">National ID</div>
              <div className="detail-value">{patient.nationalId}</div>
            </div>
          )}
          {patient.address && (
            <div className="detail-item">
              <div className="detail-label">Address</div>
              <div className="detail-value">{patient.address}</div>
            </div>
          )}
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value">
              <span className={`badge badge-${
                patient.status === 'active' ? 'success' : 
                patient.status === 'recovered' ? 'info' : 'warning'
              }`}>
                {patient.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Medical Information</h3>
        <div className="detail-item">
          <div className="detail-label">Current Condition</div>
          <div className="detail-value">{patient.sickness}</div>
        </div>
        {patient.symptoms && patient.symptoms.length > 0 && (
          <div className="detail-item">
            <div className="detail-label">Symptoms</div>
            <div className="detail-value">{patient.symptoms.join(', ')}</div>
          </div>
        )}
        {patient.diagnosis && (
          <div className="detail-item">
            <div className="detail-label">Diagnosis</div>
            <div className="detail-value">{patient.diagnosis}</div>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3>Insurance Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Provider</div>
            <div className="detail-value">{patient.insuranceProvider}</div>
          </div>
          {patient.insuranceNumber && (
            <div className="detail-item">
              <div className="detail-label">Insurance Number</div>
              <div className="detail-value">{patient.insuranceNumber}</div>
            </div>
          )}
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value">
              <span className={`badge badge-${
                patient.insuranceStatus === 'active' ? 'success' : 'warning'
              }`}>
                {patient.insuranceStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {patient.assignedWorker && (
        <div className="detail-section">
          <h3>Assigned Healthcare Worker</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Name</div>
              <div className="detail-value">{patient.assignedWorker.name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Role</div>
              <div className="detail-value">{patient.assignedWorker.role}</div>
            </div>
          </div>
        </div>
      )}

      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Visit History</h3>
          {(user.role === 'doctor' || user.role === 'nurse') && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowVisitForm(!showVisitForm)}
            >
              {showVisitForm ? '✖ Cancel' : '➕ Add Visit'}
            </button>
          )}
        </div>

        {showVisitForm && (
          <form onSubmit={handleAddVisit} style={{ marginBottom: '20px', background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <div className="form-group">
              <label>Purpose of Visit *</label>
              <input
                type="text"
                value={visitData.purpose}
                onChange={(e) => setVisitData({...visitData, purpose: e.target.value})}
                required
                placeholder="e.g., Follow-up, Consultation"
              />
            </div>
            <div className="form-group">
              <label>Diagnosis *</label>
              <input
                type="text"
                value={visitData.diagnosis}
                onChange={(e) => setVisitData({...visitData, diagnosis: e.target.value})}
                required
                placeholder="Enter diagnosis"
              />
            </div>
            <div className="form-group">
              <label>Treatment</label>
              <textarea
                value={visitData.treatment}
                onChange={(e) => setVisitData({...visitData, treatment: e.target.value})}
                rows="3"
                placeholder="Treatment provided"
              />
            </div>
            <div className="form-group">
              <label>Cost (KES)</label>
              <input
                type="number"
                value={visitData.cost}
                onChange={(e) => setVisitData({...visitData, cost: e.target.value})}
                min="0"
                placeholder="Visit cost"
              />
            </div>
            <button type="submit" className="btn btn-primary">Save Visit</button>
          </form>
        )}

        {patient.visits && patient.visits.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Purpose</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
                <th>Cost</th>
                <th>Attended By</th>
              </tr>
            </thead>
            <tbody>
              {patient.visits.map((visit, index) => (
                <tr key={index}>
                  <td>{new Date(visit.date).toLocaleDateString()}</td>
                  <td>{visit.purpose}</td>
                  <td>{visit.diagnosis}</td>
                  <td>{visit.treatment || 'N/A'}</td>
                  <td>{visit.cost ? `KES ${visit.cost}` : 'N/A'}</td>
                  <td>{visit.attendedBy?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No visits recorded yet.</p>
        )}
      </div>
    </div>
  );
}

export default PatientDetails;