import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MobileTabBar } from "../components/layout/MobileTabBar";

describe("MobileTabBar", () => {
  it("renders Shifts and Profile tabs", () => {
    render(<MobileTabBar page="dashboard" onNavigate={vi.fn()} isAdmin={false} />);
    expect(screen.getByRole("button", { name: "Shifts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
  });

  it("shows Admin tab for admin users", () => {
    render(<MobileTabBar page="dashboard" onNavigate={vi.fn()} isAdmin={true} />);
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  });

  it("does not show Admin tab for non-admin users", () => {
    render(<MobileTabBar page="dashboard" onNavigate={vi.fn()} isAdmin={false} />);
    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("uses a nav element with aria-label", () => {
    render(<MobileTabBar page="dashboard" onNavigate={vi.fn()} isAdmin={false} />);
    const nav = screen.getByLabelText("Primary navigation");
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe("NAV");
  });

  it("highlights the active page", () => {
    render(<MobileTabBar page="admin" onNavigate={vi.fn()} isAdmin={true} />);
    const adminBtn = screen.getByRole("button", { name: "Admin" });
    expect(adminBtn.className).toContain("bg-blue-600");
  });

  it("calls onNavigate when tab is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<MobileTabBar page="dashboard" onNavigate={onNavigate} isAdmin={true} />);
    await user.click(screen.getByRole("button", { name: "Admin" }));
    expect(onNavigate).toHaveBeenCalledWith("admin");
  });
});
