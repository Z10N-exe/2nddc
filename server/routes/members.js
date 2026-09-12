const router = require('express').Router();
const multer = require('multer');
const Member = require('../models/Member');
const { parseWorkbook, parsePdf, googleExportUrl } = require('../services/memberImport');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const fields = ['fullName', 'phone', 'email', 'gender', 'birthday', 'address', 'whatsapp', 'educationLevel', 'notes'];
const clean = (body) => Object.fromEntries(fields.filter((key) => body[key] !== undefined).map((key) => [key, String(body[key]).trim()]));

router.get('/', async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const query = { archived };
    if (req.query.search) query.$or = [{ fullName: new RegExp(req.query.search, 'i') }, { phone: new RegExp(req.query.search, 'i') }];
    res.json(await Member.find(query).sort({ fullName: 1 }));
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await Member.create(clean(req.body))); } catch (error) { next(error); }
});

router.post('/import', async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.members)) return res.status(400).json({ message: 'members must be an array.' });
    const valid = req.body.members.map(clean).filter((member) => member.fullName);
    const inserted = valid.length ? await Member.insertMany(valid, { ordered: false }) : [];
    res.status(201).json({ imported: inserted.length, skipped: req.body.members.length - valid.length });
  } catch (error) { next(error); }
});

async function saveImport(result) {
  const inserted = result.members.length ? await Member.insertMany(result.members, { ordered: false }) : [];
  return { imported: inserted.length, skipped: result.errors.filter((error) => /Missing required/.test(error.message)).length, warnings: result.errors };
}
router.post('/import/file', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose an Excel, CSV, or PDF file.' });
    const extension = req.file.originalname.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'pdf'].includes(extension)) return res.status(400).json({ message: 'Supported files are .xlsx, .xls, .csv, and .pdf.' });
    const result = extension === 'pdf' ? await parsePdf(req.file.buffer) : parseWorkbook(req.file.buffer);
    res.status(201).json(await saveImport(result));
  } catch (error) { next(error); }
});
router.post('/import/google-sheet', async (req, res, next) => {
  try {
    const response = await fetch(googleExportUrl(req.body.url));
    if (!response.ok) throw new Error('Google Sheets could not be downloaded. Make sure the sheet is shared as Anyone with the link can view.');
    const result = parseWorkbook(Buffer.from(await response.arrayBuffer()));
    res.status(201).json(await saveImport(result));
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, clean(req.body), { new: true, runValidators: true });
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    res.json(member);
  } catch (error) { next(error); }
});

router.patch('/:id/archive', async (req, res, next) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, { archived: req.body.archived !== false }, { new: true });
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    res.json(member);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});
module.exports = router;
