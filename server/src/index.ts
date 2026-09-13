import { createApp } from "./app.js";
import { initEmailService } from "./email/email-service.js";
import { startReminderScheduler } from "./email/reminder-scheduler.js";

const app = createApp();
const port = Number(process.env.PORT ?? 4000);

initEmailService();
startReminderScheduler();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`ContributorHub API listening on port ${port}`);
});
