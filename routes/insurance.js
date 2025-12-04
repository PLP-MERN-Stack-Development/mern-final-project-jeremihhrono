const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/insurance/verify-nssf
// @desc    Verify NSSF membership
// @access  Private
router.post('/verify-nssf', [
  body('memberId').notEmpty().withMessage('NSSF Member ID is required'),
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { memberId, patientId } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Mock NSSF verification (replace with actual API call)
    // In production, integrate with actual NSSF API
    try {
      // const response = await axios.post(
      //   `${process.env.NSSF_API_URL}/verify`,
      //   { memberId },
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${process.env.NSSF_API_KEY}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      // Mock successful verification
      const mockResponse = {
        isValid: true,
        memberName: patient.name,
        memberId: memberId,
        status: 'active',
        coverageAmount: 50000,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      };

      // Update patient insurance information
      patient.insuranceProvider = 'NSSF';
      patient.insuranceNumber = memberId;
      patient.insuranceStatus = 'active';
      await patient.save();

      res.json({
        success: true,
        message: 'NSSF membership verified successfully',
        data: mockResponse
      });
    } catch (error) {
      console.error('NSSF verification error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to verify NSSF membership',
        error: error.message
      });
    }
  } catch (error) {
    console.error('NSSF verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying NSSF membership',
      error: error.message
    });
  }
});

// @route   POST /api/insurance/verify-sha
// @desc    Verify SHA (Social Health Authority) coverage
// @access  Private
router.post('/verify-sha', [
  body('shaNumber').notEmpty().withMessage('SHA Number is required'),
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { shaNumber, patientId } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Mock SHA verification (replace with actual API call)
    // In production, integrate with actual SHA API
    try {
      // const response = await axios.post(
      //   `${process.env.SHA_API_URL}/verify`,
      //   { shaNumber },
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${process.env.SHA_API_KEY}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      // Mock successful verification
      const mockResponse = {
        isValid: true,
        memberName: patient.name,
        shaNumber: shaNumber,
        status: 'active',
        tier: 'Basic',
        coverageDetails: {
          outpatient: 'Covered',
          inpatient: 'Covered',
          maternity: 'Covered',
          dental: 'Limited'
        },
        facilities: ['Level 1-5 facilities'],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };

      // Update patient insurance information
      patient.insuranceProvider = 'SHA';
      patient.insuranceNumber = shaNumber;
      patient.insuranceStatus = 'active';
      await patient.save();

      res.json({
        success: true,
        message: 'SHA coverage verified successfully',
        data: mockResponse
      });
    } catch (error) {
      console.error('SHA verification error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to verify SHA coverage',
        error: error.message
      });
    }
  } catch (error) {
    console.error('SHA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying SHA coverage',
      error: error.message
    });
  }
});

// @route   POST /api/insurance/claim
// @desc    Submit insurance claim
// @access  Private
router.post('/claim', [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Valid amount is required'),
  body('serviceDescription').notEmpty().withMessage('Service description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { patientId, amount, serviceDescription, documents } = req.body;

    // Verify patient exists and has insurance
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (patient.insuranceProvider === 'None' || patient.insuranceStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Patient does not have active insurance coverage'
      });
    }

    // Generate claim number
    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Mock insurance claim submission
    // In production, integrate with actual insurance provider APIs
    const mockClaimResponse = {
      claimNumber,
      status: 'pending',
      submittedDate: new Date(),
      provider: patient.insuranceProvider,
      requestedAmount: amount,
      estimatedProcessingTime: '5-7 business days'
    };

    // Create payment record with insurance claim
    const payment = await Payment.create({
      patient: patientId,
      amount,
      paymentMethod: 'insurance',
      description: serviceDescription,
      status: 'pending',
      transactionId: claimNumber,
      insuranceClaim: {
        provider: patient.insuranceProvider,
        claimNumber,
        approvedAmount: 0,
        status: 'pending'
      }
    });

    // Update patient's payment records
    patient.payments.push(payment._id);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Insurance claim submitted successfully',
      data: {
        claim: mockClaimResponse,
        payment: payment
      }
    });
  } catch (error) {
    console.error('Insurance claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting insurance claim',
      error: error.message
    });
  }
});

// @route   GET /api/insurance/claim-status/:claimNumber
// @desc    Check insurance claim status
// @access  Private
router.get('/claim-status/:claimNumber', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      transactionId: req.params.claimNumber
    }).populate('patient', 'name insuranceProvider insuranceNumber');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Mock claim status check
    // In production, integrate with actual insurance provider APIs
    const mockStatus = {
      claimNumber: req.params.claimNumber,
      status: payment.insuranceClaim.status,
      provider: payment.insuranceClaim.provider,
      requestedAmount: payment.amount,
      approvedAmount: payment.insuranceClaim.approvedAmount,
      lastUpdated: payment.updatedAt,
      remarks: payment.insuranceClaim.status === 'pending' 
        ? 'Claim is being reviewed' 
        : 'Claim processed'
    };

    res.json({
      success: true,
      data: mockStatus
    });
  } catch (error) {
    console.error('Claim status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching claim status',
      error: error.message
    });
  }
});

// @route   GET /api/insurance/patient/:patientId
// @desc    Get patient insurance information
// @access  Private
router.get('/patient/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: {
        insuranceProvider: patient.insuranceProvider,
        insuranceNumber: patient.insuranceNumber,
        insuranceStatus: patient.insuranceStatus
      }
    });
  } catch (error) {
    console.error('Get insurance info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance information',
      error: error.message
    });
  }
});

module.exports = router;