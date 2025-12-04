const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/patients
// @desc    Register a new patient
// @access  Private (All healthcare workers)
router.post('/', [
  body('name').notEmpty().withMessage('Patient name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('sickness').notEmpty().withMessage('Sickness/condition is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const patientData = {
      ...req.body,
      assignedWorker: req.user._id
    };

    const patient = await Patient.create(patientData);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering patient',
      error: error.message
    });
  }
});

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private (All healthcare workers)
router.get('/', async (req, res) => {
  try {
    const { status, insuranceProvider, search } = req.query;
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (insuranceProvider) {
      query.insuranceProvider = insuranceProvider;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query)
      .populate('assignedWorker', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
});

// @route   GET /api/patients/:id
// @desc    Get single patient
// @access  Private (All healthcare workers)
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedWorker', 'name role specialization')
      .populate('visits.attendedBy', 'name role')
      .populate('payments');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient information
// @access  Private (All healthcare workers)
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message
    });
  }
});

// @route   POST /api/patients/:id/visits
// @desc    Add a visit record
// @access  Private (Doctors and Nurses)
router.post('/:id/visits', 
  authorize('doctor', 'nurse'),
  [
    body('purpose').notEmpty().withMessage('Visit purpose is required'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const patient = await Patient.findById(req.params.id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const visit = {
        date: new Date(),
        purpose: req.body.purpose,
        diagnosis: req.body.diagnosis,
        treatment: req.body.treatment,
        cost: req.body.cost,
        attendedBy: req.user._id
      };

      patient.visits.push(visit);
      await patient.save();

      res.json({
        success: true,
        message: 'Visit record added successfully',
        data: patient
      });
    } catch (error) {
      console.error('Add visit error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding visit record',
        error: error.message
      });
    }
  }
);

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private (Admin and Doctors)
router.delete('/:id', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message
    });
  }
});

module.exports = router;