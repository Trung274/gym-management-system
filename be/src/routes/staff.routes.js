const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff account management endpoints
 */

/**
 * @swagger
 * /api/v1/staff:
 *   get:
 *     summary: "Get all staff (Admin, Manager)"
 *     tags: [Staff]
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
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role name (e.g. manager)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of staff accounts
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.get('/', protect, checkPermission('staff', 'list'), staffController.getStaff);

/**
 * @swagger
 * /api/v1/staff/{id}:
 *   get:
 *     summary: "Get staff by ID (Admin, Manager)"
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff user ID
 *     responses:
 *       200:
 *         description: Staff account details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Staff not found
 */
router.get('/:id', protect, checkPermission('staff', 'read'), staffController.getStaffById);

/**
 * @swagger
 * /api/v1/staff:
 *   post:
 *     summary: "Create staff account (Admin, Manager)"
 *     tags: [Staff]
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
 *               - roleName
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 example: staff@gym.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *               roleName:
 *                 type: string
 *                 example: manager
 *     responses:
 *       201:
 *         description: Staff account created successfully
 *       400:
 *         description: Bad request - missing fields, email already exists, or role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.post('/', protect, checkPermission('staff', 'create'), staffController.createStaff);

/**
 * @swagger
 * /api/v1/staff/{id}:
 *   put:
 *     summary: "Update staff info (Admin, Manager)"
 *     tags: [Staff]
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
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff account updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Staff not found
 */
router.put('/:id', protect, checkPermission('staff', 'update'), staffController.updateStaff);

/**
 * @swagger
 * /api/v1/staff/{id}/deactivate:
 *   patch:
 *     summary: "Deactivate staff account (Admin, Manager)"
 *     tags: [Staff]
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
 *         description: Staff account deactivated
 *       400:
 *         description: Already deactivated or cannot deactivate own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Staff not found
 */
router.patch('/:id/deactivate', protect, checkPermission('staff', 'deactivate'), staffController.deactivateStaff);

/**
 * @swagger
 * /api/v1/staff/{id}/activate:
 *   patch:
 *     summary: "Activate staff account (Admin, Manager)"
 *     tags: [Staff]
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
 *         description: Staff account activated
 *       400:
 *         description: Account already active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Staff not found
 */
router.patch('/:id/activate', protect, checkPermission('staff', 'deactivate'), staffController.activateStaff);

/**
 * @swagger
 * /api/v1/staff/{id}/role:
 *   put:
 *     summary: "Assign role to staff (Admin, Manager)"
 *     tags: [Staff]
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
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *                 example: manager
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       400:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Staff not found
 */
router.put('/:id/role', protect, checkPermission('staff', 'update'), staffController.assignRole);

module.exports = router;
