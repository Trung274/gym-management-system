const Equipment = require('../models/Equipment.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all equipment
// @route   GET /api/v1/equipment
// @access  Public
exports.getEquipment = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;

  const equipment = await Equipment.find(filter).sort('category name');

  res.status(200).json({
    success: true,
    count: equipment.length,
    data: equipment
  });
});

// @desc    Get single equipment
// @route   GET /api/v1/equipment/:id
// @access  Public
exports.getEquipmentById = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id);

  if (!equipment) {
    return next(new ErrorResponse('Equipment not found', 404));
  }

  res.status(200).json({ success: true, data: equipment });
});

// @desc    Add new equipment
// @route   POST /api/v1/equipment
// @access  Private (Admin, Manager)
exports.createEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.create(req.body);
  res.status(201).json({ success: true, data: equipment });
});

// @desc    Update equipment
// @route   PUT /api/v1/equipment/:id
// @access  Private (Admin, Manager)
exports.updateEquipment = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'name', 'category', 'brand', 'model', 'serialNumber', 'quantity',
    'location', 'purchaseDate', 'purchasePrice', 'supplier',
    'lastMaintenanceDate', 'nextMaintenanceDate', 'notes'
  ];

  const updates = {};
  allowedFields.forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const equipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  if (!equipment) {
    return next(new ErrorResponse('Equipment not found', 404));
  }

  res.status(200).json({ success: true, data: equipment });
});

// @desc    Change equipment status
// @route   PATCH /api/v1/equipment/:id/status
// @access  Private (Admin, Manager)
exports.changeEquipmentStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['operational', 'maintenance', 'out_of_order'];

  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
  }

  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) {
    return next(new ErrorResponse('Equipment not found', 404));
  }

  equipment.status = status;
  // Auto-record maintenance date when set to maintenance
  if (status === 'maintenance') {
    equipment.lastMaintenanceDate = new Date();
  }
  await equipment.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: equipment });
});

// @desc    Delete equipment
// @route   DELETE /api/v1/equipment/:id
// @access  Private (Admin only)
exports.deleteEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id);

  if (!equipment) {
    return next(new ErrorResponse('Equipment not found', 404));
  }

  await equipment.deleteOne();

  res.status(200).json({
    success: true,
    message: `Equipment "${equipment.name}" deleted successfully`
  });
});
