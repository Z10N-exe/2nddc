const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');

router.get('/', async (req, res, next) => {
  try {
    const serviceDate = req.query.date;
    if (!serviceDate) return res.status(400).json({ message: 'date is required.' });
    const rows = await Attendance.find({ serviceDate }).populate('memberId', 'fullName phone').sort({ createdAt: 1 });
    res.json(rows);
  } catch (error) { next(error); }
});

router.put('/', async (req, res, next) => {
  try {
    const { serviceDate, memberId, status = 'present' } = req.body;
    if (!serviceDate || !memberId) return res.status(400).json({ message: 'serviceDate and memberId are required.' });
    const member = await Member.exists({ _id: memberId, archived: false });
    if (!member) return res.status(404).json({ message: 'Active member not found.' });
    const row = await Attendance.findOneAndUpdate({ serviceDate, memberId }, { status }, { upsert: true, new: true, runValidators: true });
    res.json(row);
  } catch (error) { next(error); }
});

router.put('/bulk', async (req, res, next) => {
  try {
    const { serviceDate, memberIds, status } = req.body;
    if (!serviceDate || !Array.isArray(memberIds) || !['present', 'absent'].includes(status)) return res.status(400).json({ message: 'serviceDate, memberIds, and a valid status are required.' });
    await Attendance.bulkWrite(memberIds.map((memberId) => ({ updateOne: { filter: { serviceDate, memberId }, update: { $set: { status } }, upsert: true } })));
    res.json({ updated: memberIds.length });
  } catch (error) { next(error); }
});
module.exports = router;
