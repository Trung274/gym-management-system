const User = require('../models/User.model');
const Role = require('../models/Role.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all staff (paginated, filterable by role name and isActive)
// @route   GET /api/v1/staff
// @access  Private (Requires: staff:list)
exports.getStaff = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Build filter — exclude users whose role name is 'member'
  const filter = {};
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  // If filtering by role name, look up role first
  if (req.query.role) {
    const role = await Role.findOne({ name: req.query.role });
    if (!role) {
      return res.status(200).json({ success: true, count: 0, total: 0, currentPage: page, totalPages: 0, data: [] });
    }
    filter.role = role._id;
  } else {
    // Exclude 'member' role by default
    const memberRole = await Role.findOne({ name: 'member' });
    if (memberRole) {
      filter.role = { $ne: memberRole._id };
    }
  }

  const total = await User.countDocuments(filter);
  const staff = await User.find(filter)
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: staff.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: staff
  });
});

// @desc    Get single staff by ID
// @route   GET /api/v1/staff/:id
// @access  Private (Requires: staff:read)
exports.getStaffById = asyncHandler(async (req, res, next) => {
  const staff = await User.findById(req.params.id);

  if (!staff) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  res.status(200).json({ success: true, data: staff });
});

// @desc    Create staff account
// @route   POST /api/v1/staff
// @access  Private (Requires: staff:create)
exports.createStaff = asyncHandler(async (req, res, next) => {
  const { name, email, password, roleName } = req.body;

  // Lookup role by name
  const role = await Role.findOne({ name: roleName });
  if (!role) {
    return next(new ErrorResponse(`Role '${roleName}' not found`, 400));
  }

  const staff = await User.create({
    name,
    email,
    password,
    role: role._id,
    createdBy: req.user._id
  });

  res.status(201).json({ success: true, data: staff });
});

// @desc    Update staff info (name, email)
// @route   PUT /api/v1/staff/:id
// @access  Private (Requires: staff:update)
exports.updateStaff = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {};
  if (req.body.name !== undefined) fieldsToUpdate.name = req.body.name;
  if (req.body.email !== undefined) fieldsToUpdate.email = req.body.email;

  const staff = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  if (!staff) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  res.status(200).json({ success: true, data: staff });
});

// @desc    Deactivate staff account (soft delete)
// @route   PATCH /api/v1/staff/:id/deactivate
// @access  Private (Requires: staff:deactivate)
exports.deactivateStaff = asyncHandler(async (req, res, next) => {
  if (req.user._id.toString() === req.params.id) {
    return next(new ErrorResponse('Cannot deactivate your own account', 400));
  }

  const staff = await User.findById(req.params.id);
  if (!staff) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  if (!staff.isActive) {
    return next(new ErrorResponse('Account is already deactivated', 400));
  }

  staff.isActive = false;
  await staff.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: staff });
});

// @desc    Activate staff account
// @route   PATCH /api/v1/staff/:id/activate
// @access  Private (Requires: staff:deactivate)
exports.activateStaff = asyncHandler(async (req, res, next) => {
  const staff = await User.findById(req.params.id);
  if (!staff) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  if (staff.isActive) {
    return next(new ErrorResponse('Account is already active', 400));
  }

  staff.isActive = true;
  await staff.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: staff });
});

// @desc    Assign role to staff account
// @route   PUT /api/v1/staff/:id/role
// @access  Private (Requires: staff:update)
exports.assignRole = asyncHandler(async (req, res, next) => {
  const { roleName } = req.body;

  const role = await Role.findOne({ name: roleName });
  if (!role) {
    return next(new ErrorResponse(`Role '${roleName}' not found`, 400));
  }

  const staff = await User.findByIdAndUpdate(
    req.params.id,
    { role: role._id },
    { new: true, runValidators: true }
  );

  if (!staff) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  res.status(200).json({ success: true, data: staff });
});
