const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Equipment
 *   description: Gym facility and equipment management
 */

/**
 * @swagger
 * /api/v1/equipment:
 *   get:
 *     summary: Get all equipment (Public)
 *     tags: [Equipment]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [cardio, strength, flexibility, free_weights, other]
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [operational, maintenance, out_of_order]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of equipment
 */
router.get('/', equipmentController.getEquipment);

/**
 * @swagger
 * /api/v1/equipment/{id}:
 *   get:
 *     summary: Get equipment by ID (Public)
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Equipment details
 *       404:
 *         description: Equipment not found
 */
router.get('/:id', equipmentController.getEquipmentById);

/**
 * @swagger
 * /api/v1/equipment:
 *   post:
 *     summary: "Add equipment (Admin, Manager)"
 *     tags: [Equipment]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Máy chạy bộ
 *               category:
 *                 type: string
 *                 enum: [cardio, strength, flexibility, free_weights, other]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 example: 1
 *               location:
 *                 type: string
 *                 example: Zone Cardio
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               purchasePrice:
 *                 type: number
 *               supplier:
 *                 type: string
 *               nextMaintenanceDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Equipment added
 *       400:
 *         description: Validation error or duplicate serialNumber
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 */
router.post('/', protect, checkPermission('equipment', 'create'), equipmentController.createEquipment);

/**
 * @swagger
 * /api/v1/equipment/{id}:
 *   put:
 *     summary: "Update equipment (Admin, Manager)"
 *     tags: [Equipment]
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
 *                 enum: [cardio, strength, flexibility, free_weights, other]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               location:
 *                 type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               purchasePrice:
 *                 type: number
 *               supplier:
 *                 type: string
 *               lastMaintenanceDate:
 *                 type: string
 *                 format: date
 *               nextMaintenanceDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Equipment updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Equipment not found
 */
router.put('/:id', protect, checkPermission('equipment', 'update'), equipmentController.updateEquipment);

/**
 * @swagger
 * /api/v1/equipment/{id}/status:
 *   patch:
 *     summary: "Change equipment status (Admin, Manager)"
 *     tags: [Equipment]
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
 *                 enum: [operational, maintenance, out_of_order]
 *                 example: maintenance
 *     responses:
 *       200:
 *         description: Status updated (sets lastMaintenanceDate if status is maintenance)
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permission
 *       404:
 *         description: Equipment not found
 */
router.patch('/:id/status', protect, checkPermission('equipment', 'status'), equipmentController.changeEquipmentStatus);

/**
 * @swagger
 * /api/v1/equipment/{id}:
 *   delete:
 *     summary: "Delete equipment (Admin)"
 *     tags: [Equipment]
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
 *         description: Equipment deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Equipment not found
 */
router.delete('/:id', protect, checkPermission('equipment', 'delete'), equipmentController.deleteEquipment);

module.exports = router;
