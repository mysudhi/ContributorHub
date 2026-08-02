interface MobileTabBarProps {
  page: string;
  onNavigate: (page: "dashboard" | "admin") => void;
  isAdmin: boolean;
}

export function MobileTabBar({ page, onNavigate, isAdmin }: MobileTabBarProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-2 py-2 md:hidden"
    >
      <ul className={`grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
        <li>
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            className={`h-11 w-full rounded-md text-sm font-medium ${page === "dashboard" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Shifts
          </button>
        </li>
        {isAdmin && (
          <li>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className={`h-11 w-full rounded-md text-sm font-medium ${page === "admin" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              Admin
            </button>
          </li>
        )}
        <li>
          <button
            type="button"
            className="h-11 w-full rounded-md bg-slate-100 text-sm font-medium text-slate-700"
          >
            Profile
          </button>
        </li>
      </ul>
    </nav>
  );
}
