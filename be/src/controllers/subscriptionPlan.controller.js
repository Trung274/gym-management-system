const SubscriptionPlan = require('../models/SubscriptionPlan.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all subscription plans (active only for public; ?all=true for admin)
// @route   GET /api/v1/subscription-plans
// @access  Public
exports.getPlans = asyncHandler(async (req, res, next) => {
  const filter = {};

  // Public only sees active plans; admin can pass ?all=true to see all
  const showAll = req.query.all === 'true' && req.user;
  if (!showAll) filter.isActive = true;

  if (req.query.type) filter.type = req.query.type;

  const plans = await SubscriptionPlan.find(filter).sort('type durationDays');

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans
  });
});

// @desc    Get single subscription plan
// @route   GET /api/v1/subscription-plans/:id
// @access  Public
exports.getPlanById = asyncHandler(async (req, res, next) => {
  const plan = await SubscriptionPlan.findById(req.params.id);

  if (!plan) {
    return next(new ErrorResponse('Subscription plan not found', 404));
  }

  res.status(200).json({ success: true, data: plan });
});

// @desc    Create new subscription plan
// @route   POST /api/v1/subscription-plans
// @access  Private (Admin, Manager)
exports.createPlan = asyncHandler(async (req, res, next) => {
  const { name, type, durationDays, price, description } = req.body;

  const plan = await SubscriptionPlan.create({ name, type, durationDays, price, description });

  res.status(201).json({ success: true, data: plan });
});

// @desc    Update subscription plan
// @route   PUT /api/v1/subscription-plans/:id
// @access  Private (Admin, Manager)
exports.updatePlan = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'type', 'durationDays', 'price', 'description'];
  const updates = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const plan = await SubscriptionPlan.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  if (!plan) {
    return next(new ErrorResponse('Subscription plan not found', 404));
  }

  res.status(200).json({ success: true, data: plan });
});

// @desc    Toggle subscription plan active status
// @route   PATCH /api/v1/subscription-plans/:id/toggle
// @access  Private (Admin, Manager)
exports.togglePlan = asyncHandler(async (req, res, next) => {
  const plan = await SubscriptionPlan.findById(req.params.id);

  if (!plan) {
    return next(new ErrorResponse('Subscription plan not found', 404));
  }

  plan.isActive = !plan.isActive;
  await plan.save();

  res.status(200).json({ success: true, data: plan });
});
