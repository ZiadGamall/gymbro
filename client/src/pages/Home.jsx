import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  ArrowRight,
  Brain,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  Orbit,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import axios from "axios";
import { parseUserResponse, loadWorkoutSessions, loadNutritionSummary, loadWeeklyProgress, getRecoveryRecommendation } from "../lib/healthApi";
import SmartWatchSimulator from "../lib/smartWatch";

const riseUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const heroStats = [
  { value: "~3s", label: "AI Response Time", tone: "var(--neon-blue)" },
  { value: "100+", label: "Exercises Catalog", tone: "var(--neon-green)" },
  { value: "24/7", label: "Smart Coaching", tone: "#f97316" },
  { value: "100%", label: "Real-time Sync", tone: "#22d3ee" },
];

const storytellingSteps = [
  {
    icon: Brain,
    step: "01",
    title: "AI Reads Your Reality",
    description:
      "Goals, schedule, energy, and training history become one adaptive profile in seconds.",
  },
  {
    icon: Target,
    step: "02",
    title: "Precision Plan Generation",
    description:
      "Workouts and meals are generated as one system, not disconnected lists.",
  },
  {
    icon: Orbit,
    step: "03",
    title: "Momentum Feedback Loop",
    description:
      "Progress signals, streaks, and performance insights keep your next best action obvious.",
  },
];

const features = [
  {
    icon: Zap,
    title: "AI Workout Generator",
    desc: "Generate adaptive routines by goal, equipment, training split, and recovery state.",
    bullets: ["Smart warmups", "Progressive overload", "Muscle priority logic"],
  },
  {
    icon: Flame,
    title: "AI Nutrition Engine",
    desc: "Create dynamic diet plans with macro targets, meal timing, and calorie periodization.",
    bullets: ["Daily macro automation", "Food substitutions", "Weekly calorie cycling"],
  },
  {
    icon: Trophy,
    title: "Gamified Progress",
    desc: "Turn consistency into levels, badges, streak rewards, and measurable long-term behavior change.",
    bullets: ["Streak shielding", "Milestone rewards", "Performance quests"],
  },
  {
    icon: HeartPulse,
    title: "Health-Aware Insights",
    desc: "See readiness, fatigue, and adherence in one premium dashboard with actionable recommendations.",
    bullets: ["Recovery score", "Training readiness", "Weekly trend intelligence"],
  },
];

const testimonials = [
  {
    quote:
      "GymBro made my training feel like a product, not a spreadsheet. I hit 4 months of consistency for the first time.",
    name: "Maya Torres",
    role: "Hybrid Athlete",
  },
  {
    quote:
      "The way workouts and nutrition sync is unreal. It feels like having a performance coach in my pocket.",
    name: "Ibrahim Rahman",
    role: "Body Recomposition Client",
  },
  {
    quote:
      "The muscle targeting visuals helped me fix weak points fast. My sessions are now focused and intentional.",
    name: "Noah Bennett",
    role: "Strength Trainee",
  },
];



