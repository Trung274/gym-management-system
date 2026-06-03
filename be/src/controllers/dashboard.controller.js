const Member = require('../models/Member.model');
const Trainer = require('../models/Trainer.model');
const Booking = require('../models/Booking.model');
const CheckinLog = require('../models/CheckinLog.model');
const Class = require('../models/Class.model');
const Equipment = require('../models/Equipment.model');
const SubscriptionPlan = require('../models/SubscriptionPlan.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get dashboard snapshot
// @route   GET /api/v1/dashboard
// @access  Private (Admin, Manager)
exports.getDashboard = asyncHandler(async (req, res, next) => {
  const now = new Date();

  // Time boundaries
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const todayDOW = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Run all queries in parallel
  const [
    memberTotal,
    memberActive,
    memberSuspended,
    memberNewThisMonth,
    trainerTotal,
    trainerActive,
    bookingTotal,
    bookingPending,
    bookingConfirmed,
    bookingCompletedThisMonth,
    checkinToday,
    checkinThisWeek,
    classTotal,
    classActive,
    todayClasses,
    equipmentStats,
    planTotal,
    planActive,
  ] = await Promise.all([
    // Members
    Member.countDocuments({}),
    Member.countDocuments({ status: 'active' }),
    Member.countDocuments({ status: 'suspended' }),
    Member.countDocuments({ createdAt: { $gte: startOfMonth } }),

    // Trainers
    Trainer.countDocuments({}),
    Trainer.countDocuments({ status: 'active' }),

    // Bookings
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'completed', updatedAt: { $gte: startOfMonth } }),

    // Check-ins
    CheckinLog.countDocuments({ checkinAt: { $gte: startOfDay } }),
    CheckinLog.countDocuments({ checkinAt: { $gte: sevenDaysAgo } }),

    // Classes
    Class.countDocuments({}),
    Class.countDocuments({ status: 'active' }),
    Class.find({ status: 'active', 'schedule.dayOfWeek': todayDOW })
      .select('name location schedule')
      .lean(),

    // Equipment (aggregate by status)
    Equipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Plans
    SubscriptionPlan.countDocuments({}),
    SubscriptionPlan.countDocuments({ isActive: true }),
  ]);

  // Parse equipment aggregate result
  const equipmentMap = { operational: 0, maintenance: 0, out_of_order: 0 };
  let equipmentTotal = 0;
  for (const { _id, count } of equipmentStats) {
    if (_id in equipmentMap) equipmentMap[_id] = count;
    equipmentTotal += count;
  }

  // Filter todayClasses schedule to only show today's slots, sort by startTime
  const todaySchedule = todayClasses.map(cls => ({
    name: cls.name,
    location: cls.location,
    sessions: cls.schedule
      .filter(s => s.dayOfWeek === todayDOW)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  })).sort((a, b) =>
    (a.sessions[0]?.startTime || '').localeCompare(b.sessions[0]?.startTime || '')
  );

  res.status(200).json({
    success: true,
    generatedAt: now.toISOString(),
    data: {
      members: {
        total: memberTotal,
        active: memberActive,
        suspended: memberSuspended,
        newThisMonth: memberNewThisMonth,
      },
      trainers: {
        total: trainerTotal,
        active: trainerActive,
      },
      bookings: {
        total: bookingTotal,
        pending: bookingPending,
        confirmed: bookingConfirmed,
        completedThisMonth: bookingCompletedThisMonth,
      },
      checkins: {
        today: checkinToday,
        thisWeek: checkinThisWeek,
      },
      classes: {
        total: classTotal,
        active: classActive,
        todaySchedule,
      },
      equipment: {
        total: equipmentTotal,
        operational: equipmentMap.operational,
        maintenance: equipmentMap.maintenance,
        outOfOrder: equipmentMap.out_of_order,
      },
      plans: {
        total: planTotal,
        active: planActive,
      },
    }
  });
});
