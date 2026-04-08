const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainer.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Trainers
 *   description: Gym trainer management endpoints
 */

/**
 * @swagger
 * /api/v1/trainers:
 *   get:
 *     summary: Get all trainers (Public)
 *     tags: [Trainers]
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by specialization (e.g. yoga, strength, cardio)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *         description: Filter by trainer status (default is active for public view)
 *     responses:
 *       200:
 *         description: List of active trainers
 */
router.get('/', trainerController.getTrainers);

/**
 * @swagger
 * /api/v1/trainers/{id}:
 *   get:
 *     summary: Get trainer by ID (Public)
 *     tags: [Trainers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trainer details
 *       404:
 *         description: Trainer not found
 */
router.get('/:id', trainerController.getTrainerById);

/**
 * @swagger
 * /api/v1/trainers:
 *   post:
 *     summary: "Create trainer (Admin, Manager)"
 *     tags: [Trainers]
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
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyen Van PT
 *               email:
 *                 type: string
 *                 example: trainer@gym.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *               phone:
 *                 type: string
 *               trainerEmail:
 *                 type: string
 *                 description: Personal email (defaults to login email)
 *               idCard:
 *                 type: string
 *               address:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["yoga", "strength"]
 *               experienceYears:
 *                 type: integer
 *                 example: 5
 *               bio:
 *                 type: string
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ACE CPT", "CrossFit L1"]
 *               hireDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Trainer created successfully
 *       400:
 *         description: Bad request - missing fields or email exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.post('/', protect, checkPermission('trainers', 'create'), trainerController.createTrainer);

/**
 * @swagger
 * /api/v1/trainers/{id}:
 *   put:
 *     summary: "Update trainer info (Admin, Manager)"
 *     tags: [Trainers]
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
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               experienceYears:
 *                 type: integer
 *               bio:
 *                 type: string
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Trainer updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Trainer not found
 */
router.put('/:id', protect, checkPermission('trainers', 'update'), trainerController.updateTrainer);

/**
 * @swagger
 * /api/v1/trainers/{id}/status:
 *   patch:
 *     summary: "Change trainer status (Admin, Manager)"
 *     tags: [Trainers]
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
 *                 enum: [active, inactive]
 *                 example: inactive
 *     responses:
 *       200:
 *         description: Status changed
 *       400:
 *         description: Invalid status or already in that status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Trainer not found
 */
router.patch('/:id/status', protect, checkPermission('trainers', 'status'), trainerController.changeTrainerStatus);

module.exports = router;
