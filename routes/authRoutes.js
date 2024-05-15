import express from 'express';
import { oauthRedirect } from '../controllers/authController.js';

const router = express.Router();

// Route for OAuth redirect
router.get('/oauth_redirect', oauthRedirect);

export default router;
