import { useState, useEffect } from "react";
import { API_BASE } from "../App";
import type { AuthUser } from "./LoginPage";

interface AdminDashboardProps {
  user: AuthUser;
}

interface Analytics {
  overview: {
    totalContributors: number;
    activeContributors: number;
    totalShifts: number;
    totalTasks: number;
    totalSignups: number;
    recentSignups: number;
  };
  shifts: { open: number; filled: number; cancelled: number; draft: number; fillRate: number };
  tasks: { todo: number; inProgress: number; done: number; completionRate: number };
  upcomingShifts: { id: string; title: string; startsAt: string; endsAt: string; capacity: number; signedUp: number; spotsLeft: number }[];
  recentActivity: { id: string; title: string; status: string; createdAt: string }[];
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  FILLED: "bg-blue-100 text-blue-700",
  DRAFT: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-100 text-red-700"
};

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch(`${API_BASE}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading analytics...</p>;
  if (error) return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Welcome back, {user.firstName} — here's an overview of your platform.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Overview</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Contributors" value={data.overview.totalContributors} sub={`${data.overview.activeContributors} active`} />
          <StatCard label="Total Shifts" value={data.overview.totalShifts} sub={`${data.shifts.open} open`} />
          <StatCard label="Total Tasks" value={data.overview.totalTasks} sub={`${data.tasks.done} completed`} />
          <StatCard label="Signups (30 days)" value={data.overview.recentSignups} sub={`${data.overview.totalSignups} all time`} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Shift Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Open</span>
              <span className="font-medium">{data.shifts.open}</span>
            </div>
            <ProgressBar value={data.shifts.open} max={data.overview.totalShifts} color="bg-green-500" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Filled</span>
              <span className="font-medium">{data.shifts.filled}</span>
            </div>
            <ProgressBar value={data.shifts.filled} max={data.overview.totalShifts} color="bg-blue-500" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Draft</span>
              <span className="font-medium">{data.shifts.draft}</span>
            </div>
            <ProgressBar value={data.shifts.draft} max={data.overview.totalShifts} color="bg-slate-400" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Cancelled</span>
              <span className="font-medium">{data.shifts.cancelled}</span>
            </div>
            <ProgressBar value={data.shifts.cancelled} max={data.overview.totalShifts} color="bg-red-400" />
            <p className="pt-2 text-center text-xs text-slate-400">Fill rate: {data.shifts.fillRate}%</p>
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Task Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">To Do</span>
              <span className="font-medium">{data.tasks.todo}</span>
            </div>
            <ProgressBar value={data.tasks.todo} max={data.overview.totalTasks} color="bg-amber-400" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">In Progress</span>
              <span className="font-medium">{data.tasks.inProgress}</span>
            </div>
            <ProgressBar value={data.tasks.inProgress} max={data.overview.totalTasks} color="bg-blue-500" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Done</span>
              <span className="font-medium">{data.tasks.done}</span>
            </div>
            <ProgressBar value={data.tasks.done} max={data.overview.totalTasks} color="bg-green-500" />
            <p className="pt-2 text-center text-xs text-slate-400">Completion rate: {data.tasks.completionRate}%</p>
          </div>
        </section>
      </div>

      {data.upcomingShifts.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming Shifts (Next 7 Days)</h3>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Shift</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Date</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Signups</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Spots Left</th>
                </tr>
              </thead>
              <tbody>
                {data.upcomingShifts.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium">{s.title}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(s.startsAt)}</td>
                    <td className="px-4 py-3">{s.signedUp} / {s.capacity}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.spotsLeft > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {s.spotsLeft > 0 ? `${s.spotsLeft} available` : "Full"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data.recentActivity.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Recently Created Shifts</h3>
          <div className="space-y-2">
            {data.recentActivity.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-slate-400">Created {formatDate(s.createdAt)}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-600"}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
