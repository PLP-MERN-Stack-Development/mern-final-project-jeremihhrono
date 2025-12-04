import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function PatientRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    phoneNumber: '',
    address: '',
    nationalId: '',
    sickness: '',
    symptoms: '',
    insuranceProvider: 'None',
    insuranceNumber: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Convert symptoms string to array
      const dataToSend = {
        ...formData,
        symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s)
      };

      const response = await axios.post('/api/patients', dataToSend, config);

      if (response.data.success) {
        setSuccess('Patient registered successfully!');
        setTimeout(() => {
          navigate(`/patients/${response.data.data._id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Register New Patient</h1>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Personal Information</h3>
          
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter patient's full name"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Age *</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="0"
                max="150"
                placeholder="Age"
              />
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              placeholder="e.g., 0712345678"
            />
          </div>

          <div className="form-group">
            <label>National ID</label>
            <input
              type="text"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              placeholder="National ID number (optional)"
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Patient's address (optional)"
            />
          </div>

          <h3 style={{ marginTop: '25px', marginBottom: '15px', color: '#2c3e50' }}>
            Medical Information
          </h3>

          <div className="form-group">
            <label>Sickness/Condition *</label>
            <input
              type="text"
              name="sickness"
              value={formData.sickness}
              onChange={handleChange}
              required
              placeholder="Main health condition or complaint"
            />
          </div>

          <div className="form-group">
            <label>Symptoms</label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              rows="3"
              placeholder="List symptoms separated by commas (e.g., fever, headache, cough)"
            />
          </div>

          <h3 style={{ marginTop: '25px', marginBottom: '15px', color: '#2c3e50' }}>
            Insurance Information
          </h3>

          <div className="form-group">
            <label>Insurance Provider</label>
            <select
              name="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={handleChange}
            >
              <option value="None">None</option>
              <option value="NSSF">NSSF</option>
              <option value="SHA">SHA (Social Health Authority)</option>
              <option value="Private">Private Insurance</option>
            </select>
          </div>

          {formData.insuranceProvider !== 'None' && (
            <div className="form-group">
              <label>Insurance Number</label>
              <input
                type="text"
                name="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={handleChange}
                placeholder="Insurance member number"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Patient'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/patients')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientRegistration;