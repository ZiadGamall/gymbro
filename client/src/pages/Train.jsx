import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Plus, ArrowRight, CheckCircle2 } from "lucide-react";

import { loadWorkoutSessions } from "../lib/healthApi";
import { getWeeklyProgress, getHealthState } from "../lib/healthStore";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const todayISO = () => new Date().toISOString().slice(0, 10);

const getLast7Days = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      iso:     d.toISOString().slice(0, 10),
      label:   d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
      isToday: i === 6,
    };
  });
};

const intensityColor = (level) => {
  const map = {
    light:    "text-success",
    moderate: "text-accent",
    high:     "text-warning",
    intense:  "text-warning",
    heavy:    "text-danger",
  };
  return map[level] || "text-secondary";
};

/* ─── Fallback builder — reads from localStorage via healthStore ──────────── */
/*
 * Used only when ALL loadWorkoutSessions() API calls fail.
 * healthStore reflects sessions that were cached locally. It may NOT include
 * sessions logged exclusively via the server (e.g. legacy WorkoutPlanner),
 * so it is treated as a best-effort display only.
 */
const buildFallbackWeekData = (dates) => {
  const storeWeekly  = getWeeklyProgress();           // [{date, workouts, calories}]
  const storeSessions = getHealthState().workouts.sessions;
  const dateSet      = new Set(dates);

  const activeDates = new Set(
    storeWeekly.filter((d) => d.workouts > 0).map((d) => d.date)
  );

  const weekSessions = storeSessions.filter((s) => dateSet.has(s.date));
  const completedCount = weekSessions.filter((s) => s.completed).length;
  const totalMin = weekSessions.reduce(
    (sum, s) => sum + (Number(s.durationMin) || 0),
    0
  );
  const todaySessions = storeSessions.filter(
    (s) => s.date === todayISO()
  );

  return { activeDates, completedCount, totalMin, todaySessions };
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const Train = () => {
  const navigate = useNavigate();

  const days = useMemo(() => getLast7Days(), []);

  /* Weekly activity state — populated from server or fallback */
  const [activeDates,    setActiveDates]    = useState(new Set());
  const [completedCount, setCompletedCount] = useState(0);
  const [totalMin,       setTotalMin]       = useState(0);
  const [todaySessions,  setTodaySessions]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  /* Tracks whether the weekly strip came from the API or the local fallback */
  const [dataSource,     setDataSource]     = useState(null); // "server" | "local"

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    const allDates = days.map((d) => d.iso);
    const today    = todayISO();

    /*
     * Primary strategy — call loadWorkoutSessions() once per day for the last 7.
     * Promise.allSettled means a single failing day does not abort the others.
     * Each call uses the existing healthApi function with no modifications.
     */
    Promise.allSettled(allDates.map((date) => loadWorkoutSessions(date)))
      .then((results) => {
        /*
         * Determine how many days returned real data.
         * A result is considered "fulfilled with data" if the promise resolved
         * (status === "fulfilled") — even an empty array counts as server data.
         * Reject means the request failed (network error, 404, 401, etc.).
         */
        const fulfilledCount = results.filter(
          (r) => r.status === "fulfilled"
        ).length;

        if (fulfilledCount > 0) {
          /* ── Server data available ── */
          const sessionsByDate = {};
          results.forEach((result, i) => {
            sessionsByDate[allDates[i]] =
              result.status === "fulfilled" ? (result.value || []) : [];
          });

          /* Days that have at least one session (any completion status) */
          const active = new Set(
            Object.entries(sessionsByDate)
              .filter(([, sessions]) => sessions.length > 0)
              .map(([date]) => date)
          );

          /* Flatten all sessions for weekly totals */
          const allWeekSessions = Object.values(sessionsByDate).flat();

          setActiveDates(active);
          setCompletedCount(allWeekSessions.filter((s) => s.completed).length);
          setTotalMin(
            allWeekSessions.reduce(
              (sum, s) => sum + (Number(s.durationMin) || 0),
              0
            )
          );
          /* Today's sessions come from the resolved result for today */
          setTodaySessions(sessionsByDate[today] || []);
          setDataSource("server");
        } else {
          /*
           * All 7 API calls rejected — fall back to healthStore (localStorage).
           * This path is reached when the server is unreachable or when there
           * is a routing mismatch between the API client and the server.
           */
          const fb = buildFallbackWeekData(allDates);
          setActiveDates(fb.activeDates);
          setCompletedCount(fb.completedCount);
          setTotalMin(fb.totalMin);
          setTodaySessions(fb.todaySessions);
          setDataSource("local");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, days]);

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="page-shell">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <header className="px-4 pt-12 pb-6 flex items-end justify-between">
        <div>
          <p className="font-body text-[12px] text-tertiary uppercase tracking-wider mb-1">
            Training
          </p>
          <h1 className="font-display text-[26px] font-bold text-primary tracking-tight">
            Train
          </h1>
        </div>
        <Link
          to="/splits"
          className="btn-ghost flex items-center gap-2"
          aria-label="Browse splits"
        >
          Splits
        </Link>
        <Link
          to="/workouts"
          className="btn-ghost flex items-center gap-2"
          aria-label="Log workout"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          New
        </Link>
      </header>

      <div className="px-4 flex flex-col gap-5">

        {/* ── Weekly activity card ────────────────────────────────────── */}
        <section className="card-surface" aria-labelledby="week-title">
          <div className="flex items-center justify-between mb-4">
            <p
              id="week-title"
              className="section-title"
              style={{ marginBottom: 0 }}
            >
              This Week
            </p>

            <div className="flex items-center gap-2">
              {completedCount > 0 && (
                <span className="font-body text-[11px] text-success font-medium">
                  {completedCount} completed
                </span>
              )}
              {/* Low-key indicator when showing cached data */}
              {dataSource === "local" && !loading && (
                <span
                  className="font-body text-[10px] text-tertiary"
                  title="Showing locally cached data — server unavailable"
                >
                  (cached)
                </span>
              )}
            </div>
          </div>

          {/* 7-day dot strip */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-[6px]"
                >
                  <div className="w-8 h-8 rounded-full bg-elevated animate-pulse" />
                  <div className="w-5 h-[8px] rounded bg-elevated animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 mb-4">
              {days.map(({ iso, label, isToday }) => {
                const active = activeDates.has(iso);
                return (
                  <div key={iso} className="flex flex-col items-center gap-[6px]">
                    {/* Circle dot */}
                    <div
                      className={[
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        active
                          ? "bg-accent"
                          : isToday
                          ? "bg-elevated border border-border"
                          : "bg-elevated",
                      ].join(" ")}
                      aria-label={`${label}: ${active ? "session logged" : "no session"}`}
                    >
                      {active ? (
                        <CheckCircle2
                          className="w-4 h-4 text-canvas"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <span
                          className={`w-[6px] h-[6px] rounded-full ${
                            isToday ? "bg-border" : "bg-surface"
                          }`}
                        />
                      )}
                    </div>

                    {/* Day label */}
                    <span
                      className={`font-body text-[10px] leading-none ${
                        isToday ? "text-accent font-semibold" : "text-tertiary"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Weekly totals */}
          <div className="flex items-center gap-6 pt-3 border-t border-border">
            <div>
              <p className="font-mono text-[20px] font-bold text-primary leading-none">
                {loading ? "–" : completedCount}
              </p>
              <p className="font-body text-[10px] text-tertiary mt-[3px] uppercase tracking-wide">
                Sessions
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="font-mono text-[20px] font-bold text-primary leading-none">
                {loading ? "–" : totalMin}
              </p>
              <p className="font-body text-[10px] text-tertiary mt-[3px] uppercase tracking-wide">
                Minutes
              </p>
            </div>
            {!loading && completedCount === 0 && (
              <p className="font-body text-[12px] text-tertiary ml-auto">
                No sessions yet this week.
              </p>
            )}
          </div>
        </section>

        {/* ── Today's sessions ────────────────────────────────────────── */}
        <section aria-labelledby="today-title">
          <p
            id="today-title"
            className="section-title"
          >
            Today
          </p>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[56px] rounded-lg bg-elevated animate-pulse"
                />
              ))}
            </div>
          ) : todaySessions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {todaySessions.map((s) => (
                <div key={s._id || s.id} className="session-row">
                  <Dumbbell
                    className={`w-[18px] h-[18px] flex-shrink-0 ${intensityColor(
                      s.intensity
                    )}`}
                    strokeWidth={2}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13.5px] font-medium text-primary truncate">
                      {s.planName}
                    </p>
                    <p className="font-body text-[11px] text-tertiary mt-[2px]">
                      {s.durationMin}&thinsp;min
                      {s.intensity ? ` · ${s.intensity}` : ""}
                    </p>
                  </div>
                  {s.completed && (
                    <CheckCircle2
                      className="w-4 h-4 text-success flex-shrink-0"
                      strokeWidth={2}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="card-surface">
              <div className="empty-state">
                <Dumbbell className="empty-state-icon" strokeWidth={1.5} />
                <p className="empty-state-title">Nothing logged today</p>
                <p className="empty-state-body">
                  Log a session in the Workout Logger — it will appear here
                  automatically.
                </p>
                <Link
                  to="/workouts"
                  className="btn-ghost mt-2 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  Log a session
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── CTA bridge to Workout Logger ─────────────────────────────── */}
        <div className="card-elevated flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-[14px] font-semibold text-primary">
              Workout Logger
            </p>
            <p className="font-body text-[11px] text-secondary mt-[2px] truncate">
              Log sets, track history, finish sessions
            </p>
          </div>
          <Link
            to="/workouts"
            className="btn-filled flex items-center gap-2 flex-shrink-0"
            aria-label="Open Workout Logger"
          >
            Open
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>

        {/* ── CTA bridge to Exercise Library ─────────────────────────────── */}
        <div className="card-elevated flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-[14px] font-semibold text-primary">
              Exercise Library
            </p>
            <p className="font-body text-[11px] text-secondary mt-[2px] truncate">
              Browse exercises, view animations, and read instructions
            </p>
          </div>
          <Link
            to="/exercise-search"
            className="btn-ghost flex items-center gap-2 flex-shrink-0 text-[var(--neon-blue)]"
            aria-label="Open Exercise Library"
          >
            Explore
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Train;
