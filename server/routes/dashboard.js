const router = require('express').Router();
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');

router.get('/', async (_req, res, next) => {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const [totalMembers, archivedMembers, birthdays, latest] = await Promise.all([
      Member.countDocuments({ archived: false }),
      Member.countDocuments({ archived: true }),
      Member.find({ archived: false, birthday: new RegExp(`^${month}-`) }).sort({ birthday: 1 }).select('fullName birthday'),
      Attendance.findOne().sort({ serviceDate: -1 })
    ]);
    const stats = latest ? await Attendance.aggregate([{ $match: { serviceDate: latest.serviceDate } }, { $group: { _id: '$status', count: { $sum: 1 } } }]) : [];
    res.json({ totalMembers, archivedMembers, birthdays, latestServiceDate: latest?.serviceDate || null, attendance: Object.fromEntries(stats.map((item) => [item._id, item.count])) });
  } catch (error) { next(error); }
});
module.exports = router;
