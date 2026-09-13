import { sendShiftReminders } from "./notification-service.js";
import { getEmailEnabled } from "./email-service.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

const DEFAULT_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_HOURS_BEFORE = 24;

export function startReminderScheduler(
  checkIntervalMs: number = DEFAULT_CHECK_INTERVAL_MS,
  hoursBeforeShift: number = DEFAULT_HOURS_BEFORE
): void {
  if (intervalId) {
    console.log("[Scheduler] Reminder scheduler already running");
    return;
  }

  if (!getEmailEnabled()) {
    console.log("[Scheduler] Email not enabled — shift reminders disabled");
    return;
  }

  console.log(
    `[Scheduler] Starting shift reminder scheduler (interval=${checkIntervalMs / 1000}s, hours_before=${hoursBeforeShift})`
  );

  intervalId = setInterval(async () => {
    try {
      const stats = await sendShiftReminders(hoursBeforeShift);
      if (stats.sent > 0 || stats.failed > 0) {
        console.log(`[Scheduler] Shift reminders: ${stats.sent} sent, ${stats.failed} failed`);
      }
    } catch (err) {
      console.error("[Scheduler] Error running shift reminders:", err);
    }
  }, checkIntervalMs);
}

export function stopReminderScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Scheduler] Reminder scheduler stopped");
  }
}

export function isSchedulerRunning(): boolean {
  return intervalId !== null;
}
