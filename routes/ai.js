const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// All routes are protected
router.use(protect);

// @route   POST /api/ai/symptom-checker
// @desc    AI-powered symptom analysis
// @access  Private
router.post('/symptom-checker', [
  body('symptoms').isArray().withMessage('Symptoms must be an array'),
  body('age').isInt({ min: 0 }).withMessage('Valid age is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { symptoms, age, gender, medicalHistory } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please add OPENAI_API_KEY to environment variables.'
      });
    }

    const prompt = `As a medical assistant AI, analyze the following patient information and provide a preliminary assessment:

Patient Details:
- Age: ${age}
- Gender: ${gender}
- Symptoms: ${symptoms.join(', ')}
${medicalHistory ? `- Medical History: ${medicalHistory}` : ''}

Please provide:
1. Possible conditions (most to least likely)
2. Recommended immediate actions
3. Whether emergency care is needed
4. Suggested tests or examinations
5. General care advice

Note: This is a preliminary assessment and not a definitive diagnosis. Always consult with a healthcare professional.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful medical assistant AI. Provide preliminary health assessments based on symptoms, but always remind users to consult healthcare professionals for definitive diagnosis and treatment.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const analysis = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        analysis,
        disclaimer: 'This is an AI-generated preliminary assessment. Please consult with a qualified healthcare professional for accurate diagnosis and treatment.'
      }
    });
  } catch (error) {
    console.error('AI symptom checker error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing symptoms',
      error: error.message
    });
  }
});

// @route   POST /api/ai/treatment-suggestion
// @desc    Get AI treatment suggestions for a diagnosis
// @access  Private (Doctors and Nurses)
router.post('/treatment-suggestion', [
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { diagnosis, patientId } = req.body;

    // Get patient information
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please add OPENAI_API_KEY to environment variables.'
      });
    }

    const prompt = `As a medical treatment assistant, provide treatment recommendations for the following case:

Patient Information:
- Age: ${patient.age}
- Gender: ${patient.gender}
- Diagnosis: ${diagnosis}
- Current Condition: ${patient.sickness}
${patient.currentMedication.length > 0 ? `- Current Medications: ${patient.currentMedication.map(m => m.name).join(', ')}` : ''}
${patient.medicalHistory.length > 0 ? `- Medical History: ${patient.medicalHistory.map(h => h.condition).join(', ')}` : ''}

Please provide:
1. Recommended treatment plan
2. Medication suggestions (generic names)
3. Lifestyle modifications
4. Follow-up recommendations
5. Warning signs to watch for
6. Estimated recovery timeline

Note: These are suggestions to assist healthcare professionals and should be reviewed by a qualified doctor before implementation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a medical treatment assistant AI helping healthcare professionals. Provide evidence-based treatment suggestions while emphasizing the need for professional medical judgment.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const suggestions = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        suggestions,
        patientInfo: {
          name: patient.name,
          age: patient.age,
          diagnosis
        },
        disclaimer: 'These are AI-generated suggestions to assist healthcare professionals. Final treatment decisions should be made by qualified medical practitioners.'
      }
    });
  } catch (error) {
    console.error('AI treatment suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating treatment suggestions',
      error: error.message
    });
  }
});

// @route   POST /api/ai/health-education
// @desc    Get health education information
// @access  Private
router.post('/health-education', [
  body('topic').notEmpty().withMessage('Topic is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { topic } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please add OPENAI_API_KEY to environment variables.'
      });
    }

    const prompt = `Provide clear, easy-to-understand health education information about: ${topic}

Please include:
1. What it is (simple explanation)
2. Common causes
3. Prevention methods
4. When to seek medical help
5. General care tips
6. Common misconceptions

Make the information accessible to the general public and suitable for community health education.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a health educator providing accurate, easy-to-understand health information to the public. Use simple language and be culturally sensitive.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        topic,
        content,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('AI health education error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating health education content',
      error: error.message
    });
  }
});

module.exports = router;