import { Router } from 'express';

const router: Router = Router();

let controller = require('../controllers/controller');

/**
 * Cyber Security Endpoint
 */

/**
 * Non-Repudiation Service
 */
router.post('/nr', controller.publishKey);
router.get('/nrk', controller.getPublishedKey);

export default router;
