import { describe, it, expect, vi } from "vitest";
import { HookRegistry } from "../plugins/hook-registry.js";

describe("HookRegistry", () => {
  it("can be instantiated", () => {
    const registry = new HookRegistry();
    expect(registry).toBeInstanceOf(HookRegistry);
  });

  it("dispatches onShiftCreated to registered handlers", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn();

    registry.register("onShiftCreated", handler);
    await registry.dispatch("onShiftCreated", {
      shiftId: "shift-1",
      organizationId: "org-1"
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      shiftId: "shift-1",
      organizationId: "org-1"
    });
  });

  it("dispatches onContributorApplied to registered handlers", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn();

    registry.register("onContributorApplied", handler);
    await registry.dispatch("onContributorApplied", {
      shiftId: "shift-1",
      userId: "user-1",
      organizationId: "org-1"
    });

    expect(handler).toHaveBeenCalledWith({
      shiftId: "shift-1",
      userId: "user-1",
      organizationId: "org-1"
    });
  });

  it("supports multiple handlers for the same hook", async () => {
    const registry = new HookRegistry();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    registry.register("onShiftCreated", handler1);
    registry.register("onShiftCreated", handler2);

    await registry.dispatch("onShiftCreated", {
      shiftId: "shift-1",
      organizationId: "org-1"
    });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("calls handlers in registration order", async () => {
    const registry = new HookRegistry();
    const order: number[] = [];

    registry.register("onShiftCreated", async () => { order.push(1); });
    registry.register("onShiftCreated", async () => { order.push(2); });
    registry.register("onShiftCreated", async () => { order.push(3); });

    await registry.dispatch("onShiftCreated", {
      shiftId: "shift-1",
      organizationId: "org-1"
    });

    expect(order).toEqual([1, 2, 3]);
  });

  it("does not call handlers for unrelated hooks", async () => {
    const registry = new HookRegistry();
    const shiftHandler = vi.fn();
    const volunteerHandler = vi.fn();

    registry.register("onShiftCreated", shiftHandler);
    registry.register("onContributorApplied", volunteerHandler);

    await registry.dispatch("onShiftCreated", {
      shiftId: "shift-1",
      organizationId: "org-1"
    });

    expect(shiftHandler).toHaveBeenCalledOnce();
    expect(volunteerHandler).not.toHaveBeenCalled();
  });

  it("handles dispatch with no registered handlers", async () => {
    const registry = new HookRegistry();
    await expect(
      registry.dispatch("onShiftCreated", {
        shiftId: "shift-1",
        organizationId: "org-1"
      })
    ).resolves.toBeUndefined();
  });

  it("handles async handlers correctly", async () => {
    const registry = new HookRegistry();
    let result = "";

    registry.register("onShiftCreated", async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      result += "first";
    });
    registry.register("onShiftCreated", async () => {
      result += "-second";
    });

    await registry.dispatch("onShiftCreated", {
      shiftId: "shift-1",
      organizationId: "org-1"
    });

    expect(result).toBe("first-second");
  });

  it("dispatches onShiftAssigned", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn();
    registry.register("onShiftAssigned", handler);
    await registry.dispatch("onShiftAssigned", { shiftId: "s1", userId: "u1" });
    expect(handler).toHaveBeenCalledWith({ shiftId: "s1", userId: "u1" });
  });

  it("dispatches onShiftCancelled", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn();
    registry.register("onShiftCancelled", handler);
    await registry.dispatch("onShiftCancelled", { shiftId: "s1" });
    expect(handler).toHaveBeenCalledWith({ shiftId: "s1" });
  });

  it("dispatches onTaskAssigned", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn();
    registry.register("onTaskAssigned", handler);
    await registry.dispatch("onTaskAssigned", { taskId: "t1", userId: "u1" });
    expect(handler).toHaveBeenCalledWith({ taskId: "t1", userId: "u1" });
  });

  it("dispatches onShiftSignup", async () => {
    const registry = new HookRegistry();
    const handler = vi.fn();
    registry.register("onShiftSignup", handler);
    await registry.dispatch("onShiftSignup", { shiftId: "s1", userId: "u1" });
    expect(handler).toHaveBeenCalledWith({ shiftId: "s1", userId: "u1" });
  });
});
