const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  serviceDate: { type: String, required: true, index: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: { type: String, enum: ['present', 'absent'], default: 'present' }
}, { timestamps: true });

attendanceSchema.index({ memberId: 1, serviceDate: 1 }, { unique: true });
module.exports = mongoose.model('Attendance', attendanceSchema);
