const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    type: String,
    trim: true
  },
  nationalId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Medical Information
  sickness: {
    type: String,
    required: [true, 'Sickness/condition is required']
  },
  symptoms: [{
    type: String
  }],
  diagnosis: {
    type: String
  },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  currentMedication: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  // Insurance Information
  insuranceProvider: {
    type: String,
    enum: ['NSSF', 'SHA', 'Private', 'None'],
    default: 'None'
  },
  insuranceNumber: {
    type: String
  },
  insuranceStatus: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'inactive'
  },
  // Assigned Healthcare Worker
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Visits and Payments
  visits: [{
    date: Date,
    purpose: String,
    diagnosis: String,
    treatment: String,
    cost: Number,
    attendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  status: {
    type: String,
    enum: ['active', 'recovered', 'referred', 'deceased'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Patient', patientSchema);