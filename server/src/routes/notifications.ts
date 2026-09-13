import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { adminRequired } from "../middleware/auth.js";
import { getEmailEnabled, verifyConnection } from "../email/email-service.js";
import { sendShiftReminders } from "../email/notification-service.js";
import { isSchedulerRunning } from "../email/reminder-scheduler.js";

export const notificationsRouter = Router();

notificationsRouter.use(authRequired);

notificationsRouter.get("/status", (_req, res) => {
  res.json({
    emailEnabled: getEmailEnabled(),
    schedulerRunning: isSchedulerRunning(),
    smtpHost: process.env.SMTP_HOST || null,
    smtpPort: process.env.SMTP_PORT || "587",
  });
});

notificationsRouter.get("/verify", adminRequired, async (_req, res) => {
  try {
    if (!getEmailEnabled()) {
      res.json({ connected: false, reason: "Email service not configured" });
      return;
    }
    const connected = await verifyConnection();
    res.json({ connected, reason: connected ? "SMTP connection verified" : "Failed to connect to SMTP server" });
  } catch (err) {
    console.error("SMTP verify error:", err);
    res.status(500).json({ error: "Failed to verify SMTP connection" });
  }
});

notificationsRouter.post("/send-reminders", adminRequired, async (_req, res) => {
  try {
    if (!getEmailEnabled()) {
      res.status(400).json({ error: "Email service not configured" });
      return;
    }
    const stats = await sendShiftReminders();
    res.json({ message: "Shift reminders sent", ...stats });
  } catch (err) {
    console.error("Send reminders error:", err);
    res.status(500).json({ error: "Failed to send reminders" });
  }
});
