const GymInfo = require('../models/GymInfo.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get gym information
// @route   GET /api/v1/gym-info
// @access  Public
exports.getGymInfo = asyncHandler(async (req, res, next) => {
  const gymInfo = await GymInfo.findOne();

  if (!gymInfo) {
    return next(new ErrorResponse('Gym information not found. Run npm run seed:gym', 404));
  }

  res.status(200).json({ success: true, data: gymInfo });
});

// @desc    Update gym information
// @route   PUT /api/v1/gym-info
// @access  Private (Admin)
exports.updateGymInfo = asyncHandler(async (req, res, next) => {
  const gymInfo = await GymInfo.findOneAndUpdate(
    {},
    req.body,
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: gymInfo });
});
