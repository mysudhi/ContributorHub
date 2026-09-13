import { HookRegistry } from "../plugins/hook-registry.js";
import {
  notifyShiftAssignment,
  notifyShiftSignupConfirmation,
  notifyShiftCancellation,
  notifyTaskAssignment,
} from "./notification-service.js";

export function registerEmailHooks(hooks: HookRegistry): void {
  hooks.register("onShiftAssigned", async ({ shiftId, userId }) => {
    await notifyShiftAssignment(shiftId, userId);
  });

  hooks.register("onShiftSignup", async ({ shiftId, userId }) => {
    await notifyShiftSignupConfirmation(shiftId, userId);
  });

  hooks.register("onShiftCancelled", async ({ shiftId }) => {
    await notifyShiftCancellation(shiftId);
  });

  hooks.register("onTaskAssigned", async ({ taskId, userId }) => {
    await notifyTaskAssignment(taskId, userId);
  });

  console.log("[Email] Registered email notification hooks");
}
