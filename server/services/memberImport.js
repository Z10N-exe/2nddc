const XLSX = require('xlsx');
const pdf = require('pdf-parse');

const aliases = {
  fullName: ['name', 'full name', 'fullname', 'member name'], phone: ['phone', 'phone number', 'mobile', 'telephone'],
  whatsapp: ['whatsapp', 'whatsapp number'], email: ['email', 'email address'], gender: ['gender', 'sex'],
  birthday: ['birthday', 'date of birth', 'dob', 'birth date'], address: ['address', 'home address'],
  educationLevel: ['educational level', 'education level', 'education', 'level of education'], notes: ['notes', 'note', 'remarks']
};
const canonical = (value) => String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
const headerKey = (header) => Object.entries(aliases).find(([, names]) => names.includes(canonical(header)))?.[0];

function birthday(value) {
  const text = String(value || '').trim(); if (!text) return '';
  const numeric = text.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-]\d{2,4})?$/);
  if (numeric) return `${numeric[1].padStart(2, '0')}-${numeric[2].padStart(2, '0')}`;
  const named = text.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+\d{4})?$/i);
  if (named) { const month = ['january','february','march','april','may','june','july','august','september','october','november','december'].findIndex((name) => name.startsWith(named[1].toLowerCase().slice(0, 3))); return month >= 0 ? `${String(month + 1).padStart(2, '0')}-${named[2].padStart(2, '0')}` : ''; }
  return '';
}
function mapRows(rows) {
  const errors = []; const members = rows.map((row, index) => {
    const member = {}; Object.entries(row).forEach(([header, value]) => { const field = headerKey(header); if (field) member[field] = String(value ?? '').trim(); });
    if (!member.fullName) { errors.push({ row: index + 2, message: 'Missing required Name column or name value.' }); return null; }
    if (member.birthday) { const parsed = birthday(member.birthday); if (!parsed) errors.push({ row: index + 2, message: `Birthday '${member.birthday}' could not be read and was left blank.` }); member.birthday = parsed; }
    if (member.gender) { const value = canonical(member.gender); member.gender = value === 'male' ? 'Male' : value === 'female' ? 'Female' : value === 'other' ? 'Other' : ''; if (!member.gender) errors.push({ row: index + 2, message: 'Unrecognised gender was left blank.' }); }
    if (member.educationLevel) { const value = canonical(member.educationLevel); member.educationLevel = value === 'primary' ? 'Primary' : value === 'secondary' ? 'Secondary' : value === 'tertiary' ? 'Tertiary' : value === 'other' ? 'Other' : ''; if (!member.educationLevel) errors.push({ row: index + 2, message: 'Unrecognised education level was left blank.' }); }
    return member;
  }).filter(Boolean);
  return { members, errors };
}
function parseWorkbook(buffer) { const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; return mapRows(XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })); }
async function parsePdf(buffer) {
  const content = (await pdf(buffer)).text.replace(/\r/g, '');
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex((line) => /\b(name|full name|member name)\b/i.test(line) && /\b(phone|gender|email|birthday|dob)\b/i.test(line));
  if (headerIndex < 0) throw new Error('No member-table header was found in this PDF. Use a PDF with selectable text and headings such as Name, Phone, and Birthday.');
  const headers = lines[headerIndex].split(/\s{2,}|\t|\|/).filter(Boolean);
  const rows = lines.slice(headerIndex + 1).filter((line) => !/^page\s+\d+/i.test(line)).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(/\s{2,}|\t|\|/)[index] || ''])));
  return mapRows(rows);
}
function googleExportUrl(value) { const url = new URL(value); const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/); if (!match) throw new Error('Enter a Google Sheets URL.'); const gid = url.searchParams.get('gid') || '0'; return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=xlsx&gid=${gid}`; }
module.exports = { parseWorkbook, parsePdf, googleExportUrl, mapRows };
