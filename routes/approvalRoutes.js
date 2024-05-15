import express from 'express';
import { getApprovals } from '../controllers/approvalController.js';

const router = express.Router();

// Route to get approvals
router.get('/approvals', getApprovals);

export default router;
