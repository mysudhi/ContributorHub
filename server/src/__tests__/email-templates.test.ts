import { describe, it, expect } from "vitest";
import {
  shiftAssignmentEmail,
  shiftSignupConfirmationEmail,
  shiftReminderEmail,
  shiftCancellationEmail,
  taskAssignmentEmail,
} from "../email/templates.js";

const recipient = { firstName: "Alice", lastName: "Smith", email: "alice@example.com" };
const shift = {
  title: "Food Drive",
  description: "Weekly food distribution",
  location: "Community Center",
  startsAt: new Date("2026-10-15T09:00:00Z"),
  endsAt: new Date("2026-10-15T13:00:00Z"),
  capacity: 5,
};

describe("Email Templates", () => {
  describe("shiftAssignmentEmail", () => {
    it("generates assignment email with correct subject", () => {
      const { subject, html } = shiftAssignmentEmail(recipient, shift);
      expect(subject).toBe("You've been assigned to: Food Drive");
      expect(html).toContain("Shift Assignment");
      expect(html).toContain("Alice");
      expect(html).toContain("Food Drive");
      expect(html).toContain("Community Center");
    });

    it("includes app URL when provided", () => {
      const { html } = shiftAssignmentEmail(recipient, shift, "http://localhost:5173");
      expect(html).toContain("http://localhost:5173");
      expect(html).toContain("View Shift Details");
    });

    it("omits location and description when null", () => {
      const minimal = { title: "Test", startsAt: shift.startsAt, endsAt: shift.endsAt };
      const { html } = shiftAssignmentEmail(recipient, minimal);
      expect(html).not.toContain("Location");
      expect(html).not.toContain("Details");
    });
  });

  describe("shiftSignupConfirmationEmail", () => {
    it("generates confirmation email", () => {
      const { subject, html } = shiftSignupConfirmationEmail(recipient, shift);
      expect(subject).toBe("Signup confirmed: Food Drive");
      expect(html).toContain("Signup Confirmation");
      expect(html).toContain("Food Drive");
      expect(html).toContain("Need to cancel?");
    });
  });

  describe("shiftReminderEmail", () => {
    it("generates reminder for 24 hours", () => {
      const { subject, html } = shiftReminderEmail(recipient, shift, 24);
      expect(subject).toContain("Reminder:");
      expect(subject).toContain("Food Drive");
      expect(subject).toContain("1 day(s)");
      expect(html).toContain("Shift Reminder");
    });

    it("generates reminder for 12 hours", () => {
      const { subject } = shiftReminderEmail(recipient, shift, 12);
      expect(subject).toContain("12 hours");
    });

    it("says 'starting soon' for <= 1 hour", () => {
      const { subject } = shiftReminderEmail(recipient, shift, 0.5);
      expect(subject).toContain("starting soon");
    });

    it("says 'in X day(s)' for >= 24 hours", () => {
      const { subject } = shiftReminderEmail(recipient, shift, 48);
      expect(subject).toContain("2 day(s)");
    });
  });

  describe("shiftCancellationEmail", () => {
    it("generates cancellation email", () => {
      const { subject, html } = shiftCancellationEmail(recipient, shift);
      expect(subject).toBe("Shift cancelled: Food Drive");
      expect(html).toContain("Shift Cancelled");
      expect(html).toContain("cancelled");
      expect(html).toContain("Food Drive");
    });
  });

  describe("taskAssignmentEmail", () => {
    it("generates task assignment email", () => {
      const task = { title: "Sort Donations", details: "Sort into categories" };
      const { subject, html } = taskAssignmentEmail(recipient, task, shift);
      expect(subject).toBe("Task assigned: Sort Donations (Food Drive)");
      expect(html).toContain("Task Assignment");
      expect(html).toContain("Sort Donations");
      expect(html).toContain("Sort into categories");
      expect(html).toContain("Food Drive");
    });

    it("omits details when null", () => {
      const task = { title: "Quick Task" };
      const { html } = taskAssignmentEmail(recipient, task, shift);
      expect(html).toContain("Quick Task");
    });
  });

  describe("HTML structure", () => {
    it("all templates include ContributorHub branding", () => {
      const templates = [
        shiftAssignmentEmail(recipient, shift),
        shiftSignupConfirmationEmail(recipient, shift),
        shiftReminderEmail(recipient, shift, 24),
        shiftCancellationEmail(recipient, shift),
        taskAssignmentEmail(recipient, { title: "Task" }, shift),
      ];

      for (const { html } of templates) {
        expect(html).toContain("ContributorHub");
        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain("</html>");
        expect(html).toContain("automated message");
      }
    });
  });
});
