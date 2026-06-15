const express = require('express');
const router = express.Router();
const gymInfoController = require('../controllers/gymInfo.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: GymInfo
 *   description: Gym information management endpoints
 */

/**
 * @swagger
 * /api/v1/gym-info:
 *   get:
 *     summary: "Get gym information (Public)"
 *     tags: [GymInfo]
 *     responses:
 *       200:
 *         description: Gym information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Fitness Center"
 *                     tagline:
 *                       type: string
 *                       example: "Your Health, Our Priority"
 *                     description:
 *                       type: string
 *                     address:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     website:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                     coverImageUrl:
 *                       type: string
 *                     openingHours:
 *                       type: string
 *                       example: "Monday - Friday: 06:00 - 22:00, Saturday: 08:00 - 20:00, Sunday: 08:00 - 18:00"
 *                     socialLinks:
 *                       type: string
 *                       example: "Facebook: https://facebook.com/fitnesscenter"
 *                     established:
 *                       type: number
 *                       example: 2020
 *       404:
 *         description: Gym information not found
 */
router.get('/', gymInfoController.getGymInfo);

/**
 * @swagger
 * /api/v1/gym-info:
 *   put:
 *     summary: "Update gym information (Admin)"
 *     tags: [GymInfo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               tagline:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               website:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               coverImageUrl:
 *                 type: string
 *               openingHours:
 *                 type: string
 *                 example: "Monday - Friday: 06:00 - 22:00, Saturday: 08:00 - 20:00, Sunday: 08:00 - 18:00"
 *               socialLinks:
 *                 type: string
 *                 example: "Facebook: https://facebook.com/fitnesscenter"
 *               established:
 *                 type: number
 *     responses:
 *       200:
 *         description: Gym information updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.put('/', protect, checkPermission('gym', 'update'), gymInfoController.updateGymInfo);

module.exports = router;
