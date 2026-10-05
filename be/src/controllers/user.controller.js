const User = require('../models/User.model');
const Role = require('../models/Role.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { ROLES, PROFILE_ROLES, ACCOUNT_ROLES } = require('../config/roles');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isSelf = (req) => req.user._id.toString() === req.params.id;

// @desc    Get all users (paginated; filter by search, role name, isActive)
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const filter = {};
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (req.query.role) {
    const role = await Role.findOne({ name: req.query.role });
    if (!role) {
      return res.status(200).json({ success: true, count: 0, total: 0, currentPage: page, totalPages: 0, data: [] });
    }
    filter.role = role._id;
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Users can only view their own profile unless they're admin
  if (req.user.id !== req.params.id && req.user.role?.name !== ROLES.ADMIN) {
    return next(new ErrorResponse('Not authorized to view this user', 403));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user (name, email) — role changes go through PATCH /users/:id/role
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Users can only update their own profile unless they're admin
  if (req.user.id !== req.params.id && req.user.role?.name !== ROLES.ADMIN) {
    return next(new ErrorResponse('Not authorized to update this user', 403));
  }

  // Fields that can be updated
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// @desc    Deactivate / reactivate an account (replaces deleting it — history is kept)
// @route   PATCH /api/v1/users/:id/status
// @access  Private/Admin
exports.setUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return next(new ErrorResponse('isActive must be true or false', 400));
  }
  if (isSelf(req)) {
    return next(new ErrorResponse('Cannot change the status of your own account', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  if (user.isActive === isActive) {
    return next(new ErrorResponse(isActive ? 'Account is already active' : 'Account is already deactivated', 400));
  }

  user.isActive = isActive;
  if (!isActive) user.refreshTokens = []; // sign out of every device
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: user });
});

// @desc    Change the role of an account without a profile (admin / manager / staff)
// @route   PATCH /api/v1/users/:id/role
// @access  Private/Admin
exports.changeUserRole = asyncHandler(async (req, res, next) => {
  const { roleName } = req.body;
  if (!ACCOUNT_ROLES.includes(roleName)) {
    return next(new ErrorResponse(`Role must be one of: ${ACCOUNT_ROLES.join(', ')}`, 400));
  }
  // Also guarantees an active admin always remains (the actor)
  if (isSelf(req)) {
    return next(new ErrorResponse('Cannot change your own role', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  if (PROFILE_ROLES.includes(user.role?.name)) {
    return next(new ErrorResponse('Member and trainer accounts are managed from their own pages', 400));
  }

  const role = await Role.findOne({ name: roleName });
  if (!role) {
    return next(new ErrorResponse(`Role '${roleName}' not found`, 400));
  }

  user.role = role._id;
  await user.save({ validateBeforeSave: false });
  await user.populate('role', 'name permissions');

  res.status(200).json({ success: true, data: user });
});

// @desc    Set a new password for an account and sign it out everywhere
// @route   PATCH /api/v1/users/:id/password
// @access  Private/Admin
exports.resetUserPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  if (typeof password !== 'string' || password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }
  // Resetting your own password here would sign you out mid-session
  if (isSelf(req)) {
    return next(new ErrorResponse('Cannot reset your own password here', 400));
  }

  const user = await User.findById(req.params.id).select('+password');
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  user.password = password;          // hashed by the pre-save hook
  user.passwordChangedAt = new Date(); // invalidates existing access tokens
  user.refreshTokens = [];           // and refresh tokens
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully' });
});

// @desc    Delete user — the admin UI deactivates instead; kept for data cleanup
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  if (isSelf(req)) {
    return next(new ErrorResponse('Cannot delete your own account', 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  // Deleting would orphan the Member / Trainer profile and its history
  if (PROFILE_ROLES.includes(user.role?.name)) {
    return next(new ErrorResponse('Member and trainer accounts cannot be deleted — deactivate them instead', 400));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: {}
  });
});
