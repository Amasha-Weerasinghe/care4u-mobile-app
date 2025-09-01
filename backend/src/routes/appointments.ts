import express from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all appointment routes
router.use(authenticateToken);

// Test route to verify appointments are working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Appointment routes are working', user: (req as any).user });
});

// Create a new appointment
router.post('/', AppointmentController.createAppointment);

// Get all appointments for the authenticated user
router.get('/', AppointmentController.getUserAppointments);

// Get appointments for a specific date
router.get('/date/:date', AppointmentController.getAppointmentsByDate);

// Get upcoming appointments
router.get('/upcoming', AppointmentController.getUpcomingAppointments);

// Get past appointments
router.get('/past', AppointmentController.getPastAppointments);

// Get appointment by ID (must come after specific routes)
router.get('/:id', AppointmentController.getAppointmentById);

// Update an appointment
router.put('/:id', AppointmentController.updateAppointment);

// Delete an appointment
router.delete('/:id', AppointmentController.deleteAppointment);

export default router;
