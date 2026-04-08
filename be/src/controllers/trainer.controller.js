const Trainer = require('../models/Trainer.model');
const User = require('../models/User.model');
const Role = require('../models/Role.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all active trainers (public)
// @route   GET /api/v1/trainers
// @access  Public
exports.getTrainers = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  } else if (!req.query.status) {
    filter.status = 'active'; // Default to active for public access
  }

  // Filter by specialization
  if (req.query.specialization) {
    filter.specializations = { $in: [req.query.specialization] };
  }

  const trainers = await Trainer.find(filter).sort('-experienceYears');

  res.status(200).json({
    success: true,
    count: trainers.length,
    data: trainers
  });
});

// @desc    Get single trainer
// @route   GET /api/v1/trainers/:id
// @access  Public
exports.getTrainerById = asyncHandler(async (req, res, next) => {
  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    return next(new ErrorResponse('Trainer not found', 404));
  }

  res.status(200).json({ success: true, data: trainer });
});

// @desc    Create new trainer (creates User + Trainer)
// @route   POST /api/v1/trainers
// @access  Private (Admin, Manager)
exports.createTrainer = asyncHandler(async (req, res, next) => {
  const {
    name, email, password,
    phone, trainerEmail, idCard, address, dateOfBirth, gender,
    specializations, experienceYears, bio, certifications, hireDate
  } = req.body;

  const trainerRole = await Role.findOne({ name: 'trainer' });
  if (!trainerRole) {
    return next(new ErrorResponse('Role "trainer" not found. Run npm run seed:trainers first', 500));
  }

  const user = await User.create({
    name,
    email,
    password,
    role: trainerRole._id,
    createdBy: req.user._id
  });

  try {
    const trainer = await Trainer.create({
      user: user._id,
      phone,
      email: trainerEmail || email,
      idCard,
      address,
      dateOfBirth,
      gender,
      specializations: specializations || [],
      experienceYears: experienceYears || 0,
      bio,
      certifications: certifications || [],
      hireDate: hireDate || Date.now()
    });

    const populated = await Trainer.findById(trainer._id);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    return next(err);
  }
});

// @desc    Update trainer info
// @route   PUT /api/v1/trainers/:id
// @access  Private (Admin, Manager)
exports.updateTrainer = asyncHandler(async (req, res, next) => {
  const allowedFields = ['phone', 'email', 'idCard', 'address', 'dateOfBirth', 'gender',
    'specializations', 'experienceYears', 'bio', 'certifications'];

  const fieldsToUpdate = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) fieldsToUpdate[field] = req.body[field];
  });

  const trainer = await Trainer.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  if (!trainer) {
    return next(new ErrorResponse('Trainer not found', 404));
  }

  res.status(200).json({ success: true, data: trainer });
});

// @desc    Change trainer status (active ↔ inactive)
// @route   PATCH /api/v1/trainers/:id/status
// @access  Private (Admin, Manager)
exports.changeTrainerStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return next(new ErrorResponse('Status must be active or inactive', 400));
  }

  const trainer = await Trainer.findById(req.params.id);
  if (!trainer) {
    return next(new ErrorResponse('Trainer not found', 404));
  }

  if (trainer.status === status) {
    return next(new ErrorResponse(`Trainer is already ${status}`, 400));
  }

  trainer.status = status;
  await trainer.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: trainer });
});
