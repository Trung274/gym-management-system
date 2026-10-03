const Booking = require('../models/Booking.model');
const Member = require('../models/Member.model');
const Trainer = require('../models/Trainer.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { ROLES } = require('../config/roles');
const { isValidDateString, isValidTimeString, nowInGym } = require('../utils/gymTime');
const { isMembershipExpired } = require('../utils/memberExpiry');

// Helper: check if two time ranges overlap (all in HH:MM string)
const timesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

// Roles that may see and act on every booking (still subject to route permissions)
const FULL_ACCESS_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF];

const refId = (ref) => (ref?._id ?? ref)?.toString();

// Trainer profile of the logged-in user (null for non-trainers or trainers without a profile)
const getOwnTrainer = (user) =>
  user.role?.name === ROLES.TRAINER ? Trainer.findOne({ user: user._id }) : null;

/**
 * How the current user relates to a booking:
 *   'all'     — admin / manager / staff
 *   'trainer' — the booking's trainer
 *   'member'  — the member who booked it
 *   null      — no access
 */
const getBookingAccess = async (user, booking) => {
  if (FULL_ACCESS_ROLES.includes(user.role?.name)) return 'all';
  if (user.role?.name === ROLES.TRAINER) {
    const trainer = await getOwnTrainer(user);
    return trainer && refId(booking.trainer) === trainer._id.toString() ? 'trainer' : null;
  }
  const member = await Member.findOne({ user: user._id });
  return member && refId(booking.member) === member._id.toString() ? 'member' : null;
};

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private (bookings:list) — trainers only get their own sessions
exports.getBookings = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.trainerId) filter.trainer = req.query.trainerId;
  if (req.user.role?.name === ROLES.TRAINER) {
    const trainer = await getOwnTrainer(req.user);
    if (!trainer) return res.status(200).json({ success: true, count: 0, data: [] });
    filter.trainer = trainer._id;
  }
  if (req.query.date) {
    const day = new Date(req.query.date);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    filter.sessionDate = { $gte: day, $lt: nextDay };
  }

  const bookings = await Booking.find(filter).sort('-sessionDate');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get current user's bookings
// @route   GET /api/v1/bookings/my
// @access  Private (Protected)
exports.getMyBookings = asyncHandler(async (req, res, next) => {
  // Find the Member document for the logged-in user
  const member = await Member.findOne({ user: req.user._id });
  if (!member) {
    return next(new ErrorResponse('No member profile found for your account', 404));
  }

  const bookings = await Booking.find({ member: member._id }).sort('-sessionDate');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private (Admin, Manager, Staff, the booking's trainer, or the member who owns it)
exports.getBookingById = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  if (!(await getBookingAccess(req.user, booking))) {
    return next(new ErrorResponse('Not authorized to view this booking', 403));
  }

  res.status(200).json({ success: true, data: booking });
});

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  Private (Protected)
exports.createBooking = asyncHandler(async (req, res, next) => {
  const { trainerId, sessionDate, startTime, endTime, notes } = req.body;

  // Find member profile for the logged-in user
  const member = await Member.findOne({ user: req.user._id });
  if (!member) {
    return next(new ErrorResponse('No member profile found. Only members can create bookings', 400));
  }

  if (member.status === 'suspended') {
    return next(new ErrorResponse('Your membership is suspended. Contact staff to book a session', 400));
  }
  if (isMembershipExpired(member)) {
    return next(new ErrorResponse('Your membership has expired. Renew it to book a session', 400));
  }

  // Validate trainer exists and is active
  const trainer = await Trainer.findById(trainerId);
  if (!trainer || trainer.status !== 'active') {
    return next(new ErrorResponse('Trainer not found or inactive', 400));
  }

  if (!isValidDateString(sessionDate)) {
    return next(new ErrorResponse('Session date must be in YYYY-MM-DD format', 400));
  }
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
    return next(new ErrorResponse('Time must be in HH:MM format', 400));
  }

  // Validate end time > start time
  if (startTime >= endTime) {
    return next(new ErrorResponse('End time must be after start time', 400));
  }

  // Session must start in the future — compared in gym-local time, so today's later slots are allowed
  const now = nowInGym();
  if (sessionDate < now.date || (sessionDate === now.date && startTime <= now.time)) {
    return next(new ErrorResponse('Session start time must be in the future', 400));
  }

  // Check for trainer schedule conflicts (against confirmed bookings)
  const day = new Date(sessionDate);
  const nextDay = new Date(day);
  nextDay.setDate(day.getDate() + 1);

  const conflictingBookings = await Booking.find({
    trainer: trainerId,
    sessionDate: { $gte: day, $lt: nextDay },
    status: 'confirmed'
  });

  const hasConflict = conflictingBookings.some(b =>
    timesOverlap(startTime, endTime, b.startTime, b.endTime)
  );

  if (hasConflict) {
    return next(new ErrorResponse('Trainer already has a booking in this time slot', 400));
  }

  const booking = await Booking.create({
    member: member._id,
    trainer: trainerId,
    sessionDate,
    startTime,
    endTime,
    notes,
    createdBy: req.user._id
  });

  const populated = await Booking.findById(booking._id);
  res.status(201).json({ success: true, data: populated });
});

// @desc    Confirm booking
// @route   PATCH /api/v1/bookings/:id/confirm
// @access  Private (bookings:manage) — trainers only for their own sessions
exports.confirmBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new ErrorResponse('Booking not found', 404));

  const access = await getBookingAccess(req.user, booking);
  if (access !== 'all' && access !== 'trainer') {
    return next(new ErrorResponse('Not authorized to confirm this booking', 403));
  }

  if (booking.status !== 'pending') {
    return next(new ErrorResponse('Only pending bookings can be confirmed', 400));
  }

  booking.status = 'confirmed';
  await booking.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: booking });
});

// @desc    Cancel booking
// @route   PATCH /api/v1/bookings/:id/cancel
// @access  Private (Admin, Manager, Staff, or member who owns pending booking) — not trainers
exports.cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new ErrorResponse('Booking not found', 404));

  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return next(new ErrorResponse(`Cannot cancel a ${booking.status} booking`, 400));
  }

  const access = await getBookingAccess(req.user, booking);
  if (access !== 'all' && access !== 'member') {
    return next(new ErrorResponse('Not authorized to cancel this booking', 403));
  }
  // Members can only cancel their own pending bookings
  if (access === 'member' && booking.status === 'confirmed') {
    return next(new ErrorResponse('Cannot cancel a confirmed booking. Contact admin', 400));
  }

  booking.status = 'cancelled';
  if (req.body.cancellationReason) booking.cancellationReason = req.body.cancellationReason;
  await booking.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: booking });
});

// @desc    Complete booking
// @route   PATCH /api/v1/bookings/:id/complete
// @access  Private (bookings:manage) — trainers only for their own sessions
exports.completeBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new ErrorResponse('Booking not found', 404));

  const access = await getBookingAccess(req.user, booking);
  if (access !== 'all' && access !== 'trainer') {
    return next(new ErrorResponse('Not authorized to complete this booking', 403));
  }

  if (booking.status !== 'confirmed') {
    return next(new ErrorResponse('Only confirmed bookings can be completed', 400));
  }

  booking.status = 'completed';
  await booking.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: booking });
});
