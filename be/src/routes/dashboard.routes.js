const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: System overview and analytics snapshot
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: "Get dashboard snapshot (Admin, Manager)"
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full system snapshot with 7 sections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     members:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         active: { type: integer }
 *                         suspended: { type: integer }
 *                         newThisMonth: { type: integer }
 *                     trainers:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         active: { type: integer }
 *                     bookings:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         pending: { type: integer }
 *                         confirmed: { type: integer }
 *                         completedThisMonth: { type: integer }
 *                     checkins:
 *                       type: object
 *                       properties:
 *                         today: { type: integer }
 *                         thisWeek: { type: integer }
 *                     classes:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         active: { type: integer }
 *                         todaySchedule:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name: { type: string }
 *                               location: { type: string }
 *                               sessions:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     dayOfWeek: { type: integer }
 *                                     startTime: { type: string }
 *                                     endTime: { type: string }
 *                     equipment:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         operational: { type: integer }
 *                         maintenance: { type: integer }
 *                         outOfOrder: { type: integer }
 *                     plans:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         active: { type: integer }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager only
 */
router.get('/', protect, checkPermission('dashboard', 'view'), dashboardController.getDashboard);

module.exports = router;
