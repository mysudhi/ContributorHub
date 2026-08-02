import type { AuthUser } from "../../pages/LoginPage";

interface DesktopHeaderProps {
  user: AuthUser | null;
  page: string;
  onNavigate: (page: "dashboard" | "admin") => void;
  onLogout: () => void;
}

export function DesktopHeader({ user, page, onNavigate, onLogout }: DesktopHeaderProps) {
  const isAdmin = user && (user.role === "SuperAdmin" || user.role === "OrgAdmin");

  return (
    <header className="hidden items-center justify-between border-b border-slate-200 px-6 py-4 md:flex">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-slate-900">ContributorHub</h1>
        {user && (
          <nav className="flex gap-1">
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${page === "dashboard" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Shifts
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate("admin")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${page === "admin" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                Admin
              </button>
            )}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {user.firstName} {user.lastName}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {user.role}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
            >
              Sign out
            </button>
          </>
        ) : (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            Org Dashboard
          </span>
        )}
      </div>
    </header>
  );
}
