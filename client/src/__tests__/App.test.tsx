import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "../App";

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(document.querySelector(".min-h-screen")).toBeInTheDocument();
  });

  it("renders the DesktopHeader component", () => {
    render(<App />);
    expect(screen.getByText("ContributorHub")).toBeInTheDocument();
  });

  it("renders the LoginPage when not authenticated", () => {
    render(<App />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("shows the sign-in form by default", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("has the correct layout structure", () => {
    const { container } = render(<App />);
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("mx-auto", "max-w-6xl");
  });
});
