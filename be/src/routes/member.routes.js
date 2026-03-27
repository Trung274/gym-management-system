const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Members
 *   description: Gym member management endpoints
 */

/**
 * @swagger
 * /api/v1/members:
 *   get:
 *     summary: "Get all members (Admin, Manager)"
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 10)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, suspended]
 *         description: Filter by status
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *           enum: [basic, premium, vip]
 *         description: Filter by subscription plan type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of members
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.get('/', protect, checkPermission('members', 'list'), memberController.getMembers);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   get:
 *     summary: "Get member by ID (Admin, Manager)"
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Member details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Member not found
 */
router.get('/:id', protect, checkPermission('members', 'read'), memberController.getMemberById);

/**
 * @swagger
 * /api/v1/members:
 *   post:
 *     summary: "Register new member (Admin, Manager)"
 *     tags: [Members]
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
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyen Van B
 *               email:
 *                 type: string
 *                 example: member@gym.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               memberEmail:
 *                 type: string
 *                 example: personal@email.com
 *                 description: Personal email (defaults to login email)
 *               idCard:
 *                 type: string
 *                 example: "012345678901"
 *               address:
 *                 type: string
 *                 example: "123 Nguyen Trai, Ha Noi"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1995-06-15"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               planId:
 *                 type: string
 *                 description: "Subscription plan ID — auto-derives endDate (endDate not required)"
 *                 example: "507f1f77bcf86cd799439011"
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: "Required if planId is not provided"
 *                 example: "2027-03-27"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member registered successfully
 *       400:
 *         description: "Bad request - missing fields, email exists, or plan not found"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.post('/', protect, checkPermission('members', 'create'), memberController.createMember);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   put:
 *     summary: "Update member info (Admin, Manager)"
 *     tags: [Members]
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
 *               subscriptionPlan:
 *                 type: string
 *                 description: Subscription plan ID (ObjectId)
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Member not found
 */
router.put('/:id', protect, checkPermission('members', 'update'), memberController.updateMember);

/**
 * @swagger
 * /api/v1/members/{id}/status:
 *   patch:
 *     summary: "Change member status (Admin, Manager)"
 *     tags: [Members]
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
 *                 enum: [active, suspended]
 *                 example: suspended
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
 *         description: Member not found
 */
router.patch('/:id/status', protect, checkPermission('members', 'status'), memberController.changeStatus);

/**
 * @swagger
 * /api/v1/members/{id}/renew:
 *   patch:
 *     summary: "Renew membership (Admin, Manager)"
 *     tags: [Members]
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
 *               - endDate
 *             properties:
 *               planId:
 *                 type: string
 *                 description: "Subscription plan ID — auto-derives endDate"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: "Required if planId is not provided"
 *                 example: "2027-12-31"
 *     responses:
 *       200:
 *         description: Membership renewed
 *       400:
 *         description: End date must be in the future
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Member not found
 */
router.patch('/:id/renew', protect, checkPermission('members', 'update'), memberController.renewMembership);

/**
 * @swagger
 * /api/v1/members/{id}/check-in:
 *   patch:
 *     summary: "Check-in member (Admin, Manager)"
 *     tags: [Members]
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
 *         description: Check-in recorded
 *       400:
 *         description: Member is not active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Member not found
 */
router.patch('/:id/check-in', protect, checkPermission('members', 'checkin'), memberController.checkIn);

module.exports = router;
