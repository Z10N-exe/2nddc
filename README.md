# DCPRIME Attendance System

Church member and attendance management, powered by Express and MongoDB.

## Run locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB Atlas connection string (or a local MongoDB URI).
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

The API is mounted under `/api`. A health check is available at `/api/health`.
