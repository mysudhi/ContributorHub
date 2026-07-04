import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../App";
import type { AuthUser } from "./LoginPage";

interface DashboardPageProps {
  user: AuthUser;
}

interface Shift {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: string;
  contributorLinks: { userId: string; contributor: { id: string; firstName: string; lastName: string } }[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export function DashboardPage({ user }: DashboardPageProps) {
  const [tab, setTab] = useState<"available" | "my">("available");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token") || "";

  const fetchShifts = useCallback(async () => {
    try {
      const [availRes, myRes] = await Promise.all([
        fetch(`${API_BASE}/api/shifts?status=OPEN`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/shifts/my/signups`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (availRes.ok) {
        const data = await availRes.json();
        setShifts(data.shifts);
      }
      if (myRes.ok) {
        const data = await myRes.json();
        setMyShifts(data.shifts);
      }
    } catch {
      setMessage("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  async function handleSignup(shiftId: string) {
    setActionLoading(shiftId);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/shifts/${shiftId}/signup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Signup failed");
      } else {
        setMessage("Signed up successfully!");
        await fetchShifts();
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(shiftId: string) {
    setActionLoading(shiftId);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/shifts/${shiftId}/signup`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) {
        setMessage("Signup cancelled");
        await fetchShifts();
      } else {
        const data = await res.json();
        setMessage(data.error || "Cancel failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  const isSignedUp = (shift: Shift) =>
    shift.contributorLinks?.some((l) => l.userId === user.id || l.contributor?.id === user.id);

  const spotsLeft = (shift: Shift) =>
    shift.capacity - (shift.contributorLinks?.length || 0);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Welcome, {user.firstName}!</h2>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {user.email} · Role: {user.role}
        </p>
      </section>

      {message && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700" role="status">
          {message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("available")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "available" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200"}`}
        >
          Available Shifts
        </button>
        <button
          type="button"
          onClick={() => setTab("my")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "my" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200"}`}
        >
          My Shifts ({myShifts.length})
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading shifts...</p>
      ) : tab === "available" ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Available Shifts</h2>
          {shifts.length === 0 ? (
            <p className="text-sm text-slate-500">No open shifts available right now.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shifts.map((shift) => (
                <article key={shift.id} className="rounded-xl bg-white p-4 shadow-sm">
                  <h3 className="text-base font-medium">{shift.title}</h3>
                  {shift.description && <p className="mt-1 text-sm text-slate-500">{shift.description}</p>}
                  <p className="mt-2 text-sm text-slate-600">{formatTime(shift.startsAt)} — {formatTime(shift.endsAt)}</p>
                  {shift.location && <p className="text-sm text-slate-500">{shift.location}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {spotsLeft(shift)} of {shift.capacity} spot{shift.capacity > 1 ? "s" : ""} left
                  </p>
                  <div className="mt-3">
                    {isSignedUp(shift) ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(shift.id)}
                        disabled={actionLoading === shift.id}
                        className="h-9 w-full rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {actionLoading === shift.id ? "Cancelling..." : "Cancel Signup"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSignup(shift.id)}
                        disabled={actionLoading === shift.id || spotsLeft(shift) <= 0}
                        className="h-9 w-full rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoading === shift.id ? "Signing up..." : "Sign Up"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          <h2 className="mb-4 text-lg font-semibold">My Shifts</h2>
          {myShifts.length === 0 ? (
            <p className="text-sm text-slate-500">You haven't signed up for any shifts yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myShifts.map((shift) => (
                <article key={shift.id} className="rounded-xl bg-white p-4 shadow-sm border-l-4 border-blue-500">
                  <h3 className="text-base font-medium">{shift.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{formatTime(shift.startsAt)} — {formatTime(shift.endsAt)}</p>
                  {shift.location && <p className="text-sm text-slate-500">{shift.location}</p>}
                  <p className="mt-1 text-xs text-slate-400">Status: {shift.status}</p>
                  <button
                    type="button"
                    onClick={() => handleCancel(shift.id)}
                    disabled={actionLoading === shift.id}
                    className="mt-3 h-9 w-full rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionLoading === shift.id ? "Cancelling..." : "Cancel Signup"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
