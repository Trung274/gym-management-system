const CheckinLog = require('../models/CheckinLog.model');
const Member = require('../models/Member.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Record a member check-in
// @route   POST /api/v1/checkins
// @access  Private (Admin, Manager)
exports.recordCheckin = asyncHandler(async (req, res, next) => {
  const { memberId, note } = req.body;

  if (!memberId) {
    return next(new ErrorResponse('memberId is required', 400));
  }

  const member = await Member.findById(memberId);
  if (!member) {
    return next(new ErrorResponse('Member not found', 404));
  }

  if (member.status === 'suspended') {
    return next(new ErrorResponse('Cannot check in a suspended member', 400));
  }

  const checkinAt = new Date();

  // Create log
  const log = await CheckinLog.create({
    member: memberId,
    checkinAt,
    note,
    recordedBy: req.user._id
  });

  // Update Member.lastCheckIn (backward compat)
  await Member.findByIdAndUpdate(memberId, { lastCheckIn: checkinAt });

  const populated = await CheckinLog.findById(log._id);
  res.status(201).json({ success: true, data: populated });
});

// @desc    Get all check-ins
// @route   GET /api/v1/checkins
// @access  Private (Admin, Manager)
exports.getCheckins = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.memberId) filter.member = req.query.memberId;

  if (req.query.date) {
    const day = new Date(req.query.date);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    filter.checkinAt = { $gte: day, $lt: nextDay };
  } else if (req.query.dateFrom || req.query.dateTo) {
    filter.checkinAt = {};
    if (req.query.dateFrom) filter.checkinAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) {
      const to = new Date(req.query.dateTo);
      to.setDate(to.getDate() + 1);
      filter.checkinAt.$lt = to;
    }
  }

  const logs = await CheckinLog.find(filter).sort('-checkinAt');

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get current user's check-in history
// @route   GET /api/v1/checkins/my
// @access  Private (Protected)
exports.getMyCheckins = asyncHandler(async (req, res, next) => {
  const member = await Member.findOne({ user: req.user._id });
  if (!member) {
    return next(new ErrorResponse('No member profile found for your account', 404));
  }

  const logs = await CheckinLog.find({ member: member._id }).sort('-checkinAt');

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get check-in history for a specific member
// @route   GET /api/v1/checkins/member/:memberId
// @access  Private (Admin, Manager)
exports.getMemberCheckins = asyncHandler(async (req, res, next) => {
  const member = await Member.findById(req.params.memberId);
  if (!member) {
    return next(new ErrorResponse('Member not found', 404));
  }

  const logs = await CheckinLog.find({ member: req.params.memberId }).sort('-checkinAt');

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get check-in statistics
// @route   GET /api/v1/checkins/stats
// @access  Private (Admin, Manager)
exports.getCheckinStats = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [result] = await CheckinLog.aggregate([
    {
      $facet: {
        todayCount: [
          { $match: { checkinAt: { $gte: startOfToday } } },
          { $count: 'count' }
        ],
        weekCount: [
          { $match: { checkinAt: { $gte: sevenDaysAgo } } },
          { $count: 'count' }
        ],
        monthCount: [
          { $match: { checkinAt: { $gte: thirtyDaysAgo } } },
          { $count: 'count' }
        ],
        peakHour: [
          { $match: { checkinAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: { $hour: '$checkinAt' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ],
        dailyTrend: [
          { $match: { checkinAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: {
                year:  { $year: '$checkinAt' },
                month: { $month: '$checkinAt' },
                day:   { $dayOfMonth: '$checkinAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day'
                }
              },
              count: 1
            }
          }
        ]
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      todayCount:  result.todayCount[0]?.count  ?? 0,
      weekCount:   result.weekCount[0]?.count   ?? 0,
      monthCount:  result.monthCount[0]?.count  ?? 0,
      peakHour:    result.peakHour[0]?._id      ?? null,
      dailyTrend:  result.dailyTrend
    }
  });
});
