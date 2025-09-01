import express from 'express';
import { SugarController } from '../controllers/sugarController';
import { authenticateToken } from '../middleware/auth';
import {
  createSugarRecordValidation,
  updateSugarRecordValidation,
  getSugarRecordsValidation,
  getSugarSummaryValidation,
  deleteSugarRecordValidation
} from '../middleware/sugarValidation';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create sugar record
router.post('/', createSugarRecordValidation, SugarController.createSugarRecord);

// Get sugar records
router.get('/', getSugarRecordsValidation, SugarController.getSugarRecords);

// Get sugar summary
router.get('/summary', getSugarSummaryValidation, SugarController.getSugarSummary);

// Get today's sugar summary
router.get('/today-summary', SugarController.getTodaySugarSummary);

// Update sugar record
router.put('/:id', updateSugarRecordValidation, SugarController.updateSugarRecord);

// Delete sugar record
router.delete('/:id', deleteSugarRecordValidation, SugarController.deleteSugarRecord);

// Delete sugar records by date and type
router.delete('/', SugarController.deleteSugarRecordsByDateAndType);

export default router;
