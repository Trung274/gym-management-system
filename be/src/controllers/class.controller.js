const Class = require('../models/Class.model');
const Trainer = require('../models/Trainer.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all classes
// @route   GET /api/v1/classes
// @access  Public (active only; ?all=true for logged-in admin/manager)
exports.getClasses = asyncHandler(async (req, res, next) => {
  const filter = {};

  // Public sees active only; authenticated user can pass ?all=true
  const showAll = req.query.all === 'true' && req.user;
  if (!showAll) filter.status = 'active';

  if (req.query.category) filter.category = req.query.category;
  if (req.query.trainerId) filter.trainer = req.query.trainerId;

  // Filter by dayOfWeek inside the schedule array
  if (req.query.dayOfWeek !== undefined) {
    filter['schedule.dayOfWeek'] = parseInt(req.query.dayOfWeek, 10);
  }

  const classes = await Class.find(filter).sort('category name');

  res.status(200).json({
    success: true,
    count: classes.length,
    data: classes
  });
});

// @desc    Get single class
// @route   GET /api/v1/classes/:id
// @access  Public
exports.getClassById = asyncHandler(async (req, res, next) => {
  const gymClass = await Class.findById(req.params.id);

  if (!gymClass) {
    return next(new ErrorResponse('Class not found', 404));
  }

  res.status(200).json({ success: true, data: gymClass });
});

// @desc    Create new class
// @route   POST /api/v1/classes
// @access  Private (Admin, Manager)
exports.createClass = asyncHandler(async (req, res, next) => {
  const { trainer: trainerId } = req.body;

  // Validate trainer is active if provided
  if (trainerId) {
    const trainer = await Trainer.findById(trainerId);
    if (!trainer || trainer.status !== 'active') {
      return next(new ErrorResponse('Trainer is not active or not found', 400));
    }
  }

  const gymClass = await Class.create(req.body);
  const populated = await Class.findById(gymClass._id);

  res.status(201).json({ success: true, data: populated });
});

// @desc    Update class
// @route   PUT /api/v1/classes/:id
// @access  Private (Admin, Manager)
exports.updateClass = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'name', 'category', 'description', 'trainer', 'location',
    'capacity', 'schedule', 'startDate', 'endDate', 'notes'
  ];

  // Validate trainer if being updated
  if (req.body.trainer) {
    const trainer = await Trainer.findById(req.body.trainer);
    if (!trainer || trainer.status !== 'active') {
      return next(new ErrorResponse('Trainer is not active or not found', 400));
    }
  }

  const updates = {};
  allowedFields.forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const gymClass = await Class.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  if (!gymClass) {
    return next(new ErrorResponse('Class not found', 404));
  }

  res.status(200).json({ success: true, data: gymClass });
});

// @desc    Change class status
// @route   PATCH /api/v1/classes/:id/status
// @access  Private (Admin, Manager)
exports.changeClassStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['active', 'cancelled', 'completed'];

  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Status must be one of: ${validStatuses.join(', ')}`, 400));
  }

  const gymClass = await Class.findById(req.params.id);
  if (!gymClass) {
    return next(new ErrorResponse('Class not found', 404));
  }

  gymClass.status = status;
  await gymClass.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: gymClass });
});
