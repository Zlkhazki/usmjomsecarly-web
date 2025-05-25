import express from 'express';
import {
  getSystemFeedback,
  getFeedbackByUser,
  createSystemFeedback,
  getFeedbackStats
} from '../controllers/feedbackController.js';

// Middleware (you may need to adjust these based on your auth setup)
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes for system feedback

// GET /api/feedback - Get all system feedback with pagination and filtering
router.get('/', authenticateToken, getSystemFeedback);

// GET /api/feedback/stats - Get feedback statistics
router.get('/stats', authenticateToken, getFeedbackStats);

// GET /api/feedback/user/:userId - Get feedback by specific user
router.get('/user/:userId', authenticateToken, getFeedbackByUser);

// POST /api/feedback - Create new system feedback
router.post('/', authenticateToken, createSystemFeedback);

export default router;
