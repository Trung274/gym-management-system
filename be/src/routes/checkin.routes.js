const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Checkins
 *   description: Member check-in log and statistics
 */

/**
 * @swagger
 * /api/v1/checkins:
 *   post:
 *     summary: "Record check-in (Admin, Manager)"
 *     tags: [Checkins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *             properties:
 *               memberId:
 *                 type: string
 *                 description: Member ID (ObjectId)
 *               note:
 *                 type: string
 *                 example: Guest check-in
 *     responses:
 *       201:
 *         description: Check-in recorded. Member.lastCheckIn updated.
 *       400:
 *         description: Missing memberId or member is suspended
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Member not found
 */
router.post('/', protect, checkPermission('checkins', 'record'), checkinController.recordCheckin);

/**
 * @swagger
 * /api/v1/checkins/stats:
 *   get:
 *     summary: "Get check-in stats (Admin, Manager)"
 *     tags: [Checkins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 todayCount:
 *                   type: integer
 *                 weekCount:
 *                   type: integer
 *                 monthCount:
 *                   type: integer
 *                 peakHour:
 *                   type: integer
 *                   description: "Hour of day (0-23) with most check-ins in last 30 days"
 *                 dailyTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.get('/stats', protect, checkPermission('checkins', 'list'), checkinController.getCheckinStats);

/**
 * @swagger
 * /api/v1/checkins/my:
 *   get:
 *     summary: Get my check-in history (Protected)
 *     tags: [Checkins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in history for the logged-in member
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No member profile found
 */
router.get('/my', protect, checkinController.getMyCheckins);

/**
 * @swagger
 * /api/v1/checkins/member/{memberId}:
 *   get:
 *     summary: "Get member check-in history (Admin, Manager)"
 *     tags: [Checkins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Check-in history for the specified member
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Member not found
 */
router.get('/member/:memberId', protect, checkPermission('checkins', 'read'), checkinController.getMemberCheckins);

/**
 * @swagger
 * /api/v1/checkins:
 *   get:
 *     summary: "Get all check-ins (Admin, Manager)"
 *     tags: [Checkins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *         description: Filter by member ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by exact date (YYYY-MM-DD)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Range start date (inclusive)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Range end date (inclusive)
 *     responses:
 *       200:
 *         description: List of check-ins sorted by most recent
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.get('/', protect, checkPermission('checkins', 'list'), checkinController.getCheckins);

module.exports = router;
