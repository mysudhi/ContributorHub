import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DesktopHeader } from "../components/layout/DesktopHeader";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  firstName: "Alice",
  lastName: "Smith",
  role: "Contributor"
};

const adminUser = { ...mockUser, role: "OrgAdmin" };

describe("DesktopHeader", () => {
  it("renders the application name", () => {
    render(<DesktopHeader user={null} page="dashboard" onNavigate={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("ContributorHub")).toBeInTheDocument();
  });

  it("shows Org Dashboard badge when not logged in", () => {
    render(<DesktopHeader user={null} page="dashboard" onNavigate={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("Org Dashboard")).toBeInTheDocument();
  });

  it("shows user name when logged in", () => {
    render(<DesktopHeader user={mockUser} page="dashboard" onNavigate={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows Sign out button when logged in", () => {
    render(<DesktopHeader user={mockUser} page="dashboard" onNavigate={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls onLogout when Sign out is clicked", async () => {
    const onLogout = vi.fn();
    const user = userEvent.setup();
    render(<DesktopHeader user={mockUser} page="dashboard" onNavigate={vi.fn()} onLogout={onLogout} />);
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("shows Admin nav tab for admin users", () => {
    render(<DesktopHeader user={adminUser} page="dashboard" onNavigate={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  });

  it("does not show Admin tab for Contributor role", () => {
    render(<DesktopHeader user={mockUser} page="dashboard" onNavigate={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("shows user role badge", () => {
    render(<DesktopHeader user={mockUser} page="dashboard" onNavigate={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("Contributor")).toBeInTheDocument();
  });
});
