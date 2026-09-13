import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../email/email-service.js", () => ({
  getEmailEnabled: vi.fn(() => true),
}));

vi.mock("../email/notification-service.js", () => ({
  sendShiftReminders: vi.fn(async () => ({ sent: 2, failed: 0 })),
}));

import {
  startReminderScheduler,
  stopReminderScheduler,
  isSchedulerRunning,
} from "../email/reminder-scheduler.js";
import { getEmailEnabled } from "../email/email-service.js";

describe("Reminder Scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopReminderScheduler();
  });

  afterEach(() => {
    stopReminderScheduler();
    vi.useRealTimers();
  });

  it("starts and reports running", () => {
    startReminderScheduler(60000);
    expect(isSchedulerRunning()).toBe(true);
  });

  it("stops and reports not running", () => {
    startReminderScheduler(60000);
    stopReminderScheduler();
    expect(isSchedulerRunning()).toBe(false);
  });

  it("does not start if email is disabled", () => {
    vi.mocked(getEmailEnabled).mockReturnValueOnce(false);
    startReminderScheduler(60000);
    expect(isSchedulerRunning()).toBe(false);
  });

  it("does not start twice", () => {
    startReminderScheduler(60000);
    startReminderScheduler(60000);
    expect(isSchedulerRunning()).toBe(true);
  });
});
