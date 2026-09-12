require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const memberRoutes = require('./routes/members');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json({ limit: '2mb' }));
app.use('/api/members', memberRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Unexpected server error.' });
});

async function start() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required. Copy .env.example to .env and add your connection string.');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log('MongoDB connected');
  app.listen(port, () => console.log(`DCPRIME is running at http://localhost:${port}`));
}

start().catch((error) => { console.error(error.message); process.exit(1); });
