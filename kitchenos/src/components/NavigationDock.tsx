export type Tab =
  | "home"
  | "pantry"
  | "recipes"
  | "planner"
  | "shopping"
  | "secondlife";

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
    icon: "",
    label: "Home",
  },
  {
    key: "pantry",
    icon: "",
    label: "Pantry",
  },
  {
    key: "recipes",
    icon: "",
    label: "Recipes",
  },
  {
    key: "planner",
    icon: "",
    label: "Plan",
  },
  {
    key: "shopping",
    icon: "",
    label: "Shop",
  },
  {
    key: "secondlife",
    icon: "",
    label: "Reuse",
  },
];

export function NavigationDock({
  activeTab,
  setActiveTab,
}: NavigationDockProps) {
  return (
    <nav 
      className="kos-bottom-nav" 
      style={{ 
        display: "flex", 
        justifyContent: "space-around", 
        alignItems: "center", 
        padding: "6px 8px",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto"
      }}
    >
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
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 6px",
              flex: 1,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "1.1rem", lineHeight: "1.2" }}>
              {item.icon}
            </span>
            <span
              style={{
                fontSize: "0.58rem",
                fontWeight: 650,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                color: "#5a2111",
                marginTop: "2px",
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