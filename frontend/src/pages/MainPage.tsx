import { useState, useEffect } from "react";
import "../styles/globals.css";

type TabType = "home" | "recipes" | "ingredients" | "meal-planner" | "profile";

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<TabType>("home");

  // Load inventory from localStorage with fallback sample data
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem("kos_inventory");
      return saved ? JSON.parse(saved) : [
        { id: 1, name: "Ripe Avocados", category: "Produce", qty: "3 units", status: "Fresh" },
        { id: 2, name: "Whole Milk", category: "Dairy", qty: "0.5 L", status: "Low" },
        { id: 3, name: "Sourdough Bread", category: "Bakery", qty: "1 loaf", status: "Fresh" },
        { id: 4, name: "Olive Oil", category: "Pantry", qty: "80%", status: "Good" },
      ];
    } catch {
      return [
        { id: 1, name: "Ripe Avocados", category: "Produce", qty: "3 units", status: "Fresh" },
        { id: 2, name: "Whole Milk", category: "Dairy", qty: "0.5 L", status: "Low" },
        { id: 3, name: "Sourdough Bread", category: "Bakery", qty: "1 loaf", status: "Fresh" },
        { id: 4, name: "Olive Oil", category: "Pantry", qty: "80%", status: "Good" },
      ];
    }
  });

  // Save inventory changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("kos_inventory", JSON.stringify(inventory));
    } catch (e) {
      console.error("Failed to save inventory to localStorage", e);
    }
  }, [inventory]);

  const [recipes] = useState([
    { id: 1, title: "Avocado Toast with Poached Egg", prepTime: "15 mins", difficulty: "Easy", icon: "🥑" },
    { id: 2, title: "Creamy Garlic Pasta", prepTime: "25 mins", difficulty: "Medium", icon: "🍝" },
    { id: 3, title: "Sourdough French Toast", prepTime: "20 mins", difficulty: "Easy", icon: "🍞" },
  ]);

  return (
    <div className="kos-main-page">

      {/* NAVBAR */}
      <header className="kos-navbar">
        <div 
          className="kos-logo" 
          onClick={() => setActiveTab("home")} 
          style={{ cursor: "pointer" }}
        >
          KitchenOS
        </div>

        <nav className="kos-nav">
          <button 
            className={activeTab === "home" ? "kos-active-nav" : ""} 
            onClick={() => setActiveTab("home")}
          >
            Home
          </button>
          <button 
            className={activeTab === "recipes" ? "kos-active-nav" : ""} 
            onClick={() => setActiveTab("recipes")}
          >
            Recipes
          </button>
          <button 
            className={activeTab === "ingredients" ? "kos-active-nav" : ""} 
            onClick={() => setActiveTab("ingredients")}
          >
            Ingredients
          </button>
          <button 
            className={activeTab === "meal-planner" ? "kos-active-nav" : ""} 
            onClick={() => setActiveTab("meal-planner")}
          >
            Meal Planner
          </button>
        </nav>

        <button 
          className="kos-profile-button"
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
      </header>


      {/* MAIN CONTENT AREA */}
      <main className="kos-main-content">

        {activeTab === "home" && (
          <>
            {/* HERO SECTION */}
            <section className="kos-main-hero">

              <div className="kos-main-text">

                <p className="kos-main-small-text">
                  WELCOME TO
                </p>

                <h1>
                  Your Smart
                  <br />
                  Kitchen
                </h1>

                <p className="kos-main-description">
                  Plan meals, discover recipes, manage ingredients,
                  and organize your kitchen in one simple place.
                </p>

                <div className="kos-main-actions">
                  <button 
                    className="kos-primary-button"
                    onClick={() => setActiveTab("recipes")}
                  >
                    Explore Recipes
                  </button>

                  <button 
                    className="kos-secondary-button"
                    onClick={() => setActiveTab("meal-planner")}
                  >
                    Plan a Meal
                  </button>
                </div>

              </div>


              {/* RIGHT SIDE CARD */}
              <div className="kos-main-card">

                <div className="kos-card-icon">
                  🍳
                </div>

                <h2>
                  Smart Kitchen
                </h2>

                <p>
                  Everything you need to make cooking easier.
                </p>

              </div>

            </section>


            {/* FEATURE CARDS */}
            <section className="kos-features">

              <div 
                className="kos-feature-card" 
                onClick={() => setActiveTab("recipes")} 
                style={{ cursor: "pointer" }}
              >
                <span>🍴</span>
                <h3>Recipes</h3>
                <p>
                  Discover and organize your favorite recipes.
                </p>
              </div>

              <div 
                className="kos-feature-card" 
                onClick={() => setActiveTab("ingredients")} 
                style={{ cursor: "pointer" }}
              >
                <span>🥕</span>
                <h3>Ingredients</h3>
                <p>
                  Keep track of ingredients available in your kitchen.
                </p>
              </div>

              <div 
                className="kos-feature-card" 
                onClick={() => setActiveTab("meal-planner")} 
                style={{ cursor: "pointer" }}
              >
                <span>📋</span>
                <h3>Meal Planner</h3>
                <p>
                  Plan your meals and stay organized throughout the week.
                </p>
              </div>

            </section>
          </>
        )}

        {activeTab === "recipes" && (
          <div className="kos-sub-page">
            <div className="kos-sub-header">
              <h1>Recipe Box</h1>
              <p>Curated dishes ready to cook with your pantry items.</p>
            </div>
            <div className="kos-grid-container">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="kos-feature-card" style={{ textAlign: "left" }}>
                  <span style={{ fontSize: "2rem" }}>{recipe.icon}</span>
                  <span className="kos-badge">{recipe.difficulty}</span>
                  <h3>{recipe.title}</h3>
                  <p>Prep time: {recipe.prepTime}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "ingredients" && (
          <div className="kos-sub-page">
            <div className="kos-sub-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1>Pantry & Ingredients</h1>
                <p>Monitor your stock levels in real time.</p>
              </div>
              <button 
                className="kos-primary-button" 
                onClick={() => {
                  const name = prompt("Enter ingredient name:");
                  if (name && name.trim()) {
                    const category = prompt("Enter category (e.g., Produce, Dairy, Pantry):") || "General";
                    const qty = prompt("Enter quantity (e.g., 2 units, 1L):") || "1 unit";
                    const status = prompt("Enter status (Fresh, Low, Good):") || "Fresh";
                    setInventory([
                      ...inventory, 
                      { id: Date.now(), name: name.trim(), category, qty, status }
                    ]);
                  }
                }}
              >
                + Add Item
              </button>
            </div>
            <div className="kos-table-wrapper" style={{ marginTop: "1.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E8D5C4", textAlign: "left" }}>
                    <th style={{ padding: "0.75rem" }}>Name</th>
                    <th style={{ padding: "0.75rem" }}>Category</th>
                    <th style={{ padding: "0.75rem" }}>Quantity</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F4EBE1" }}>
                      <td style={{ padding: "0.75rem", fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: "0.75rem" }}>{item.category}</td>
                      <td style={{ padding: "0.75rem" }}>{item.qty}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ 
                          padding: "0.25rem 0.75rem", 
                          borderRadius: "999px", 
                          fontSize: "0.85rem",
                          background: item.status === "Low" ? "#FEF3C7" : "#D1FAE5",
                          color: item.status === "Low" ? "#92400E" : "#065F46"
                        }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "meal-planner" && (
          <div className="kos-sub-page">
            <div className="kos-sub-header">
              <h1>Meal Planner</h1>
              <p>Organize your weekly breakfast, lunch, and dinners.</p>
            </div>
            <div className="kos-empty-state" style={{ padding: "3rem", textAlign: "center", background: "#FFF9F5", borderRadius: "1rem", border: "1px solid #E8D5C4", marginTop: "1.5rem" }}>
              <p>No meals scheduled for this week yet.</p>
              <button className="kos-primary-button" style={{ marginTop: "1rem" }}>
                Schedule First Meal
              </button>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="kos-sub-page">
            <div className="kos-sub-header">
              <h1>Chef Profile</h1>
              <p>Manage your KitchenOS account and preferences.</p>
            </div>
            <div className="kos-feature-card" style={{ maxWidth: "400px", marginTop: "1.5rem", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#D97757", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: "bold" }}>
                  C
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Head Chef</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>chef@kitchenos.app</p>
                </div>
              </div>
              <p>KitchenOS status: Active & Connected</p>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}