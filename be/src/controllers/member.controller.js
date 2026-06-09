const Member = require('../models/Member.model');
const User = require('../models/User.model');
const Role = require('../models/Role.model');
const SubscriptionPlan = require('../models/SubscriptionPlan.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get current member's own profile
// @route   GET /api/v1/members/me
// @access  Private (any logged-in user with a member profile)
exports.getMemberProfile = asyncHandler(async (req, res, next) => {
  const member = await Member.findOne({ user: req.user._id });

  if (!member) {
    return next(new ErrorResponse('No member profile found for your account', 404));
  }

  res.status(200).json({ success: true, data: member });
});

// @desc    Update current member's own profile
// @route   PUT /api/v1/members/me
// @access  Private (any logged-in user with a member profile)
exports.updateMemberProfile = asyncHandler(async (req, res, next) => {
  // Members can only update limited personal fields
  const allowedFields = ['phone', 'emergencyContact', 'notes'];
  const updates = {};
  allowedFields.forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const member = await Member.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!member) {
    return next(new ErrorResponse('No member profile found for your account', 404));
  }

  res.status(200).json({ success: true, data: member });
});

// @desc    Get all members (paginated, filterable)
// @route   GET /api/v1/members
// @access  Private (Admin, Manager)
exports.getMembers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Build aggregate pipeline — always use $lookup for filter & populate
  const pipeline = [
    // Lookup user
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, email: 1, isActive: 1 } }],
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    // Lookup subscriptionPlan
    {
      $lookup: {
        from: 'subscriptionplans',
        localField: 'subscriptionPlan',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, type: 1, durationDays: 1, price: 1, isActive: 1 } }],
        as: 'subscriptionPlan'
      }
    },
    { $unwind: { path: '$subscriptionPlan', preserveNullAndEmptyArrays: true } }
  ];

  // Build match conditions after lookups
  const match = {};
  if (req.query.status) match.status = req.query.status;
  if (req.query.planType) match['subscriptionPlan.type'] = req.query.planType;

  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    match.$or = [
      { 'user.name': regex },
      { 'user.email': regex }
    ];
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  // Use $facet to get data + total count in one query
  pipeline.push({
    $facet: {
      data: [
        { $sort: { createdAt: -1 } },
        { $skip: startIndex },
        { $limit: limit }
      ],
      total: [{ $count: 'count' }]
    }
  });

  const [result] = await Member.aggregate(pipeline);
  const members = result.data;
  const total = result.total[0]?.count || 0;

  res.status(200).json({
    success: true,
    count: members.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: members
  });
});

// @desc    Get single member by ID
// @route   GET /api/v1/members/:id
// @access  Private (Admin, Manager)
exports.getMemberById = asyncHandler(async (req, res, next) => {
  const member = await Member.findById(req.params.id);

  if (!member) {
    return next(new ErrorResponse('Member not found', 404));
  }

  res.status(200).json({ success: true, data: member });
});

// @desc    Register new member (creates User + Member)
// @route   POST /api/v1/members
// @access  Private (Admin, Manager)
exports.createMember = asyncHandler(async (req, res, next) => {
  const {
    name, email, password,
    phone, memberEmail, idCard, address, dateOfBirth, gender,
    startDate, endDate, planId, notes
  } = req.body;

  // Lookup member role
  const memberRole = await Role.findOne({ name: 'member' });
  if (!memberRole) {
    return next(new ErrorResponse('Role "member" not found. Run npm run seed:members first', 500));
  }

  // Resolve plan and endDate
  let resolvedEndDate = endDate;
  let resolvedPlanId = null;

  if (planId) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return next(new ErrorResponse('Subscription plan not found', 404));
    if (!plan.isActive) return next(new ErrorResponse('Subscription plan is inactive', 400));
    resolvedPlanId = plan._id;
    const start = startDate ? new Date(startDate) : new Date();
    resolvedEndDate = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  }

  if (!resolvedEndDate) {
    return next(new ErrorResponse('endDate is required unless a planId is provided', 400));
  }

  // Create User with role=member
  const user = await User.create({
    name,
    email,
    password,
    role: memberRole._id,
    createdBy: req.user._id
  });

  try {
    const member = await Member.create({
      user: user._id,
      phone,
      email: memberEmail || email,
      idCard,
      address,
      dateOfBirth,
      gender,
      startDate: startDate || Date.now(),
      endDate: resolvedEndDate,
      subscriptionPlan: resolvedPlanId,
      notes
    });

    const populated = await Member.findById(member._id);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    // Manual rollback — delete user if Member creation fails
    await User.findByIdAndDelete(user._id);
    return next(err);
  }
});

// @desc    Update member info
// @route   PUT /api/v1/members/:id
// @access  Private (Admin, Manager)
exports.updateMember = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {};
  const allowedFields = ['phone', 'email', 'idCard', 'address', 'dateOfBirth', 'gender', 'subscriptionPlan', 'notes'];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) fieldsToUpdate[field] = req.body[field];
  });

  const member = await Member.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  if (!member) {
    return next(new ErrorResponse('Member not found', 404));
  }

  res.status(200).json({ success: true, data: member });
});

// @desc    Change member status (active ↔ suspended only)
// @route   PATCH /api/v1/members/:id/status
// @access  Private (Admin, Manager)
exports.changeStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return next(new ErrorResponse('Status must be active or suspended', 400));
  }

  const member = await Member.findById(req.params.id);
  if (!member) {
    return next(new ErrorResponse('Member not found', 404));
  }

  if (member.status === status) {
    return next(new ErrorResponse(`Member is already ${status}`, 400));
  }

  member.status = status;
  await member.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: member });
});

// @desc    Renew membership (via planId or manual endDate)
// @route   PATCH /api/v1/members/:id/renew
// @access  Private (Admin, Manager)
exports.renewMembership = asyncHandler(async (req, res, next) => {
  const { endDate, planId } = req.body;

  const member = await Member.findById(req.params.id);
  if (!member) {
    return next(new ErrorResponse('Member not found', 404));
  }

  if (planId) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return next(new ErrorResponse('Subscription plan not found', 404));
    if (!plan.isActive) return next(new ErrorResponse('Subscription plan is inactive', 400));
    const start = new Date();
    member.endDate = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    member.subscriptionPlan = plan._id;
  } else {
    if (!endDate) return next(new ErrorResponse('endDate or planId is required', 400));
    if (new Date(endDate) <= new Date()) return next(new ErrorResponse('End date must be in the future', 400));
    member.endDate = endDate;
  }

  member.status = 'active';
  await member.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: member });
});

// @desc    Check-in member
// @route   PATCH /api/v1/members/:id/check-in
// @access  Private (Admin, Manager)
exports.checkIn = asyncHandler(async (req, res, next) => {
  const member = await Member.findById(req.params.id);
  if (!member) {
    return next(new ErrorResponse('Member not found', 404));
  }

  if (member.status !== 'active') {
    return next(new ErrorResponse('Member is not active', 400));
  }

  member.lastCheckIn = new Date();
  await member.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: member });
});
