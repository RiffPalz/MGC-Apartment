import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { Server } from "socket.io";
import { EventEmitter } from "events";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB, sequelize } from "./config/database.js";

// Routes
import applicationRequestRoutes from "./routes/applicationRequestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";

import adminRoutes from "./routes/admin/adminRoutes.js";
import adminAddTenantRoutes from "./routes/admin/adminAddTenantRoutes.js";
import adminMaintenanceRoutes from "./routes/admin/adminMaintenanceRoutes.js";
import adminContractRoutes from "./routes/admin/adminContractRoutes.js";
import adminPaymentRoutes from "./routes/admin/adminPaymentRoutes.js";
import adminAnnouncementRoutes from "./routes/admin/adminAnnouncementRoutes.js";
import adminApplicationRoutes from "./routes/admin/adminAppRequestRoutes.js";
import adminUnitRoutes from "./routes/admin/adminUnitRoutes.js";

import caretakerRoutes from "./routes/caretaker/caretakerRoute.js";
import caretakerMaintenanceRoutes from "./routes/caretaker/caretakerMaintenanceRoutes.js";
import caretakerPaymentRoutes from "./routes/caretaker/caretakerPaymentRoutes.js";
import caretakerAnnouncementRoutes from "./routes/caretaker/caretakerAnnouncementRoutes.js";

import { configRouter } from "./routes/configRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userMaintenanceRoutes from "./routes/userMaintenanceRoutes.js";
import userContractRoutes from "./routes/userContractRoutes.js";
import userPaymentRoutes from "./routes/userPaymentRoutes.js";
import userAnnouncementRoutes from "./routes/userAnnouncementRoutes.js";

import "./models/index.js";
import runSeeders from "./utils/runSeeders.js";
import { startSystemCron } from "./utils/systemCron.js";

EventEmitter.defaultMaxListeners = 20;

const app = express();
const httpServer = createServer(app);

// 1. Proxy
app.set("trust proxy", 1);

// 2. CORS & Security (Must be BEFORE Rate Limiter)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://mgc-aparment.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 3. Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", generalLimiter);
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/caretaker/login", authLimiter);

// 4. Data Parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// 5. Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isLocalhost = /^https?:\/\/localhost:\d+$/.test(origin);
      if (isLocalhost || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join_role", (role) => socket.join(role));
  socket.on("join_user", (userId) => socket.join(`user_${userId}`));
  socket.on("disconnect", (reason) => console.log(`Client disconnected: ${socket.id} (${reason})`));
  socket.on("connect_error", (error) => console.error(`Socket error: ${error.message}`));
});

// 6. Mount Routes
app.use("/api/applications", applicationRequestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity-logs", activityLogRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/maintenance", adminMaintenanceRoutes);
app.use("/api/admin/tenants", adminAddTenantRoutes);
app.use("/api/admin/contracts", adminContractRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/announcements", adminAnnouncementRoutes);
app.use("/api/admin/applications", adminApplicationRoutes);
app.use("/api/admin/units", adminUnitRoutes);

app.use("/api/caretaker", caretakerRoutes);
app.use("/api/caretaker/maintenance", caretakerMaintenanceRoutes);
app.use("/api/caretaker/payments", caretakerPaymentRoutes);
app.use("/api/caretaker/announcements", caretakerAnnouncementRoutes);

app.use("/api/config", configRouter);

app.use("/api/users", userRoutes);
app.use("/api/users/maintenance", userMaintenanceRoutes);
app.use("/api/users/contracts", userContractRoutes);
app.use("/api/users/payments", userPaymentRoutes);
app.use("/api/users/announcements", userAnnouncementRoutes);

// Health Check
app.get("/", (req, res) => res.send("API is running"));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? "An unexpected internal server error occurred." : err.message
  });
});

// Server Initialization
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  try {
    await connectDB();
    await sequelize.sync({ alter: false });
    console.log("Database synchronized successfully");

    await runSeeders();
    startSystemCron();

    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket ready for real-time notifications`);
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
});

export { io };