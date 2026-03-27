const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: PT session booking management
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: "Get all bookings (Admin, Manager)"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: trainerId
 *         schema:
 *           type: string
 *         description: Filter by trainer ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by session date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.get('/', protect, checkPermission('bookings', 'list'), bookingController.getBookings);

/**
 * @swagger
 * /api/v1/bookings/my:
 *   get:
 *     summary: Get my bookings (Protected)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookings belonging to the logged-in member
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No member profile found
 */
router.get('/my', protect, bookingController.getMyBookings);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: "Get booking by ID (Admin, Manager, Member-owner)"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not your booking
 *       404:
 *         description: Booking not found
 */
router.get('/:id', protect, checkPermission('bookings', 'read'), bookingController.getBookingById);

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create booking (Protected)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trainerId
 *               - sessionDate
 *               - startTime
 *               - endTime
 *             properties:
 *               trainerId:
 *                 type: string
 *                 description: Trainer ID (ObjectId)
 *               sessionDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-05"
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *                 description: Format HH:MM
 *               endTime:
 *                 type: string
 *                 example: "10:00"
 *                 description: Format HH:MM
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created (status pending)
 *       400:
 *         description: Trainer unavailable, time conflict, or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.post('/', protect, checkPermission('bookings', 'create'), bookingController.createBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/confirm:
 *   patch:
 *     summary: "Confirm booking (Admin, Manager)"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking confirmed
 *       400:
 *         description: Only pending bookings can be confirmed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Booking not found
 */
router.patch('/:id/confirm', protect, checkPermission('bookings', 'manage'), bookingController.confirmBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/cancel:
 *   patch:
 *     summary: "Cancel booking (Admin, Manager, Member-owner)"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       400:
 *         description: Cannot cancel completed/confirmed booking (for member)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not your booking
 *       404:
 *         description: Booking not found
 */
router.patch('/:id/cancel', protect, bookingController.cancelBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/complete:
 *   patch:
 *     summary: "Complete booking (Admin, Manager)"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking completed
 *       400:
 *         description: Only confirmed bookings can be completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Booking not found
 */
router.patch('/:id/complete', protect, checkPermission('bookings', 'manage'), bookingController.completeBooking);

module.exports = router;
