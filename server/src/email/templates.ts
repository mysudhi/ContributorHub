const BRAND_COLOR = "#2563eb";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f5f7; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .card { background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid ${BRAND_COLOR}; margin-bottom: 24px; }
    .header h1 { color: ${BRAND_COLOR}; font-size: 24px; margin: 0; }
    .header p { color: #6b7280; font-size: 14px; margin: 4px 0 0; }
    h2 { color: #111827; font-size: 20px; margin: 0 0 16px; }
    p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
    .detail-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .detail-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .detail-table td:first-child { color: #6b7280; font-weight: 500; width: 120px; }
    .detail-table td:last-child { color: #111827; }
    .btn { display: inline-block; background: ${BRAND_COLOR}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .footer { text-align: center; padding-top: 24px; margin-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
    .highlight { background: #eff6ff; border-left: 4px solid ${BRAND_COLOR}; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>ContributorHub</h1>
        <p>Contributor Scheduling Platform</p>
      </div>
      ${body}
      <div class="footer">
        <p>This is an automated message from ContributorHub.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export interface ShiftDetails {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
  capacity?: number;
}

export interface RecipientInfo {
  firstName: string;
  lastName: string;
  email: string;
}

export function shiftAssignmentEmail(
  recipient: RecipientInfo,
  shift: ShiftDetails,
  appUrl?: string
): { subject: string; html: string } {
  const subject = `You've been assigned to: ${shift.title}`;
  const html = layout(
    subject,
    `
    <h2>Shift Assignment</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>You have been assigned to the following shift:</p>
    <table class="detail-table">
      <tr><td>Shift</td><td><strong>${shift.title}</strong></td></tr>
      <tr><td>Date</td><td>${formatDate(shift.startsAt)}</td></tr>
      <tr><td>Time</td><td>${formatTime(shift.startsAt)} — ${formatTime(shift.endsAt)}</td></tr>
      ${shift.location ? `<tr><td>Location</td><td>${shift.location}</td></tr>` : ""}
      ${shift.description ? `<tr><td>Details</td><td>${shift.description}</td></tr>` : ""}
    </table>
    ${appUrl ? `<a href="${appUrl}" class="btn">View Shift Details</a>` : ""}
    <p>Please make sure to arrive on time. If you can no longer attend, cancel your signup as soon as possible so someone else can take your spot.</p>
    `
  );
  return { subject, html };
}

export function shiftSignupConfirmationEmail(
  recipient: RecipientInfo,
  shift: ShiftDetails,
  appUrl?: string
): { subject: string; html: string } {
  const subject = `Signup confirmed: ${shift.title}`;
  const html = layout(
    subject,
    `
    <h2>Signup Confirmation</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>You have successfully signed up for the following shift:</p>
    <table class="detail-table">
      <tr><td>Shift</td><td><strong>${shift.title}</strong></td></tr>
      <tr><td>Date</td><td>${formatDate(shift.startsAt)}</td></tr>
      <tr><td>Time</td><td>${formatTime(shift.startsAt)} — ${formatTime(shift.endsAt)}</td></tr>
      ${shift.location ? `<tr><td>Location</td><td>${shift.location}</td></tr>` : ""}
    </table>
    ${appUrl ? `<a href="${appUrl}" class="btn">View My Shifts</a>` : ""}
    <div class="highlight">
      <p><strong>Need to cancel?</strong> You can withdraw from this shift at any time before it starts through the ContributorHub app.</p>
    </div>
    `
  );
  return { subject, html };
}

export function shiftReminderEmail(
  recipient: RecipientInfo,
  shift: ShiftDetails,
  hoursUntilShift: number,
  appUrl?: string
): { subject: string; html: string } {
  const timeLabel =
    hoursUntilShift <= 1
      ? "starting soon"
      : hoursUntilShift < 24
        ? `in ${Math.round(hoursUntilShift)} hours`
        : `in ${Math.round(hoursUntilShift / 24)} day(s)`;

  const subject = `Reminder: ${shift.title} — ${timeLabel}`;
  const html = layout(
    subject,
    `
    <h2>Shift Reminder</h2>
    <p>Hi ${recipient.firstName},</p>
    <div class="highlight">
      <p>Your shift <strong>${shift.title}</strong> is ${timeLabel}!</p>
    </div>
    <table class="detail-table">
      <tr><td>Shift</td><td><strong>${shift.title}</strong></td></tr>
      <tr><td>Date</td><td>${formatDate(shift.startsAt)}</td></tr>
      <tr><td>Time</td><td>${formatTime(shift.startsAt)} — ${formatTime(shift.endsAt)}</td></tr>
      ${shift.location ? `<tr><td>Location</td><td>${shift.location}</td></tr>` : ""}
      ${shift.description ? `<tr><td>Details</td><td>${shift.description}</td></tr>` : ""}
    </table>
    ${appUrl ? `<a href="${appUrl}" class="btn">View Shift Details</a>` : ""}
    <p>If you can no longer attend, please cancel your signup as soon as possible.</p>
    `
  );
  return { subject, html };
}

export function shiftCancellationEmail(
  recipient: RecipientInfo,
  shift: ShiftDetails
): { subject: string; html: string } {
  const subject = `Shift cancelled: ${shift.title}`;
  const html = layout(
    subject,
    `
    <h2>Shift Cancelled</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>The following shift has been <strong>cancelled</strong>:</p>
    <table class="detail-table">
      <tr><td>Shift</td><td><strong>${shift.title}</strong></td></tr>
      <tr><td>Date</td><td>${formatDate(shift.startsAt)}</td></tr>
      <tr><td>Time</td><td>${formatTime(shift.startsAt)} — ${formatTime(shift.endsAt)}</td></tr>
      ${shift.location ? `<tr><td>Location</td><td>${shift.location}</td></tr>` : ""}
    </table>
    <p>You do not need to take any further action. We apologize for any inconvenience.</p>
    `
  );
  return { subject, html };
}

export function taskAssignmentEmail(
  recipient: RecipientInfo,
  task: { title: string; details?: string | null },
  shift: ShiftDetails,
  appUrl?: string
): { subject: string; html: string } {
  const subject = `Task assigned: ${task.title} (${shift.title})`;
  const html = layout(
    subject,
    `
    <h2>Task Assignment</h2>
    <p>Hi ${recipient.firstName},</p>
    <p>You have been assigned a new task:</p>
    <table class="detail-table">
      <tr><td>Task</td><td><strong>${task.title}</strong></td></tr>
      ${task.details ? `<tr><td>Details</td><td>${task.details}</td></tr>` : ""}
      <tr><td>Shift</td><td>${shift.title}</td></tr>
      <tr><td>Date</td><td>${formatDate(shift.startsAt)}</td></tr>
      <tr><td>Time</td><td>${formatTime(shift.startsAt)} — ${formatTime(shift.endsAt)}</td></tr>
    </table>
    ${appUrl ? `<a href="${appUrl}" class="btn">View Task</a>` : ""}
    `
  );
  return { subject, html };
}