const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [me, setMe] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const [workoutPercent, setWorkoutPercent] = useState(86);
  const [sessionName, setSessionName] = useState("Push + Core");
  const [sessionDesc, setSessionDesc] = useState("54 mins, 7 movements");
  const [recoveryStatus, setRecoveryStatus] = useState("Ready");
  const [recoveryDesc, setRecoveryDesc] = useState("Sleep and hydration aligned");

  const location = useLocation();
  const heroCardRef = useRef(null);
  const sectionRefs = useRef([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (!token) {
      setMe(null);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await axios.get("/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = parseUserResponse(res);
        setMe(user);

        try {
          const today = new Date().toISOString().slice(0, 10);
          const [todayWorkouts, todayTotals, weeklyProgress] = await Promise.all([
            loadWorkoutSessions(today),
            loadNutritionSummary(today),
            loadWeeklyProgress(),
          ]);

          let activeDays = 0;
          if (Array.isArray(weeklyProgress)) {
            activeDays = weeklyProgress.filter(d => Number(d.workouts || d.completedWorkouts || 0) > 0).length;
          }
          const weeklyPercent = Math.min(100, Math.round((activeDays / 4) * 100));
          setWorkoutPercent(weeklyPercent);

          if (todayWorkouts && todayWorkouts.length > 0) {
            const lastSession = todayWorkouts[0];
            setSessionName(lastSession.planName || "Workout");
            setSessionDesc(`${lastSession.durationMin} mins, ${lastSession.intensity} intensity`);
          } else {
            setSessionName("Rest Day");
            setSessionDesc("No workouts logged today");
          }

          setRecoveryStatus("Syncing...");
          setRecoveryDesc("Requesting smartwatch telemetry...");

          try {
            // Only try if user has set a gender/DOB which is required by the recovery endpoint
            if (!user.gender || !user.dateOfBirth) {
              throw new Error("Missing profile info");
            }
            const watchData = await SmartWatchSimulator.syncData();
            const rec = await getRecoveryRecommendation(watchData);
            if (rec && rec.recommendation) {
              setRecoveryStatus(rec.recommendation);
              setRecoveryDesc(rec.message || "Ready for training.");
            } else {
              throw new Error("No recommendation returned");
            }
          } catch (err) {
            // Fallback to basic nutrition checking if AI fails or profile is incomplete
            if (todayTotals && todayTotals.calories > 0) {
              setRecoveryStatus("Fueling");
              setRecoveryDesc(`${Math.round(todayTotals.calories)} kcal logged today`);
            } else {
              setRecoveryStatus("Pending");
              setRecoveryDesc(user.gender && user.dateOfBirth ? "AI service unavailable" : "Complete profile for AI recovery");
            }
          }
        } catch (e) {
          console.error("Failed to load dashboard stats for home", e);
        }
      } catch {
        setMe(null);
        setIsLoggedIn(false);
      }
    };

    fetchMe();
  }, [location]);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = setInterval(() => {
      setActiveTestimonial((idx) => (idx + 1) % testimonials.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return undefined;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const localTriggers = [];
    sectionRefs.current.forEach((section) => {
      if (!section) return;
      const tween = gsap.fromTo(
        section,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            once: true,
          },
        }
      );
      if (tween.scrollTrigger) localTriggers.push(tween.scrollTrigger);
    });

    return () => {
      cancelAnimationFrame(rafId);
      localTriggers.forEach((trigger) => trigger.kill());
      lenis.destroy();
    };
  }, [reduceMotion]);

  const welcomeName = useMemo(() => {
    if (!me) return "Athlete";
    return me.firstName || me.username || "Athlete";
  }, [me]);

  const handleTilt = (event) => {
    if (reduceMotion || !heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (x - 0.5) * 10, y: (0.5 - y) * 10 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-cinematic-noise opacity-35" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-cinematic-grid opacity-25" aria-hidden="true" />

      <section className="relative px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28 lg:pt-12">
        <div className="pointer-events-none absolute left-1/2 top-[-14rem] -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(25,232,255,0.18)_0%,rgba(25,232,255,0)_70%)]" />
        <div className="pointer-events-none absolute right-[8%] top-[8rem] -z-10 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(28,255,153,0.2)_0%,rgba(28,255,153,0)_68%)]" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]"
        >
          <motion.div variants={riseUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] backdrop-blur-xl sm:text-sm">
              <Sparkles className="h-4 w-4 text-[var(--neon-blue)]" />
              AI Performance System 2026
            </div>

            <h1 className="mt-8 max-w-4xl font-display text-5xl font-bold leading-[0.88] text-white sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
              Build Your
              <span className="block text-gradient-neon">Future Physique</span>
              <span className="block text-[#d8e4ff]">With Cinematic AI Coaching</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
              {isLoggedIn
                ? `Welcome back, ${welcomeName}. Your workout, nutrition, and recovery loops are synchronized and ready.`
                : "A premium AI fitness operating system for training, nutrition, analytics, and transformation at startup-grade product quality."}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to={isLoggedIn ? "/dashboard" : "/register"}
                className="btn-neon-primary px-8 py-4 text-base"
              >
                {isLoggedIn ? "Enter Command Center" : "Start Your Transformation"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to={isLoggedIn ? "/workouts" : "/food-search"}
                className="btn-neon-ghost px-8 py-4 text-base"
              >
                Explore the AI Experience
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            <motion.div
              variants={stagger}
              className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {heroStats.map((item) => (
                <motion.div key={item.label} variants={riseUp} className="card-neon p-5">
                  <div className="text-3xl font-bold" style={{ color: item.tone }}>
                    {item.value}
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-tertiary)]">{item.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            variants={riseUp}
            className="relative"
            ref={heroCardRef}
            onMouseMove={handleTilt}
            onMouseLeave={resetTilt}
          >
            <motion.div
              style={
                reduceMotion
                  ? undefined
                  : {
                      transform: `perspective(1200px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                    }
              }
              className="card-glass-premium relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_20%,rgba(25,232,255,0.22),transparent_36%),radial-gradient(circle_at_20%_82%,rgba(28,255,153,0.16),transparent_35%)]" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                    AI Control Center
                  </p>
                  <span className="rounded-full border border-[var(--neon-blue)]/40 bg-[var(--neon-blue)]/15 px-3 py-1 text-xs font-semibold text-[var(--neon-blue)]">
                    Real-time
                  </span>
                </div>

                <h2 className="mt-4 font-display text-3xl font-bold text-white">
                  Daily Intelligence Briefing
                </h2>

                <div className="mt-7 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                      <span>Weekly Consistency</span>
                      <span className="font-semibold text-[var(--neon-green)]">{workoutPercent}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${workoutPercent}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-2 rounded-full bg-gradient-to-r from-[var(--neon-green)] to-[var(--neon-blue)]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#0a1324]/90 p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                        Focus Session
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-white truncate" title={sessionName}>{sessionName}</div>
                      <div className="mt-2 text-sm text-[var(--text-secondary)] truncate">{sessionDesc}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0a1324]/90 p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                        Recovery Index
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-[var(--neon-green)]">{recoveryStatus}</div>
                      <div className="mt-2 text-sm text-[var(--text-secondary)] truncate">{recoveryDesc}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="card-neon absolute -bottom-8 left-3 hidden max-w-[17rem] p-4 sm:block"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--neon-blue)]/15 text-[var(--neon-blue)]">
                  <Dumbbell className="h-5 w-5" />
                </div>
                Dynamic workout generation
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                Adapts recommendations based on adherence, effort, and fatigue markers.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section
        className="px-4 py-20 sm:px-6 lg:px-8"
        ref={(el) => {
          sectionRefs.current[0] = el;
        }}
      >
        <motion.div
          className="mx-auto max-w-7xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div variants={riseUp} className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--neon-blue)]">Scroll Story</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">
              From Intent to Transformation in Three Intelligent Loops
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {storytellingSteps.map((step) => {
              const Icon = step.icon;
              return (
                <motion.article key={step.title} variants={riseUp} className="card-glass-premium rounded-[1.8rem] p-7">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                      Step {step.step}
                    </span>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[var(--neon-blue)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 leading-7 text-[var(--text-secondary)]">{step.description}</p>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section
        className="px-4 py-20 sm:px-6 lg:px-8"
        ref={(el) => {
          sectionRefs.current[1] = el;
        }}
      >
        <motion.div
          className="mx-auto max-w-7xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div variants={riseUp} className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--neon-green)]">Feature Matrix</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">
              Product Modules Built for Relentless Consistency
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={riseUp} className="card-glass-premium rounded-[1.8rem] p-7">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[var(--neon-blue)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="mt-4 leading-7 text-[var(--text-secondary)]">{feature.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {feature.bullets.map((bullet) => (
                      <span
                        key={bullet}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]"
                      >
                        <Check className="h-3.5 w-3.5 text-[var(--neon-green)]" />
                        {bullet}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section
        className="px-4 py-20 sm:px-6 lg:px-8"
        ref={(el) => {
          sectionRefs.current[2] = el;
        }}
      >
        <motion.div
          className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div variants={riseUp} className="card-glass-premium rounded-[2rem] p-8 sm:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--neon-blue)]">Athlete Voice</p>
            <motion.blockquote
              key={activeTestimonial}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="mt-6 text-xl leading-9 text-[#dce8ff] sm:text-2xl"
            >
              "{testimonials[activeTestimonial].quote}"
            </motion.blockquote>
            <div className="mt-6">
              <div className="text-lg font-semibold text-white">{testimonials[activeTestimonial].name}</div>
              <div className="text-sm text-[var(--text-secondary)]">{testimonials[activeTestimonial].role}</div>
            </div>
            <div className="mt-7 flex gap-2">
              {testimonials.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeTestimonial ? "w-9 bg-[var(--neon-blue)]" : "w-2.5 bg-white/20"
                  }`}
                  aria-label={`View testimonial from ${item.name}`}
                />
              ))}
            </div>
          </motion.div>

          <motion.div variants={riseUp} className="card-neon rounded-[2rem] p-8 sm:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--neon-green)]">System Performance</p>
            <h3 className="mt-4 font-display text-3xl font-bold text-white">Core Engine Metrics</h3>
            <div className="mt-8 space-y-5">
              {[
                { name: "AI Plan Accuracy", val: 95 },
                { name: "Vision Tracking Precision", val: 92 },
                { name: "Data Synchronization", val: 100 },
              ].map((metric) => (
                <div key={metric.name}>
                  <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                    <span>{metric.name}</span>
                    <span className="font-semibold text-white">{metric.val}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${metric.val}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-2 rounded-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-green)]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--neon-green)]/30 bg-[var(--neon-green)]/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-[var(--neon-green)]">
              <Star className="h-4 w-4" />
              Built with state-of-the-art ML models
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section
        className="px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-28"
        ref={(el) => {
          sectionRefs.current[3] = el;
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl"
        >
          <div className="relative overflow-hidden rounded-[2.2rem] border border-white/15 bg-[linear-gradient(125deg,rgba(7,18,34,0.95)_0%,rgba(4,24,39,0.92)_60%,rgba(7,18,34,0.95)_100%)] px-6 py-12 shadow-[0_30px_100px_rgba(3,8,16,0.55)] sm:px-10 lg:px-14">
            <div className="pointer-events-none absolute -right-14 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(25,232,255,0.32)_0%,rgba(25,232,255,0)_70%)]" />
            <div className="pointer-events-none absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(28,255,153,0.28)_0%,rgba(28,255,153,0)_72%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-[var(--neon-green)]">Final Call</p>
                <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold text-white sm:text-5xl">
                  {isLoggedIn
                    ? "Lock in your next streak and execute with intent."
                    : "The AI fitness ecosystem is ready. Build your edge now."}
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
                  {isLoggedIn
                    ? "Open your dashboard, accept your next challenge, and continue compounding progress."
                    : "Join a premium product experience where workouts, nutrition, and analytics behave like one intelligent system."}
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:min-w-[15rem]">
                <Link
                  to={isLoggedIn ? "/dashboard" : "/register"}
                  className="btn-neon-primary w-full px-6 py-3.5"
                >
                  {isLoggedIn ? "Open Dashboard" : "Create Free Account"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to={isLoggedIn ? "/muscle-lab" : "/login"}
                  className="btn-neon-ghost w-full px-6 py-3.5"
                >
                  {isLoggedIn ? "Open Muscle Lab" : "Sign In"}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center">
              <img src="/gymbro-logo.png" alt="GymBro" className="h-full w-full object-contain scale-[1.3]" />
            </div>
            <div>
              <div className="font-display text-xl font-bold text-white">GymBro AI Performance</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Futuristic training, nutrition, and analytics in one premium ecosystem.
              </div>
            </div>
          </div>
          <div className="text-sm text-[var(--text-tertiary)]">© 2026 GymBro. Built for the next generation of athletes.</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
