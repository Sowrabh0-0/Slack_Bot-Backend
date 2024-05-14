import express from 'express';
import { getApprovals } from '../controllers/approvalController.js';

const router = express.Router();

router.get('/approvals', getApprovals);

export default router;