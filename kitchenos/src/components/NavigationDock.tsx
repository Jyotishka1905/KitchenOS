export type Tab =
  | "home"
  | "pantry"
  | "recipes"
  | "planner"
  | "shopping";

type NavigationDockProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const navigationItems: {
  key: Tab;
  icon: string;
  label: string;
}[] = [
  {
    key: "home",
    icon: "🏠",
    label: "Home",
  },
  {
    key: "pantry",
    icon: "🥕",
    label: "Pantry",
  },
  {
    key: "recipes",
    icon: "🍳",
    label: "Recipes",
  },
  {
    key: "planner",
    icon: "📅",
    label: "Meal Plan",
  },
  {
    key: "shopping",
    icon: "🛒",
    label: "Shopping",
  },
];

export function NavigationDock({
  activeTab,
  setActiveTab,
}: NavigationDockProps) {
  return (
    <nav className="kos-bottom-nav">
      {navigationItems.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key)}
            className={`kos-bottom-nav-item ${
              isActive ? "is-active" : ""
            }`}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span aria-hidden="true" style={{ fontSize: "1.05rem" }}>
              {item.icon}
            </span>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 650,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                color: "#5a2111",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}