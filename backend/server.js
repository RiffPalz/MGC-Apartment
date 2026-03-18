import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { Server } from "socket.io";
import { EventEmitter } from "events";

import { connectDB, sequelize } from "./config/database.js";

// ===================== ROUTES =====================

// Public
import applicationRequestRoutes from "./routes/applicationRequestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";

// Admin
import adminRoutes from "./routes/admin/adminRoutes.js";
import adminAddTenantRoutes from "./routes/admin/adminAddTenantRoutes.js";
import adminMaintenanceRoutes from "./routes/admin/adminMaintenanceRoutes.js";
import adminContractRoutes from "./routes/admin/adminContractRoutes.js";
import adminPaymentRoutes from "./routes/admin/adminPaymentRoutes.js";
import adminAnnouncementRoutes from "./routes/admin/adminAnnouncementRoutes.js";
import adminApplicationRoutes from "./routes/admin/adminAppRequestRoutes.js";

// Caretaker
import caretakerRoutes from "./routes/caretaker/caretakerRoute.js";
import caretakerMaintenanceRoutes from "./routes/caretaker/caretakerMaintenanceRoutes.js";
import caretakerPaymentRoutes from "./routes/caretaker/caretakerPaymentRoutes.js";
import caretakerAnnouncementRoutes from "./routes/caretaker/caretakerAnnouncementRoutes.js";

// Tenant
import userRoutes from "./routes/userRoutes.js";
import userMaintenanceRoutes from "./routes/userMaintenanceRoutes.js";
import userContractRoutes from "./routes/userContractRoutes.js";
import userPaymentRoutes from "./routes/userPaymentRoutes.js";
import userAnnouncementRoutes from "./routes/userAnnouncementRoutes.js";

// Utils
import runSeeders from "./utils/runSeeders.js";
import { startSystemCron } from "./utils/systemCron.js";

// ===================== APP INITIALIZATION =====================
EventEmitter.defaultMaxListeners = 20;

const app = express();
const httpServer = createServer(app);

// ===================== SOCKET.IO =====================
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io accessible inside controllers/services
app.set("io", io);

// ===================== MIDDLEWARE =====================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===================== SOCKET CONNECTION =====================
io.on("connection", (socket) => {

  console.log(`🔌 Client connected: ${socket.id}`);

  /* JOIN ROLE ROOM */
  socket.on("join_role", (role) => {
    socket.join(role);
    console.log(`👤 ${socket.id} joined ${role} room`);
  });

  /* JOIN USER ROOM */
  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 ${socket.id} joined user_${userId}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔴 Client disconnected: ${socket.id} (${reason})`);
  });

  socket.on("connect_error", (error) => {
    console.log(`❌ Socket error: ${error.message}`);
  });

});

// ===================== ROUTES =====================

// Public
app.use("/api/applications", applicationRequestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity-logs", activityLogRoutes);

// Admin
app.use("/api/admin", adminRoutes);
app.use("/api/admin/maintenance", adminMaintenanceRoutes);
app.use("/api/admin/tenants", adminAddTenantRoutes);
app.use("/api/admin/contracts", adminContractRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/announcements", adminAnnouncementRoutes);
app.use("/api/admin/applications", adminApplicationRoutes);

// Caretaker
app.use("/api/caretaker", caretakerRoutes);
app.use("/api/caretaker/maintenance", caretakerMaintenanceRoutes);
app.use("/api/caretaker/payments", caretakerPaymentRoutes);
app.use("/api/caretaker/announcements", caretakerAnnouncementRoutes);

// Tenant
app.use("/api/users", userRoutes);
app.use("/api/users/maintenance", userMaintenanceRoutes);
app.use("/api/users/contracts", userContractRoutes);
app.use("/api/users/payments", userPaymentRoutes);
app.use("/api/users/announcements", userAnnouncementRoutes);

// ===================== HEALTH CHECK =====================
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ===================== GLOBAL ERROR HANDLER =====================
app.use((err, req, res, next) => {

  console.error("❌ Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });

});

// ===================== SERVER START =====================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {

  try {

    await connectDB();

    await sequelize.sync();

    await runSeeders();

    startSystemCron();

    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket ready for real-time notifications`);

  } catch (error) {

    console.error("❌ Server startup failed:", error.message);
    process.exit(1);

  }

});

// Export io for services
export { io };