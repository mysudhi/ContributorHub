import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardPage } from "../pages/DashboardPage";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "Contributor"
};

const mockShifts = [
  {
    id: "shift-1", title: "Food Drive", description: "Help distribute food",
    location: "Central Park", startsAt: "2026-06-15T09:00:00Z", endsAt: "2026-06-15T12:00:00Z",
    capacity: 5, status: "OPEN", contributorLinks: []
  },
  {
    id: "shift-2", title: "Shelter Check-In", description: null,
    location: null, startsAt: "2026-06-16T13:00:00Z", endsAt: "2026-06-16T17:00:00Z",
    capacity: 3, status: "OPEN", contributorLinks: [{ userId: "user-1", contributor: { id: "user-1", firstName: "Test", lastName: "User" } }]
  }
];

beforeEach(() => {
  localStorage.setItem("token", "mock-token");
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
    if (url.includes("/my/signups")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ shifts: [mockShifts[1]] })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ shifts: mockShifts })
    });
  }));
});

describe("DashboardPage", () => {
  it("renders a personalized welcome heading", async () => {
    render(<DashboardPage user={mockUser} />);
    expect(screen.getByText("Welcome, Test!")).toBeInTheDocument();
  });

  it("displays the user email and role", () => {
    render(<DashboardPage user={mockUser} />);
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Contributor/)).toBeInTheDocument();
  });

  it("shows Available Shifts and My Shifts tabs", () => {
    render(<DashboardPage user={mockUser} />);
    expect(screen.getByRole("button", { name: /available shifts/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /my shifts/i })).toBeInTheDocument();
  });

  it("loads and displays shift titles", async () => {
    render(<DashboardPage user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText("Food Drive")).toBeInTheDocument();
    });
  });

  it("shows Sign Up button for shifts user hasn't joined", async () => {
    render(<DashboardPage user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText("Sign Up")).toBeInTheDocument();
    });
  });

  it("shows Cancel Signup button for shifts user has joined", async () => {
    render(<DashboardPage user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText("Cancel Signup")).toBeInTheDocument();
    });
  });

  it("switches to My Shifts tab", async () => {
    const user = userEvent.setup();
    render(<DashboardPage user={mockUser} />);
    await waitFor(() => screen.getByText("Food Drive"));
    await user.click(screen.getByRole("button", { name: /my shifts/i }));
    expect(screen.getByText("My Shifts")).toBeInTheDocument();
  });
});
