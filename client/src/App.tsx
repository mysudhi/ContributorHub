import { useState, useEffect } from "react";
import { DesktopHeader } from "./components/layout/DesktopHeader";
import { MobileTabBar } from "./components/layout/MobileTabBar";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LoginPage, type AuthUser } from "./pages/LoginPage";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Page = "dashboard" | "admin";

function isAdmin(user: AuthUser) {
  return user.role === "SuperAdmin" || user.role === "OrgAdmin";
}

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const errorFromUrl = params.get("auth_error");

    if (errorFromUrl) {
      setAuthError(errorFromUrl);
      window.history.replaceState({}, "", "/");
      setLoading(false);
      return;
    }

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      window.history.replaceState({}, "", "/");
    }

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) setUser(data.user);
          else localStorage.removeItem("token");
        })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function handleLogin(token: string, authUser: AuthUser) {
    localStorage.setItem("token", token);
    setUser(authUser);
    setAuthError("");
    setPage(isAdmin(authUser) ? "admin" : "dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    setPage("dashboard");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <DesktopHeader user={user} page={page} onNavigate={setPage} onLogout={handleLogout} />
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        {!user ? (
          <LoginPage onLogin={handleLogin} initialError={authError} />
        ) : page === "admin" && isAdmin(user) ? (
          <AdminDashboard user={user} />
        ) : (
          <DashboardPage user={user} />
        )}
      </main>
      {user && <MobileTabBar page={page} onNavigate={setPage} isAdmin={isAdmin(user)} />}
    </div>
  );
}
