import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function PaymentForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    phoneNumber: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`/api/patients/${patientId}`, config);
      setPatient(response.data.data);
      setFormData({
        ...formData,
        phoneNumber: response.data.data.phoneNumber
      });
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      let endpoint = '';
      let data = {
        patientId,
        amount: parseFloat(formData.amount),
        description: formData.description
      };

      if (paymentMethod === 'mpesa') {
        endpoint = '/api/payments/mpesa/stk-push';
        data.phoneNumber = formData.phoneNumber;
      } else if (paymentMethod === 'cash') {
        endpoint = '/api/payments/cash';
      } else if (paymentMethod === 'insurance') {
        endpoint = '/api/insurance/claim';
        data.serviceDescription = formData.description;
      }

      const response = await axios.post(endpoint, data, config);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: paymentMethod === 'mpesa' 
            ? 'M-Pesa payment initiated! Please check your phone to complete the payment.'
            : paymentMethod === 'insurance'
            ? 'Insurance claim submitted successfully!'
            : 'Payment recorded successfully!'
        });

        setTimeout(() => {
          navigate(`/patients/${patientId}`);
        }, 3000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Payment failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!patient) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Payment for {patient.name}</h1>

      <div className="card">
        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        <div className="detail-section">
          <h3>Patient Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Name</div>
              <div className="detail-value">{patient.name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{patient.phoneNumber}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Insurance</div>
              <div className="detail-value">{patient.insuranceProvider}</div>
            </div>
          </div>
        </div>

        <h3 style={{ marginTop: '20px', marginBottom: '15px' }}>Select Payment Method</h3>
        
        <div className="payment-methods">
          <div
            className={`payment-method-card ${paymentMethod === 'mpesa' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('mpesa')}
          >
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📱</div>
            <div style={{ fontWeight: 'bold' }}>M-Pesa</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Pay via M-Pesa</div>
          </div>

          <div
            className={`payment-method-card ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💵</div>
            <div style={{ fontWeight: 'bold' }}>Cash</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Cash payment</div>
          </div>

          <div
            className={`payment-method-card ${paymentMethod === 'insurance' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('insurance')}
          >
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏥</div>
            <div style={{ fontWeight: 'bold' }}>Insurance</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Submit claim</div>
          </div>
        </div>

        {paymentMethod && (
          <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
            <div className="form-group">
              <label>Amount (KES) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="1"
                placeholder="Enter amount"
              />
            </div>

            {paymentMethod === 'mpesa' && (
              <div className="form-group">
                <label>M-Pesa Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 0712345678"
                />
                <small style={{ color: '#666' }}>
                  You will receive an M-Pesa prompt on this number
                </small>
              </div>
            )}

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Payment description (optional)"
              />
            </div>

            {paymentMethod === 'insurance' && patient.insuranceProvider !== 'None' && (
              <div className="insurance-verification">
                <h4>Insurance Information</h4>
                <p><strong>Provider:</strong> {patient.insuranceProvider}</p>
                <p><strong>Member Number:</strong> {patient.insuranceNumber || 'Not provided'}</p>
                <p><strong>Status:</strong> <span className={`badge badge-${
                  patient.insuranceStatus === 'active' ? 'success' : 'warning'
                }`}>{patient.insuranceStatus}</span></p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Processing...' : 
                  paymentMethod === 'mpesa' ? 'Initiate M-Pesa Payment' :
                  paymentMethod === 'insurance' ? 'Submit Insurance Claim' :
                  'Record Cash Payment'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate(`/patients/${patientId}`)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default PaymentForm;