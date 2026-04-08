const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Group fitness class schedule management
 */

/**
 * @swagger
 * /api/v1/classes:
 *   get:
 *     summary: Get all classes (Public)
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [yoga, zumba, cycling, hiit, pilates, boxing, other]
 *         description: Filter by category
 *       - in: query
 *         name: trainerId
 *         schema:
 *           type: string
 *         description: Filter by trainer ID
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         description: "Filter by day (0=Sun, 1=Mon, ..., 6=Sat)"
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: "Show all statuses including cancelled/completed (requires login)"
 *     responses:
 *       200:
 *         description: List of active classes
 */
router.get('/', classController.getClasses);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   get:
 *     summary: Get class by ID (Public)
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class details with trainer info
 *       404:
 *         description: Class not found
 */
router.get('/:id', classController.getClassById);

/**
 * @swagger
 * /api/v1/classes:
 *   post:
 *     summary: "Create class (Admin, Manager)"
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - schedule
 *             properties:
 *               name:
 *                 type: string
 *                 example: Yoga Buổi Sáng
 *               category:
 *                 type: string
 *                 enum: [yoga, zumba, cycling, hiit, pilates, boxing, other]
 *               description:
 *                 type: string
 *               trainer:
 *                 type: string
 *                 description: Trainer ID (ObjectId) — must be active
 *               location:
 *                 type: string
 *                 example: Phòng Yoga
 *               capacity:
 *                 type: integer
 *                 example: 20
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                       description: "0=Sun, 1=Mon, ..., 6=Sat"
 *                     startTime:
 *                       type: string
 *                       example: "06:30"
 *                     endTime:
 *                       type: string
 *                       example: "07:30"
 *                 example:
 *                   - dayOfWeek: 1
 *                     startTime: "06:30"
 *                     endTime: "07:30"
 *                   - dayOfWeek: 3
 *                     startTime: "06:30"
 *                     endTime: "07:30"
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Class created
 *       400:
 *         description: Validation error or trainer not active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.post('/', protect, checkPermission('classes', 'create'), classController.createClass);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   put:
 *     summary: "Update class (Admin, Manager)"
 *     tags: [Classes]
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
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [yoga, zumba, cycling, hiit, pilates, boxing, other]
 *               description:
 *                 type: string
 *               trainer:
 *                 type: string
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated
 *       400:
 *         description: Trainer not active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Class not found
 */
router.put('/:id', protect, checkPermission('classes', 'update'), classController.updateClass);

/**
 * @swagger
 * /api/v1/classes/{id}/status:
 *   patch:
 *     summary: "Change class status (Admin, Manager)"
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, cancelled, completed]
 *                 example: cancelled
 *     responses:
 *       200:
 *         description: Status changed
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Class not found
 */
router.patch('/:id/status', protect, checkPermission('classes', 'status'), classController.changeClassStatus);

module.exports = router;
