const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash', 'insurance', 'card'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  mpesaReceiptNumber: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  description: {
    type: String
  },
  insuranceClaim: {
    provider: String,
    claimNumber: String,
    approvedAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);