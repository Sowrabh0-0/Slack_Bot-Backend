import express from 'express';
import { oauthRedirect } from '../controllers/authController.js';

const router = express.Router();

router.get('/oauth_redirect', oauthRedirect);

export default router;
