import { useMemo, useState, useEffect, type FormEvent } from "react";
import LandingPage from "./pages/LandingPage";
import { NavigationDock } from "./components/NavigationDock";

type Tab = "home" | "pantry" | "recipes" | "planner" | "shopping";

type Greeting = {
  title: string;
  subtitle: string;
};

type Ingredient = {
  id: number;
  name: string;
  icon: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
};

type User = {
  name: string;
  email: string;
};

type StoredAccount = User & {
  password: string;
};

type AuthMode = "signin" | "signup";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

const categories = [
  "All",
  "Vegetables",
  "Dairy",
  "Grains",
  "Fruits",
  "Meat",
  "Other",
];

export default function App() {
  const [inApp, setInApp] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // =========================================================
  // USER / ACCOUNT
  // =========================================================

  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem("kitchenos_user");

      if (!savedUser) {
        return null;
      }

      return JSON.parse(savedUser) as User;
    } catch {
      return null;
    }
  });

  // =========================================================
  // AUTH
  // =========================================================

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  const [authError, setAuthError] = useState("");

  // Personalized profile dashboard
  const [showProfileDashboard, setShowProfileDashboard] = useState(false);

  // Global toaster notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // =========================================================
  // PANTRY (FETCHED FROM BACKEND API)
  // =========================================================

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/ingredients")
      .then((res) => res.json())
      .then((data: any[]) => {
        const formatted = data.map((item) => ({
          id: item.id,
          name: item.name,
          icon: item.icon || "📦",
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          expiryDate: item.expiry_date,
        }));
        setIngredients(formatted);
      })
      .catch((err) => {
        console.error("Failed to fetch pantry ingredients:", err);
        showToast("Could not load pantry from server.", "error");
      });
  }, []);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newIngredient, setNewIngredient] = useState({
    name: "",
    category: "Vegetables",
    quantity: "",
    unit: "pcs",
    expiryDate: "",
  });

  // =========================================================
  // GREETING
  // =========================================================

  const getGreeting = (): Greeting => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return {
        title: user
          ? `Good morning, ${user.name.split(" ")[0]} 👋`
          : "Good morning 👋",
        subtitle: "What are we doing today?",
      };
    }

    if (hour >= 12 && hour < 17) {
      return {
        title: user
          ? `Good afternoon, ${user.name.split(" ")[0]} ☀️`
          : "Good afternoon ☀️",
        subtitle: "What are we cooking today?",
      };
    }

    if (hour >= 17 && hour < 21) {
      return {
        title: user
          ? `Good evening, ${user.name.split(" ")[0]} 🌅`
          : "Good evening 🌅",
        subtitle: "What are we having for dinner?",
      };
    }

    return {
      title: user
        ? `Good night, ${user.name.split(" ")[0]} 🌙`
        : "Good night 🌙",
      subtitle: "Planning something for tomorrow?",
    };
  };

  const greeting = useMemo(() => getGreeting(), [user]);

  // =========================================================
  // GLOBAL TOAST NOTIFICATIONS
  // =========================================================

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();

    setToasts((current) => [
      ...current,
      { id, message, type },
    ]);

    window.setTimeout(() => {
      setToasts((current) =>
        current.filter((toast) => toast.id !== id)
      );
    }, 3200);
  };

  const removeToast = (id: number) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  };

  // =========================================================
  // GET STARTED
  // =========================================================

  const handleGetStarted = () => {
    setInApp(true);
    setActiveTab("home");
    setShowProfileDashboard(false);
    showToast("Welcome to KitchenOS!", "success");
  };

  // =========================================================
  // OPEN AUTH
  // =========================================================

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);

    setNameInput("");
    setEmailInput("");
    setPasswordInput("");
    setConfirmPasswordInput("");
    setAuthError("");

    setShowProfileDashboard(false);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
    setAuthError("");
  };

  // =========================================================
  // AUTH SUBMIT
  // =========================================================

  const handleAuthSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAuthError("");

    const name = nameInput.trim();
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;

    if (!email) {
      setAuthError("Please enter your email address.");
      showToast("Please enter your email address.", "error");
      return;
    }

    if (!password) {
      setAuthError("Please enter your password.");
      showToast("Please enter your password.", "error");
      return;
    }

    // =======================================================
    // CREATE ACCOUNT
    // =======================================================

    if (authMode === "signup") {
      if (!name) {
        setAuthError("Please enter your name.");
        showToast("Please enter your name.", "error");
        return;
      }

      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        showToast("Password must be at least 6 characters.", "error");
        return;
      }

      if (password !== confirmPasswordInput) {
        setAuthError("Passwords do not match.");
        showToast("Passwords do not match.", "error");
        return;
      }

      const existingAccount = localStorage.getItem(
        "kitchenos_account"
      );

      if (existingAccount) {
        try {
          const account = JSON.parse(
            existingAccount
          ) as StoredAccount;

          if (account.email === email) {
            const message =
              "An account with this email already exists. Please sign in.";
            setAuthError(message);
            showToast(message, "error");
            return;
          }
        } catch {
          // Ignore invalid old account data.
        }
      }

      const account: StoredAccount = {
        name,
        email,
        password,
      };

      const accountUser: User = {
        name,
        email,
      };

      localStorage.setItem(
        "kitchenos_account",
        JSON.stringify(account)
      );

      localStorage.setItem(
        "kitchenos_user",
        JSON.stringify(accountUser)
      );

      setUser(accountUser);

      setIsAuthOpen(false);
      setActiveTab("home");
      setShowProfileDashboard(false);
      setInApp(true);
      showToast(`Account created successfully. Welcome, ${name}!`, "success");

      setNameInput("");
      setEmailInput("");
      setPasswordInput("");
      setConfirmPasswordInput("");

      return;
    }

    // =======================================================
    // SIGN IN
    // =======================================================

    const savedAccount = localStorage.getItem(
      "kitchenos_account"
    );

    if (!savedAccount) {
      const message =
        "No KitchenOS account found. Please create an account first.";
      setAuthError(message);
      showToast(message, "error");
      return;
    }

    try {
      const account = JSON.parse(
        savedAccount
      ) as StoredAccount;

      if (account.email !== email) {
        const message =
          "The email address does not match your KitchenOS account.";
        setAuthError(message);
        showToast(message, "error");
        return;
      }

      if (account.password !== password) {
        setAuthError("Incorrect password.");
        showToast("Incorrect password. Please try again.", "error");
        return;
      }

      const signedInUser: User = {
        name: account.name,
        email: account.email,
      };

      localStorage.setItem(
        "kitchenos_user",
        JSON.stringify(signedInUser)
      );

      setUser(signedInUser);
      setIsAuthOpen(false);
      setActiveTab("home");
      setShowProfileDashboard(false);
      setInApp(true);
      showToast(`Signed in successfully. Welcome back, ${signedInUser.name.split(" ")[0]}!`, "success");

      setNameInput("");
      setEmailInput("");
      setPasswordInput("");
      setConfirmPasswordInput("");
    } catch {
      const message =
        "Your account data could not be read. Please create the account again.";
      setAuthError(message);
      showToast(message, "error");
    }
  };

  // =========================================================
  // SIGN OUT
  // =========================================================

  const handleSignOut = () => {
    localStorage.removeItem("kitchenos_user");

    setUser(null);
    setShowProfileDashboard(false);
    setActiveTab("home");
    setInApp(true);
    showToast("You have been signed out successfully.", "success");
  };

  // =========================================================
  // PROFILE INITIALS
  // =========================================================

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  // =========================================================
  // PANTRY CALCULATIONS
  // =========================================================

  const today = new Date();

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);

    const difference =
      (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    return difference >= 0 && difference <= 7;
  };

  const isLowStock = (ingredient: Ingredient) => {
    return ingredient.quantity <= 2;
  };

  const expiringIngredients = ingredients.filter(
    (ingredient) => isExpiringSoon(ingredient.expiryDate)
  );

  const lowStockIngredients = ingredients.filter(
    (ingredient) => isLowStock(ingredient)
  );

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ingredient) => {
      const matchesSearch = ingredient.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        ingredient.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [ingredients, search, selectedCategory]);

  // =========================================================
  // DELETE INGREDIENT
  // =========================================================

  const deleteIngredient = (id: number) => {
    const ingredient = ingredients.find((item) => item.id === id);

    setIngredients((current) =>
      current.filter((item) => item.id !== id)
    );

    if (ingredient) {
      showToast(`${ingredient.name} removed from your pantry.`, "success");
    }
  };

  // =========================================================
  // ADD INGREDIENT (BACKEND SYNC)
  // =========================================================

  const handleAddIngredient = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !newIngredient.name.trim() ||
      !newIngredient.quantity ||
      !newIngredient.expiryDate
    ) {
      showToast("Please complete all ingredient details.", "error");
      return;
    }

    const payload = {
      name: newIngredient.name.trim(),
      icon:
        newIngredient.category === "Vegetables"
          ? "🥕"
          : newIngredient.category === "Dairy"
          ? "🥛"
          : newIngredient.category === "Grains"
          ? "🍚"
          : newIngredient.category === "Fruits"
          ? "🍎"
          : newIngredient.category === "Meat"
          ? "🥩"
          : "🥫",
      category: newIngredient.category,
      quantity: Number(newIngredient.quantity),
      unit: newIngredient.unit,
      expiry_date: newIngredient.expiryDate,
      user_id: user?.email || "default_user",
    };

    try {
      const response = await fetch("http://localhost:8000/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save ingredient to backend");
      }

      const savedItem = await response.json();

      const mappedItem: Ingredient = {
        id: savedItem.id,
        name: savedItem.name,
        icon: savedItem.icon,
        category: savedItem.category,
        quantity: savedItem.quantity,
        unit: savedItem.unit,
        expiryDate: savedItem.expiry_date,
      };

      setIngredients((current) => [mappedItem, ...current]);

      setNewIngredient({
        name: "",
        category: "Vegetables",
        quantity: "",
        unit: "pcs",
        expiryDate: "",
      });

      setIsAddOpen(false);
      showToast(`${mappedItem.name} added to your pantry.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add ingredient on server.", "error");
    }
  };

  // =========================================================
  // DATE DISPLAY
  // =========================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  // =========================================================
  // HOME
  // =========================================================

  const renderHome = () => {
    return (
      <div className="kos-dashboard">
        <section className="kos-greeting">
          <h1>{greeting.title}</h1>
          <p>{greeting.subtitle}</p>
        </section>

        <section className="kos-dashboard-actions">
          <button
            type="button"
            onClick={() => setActiveTab("pantry")}
            className="kos-dashboard-action"
          >
            <span>🥕</span>
            <strong>PANTRY</strong>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recipes")}
            className="kos-dashboard-action"
          >
            <span>🍳</span>
            <strong>RECIPES</strong>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("planner")}
            className="kos-dashboard-action"
          >
            <span>📅</span>
            <strong>MEAL PLAN</strong>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shopping")}
            className="kos-dashboard-action"
          >
            <span>🛒</span>
            <strong>SHOPPING</strong>
          </button>
        </section>

        <div className="kos-dashboard-divider" />

        <section className="kos-use-soon">
          <p className="kos-use-soon-title">
            ⚠️ USE SOON
          </p>

          <p className="kos-expiring">
            {expiringIngredients.length}{" "}
            {expiringIngredients.length === 1
              ? "ingredient"
              : "ingredients"}{" "}
            expiring
          </p>

          <button
            type="button"
            onClick={() => setActiveTab("pantry")}
            className="kos-view-pantry"
          >
            View Pantry
          </button>
        </section>
      </div>
    );
  };

  // =========================================================
  // PANTRY DASHBOARD
  // =========================================================

  const renderPantry = () => (
    <div className="kos-pantry-dashboard">
      <section className="kos-page-heading">
        <div>
          <span className="kos-page-icon">🥕</span>

          <h1>Pantry</h1>

          <p>
            Everything in your kitchen, organized.
          </p>
        </div>

        <button
          type="button"
          className="kos-add-button"
          onClick={() => setIsAddOpen(true)}
        >
          +
        </button>
      </section>

      <section className="kos-pantry-stats">
        <div className="kos-pantry-stat">
          <strong>{ingredients.length}</strong>
          <span>Items</span>
        </div>

        <div className="kos-pantry-stat">
          <strong>{lowStockIngredients.length}</strong>
          <span>Low Stock</span>
        </div>

        <div className="kos-pantry-stat">
          <strong>{expiringIngredients.length}</strong>
          <span>Use Soon</span>
        </div>
      </section>

      <div className="kos-pantry-search">
        <span>⌕</span>

        <input
          type="text"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <section className="kos-category-section">
        <p className="kos-small-heading">
          CATEGORIES
        </p>

        <div className="kos-category-scroll">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              onClick={() =>
                setSelectedCategory(category)
              }
              className={`kos-category-button ${
                selectedCategory === category
                  ? "is-selected"
                  : ""
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="kos-ingredient-section">
        <div className="kos-list-heading">
          <p className="kos-small-heading">
            YOUR PANTRY
          </p>

          <span>
            {filteredIngredients.length} items
          </span>
        </div>

        {filteredIngredients.length === 0 ? (
          <div className="kos-empty-state">
            <span>🥣</span>

            <h3>No ingredients found</h3>

            <p>
              Try another search or add a new ingredient.
            </p>
          </div>
        ) : (
          <div className="kos-ingredient-list">
            {filteredIngredients.map((ingredient) => {
              const expiring = isExpiringSoon(
                ingredient.expiryDate
              );

              const lowStock = isLowStock(ingredient);

              return (
                <div
                  className={`kos-ingredient-card ${
                    expiring ? "is-expiring" : ""
                  }`}
                  key={ingredient.id}
                >
                  <div className="kos-ingredient-icon">
                    {ingredient.icon}
                  </div>

                  <div className="kos-ingredient-info">
                    <h3>{ingredient.name}</h3>

                    <p>
                      {ingredient.quantity}{" "}
                      {ingredient.unit}
                    </p>

                    <small>
                      {expiring
                        ? "⚠️ Use soon"
                        : `Expires ${formatDate(
                            ingredient.expiryDate
                          )}`}
                    </small>
                  </div>

                  <div className="kos-ingredient-right">
                    {lowStock && (
                      <span className="kos-low-stock">
                        Low
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        deleteIngredient(ingredient.id)
                      }
                      className="kos-delete-button"
                      aria-label={`Delete ${ingredient.name}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <button
        type="button"
        className="kos-add-ingredient-wide"
        onClick={() => setIsAddOpen(true)}
      >
        <span>+</span>
        Add Ingredient
      </button>
    </div>
  );

  // =========================================================
  // PERSONALIZED PROFILE DASHBOARD
  // =========================================================

  const renderProfileDashboard = () => {
    if (!user) {
      return (
        <div className="kos-section-placeholder">
          <span>👤</span>
          <h2>Your Dashboard</h2>
          <p>Sign in to view your personalized KitchenOS dashboard.</p>
          <button
            type="button"
            className="kos-modal-submit"
            onClick={() => openAuth("signin")}
          >
            Sign In
          </button>
        </div>
      );
    }

    return (
      <div className="kos-profile-dashboard">
        <section className="kos-profile-dashboard-heading">
          <div>
            <span className="kos-profile-dashboard-eyebrow">
              MY KITCHENOS
            </span>
            <h1>{greeting.title}</h1>
            <p>Your personal kitchen dashboard.</p>
          </div>

          <div className="kos-profile-avatar kos-profile-avatar-large">
            {getInitials(user.name)}
          </div>
        </section>

        <section className="kos-profile-card">
          <div className="kos-profile-card-avatar">
            {getInitials(user.name)}
          </div>

          <div className="kos-profile-card-info">
            <span className="kos-profile-card-label">PROFILE</span>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </section>

        <section className="kos-profile-stats">
          <button
            type="button"
            className="kos-profile-stat"
            onClick={() => setActiveTab("pantry")}
          >
            <span>🥕</span>
            <strong>{ingredients.length}</strong>
            <small>Pantry Items</small>
          </button>

          <button
            type="button"
            className="kos-profile-stat"
            onClick={() => setActiveTab("pantry")}
          >
            <span>⚠️</span>
            <strong>{expiringIngredients.length}</strong>
            <small>Use Soon</small>
          </button>

          <button
            type="button"
            className="kos-profile-stat"
            onClick={() => setActiveTab("pantry")}
          >
            <span>📦</span>
            <strong>{lowStockIngredients.length}</strong>
            <small>Low Stock</small>
          </button>

          <button
            type="button"
            className="kos-profile-stat"
            onClick={() => setActiveTab("planner")}
          >
            <span>📅</span>
            <strong>0</strong>
            <small>Meal Plans</small>
          </button>
        </section>

        <section className="kos-profile-quick-actions">
          <div className="kos-profile-section-heading">
            <h2>Quick Actions</h2>
            <span>Kitchen tools</span>
          </div>

          <div className="kos-profile-action-grid">
            <button
              type="button"
              onClick={() => setActiveTab("pantry")}
              className="kos-profile-action"
            >
              <span>🥕</span>
              <div>
                <strong>Pantry</strong>
                <small>Manage ingredients</small>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recipes")}
              className="kos-profile-action"
            >
              <span>🍳</span>
              <div>
                <strong>Recipes</strong>
                <small>Find something to cook</small>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("planner")}
              className="kos-profile-action"
            >
              <span>📅</span>
              <div>
                <strong>Meal Plan</strong>
                <small>Plan your meals</small>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("shopping")}
              className="kos-profile-action"
            >
              <span>🛒</span>
              <div>
                <strong>Shopping</strong>
                <small>Manage your list</small>
              </div>
            </button>
          </div>
        </section>

        <section className="kos-profile-use-soon">
          <div>
            <span className="kos-profile-use-soon-icon">⚠️</span>
            <div>
              <strong>Use Soon</strong>
              <p>
                {expiringIngredients.length > 0
                  ? `${expiringIngredients.length} ${
                      expiringIngredients.length === 1
                        ? "ingredient needs"
                        : "ingredients need"
                    } your attention.`
                  : "Nothing is expiring soon."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("pantry")}
            className="kos-view-pantry"
          >
            View Pantry
          </button>
        </section>

        <button
          type="button"
          className="kos-profile-signout-dashboard"
          onClick={handleSignOut}
        >
          ↪ Sign Out
        </button>
      </div>
    );
  };

  // =========================================================
  // OTHER SECTIONS
  // =========================================================

  const renderPlaceholder = () => {
    const titles: Record<Tab, string> = {
      home: "",
      pantry: "Pantry",
      recipes: "Recipes",
      planner: "Meal Plan",
      shopping: "Shopping",
    };

    const icons: Record<Tab, string> = {
      home: "",
      pantry: "🥕",
      recipes: "🍳",
      planner: "📅",
      shopping: "🛒",
    };

    return (
      <div className="kos-section-placeholder">
        <span>{icons[activeTab]}</span>

        <h2>{titles[activeTab]}</h2>

        <p>
          This section is ready for the next step.
        </p>
      </div>
    );
  };

  // =========================================================
  // MAIN APP
  // =========================================================

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="kos-toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`kos-toast kos-toast-${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <span className="kos-toast-icon">
              {toast.type === "success"
                ? "✓"
                : toast.type === "error"
                ? "!"
                : "i"}
            </span>

            <span className="kos-toast-message">{toast.message}</span>

            <button
              type="button"
              className="kos-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {!inApp ? (
        <LandingPage onGetStarted={handleGetStarted} />
      ) : (
        <main className="kos-app">
          {/* BACKGROUND */}
          <img
            src="/images/kitchen-hero.png"
            alt=""
            className="kos-app-kitchen-image"
            draggable={false}
          />

          <div className="kos-app-overlay" />

          <div className="kos-app-content">
            {/* =================================================
                HEADER
                ================================================= */}

            <header className="kos-dashboard-header">
              <div>
                <button
                  type="button"
                  className="kos-logo-button"
                  onClick={() => {
                    setActiveTab("home");
                    setShowProfileDashboard(false);
                  }}
                >
                  KITCHENOS
                </button>

                <p>Smart Kitchen</p>
              </div>

              {/* ACCOUNT */}
              <div className="kos-account-wrapper">
                {user ? (
                  <>
                    <button
                      type="button"
                      className="kos-profile-button"
                      onClick={() => {
                        setShowProfileDashboard(true);
                      }}
                      aria-label="Open personalized dashboard"
                    >
                      <span className="kos-profile-avatar">
                        {getInitials(user.name)}
                      </span>

                      <span className="kos-profile-name">
                        {user.name.split(" ")[0]}
                      </span>

                      <span className="kos-profile-arrow">→</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="kos-sign-in"
                    onClick={() => openAuth("signin")}
                  >
                    Sign In
                  </button>
                )}
              </div>
            </header>

            {/* =================================================
                CONTENT
                ================================================= */}

            <section className="kos-main-section">
              {showProfileDashboard
                ? renderProfileDashboard()
                : activeTab === "home"
                ? renderHome()
                : activeTab === "pantry"
                ? renderPantry()
                : renderPlaceholder()}
            </section>

            {/* =================================================
                NAVIGATION
                ================================================= */}

            <NavigationDock
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setShowProfileDashboard(false);
              }}
            />
          </div>

          {/* =================================================
              ADD INGREDIENT MODAL
              ================================================= */}

          {isAddOpen && (
            <div
              className="kos-auth-backdrop"
              onClick={() => setIsAddOpen(false)}
            >
              <div
                className="kos-auth-modal kos-add-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="kos-auth-close"
                  onClick={() => setIsAddOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>

                <div className="kos-modal-icon">
                  🥕
                </div>

                <h2>Add Ingredient</h2>

                <p>
                  Add something to your pantry.
                </p>

                <form onSubmit={handleAddIngredient}>
                  <label className="kos-modal-label">
                    Ingredient Name
                    <input
                      type="text"
                      placeholder="e.g. Potatoes"
                      value={newIngredient.name}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          name: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="kos-modal-label">
                    Category
                    <select
                      value={newIngredient.category}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          category: e.target.value,
                        })
                      }
                    >
                      {categories
                        .filter(
                          (category) =>
                            category !== "All"
                        )
                        .map((category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        ))}
                    </select>
                  </label>

                  <div className="kos-form-row">
                    <label className="kos-modal-label">
                      Quantity
                      <input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        value={newIngredient.quantity}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            quantity:
                              e.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="kos-modal-label">
                      Unit
                      <select
                        value={newIngredient.unit}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            unit: e.target.value,
                          })
                        }
                      >
                        <option value="pcs">
                          pcs
                        </option>
                        <option value="kg">
                          kg
                        </option>
                        <option value="g">
                          g
                        </option>
                        <option value="L">
                          L
                        </option>
                        <option value="ml">
                          ml
                        </option>
                      </select>
                    </label>
                  </div>

                  <label className="kos-modal-label">
                    Expiry Date
                    <input
                      type="date"
                      value={newIngredient.expiryDate}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          expiryDate:
                            e.target.value,
                        })
                      }
                    />
                  </label>

                  <button
                    type="submit"
                    className="kos-modal-submit"
                  >
                    Add to Pantry
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* =================================================
              AUTH MODAL
              ================================================= */}

          {isAuthOpen && (
            <div
              className="kos-auth-backdrop"
              onClick={closeAuth}
            >
              <div
                className="kos-auth-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="kos-auth-close"
                  onClick={closeAuth}
                  aria-label="Close"
                >
                  ×
                </button>

                <div className="kos-modal-icon">
                  {authMode === "signup"
                    ? "👋"
                    : "🏠"}
                </div>

                <h2>
                  {authMode === "signup"
                    ? "Create your account"
                    : "Welcome back"}
                </h2>

                <p>
                  {authMode === "signup"
                    ? "Create your personal KitchenOS profile."
                    : "Sign in to your personalized kitchen."}
                </p>

                <form onSubmit={handleAuthSubmit}>
                  {authMode === "signup" && (
                    <label className="kos-modal-label">
                      Your Name
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={nameInput}
                        onChange={(e) =>
                          setNameInput(e.target.value)
                        }
                        autoComplete="name"
                      />
                    </label>
                  )}

                  <label className="kos-modal-label">
                    Email
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={(e) =>
                        setEmailInput(e.target.value)
                      }
                      autoComplete="email"
                    />
                  </label>

                  <label className="kos-modal-label">
                    Password
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={passwordInput}
                      onChange={(e) =>
                        setPasswordInput(
                          e.target.value
                        )
                      }
                      autoComplete={
                        authMode === "signup"
                          ? "new-password"
                          : "current-password"
                      }
                    />
                  </label>

                  {authMode === "signup" && (
                    <label className="kos-modal-label">
                      Confirm Password
                      <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPasswordInput}
                        onChange={(e) =>
                          setConfirmPasswordInput(
                            e.target.value
                          )
                        }
                        autoComplete="new-password"
                      />
                    </label>
                  )}

                  {authError && (
                    <div className="kos-auth-error">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="kos-modal-submit"
                  >
                    {authMode === "signup"
                      ? "Create Account"
                      : "Sign In"}
                  </button>
                </form>

                <div className="kos-auth-switch">
                  {authMode === "signup"
                    ? "Already have an account?"
                    : "New to KitchenOS?"}

                  <button
                    type="button"
                    onClick={() =>
                      openAuth(
                        authMode === "signup"
                          ? "signin"
                          : "signup"
                      )
                    }
                  >
                    {authMode === "signup"
                      ? "Sign In"
                      : "Create Account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}