import { NavLink } from "react-router-dom";
import { Home, Dumbbell, Utensils, TrendingUp, Bot } from "lucide-react";

const TABS = [
  { to: "/today",    label: "Today",    Icon: Home       },
  { to: "/train",    label: "Train",    Icon: Dumbbell   },
  { to: "/eat",      label: "Eat",      Icon: Utensils   },
  { to: "/progress", label: "Progress", Icon: TrendingUp },
  { to: "/coach",    label: "FitBot",   Icon: Bot        },
];

const BottomTabBar = () => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch
               bg-surface border-t border-border"
    style={{ height: 72 }}
    aria-label="Main navigation"
  >
    {TABS.map(({ to, label, Icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/today"}
        className={({ isActive }) =>
          [
            "flex flex-1 flex-col items-center justify-center gap-[3px]",
            "font-body text-[11px] font-medium leading-none",
            "transition-colors duration-150",
            isActive ? "text-accent" : "text-secondary hover:text-primary",
          ].join(" ")
        }
        aria-label={label}
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`w-[22px] h-[22px] transition-colors duration-150 ${
                isActive ? "text-accent" : "text-secondary"
              }`}
              strokeWidth={isActive ? 2.2 : 1.7}
            />
            <span>{label}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export default BottomTabBar;
