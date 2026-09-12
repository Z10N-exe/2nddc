const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, index: true },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  birthday: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  whatsapp: { type: String, trim: true, default: '' },
  educationLevel: { type: String, enum: ['Primary', 'Secondary', 'Tertiary', 'Other', ''], default: '' },
  notes: { type: String, trim: true, default: '' },
  archived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

memberSchema.index({ fullName: 'text', phone: 'text' });
module.exports = mongoose.model('Member', memberSchema);
