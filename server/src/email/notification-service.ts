import { prisma } from "../config/db.js";
import { sendEmail, getEmailEnabled } from "./email-service.js";
import {
  shiftAssignmentEmail,
  shiftSignupConfirmationEmail,
  shiftReminderEmail,
  shiftCancellationEmail,
  taskAssignmentEmail,
  type ShiftDetails,
  type RecipientInfo,
} from "./templates.js";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

export async function notifyShiftAssignment(
  shiftId: string,
  userId: string
): Promise<boolean> {
  if (!getEmailEnabled()) return false;

  try {
    const [user, shift] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } }),
      prisma.shift.findUnique({ where: { id: shiftId }, select: { title: true, description: true, location: true, startsAt: true, endsAt: true, capacity: true } }),
    ]);

    if (!user || !shift) return false;

    const recipient: RecipientInfo = { firstName: user.firstName, lastName: user.lastName, email: user.email };
    const shiftDetails: ShiftDetails = shift;
    const { subject, html } = shiftAssignmentEmail(recipient, shiftDetails, FRONTEND_URL);

    return sendEmail({ to: user.email, subject, html });
  } catch (err) {
    console.error("[Notification] Failed to send shift assignment email:", err);
    return false;
  }
}

export async function notifyShiftSignupConfirmation(
  shiftId: string,
  userId: string
): Promise<boolean> {
  if (!getEmailEnabled()) return false;

  try {
    const [user, shift] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } }),
      prisma.shift.findUnique({ where: { id: shiftId }, select: { title: true, description: true, location: true, startsAt: true, endsAt: true } }),
    ]);

    if (!user || !shift) return false;

    const recipient: RecipientInfo = { firstName: user.firstName, lastName: user.lastName, email: user.email };
    const { subject, html } = shiftSignupConfirmationEmail(recipient, shift, FRONTEND_URL);

    return sendEmail({ to: user.email, subject, html });
  } catch (err) {
    console.error("[Notification] Failed to send signup confirmation email:", err);
    return false;
  }
}

export async function notifyShiftCancellation(shiftId: string): Promise<boolean> {
  if (!getEmailEnabled()) return false;

  try {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: {
        title: true, description: true, location: true, startsAt: true, endsAt: true,
        contributorLinks: {
          include: { contributor: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    if (!shift) return false;

    const results = await Promise.allSettled(
      shift.contributorLinks.map((link) => {
        const recipient: RecipientInfo = link.contributor;
        const { subject, html } = shiftCancellationEmail(recipient, shift);
        return sendEmail({ to: recipient.email, subject, html });
      })
    );

    return results.every((r) => r.status === "fulfilled" && r.value);
  } catch (err) {
    console.error("[Notification] Failed to send shift cancellation emails:", err);
    return false;
  }
}

export async function notifyTaskAssignment(
  taskId: string,
  userId: string
): Promise<boolean> {
  if (!getEmailEnabled()) return false;

  try {
    const [user, task] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } }),
      prisma.task.findUnique({
        where: { id: taskId },
        select: { title: true, details: true, shift: { select: { title: true, description: true, location: true, startsAt: true, endsAt: true } } },
      }),
    ]);

    if (!user || !task || !task.shift) return false;

    const recipient: RecipientInfo = { firstName: user.firstName, lastName: user.lastName, email: user.email };
    const { subject, html } = taskAssignmentEmail(recipient, task, task.shift, FRONTEND_URL);

    return sendEmail({ to: user.email, subject, html });
  } catch (err) {
    console.error("[Notification] Failed to send task assignment email:", err);
    return false;
  }
}

export async function sendShiftReminders(
  hoursBeforeShift: number = 24
): Promise<{ sent: number; failed: number }> {
  if (!getEmailEnabled()) return { sent: 0, failed: 0 };

  const stats = { sent: 0, failed: 0 };

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hoursBeforeShift * 60 * 60 * 1000);
    const windowStart = new Date(now.getTime() + (hoursBeforeShift - 1) * 60 * 60 * 1000);

    const shifts = await prisma.shift.findMany({
      where: {
        deletedAt: null,
        status: { in: ["OPEN", "FILLED"] },
        startsAt: { gte: windowStart, lte: cutoff },
      },
      select: {
        id: true, title: true, description: true, location: true, startsAt: true, endsAt: true,
        contributorLinks: {
          include: { contributor: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    for (const shift of shifts) {
      const hoursUntil = (shift.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      for (const link of shift.contributorLinks) {
        const recipient: RecipientInfo = link.contributor;
        const { subject, html } = shiftReminderEmail(recipient, shift, hoursUntil, FRONTEND_URL);

        const sent = await sendEmail({ to: recipient.email, subject, html });
        if (sent) {
          stats.sent++;
        } else {
          stats.failed++;
        }
      }
    }
  } catch (err) {
    console.error("[Notification] Failed to send shift reminders:", err);
  }

  return stats;
}
