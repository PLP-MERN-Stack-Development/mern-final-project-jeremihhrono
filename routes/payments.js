const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// M-Pesa Access Token Function
const getMpesaAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa access token error:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token');
  }
};

// @route   POST /api/payments/mpesa/stk-push
// @desc    Initiate M-Pesa STK Push
// @access  Private
router.post('/mpesa/stk-push', [
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Valid amount is required'),
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phoneNumber, amount, patientId, description } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get M-Pesa access token
    const accessToken = await getMpesaAccessToken();

    // Prepare STK Push request
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const stkPushData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: `PAT${patientId.slice(-6)}`,
      TransactionDesc: description || 'Health Service Payment'
    };

    // Send STK Push
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPushData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    // Create payment record
    const payment = await Payment.create({
      patient: patientId,
      amount,
      paymentMethod: 'mpesa',
      phoneNumber,
      transactionId: response.data.CheckoutRequestID,
      description,
      status: 'pending'
    });

    // Update patient's payment records
    patient.payments.push(payment._id);
    await patient.save();

    res.json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        payment: payment
      }
    });
  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error initiating M-Pesa payment',
      error: error.response?.data || error.message
    });
  }
});

// @route   POST /api/payments/mpesa/callback
// @desc    M-Pesa callback endpoint
// @access  Public (Called by Safaricom)
router.post('/mpesa/callback', async (req, res) => {
  try {
    console.log('M-Pesa Callback:', JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    const { stkCallback } = Body;

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const items = stkCallback.CallbackMetadata.Item;
      const amount = items.find(item => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = items.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = items.find(item => item.Name === 'PhoneNumber')?.Value;

      // Update payment record
      await Payment.findOneAndUpdate(
        { transactionId: stkCallback.CheckoutRequestID },
        {
          status: 'completed',
          mpesaReceiptNumber,
          phoneNumber
        }
      );
    } else {
      // Payment failed
      await Payment.findOneAndUpdate(
        { transactionId: stkCallback.CheckoutRequestID },
        { status: 'failed' }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/payments/cash
// @desc    Record cash payment
// @access  Private
router.post('/cash', [
  body('amount').isFloat({ min: 1 }).withMessage('Valid amount is required'),
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { amount, patientId, description } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      patient: patientId,
      amount,
      paymentMethod: 'cash',
      description,
      status: 'completed',
      transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Update patient's payment records
    patient.payments.push(payment._id);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Cash payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Cash payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording cash payment',
      error: error.message
    });
  }
});

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, patientId, paymentMethod } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const payments = await Payment.find(query)
      .populate('patient', 'name phoneNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patient', 'name phoneNumber insuranceProvider');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
});

module.exports = router;