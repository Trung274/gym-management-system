const express = require('express');
const router = express.Router();
const planController = require('../controllers/subscriptionPlan.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: SubscriptionPlans
 *   description: Gym membership subscription plan catalog
 */

/**
 * @swagger
 * /api/v1/subscription-plans:
 *   get:
 *     summary: Get all subscription plans (Public)
 *     tags: [SubscriptionPlans]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [basic, premium, vip]
 *         description: Filter by plan type
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: "Show inactive plans too (requires login)"
 *     responses:
 *       200:
 *         description: List of active subscription plans
 */
router.get('/', planController.getPlans);

/**
 * @swagger
 * /api/v1/subscription-plans/{id}:
 *   get:
 *     summary: Get subscription plan by ID (Public)
 *     tags: [SubscriptionPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Subscription plan details
 *       404:
 *         description: Plan not found
 */
router.get('/:id', planController.getPlanById);

/**
 * @swagger
 * /api/v1/subscription-plans:
 *   post:
 *     summary: "Create subscription plan (Admin, Manager)"
 *     tags: [SubscriptionPlans]
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
 *               - type
 *               - durationDays
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gói Premium 6 Tháng
 *               type:
 *                 type: string
 *                 enum: [basic, premium, vip]
 *               durationDays:
 *                 type: integer
 *                 example: 180
 *               price:
 *                 type: number
 *                 example: 1500000
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plan created successfully
 *       400:
 *         description: Bad request - missing fields or duplicate name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.post('/', protect, checkPermission('plans', 'create'), planController.createPlan);

/**
 * @swagger
 * /api/v1/subscription-plans/{id}:
 *   put:
 *     summary: "Update subscription plan (Admin, Manager)"
 *     tags: [SubscriptionPlans]
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
 *               type:
 *                 type: string
 *                 enum: [basic, premium, vip]
 *               durationDays:
 *                 type: integer
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plan updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Plan not found
 */
router.put('/:id', protect, checkPermission('plans', 'update'), planController.updatePlan);

/**
 * @swagger
 * /api/v1/subscription-plans/{id}/toggle:
 *   patch:
 *     summary: "Toggle subscription plan status (Admin, Manager)"
 *     tags: [SubscriptionPlans]
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
 *         description: Plan status toggled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Plan not found
 */
router.patch('/:id/toggle', protect, checkPermission('plans', 'toggle'), planController.togglePlan);

module.exports = router;
