import { useMemo, useState, useEffect, type FormEvent } from "react";
import LandingPage from "./pages/LandingPage";
import { NavigationDock } from "./components/NavigationDock";

type Tab = "home" | "pantry" | "recipes" | "planner" | "shopping" | "secondlife";

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

type MealPlan = {
  id?: number;
  day: string;
  meal_type: string;
  recipe_name: string;
  user_id?: string;
};

type ShoppingItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  buy_link: string;
  store: string;
};

type SmartShoppingData = {
  proposed_dish: { title: string; reason: string; icon: string };
  expiring_audit: string[];
  shopping_list: ShoppingItem[];
};

type SecondLifeRemedy = {
  id: number;
  category: string;
  title: string;
  description: string;
  icon: string;
  steps: string[];
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

const cuisines = ["Indian", "Italian", "Mexican", "Chinese", "Continental"];
const spiceOptions = ["General", "Spicy", "Mild", "Garlicky", "Herby", "Traditional"];

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
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
  const [phoneInput, setPhoneInput] = useState("");

  const [authError, setAuthError] = useState("");

  // Personalized profile dashboard
  const [showProfileDashboard, setShowProfileDashboard] = useState(false);

  // Global toaster notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // =========================================================
  // PANTRY, MEAL PLANS, RECIPES, REMEDIES & SHOPPING
  // =========================================================

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [mealInput, setMealInput] = useState({ meal_type: "Lunch", recipe_name: "" });

  // Recipe & Preference States
  const [selectedExpiringItem, setSelectedExpiringItem] = useState<string>("");
  const [selectedSpicePref, setSelectedSpicePref] = useState<string>("General");
  const [selectedCuisinePref, setSelectedCuisinePref] = useState<string>("Indian");
  const [recipeDashboardData, setRecipeDashboardData] = useState<any | null>(null);

  // Second Life Remedies State
  const [secondLifeRemedies, setSecondLifeRemedies] = useState<SecondLifeRemedy[]>([]);
  const [expiredCount, setExpiredCount] = useState<number>(0);

  const [smartShopping, setSmartShopping] = useState<SmartShoppingData | null>(null);

  // New Backend Feature States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceInput, setVoiceInput] = useState("Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge");
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [lastVoiceResponse, setLastVoiceResponse] = useState<any | null>(null);

  const [isFreshnessModalOpen, setIsFreshnessModalOpen] = useState(false);
  const [freshnessAudit, setFreshnessAudit] = useState<any | null>(null);
  const [isFreshnessLoading, setIsFreshnessLoading] = useState(false);

  const [isZeroWasteLoading, setIsZeroWasteLoading] = useState(false);
  const [isMealPlanLoading, setIsMealPlanLoading] = useState(false);
  const [macroAnalytics, setMacroAnalytics] = useState<any | null>(null);

  useEffect(() => {
    // Fetch pantry ingredients
    fetch("http://localhost:8001/api/ingredients")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load pantry from server.");
        }
        return res.json();
      })
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

    // Fetch meal plans
    const userId = user?.email || "default_user";
    fetch(`http://localhost:8001/api/meal-plans?user_id=${userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load meal plans.");
        }
        return res.json();
      })
      .then((data: any[]) => {
        setMealPlans(data);
      })
      .catch((err) => {
        console.error("Failed to fetch meal plans:", err);
      });
  }, [user]);

  // Play browser audio beep alarm
  const playBrowserAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio blocked until interaction", e);
    }
  };

  // Check for expiring item alerts on load and trigger audio/browser notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    fetch("http://localhost:8001/api/alerts/expiring")
      .then((res) => res.json())
      .then((data) => {
        if (data.has_alerts && data.expiring_items.length > 0) {
          const itemNames = data.expiring_items.map((i: any) => i.name).join(", ");
          
          playBrowserAlarm();
          showToast(`🚨 ALARM: Expiring items detected: ${itemNames}`, "error");

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🚨 KitchenOS Expiry Alarm", {
              body: `The following items are expiring soon: ${itemNames}. Check your pantry!`,
              icon: "🥕"
            });
          }
        }
      })
      .catch((err) => console.error("Failed to fetch expiry alerts:", err));

    // Also fetch initial second life remedies count on mount to populate the blinking badge if items exist
    fetchSecondLifeRemedies();
  }, []);

  // Fetch contextual tab data when active tab changes
  useEffect(() => {
    if (activeTab === "shopping") {
      fetchSmartShoppingList();
    } else if (activeTab === "secondlife") {
      fetchSecondLifeRemedies();
    }
  }, [activeTab]);

  const fetchRecipeSearch = async (itemName: string, spices: string, cuisine: string) => {
    try {
      const res = await fetch(`http://localhost:8001/api/recipes/generate?item=${encodeURIComponent(itemName)}&spices=${encodeURIComponent(spices)}&cuisine=${encodeURIComponent(cuisine)}`);
      if (!res.ok) throw new Error("Failed to generate AI recipe");
      const data = await res.json();
      setRecipeDashboardData(data);
    } catch (err) {
      console.error(err);
      showToast("Could not generate AI recipe.", "error");
    }
  };

  const fetchSecondLifeRemedies = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/second-life/remedies");
      if (!res.ok) throw new Error("Failed to load second life remedies");
      const data = await res.json();
      const remedies = data.remedies || [];
      const expiredItemsCount = remedies.filter((r: any) => r.category.includes("Expired")).length;
      
      setSecondLifeRemedies(remedies);
      setExpiredCount(expiredItemsCount);
      
      const pantryRes = await fetch("http://localhost:8001/api/ingredients");
      if (pantryRes.ok) {
        const pantryData = await pantryRes.json();
        setIngredients(pantryData.map((item: any) => ({
          id: item.id,
          name: item.name,
          icon: item.icon || "📦",
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          expiryDate: item.expiry_date,
        })));
      }
    } catch (err) {
      console.error(err);
      showToast("Could not load second life remedies.", "error");
    }
  };

  const fetchSmartShoppingList = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/shopping/smart-list");
      if (!res.ok) throw new Error("Failed to load smart shopping list");
      const data = await res.json();
      setSmartShopping(data);
    } catch (err) {
      console.error(err);
      showToast("Could not generate smart shopping list.", "error");
    }
  };

  // =========================================================
  // INTEGRATED BACKEND FEATURE HANDLERS
  // =========================================================

  const fetchFreshnessAudit = async () => {
    setIsFreshnessLoading(true);
    try {
      const res = await fetch("http://localhost:8001/api/spoilage/freshness");
      if (!res.ok) throw new Error("Failed to load freshness audit");
      const data = await res.json();
      setFreshnessAudit(data);
      setIsFreshnessModalOpen(true);
      showToast("Deterministic Spoilage Engine audit loaded!", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not load spoilage freshness audit.", "error");
    } finally {
      setIsFreshnessLoading(false);
    }
  };

  const handleZeroWasteChef = async () => {
    setIsZeroWasteLoading(true);
    showToast("Zero-Waste Chef analyzing expiring stock...", "info");
    try {
      const res = await fetch("http://localhost:8001/api/recipes/zero-waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuisine: selectedCuisinePref,
          spices: selectedSpicePref,
          dietary_pref: "Zero-Waste Spoilage Prevention Priority"
        })
      });
      if (!res.ok) throw new Error("Failed to generate zero waste recipe");
      const data = await res.json();
      setSelectedExpiringItem(data.expiring_item || "Pantry Urgent Items");
      setRecipeDashboardData(data);
      showToast(`Generated: ${data.title || "Zero-Waste Recipe"}!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Could not generate zero-waste recipe.", "error");
    } finally {
      setIsZeroWasteLoading(false);
    }
  };

  const handleVoiceCommand = async (cmdText?: string) => {
    const textToSend = cmdText || voiceInput;
    if (!textToSend.trim()) {
      showToast("Please enter or speak a kitchen command.", "error");
      return;
    }
    setIsVoiceProcessing(true);
    showToast("Processing kitchen voice command...", "info");
    try {
      const res = await fetch("http://localhost:8001/api/voice/process-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend,
          user_id: user?.email || "default_user",
          generate_audio: true
        })
      });
      if (!res.ok) throw new Error("Voice command failed");
      const data = await res.json();
      setLastVoiceResponse(data);
      showToast(data.confirmation_text || "Inventory updated verbally!", "success");

      // Play synthesized natural ElevenLabs audio response if available
      if (data.audio_base64) {
        try {
          const audio = new Audio(data.audio_base64);
          audio.play().catch(e => console.log("Audio playback blocked", e));
        } catch (e) {
          console.error("Audio playback error", e);
        }
      }

      // Refresh pantry inventory immediately
      const pRes = await fetch("http://localhost:8001/api/ingredients");
      if (pRes.ok) {
        const pData = await pRes.json();
        setIngredients(pData.map((item: any) => ({
          id: item.id,
          name: item.name,
          icon: item.icon || "📦",
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          expiryDate: item.expiry_date,
        })));
      }
    } catch (err) {
      console.error(err);
      showToast("Voice logging failed.", "error");
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  const handleGenerateWeeklyMealPlan = async (goal: string = "High Protein") => {
    setIsMealPlanLoading(true);
    showToast(`Generating ${goal} meal plan from unexpired pantry...`, "info");
    try {
      const res = await fetch("http://localhost:8001/api/meal-plans/generate-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dietary_goals: [goal, "High Fiber"],
          calorie_target: 2000,
          family_size: 2,
          user_id: user?.email || "default_user",
          auto_save: true
        })
      });
      if (!res.ok) throw new Error("Failed to generate meal plan");
      const data = await res.json();
      setMacroAnalytics(data.macro_analytics);

      // Refresh meal plans
      const userId = user?.email || "default_user";
      const mpRes = await fetch(`http://localhost:8001/api/meal-plans?user_id=${userId}`);
      if (mpRes.ok) {
        const mpData = await mpRes.json();
        setMealPlans(mpData);
      }
      showToast("Weekly meal plan & macro analytics generated!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate weekly meal plan.", "error");
    } finally {
      setIsMealPlanLoading(false);
    }
  };

  const handleStartVoiceListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech recognition not supported in this browser. Please type your command.", "info");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => showToast("🎙️ Listening... Speak your kitchen update!", "info");
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceInput(text);
        showToast(`Heard: "${text}"`, "success");
      };
      recognition.onerror = (e: any) => {
        console.error("Speech error", e);
        showToast("Speech error or microphone permission denied.", "error");
      };
      recognition.start();
    } catch (err) {
      console.error(err);
      showToast("Speech recognition unavailable.", "error");
    }
  };

  // =========================================================
  // EXPORT & SHARE HELPERS
  // =========================================================

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast(`${label} copied to clipboard!`, "success"))
      .catch(() => showToast("Failed to copy to clipboard.", "error"));
  };

  const handleWhatsAppShare = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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

  const handleGetStarted = () => {
    setInApp(true);
    setActiveTab("home");
    setShowProfileDashboard(false);
    showToast("Welcome to KitchenOS!", "success");
  };

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setNameInput("");
    setEmailInput("");
    setPasswordInput("");
    setConfirmPasswordInput("");
    setPhoneInput("");
    setAuthError("");
    setShowProfileDashboard(false);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
    setAuthError("");
  };

  const handleAuthSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");

    const name = nameInput.trim();
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;
    const phone = phoneInput.trim();

    if (!email || !password) {
      setAuthError("Please fill out all required fields.");
      showToast("Please fill out all required fields.", "error");
      return;
    }

    if (authMode === "signup") {
      if (!name || password.length < 6 || password !== confirmPasswordInput) {
        setAuthError("Please check your input details and password match.");
        showToast("Please check your input details.", "error");
        return;
      }

      try {
        const response = await fetch("http://localhost:8001/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            phone_number: phone || null,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setAuthError(data.message || "Registration failed");
          showToast(data.message || "Registration failed", "error");
          return;
        }

        const account: StoredAccount = { name, email, password };
        const accountUser: User = { name, email };

        localStorage.setItem("kitchenos_account", JSON.stringify(account));
        localStorage.setItem("kitchenos_user", JSON.stringify(accountUser));
        setUser(accountUser);
        setIsAuthOpen(false);
        setActiveTab("home");
        setInApp(true);
        showToast(`Welcome, ${name}!`, "success");
      } catch (err) {
        console.error("Registration error:", err);
        setAuthError("Failed to connect to server");
        showToast("Failed to connect to server", "error");
      }
      return;
    }

    const savedAccount = localStorage.getItem("kitchenos_account");
    if (!savedAccount) {
      setAuthError("No account found. Please sign up.");
      showToast("No account found.", "error");
      return;
    }

    try {
      const account = JSON.parse(savedAccount) as StoredAccount;
      if (account.email !== email || account.password !== password) {
        setAuthError("Invalid email or password.");
        showToast("Invalid credentials.", "error");
        return;
      }

      const signedInUser: User = { name: account.name, email: account.email };
      localStorage.setItem("kitchenos_user", JSON.stringify(signedInUser));
      setUser(signedInUser);
      setIsAuthOpen(false);
      setActiveTab("home");
      setInApp(true);
      showToast(`Welcome back, ${signedInUser.name}!`, "success");
    } catch {
      setAuthError("Error reading account data.");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("kitchenos_user");
    setUser(null);
    setShowProfileDashboard(false);
    setActiveTab("home");
    setInApp(true);
    showToast("Signed out successfully.", "success");
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const difference = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return difference >= 0 && difference <= 3;
  };

  const isLowStock = (ingredient: Ingredient) => ingredient.quantity <= 2;

  const expiringIngredients = ingredients.filter((ingredient) => isExpiringSoon(ingredient.expiryDate));
  const lowStockIngredients = ingredients.filter((ingredient) => isLowStock(ingredient));

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ingredient) => {
      const matchesSearch = ingredient.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || ingredient.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, search, selectedCategory]);

  const deleteIngredient = (id: number) => {
    const ingredient = ingredients.find((item) => item.id === id);
    setIngredients((current) => current.filter((item) => item.id !== id));
    if (ingredient) {
      showToast(`${ingredient.name} removed from your pantry.`, "success");
    }
  };

  const handleAddIngredient = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newIngredient.name.trim() || !newIngredient.quantity || !newIngredient.expiryDate) {
      showToast("Please complete all ingredient details.", "error");
      return;
    }

    const payload = {
      name: newIngredient.name.trim(),
      icon: newIngredient.category === "Vegetables" ? "🥕" : newIngredient.category === "Dairy" ? "🥛" : newIngredient.category === "Grains" ? "🍚" : "🥫",
      category: newIngredient.category,
      quantity: Number(newIngredient.quantity),
      unit: newIngredient.unit,
      expiry_date: newIngredient.expiryDate,
      user_id: user?.email || "default_user",
    };

    try {
      const response = await fetch("http://localhost:8001/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save ingredient");
      const savedItem = await response.json();

      setIngredients((current) => [
        {
          id: savedItem.id,
          name: savedItem.name,
          icon: savedItem.icon,
          category: savedItem.category,
          quantity: savedItem.quantity,
          unit: savedItem.unit,
          expiryDate: savedItem.expiry_date,
        },
        ...current,
      ]);

      setNewIngredient({ name: "", category: "Vegetables", quantity: "", unit: "pcs", expiryDate: "" });
      setIsAddOpen(false);
      showToast(`${savedItem.name} added successfully!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add ingredient.", "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setIsScanning(true);
    showToast("Analyzing grocery image with YOLOv8...", "info");

    try {
      const response = await fetch("http://localhost:8001/api/scan-grocery", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Scan failed");
      const data = await response.json();
      showToast(`Scanned! Found ${data.items_found} items.`, "success");

      const res = await fetch("http://localhost:8001/api/ingredients");
      if (res.ok) {
        const jsonList = await res.json();
        setIngredients(jsonList.map((item: any) => ({
          id: item.id,
          name: item.name,
          icon: item.icon || "📦",
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          expiryDate: item.expiry_date,
        })));
      }
    } catch (err) {
      console.error(err);
      showToast("Error scanning image.", "error");
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  const handleAddMealPlan = async () => {
    if (!mealInput.recipe_name.trim()) {
      showToast("Please enter a meal name.", "error");
      return;
    }

    const payload = {
      day: selectedDay,
      meal_type: mealInput.meal_type,
      recipe_name: mealInput.recipe_name.trim(),
      user_id: user?.email || "default_user",
    };

    try {
      const response = await fetch("http://localhost:8001/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed");
      const savedPlan = await response.json();
      setMealPlans((current) => [...current, savedPlan]);
      setMealInput({ meal_type: "Lunch", recipe_name: "" });
      showToast(`Meal added for ${selectedDay}!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save meal plan.", "error");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // =========================================================
  // HOME DASHBOARD
  // =========================================================

  const renderHome = () => (
    <div className="kos-dashboard">
      <section className="kos-greeting">
        <h1>{greeting.title}</h1>
        <p>{greeting.subtitle}</p>
      </section>

      <section className="kos-dashboard-actions">
        <button type="button" onClick={() => setActiveTab("pantry")} className="kos-dashboard-action">
          <span>🥕</span>
          <strong>PANTRY</strong>
        </button>
        <button type="button" onClick={() => setActiveTab("recipes")} className="kos-dashboard-action">
          <span>🍳</span>
          <strong>RECIPES</strong>
        </button>
        <button type="button" onClick={() => setActiveTab("planner")} className="kos-dashboard-action">
          <span>📅</span>
          <strong>MEAL PLAN</strong>
        </button>
        <button type="button" onClick={() => setActiveTab("shopping")} className="kos-dashboard-action">
          <span>🛒</span>
          <strong>SHOPPING</strong>
        </button>
      </section>

      <div className="kos-dashboard-divider" />

      {expiringIngredients.length > 0 ? (
        <div className="kos-ingredient-card" style={{ flexDirection: "column", gap: "10px", padding: "16px", marginBottom: "20px", background: "rgba(255, 100, 100, 0.25)", border: "1px solid rgba(255, 100, 100, 0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Expiry Alert</h3>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#fff" }}>
            You have <strong>{expiringIngredients.length}</strong> ingredient(s) expiring soon: {expiringIngredients.map(i => i.name).join(", ")}.
          </p>
          <button type="button" onClick={() => setActiveTab("recipes")} className="kos-modal-submit" style={{ padding: "6px 12px", width: "fit-content", margin: 0, fontSize: "12px" }}>
            Generate AI Recipe →
          </button>
        </div>
      ) : (
        <div className="kos-ingredient-card" style={{ flexDirection: "column", gap: "8px", padding: "14px", marginBottom: "20px", background: "rgba(255, 255, 255, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>✨</span>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#fff" }}>All Pantry Items Fresh</h3>
          </div>
          <p style={{ margin: 0, fontSize: "12px", opacity: 0.9, color: "#fff" }}>
            No items are expiring within the next 3 days. Your kitchen stock is optimal!
          </p>
        </div>
      )}
    </div>
  );

  // =========================================================
  // PANTRY TAB
  // =========================================================

  const renderPantry = () => (
    <div className="kos-pantry-dashboard">
      <section className="kos-page-heading">
        <div>
          <span className="kos-page-icon">🥕</span>
          <h1>Pantry</h1>
          <p>Everything in your kitchen, organized.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className="kos-add-button"
            onClick={() => setIsVoiceModalOpen(true)}
            title="Voice Inventory Logging (ElevenLabs Speech)"
            style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}
          >
            🎙️
          </button>
          <button
            type="button"
            className="kos-add-button"
            onClick={fetchFreshnessAudit}
            title="Deterministic Spoilage Engine Freshness Audit"
            style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}
          >
            🔬
          </button>
          <label className="kos-add-button" title="Scan Grocery Image (YOLOv8)" style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.3)", fontSize: "18px" }}>
            📷
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={isScanning} />
          </label>
          <button type="button" className="kos-add-button" onClick={() => setIsAddOpen(true)} style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            +
          </button>
        </div>
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
        <input type="text" placeholder="Search ingredients..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <section className="kos-category-section">
        <p className="kos-small-heading">CATEGORIES</p>
        <div className="kos-category-scroll">
          {categories.map((category) => (
            <button type="button" key={category} onClick={() => setSelectedCategory(category)} className={`kos-category-button ${selectedCategory === category ? "is-selected" : ""}`}>
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="kos-ingredient-section">
        <div className="kos-list-heading">
          <p className="kos-small-heading">YOUR PANTRY</p>
          <span>{filteredIngredients.length} items</span>
        </div>

        {filteredIngredients.length === 0 ? (
          <div className="kos-empty-state">
            <span>🥣</span>
            <h3>No ingredients found</h3>
            <p>Try another search or add a new ingredient.</p>
          </div>
        ) : (
          <div className="kos-ingredient-list">
            {filteredIngredients.map((ingredient) => {
              const expiring = isExpiringSoon(ingredient.expiryDate);
              const lowStock = isLowStock(ingredient);
              return (
                <div className={`kos-ingredient-card ${expiring ? "is-expiring" : ""}`} key={ingredient.id}>
                  <div className="kos-ingredient-icon">{ingredient.icon}</div>
                  <div className="kos-ingredient-info">
                    <h3>{ingredient.name}</h3>
                    <p>{ingredient.quantity} {ingredient.unit}</p>
                    <small>{expiring ? "⚠️ Use soon" : `Expires ${formatDate(ingredient.expiryDate)}`}</small>
                  </div>
                  <div className="kos-ingredient-right">
                    {lowStock && <span className="kos-low-stock">Low</span>}
                    <button type="button" onClick={() => deleteIngredient(ingredient.id)} className="kos-delete-button">×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );

  // =========================================================
  // RECIPES TAB
  // =========================================================

  const renderRecipes = () => {
    return (
      <div className="kos-pantry-dashboard">
        <section className="kos-page-heading">
          <div>
            <span className="kos-page-icon">🍳</span>
            <h1>AI Recipe Generator</h1>
            <p>Select an expiring ingredient and your preferred spices/cuisine to generate instant recipes.</p>
          </div>
        </section>

        <div style={{ margin: "10px 0 16px" }}>
          <button
            type="button"
            className="kos-modal-submit"
            onClick={handleZeroWasteChef}
            disabled={isZeroWasteLoading}
            style={{ padding: "10px 18px", width: "100%", margin: 0, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            ⚡ {isZeroWasteLoading ? "Zero-Waste Chef Generating..." : "Zero-Waste Chef: Auto-Prioritize Expiring Stock"}
          </button>
        </div>

        <section className="kos-ingredient-section" style={{ margin: "15px 0" }}>
          <p className="kos-small-heading">SELECT EXPIRING SOON PRODUCT</p>
          {expiringIngredients.length === 0 ? (
            <div className="kos-empty-state" style={{ padding: "20px" }}>
              <span>✨</span>
              <p>No items currently expiring soon. All pantry stock is fresh!</p>
            </div>
          ) : (
            <div className="kos-category-scroll">
              {expiringIngredients.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setSelectedExpiringItem(item.name);
                    fetchRecipeSearch(item.name, selectedSpicePref, selectedCuisinePref);
                  }}
                  className={`kos-category-button ${selectedExpiringItem === item.name ? "is-selected" : ""}`}
                >
                  {item.icon} {item.name} (Exp: {formatDate(item.expiryDate)})
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="kos-category-section" style={{ margin: "15px 0" }}>
          <p className="kos-small-heading">SPICE PREFERENCE</p>
          <div className="kos-category-scroll">
            {spiceOptions.map((spice) => (
              <button
                type="button"
                key={spice}
                onClick={() => {
                  setSelectedSpicePref(spice);
                  if (selectedExpiringItem) {
                    fetchRecipeSearch(selectedExpiringItem, spice, selectedCuisinePref);
                  }
                }}
                className={`kos-category-button ${selectedSpicePref === spice ? "is-selected" : ""}`}
              >
                {spice}
              </button>
            ))}
          </div>
        </section>

        <section className="kos-category-section" style={{ margin: "15px 0" }}>
          <p className="kos-small-heading">CUISINE PREFERENCE</p>
          <div className="kos-category-scroll">
            {cuisines.map((cuisine) => (
              <button
                type="button"
                key={cuisine}
                onClick={() => {
                  setSelectedCuisinePref(cuisine);
                  if (selectedExpiringItem) {
                    fetchRecipeSearch(selectedExpiringItem, selectedSpicePref, cuisine);
                  }
                }}
                className={`kos-category-button ${selectedCuisinePref === cuisine ? "is-selected" : ""}`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </section>

        {selectedExpiringItem && (
          <div className="kos-ingredient-card" style={{ flexDirection: "column", gap: "14px", padding: "20px", marginTop: "20px", background: "rgba(255,255,255,0.15)" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>{recipeDashboardData?.title || `AI Recipe for: ${selectedExpiringItem}`}</h3>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.85 }}>
              Cuisine: <strong>{selectedCuisinePref}</strong> | Spices: <strong>{selectedSpicePref}</strong>
            </p>
            {recipeDashboardData && recipeDashboardData.recipe_text && (
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "14px", borderRadius: "8px", whiteSpace: "pre-line", fontSize: "13px", lineHeight: "1.5" }}>
                {recipeDashboardData.recipe_text}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // =========================================================
  // PLANNER TAB
  // =========================================================

  const renderPlanner = () => {
    const currentDayMeals = mealPlans.filter((p) => p.day === selectedDay);

    return (
      <div className="kos-pantry-dashboard">
        <section className="kos-page-heading">
          <div>
            <span className="kos-page-icon">📅</span>
            <h1>Meal Plan</h1>
            <p>Organize your weekly kitchen schedule day-wise.</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="kos-add-button"
              onClick={() => {
                const text = `📅 KitchenOS Meal Plan (${selectedDay}):\n` + 
                  currentDayMeals.map(m => `- ${m.meal_type}: ${m.recipe_name}`).join("\n");
                handleCopyText(text, `Meal plan for ${selectedDay}`);
              }}
              title="Copy Meal Plan"
              style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
            >
              📋
            </button>
            <button
              type="button"
              className="kos-add-button"
              onClick={() => {
                const text = `📅 KitchenOS Meal Plan (${selectedDay}):\n` + 
                  currentDayMeals.map(m => `- ${m.meal_type}: ${m.recipe_name}`).join("\n");
                handleWhatsAppShare(text);
              }}
              title="Share via WhatsApp"
              style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
            >
              💬
            </button>
          </div>
        </section>

        <div className="kos-category-scroll" style={{ margin: "15px 0" }}>
          {daysOfWeek.map((day) => (
            <button type="button" key={day} onClick={() => setSelectedDay(day)} className={`kos-category-button ${selectedDay === day ? "is-selected" : ""}`}>
              {day}
            </button>
          ))}
        </div>

        {/* AI Family Meal Planner Bar */}
        <div style={{ margin: "10px 0 16px 0" }}>
          <button
            type="button"
            className="kos-modal-submit"
            style={{ width: "100%", margin: 0, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            onClick={() => handleGenerateWeeklyMealPlan("Balanced High Protein & Fiber")}
            disabled={isMealPlanLoading}
          >
            <span>{isMealPlanLoading ? "⏳" : "⚡"}</span>
            <span>{isMealPlanLoading ? "Generating AI Plan..." : "Generate AI Family Meal Plan (Zero-Waste & Macro-Optimized)"}</span>
          </button>
        </div>

        {macroAnalytics && (
          <div className="kos-ingredient-card" style={{ flexDirection: "column", gap: "10px", padding: "16px", marginBottom: "20px", background: "rgba(255, 255, 255, 0.85)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#5a2111" }}>📊 Weekly Family Macro Analytics</h3>
              <span style={{ fontSize: "12px", color: "rgba(90,33,17,0.7)" }}>Targets Met: {macroAnalytics.macro_compliance_score || "100%"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))", gap: "8px", width: "100%" }}>
              <div style={{ padding: "8px", background: "rgba(90, 33, 17, 0.05)", borderRadius: "8px", textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#5a2111", fontWeight: 600 }}>Daily Avg</span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 800, color: "#5a2111" }}>{macroAnalytics.average_daily_calories || 2050} kcal</p>
              </div>
              <div style={{ padding: "8px", background: "rgba(90, 33, 17, 0.05)", borderRadius: "8px", textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#5a2111", fontWeight: 600 }}>Protein</span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 800, color: "#5a2111" }}>{macroAnalytics.average_daily_protein_g || 115}g</p>
              </div>
              <div style={{ padding: "8px", background: "rgba(90, 33, 17, 0.05)", borderRadius: "8px", textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#5a2111", fontWeight: 600 }}>Carbs</span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 800, color: "#5a2111" }}>{macroAnalytics.average_daily_carbs_g || 220}g</p>
              </div>
              <div style={{ padding: "8px", background: "rgba(90, 33, 17, 0.05)", borderRadius: "8px", textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#5a2111", fontWeight: 600 }}>Fats</span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 800, color: "#5a2111" }}>{macroAnalytics.average_daily_fat_g || 65}g</p>
              </div>
              <div style={{ padding: "8px", background: "rgba(90, 33, 17, 0.05)", borderRadius: "8px", textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#5a2111", fontWeight: 600 }}>Fiber</span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 800, color: "#5a2111" }}>{macroAnalytics.average_daily_fiber_g || 34}g</p>
              </div>
            </div>
            {macroAnalytics.dietary_notes && (
              <p style={{ margin: 0, fontSize: "12px", color: "rgba(90,33,17,0.8)", fontStyle: "italic" }}>
                💡 {macroAnalytics.dietary_notes}
              </p>
            )}
          </div>
        )}

        <div className="kos-ingredient-card" style={{ flexDirection: "column", gap: "10px", padding: "16px", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "16px" }}>Add Meal for {selectedDay}</h3>
          <div style={{ display: "flex", gap: "10px", width: "100%", flexWrap: "wrap" }}>
            <select
              value={mealInput.meal_type}
              onChange={(e) => setMealInput({ ...mealInput, meal_type: e.target.value })}
              style={{ padding: "8px", borderRadius: "8px", background: "#ffffff", color: "#5a2111", border: "1px solid rgba(90, 33, 17, 0.2)", fontWeight: 600, outline: "none" }}
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
            <input
              type="text"
              placeholder="Recipe or dish name..."
              value={mealInput.recipe_name}
              onChange={(e) => setMealInput({ ...mealInput, recipe_name: e.target.value })}
              style={{ flex: 1, minWidth: "180px", padding: "8px", borderRadius: "8px", background: "#ffffff", color: "#5a2111", border: "1px solid rgba(90, 33, 17, 0.2)", fontWeight: 600, outline: "none" }}
            />
            <button type="button" className="kos-modal-submit" style={{ padding: "8px 16px", margin: 0 }} onClick={handleAddMealPlan}>
              Add
            </button>
          </div>
        </div>

        <section className="kos-ingredient-section">
          <p className="kos-small-heading">SCHEDULE FOR {selectedDay.toUpperCase()}</p>
          {currentDayMeals.length === 0 ? (
            <div className="kos-empty-state">
              <span>🍽️</span>
              <h3>No meals planned</h3>
              <p>Add a meal above to fill your schedule for {selectedDay}.</p>
            </div>
          ) : (
            <div className="kos-ingredient-list">
              {currentDayMeals.map((meal, idx) => (
                <div className="kos-ingredient-card" key={meal.id || idx}>
                  <div className="kos-ingredient-icon">
                    {meal.meal_type === "Breakfast" ? "🥞" : meal.meal_type === "Lunch" ? "🍲" : "🌙"}
                  </div>
                  <div className="kos-ingredient-info">
                    <h3>{meal.recipe_name}</h3>
                    <p>{meal.meal_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  // =========================================================
  // SHOPPING TAB
  // =========================================================

  const renderShopping = () => {
    return (
      <div className="kos-pantry-dashboard">
        <section className="kos-page-heading">
          <div>
            <span className="kos-page-icon">🛒</span>
            <h1>Smart Shopping List</h1>
            <p>Missing items needed for expiring ingredients. Items already available in your pantry are excluded.</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="kos-add-button"
              onClick={() => {
                const text = `🛒 KitchenOS Smart Shopping List:\n` + 
                  (smartShopping?.shopping_list || []).map(i => `- ${i.name} (${i.quantity} ${i.unit})`).join("\n");
                handleCopyText(text, "Shopping list");
              }}
              title="Copy Shopping List"
              style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
            >
              📋
            </button>
            <button
              type="button"
              className="kos-add-button"
              onClick={() => {
                const text = `🛒 KitchenOS Smart Shopping List:\n` + 
                  (smartShopping?.shopping_list || []).map(i => `- ${i.name} (${i.quantity} ${i.unit})`).join("\n");
                handleWhatsAppShare(text);
              }}
              title="Share via WhatsApp"
              style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
            >
              💬
            </button>
            <button type="button" className="kos-add-button" onClick={fetchSmartShoppingList} title="Refresh List" style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
              🔄
            </button>
          </div>
        </section>

        {smartShopping && smartShopping.proposed_dish && (
          <div className="kos-ingredient-card" style={{ flexDirection: "column", gap: "8px", padding: "16px", margin: "16px 0", background: "rgba(255,255,255,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>{smartShopping.proposed_dish.icon}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px" }}>Suggested Dish: {smartShopping.proposed_dish.title}</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.9 }}>{smartShopping.proposed_dish.reason}</p>
              </div>
            </div>
          </div>
        )}

        <section className="kos-ingredient-section" style={{ marginTop: "20px" }}>
          <div className="kos-list-heading">
            <p className="kos-small-heading">ITEMS TO BUY</p>
            <span>{smartShopping?.shopping_list?.length || 0} items needed</span>
          </div>

          {!smartShopping || !smartShopping.shopping_list || smartShopping.shopping_list.length === 0 ? (
            <div className="kos-empty-state">
              <span>🛍️</span>
              <h3>Your shopping list is empty</h3>
              <p>You have all required items in your pantry!</p>
            </div>
          ) : (
            <div className="kos-ingredient-list">
              {smartShopping.shopping_list.map((item) => (
                <div className="kos-ingredient-card" key={item.id} style={{ alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="kos-ingredient-icon" style={{ fontSize: "22px" }}>📦</div>
                    <div className="kos-ingredient-info">
                      <h3 style={{ margin: 0, fontSize: "15px" }}>{item.name}</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.8 }}>{item.quantity} {item.unit} • {item.category}</p>
                    </div>
                  </div>

                  <a
                    href={item.buy_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#5a2111",
                      color: "#fff",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  >
                    🛒 Buy on {item.store} →
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  // =========================================================
  // SECOND LIFE HUB TAB
  // =========================================================

  const renderSecondLife = () => (
    <div className="kos-pantry-dashboard">
      <section className="kos-page-heading">
        <div>
          <span className="kos-page-icon">♻️</span>
          <h1>AI Second Life Hub</h1>
          <p>Expired items automatically migrate here with customized upcycling, cleaning, and composting guides.</p>
        </div>
      </section>

      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          className="kos-modal-submit"
          style={{ flex: 1, minWidth: "220px", margin: 0, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          onClick={async () => {
            showToast("Syncing expired inventory to Second Life Hub...", "info");
            try {
              const res = await fetch("http://localhost:8001/api/second-life/remedies?force_sync=true");
              if (res.ok) {
                const data = await res.json();
                setSecondLifeRemedies(data);
                showToast("Second Life Hub synced with latest expired goods!", "success");
              }
            } catch (e) {
              showToast("Failed to sync Second Life Hub.", "error");
            }
          }}
        >
          <span>♻️</span>
          <span>Auto-Scan & Upcycle Expired Stock</span>
        </button>
      </div>

      <section className="kos-ingredient-section" style={{ marginTop: "20px" }}>
        <div className="kos-list-heading">
          <p className="kos-small-heading">EXPIRED & REUSED ITEMS</p>
          <span>{secondLifeRemedies.length} items archived</span>
        </div>

        {secondLifeRemedies.length === 0 ? (
          <div className="kos-empty-state">
            <span>🌿</span>
            <h3>No expired items found</h3>
            <p>All your pantry items are fresh! Items past their expiry date will appear here automatically.</p>
          </div>
        ) : (
          <div className="kos-ingredient-list">
            {secondLifeRemedies.map((remedy) => (
              <div className="kos-ingredient-card" key={remedy.id} style={{ flexDirection: "column", gap: "10px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                  <div className="kos-ingredient-icon" style={{ fontSize: "24px" }}>{remedy.icon}</div>
                  <div className="kos-ingredient-info" style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>{remedy.title}</h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.85 }}>
                      {remedy.description}
                    </p>
                  </div>
                  <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                    {remedy.category}
                  </span>
                </div>

                <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px", fontSize: "12px", lineHeight: "1.5", whiteSpace: "pre-line", width: "100%" }}>
                  <strong>Action Steps:</strong>
                  <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                    {remedy.steps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderProfileDashboard = () => {
    if (!user) {
      return (
        <div className="kos-section-placeholder">
          <span>👤</span>
          <h2>Your Dashboard</h2>
          <p>Sign in to view your profile.</p>
          <button type="button" className="kos-modal-submit" onClick={() => openAuth("signin")}>
            Sign In
          </button>
        </div>
      );
    }

    return (
      <div className="kos-profile-dashboard">
        <section className="kos-profile-dashboard-heading">
          <div>
            <span className="kos-profile-dashboard-eyebrow">MY KITCHENOS</span>
            <h1>{greeting.title}</h1>
            <p>Your personal kitchen dashboard.</p>
          </div>
          <div className="kos-profile-avatar kos-profile-avatar-large">
            {getInitials(user.name)}
          </div>
        </section>

        <section className="kos-profile-card">
          <div className="kos-profile-card-avatar">{getInitials(user.name)}</div>
          <div className="kos-profile-card-info">
            <span className="kos-profile-card-label">PROFILE</span>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </section>

        <button type="button" className="kos-profile-signout-dashboard" onClick={handleSignOut}>
          ↪ Sign Out
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <style>{`
        @keyframes kosBlink {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.12); }
          100% { opacity: 1; transform: scale(1); }
        }
        .kos-blink-badge {
          background-color: #ff3b30;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 50px;
          animation: kosBlink 1.2s infinite ease-in-out;
          box-shadow: 0 0 10px rgba(255, 59, 48, 0.9);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 6px;
          vertical-align: middle;
        }
      `}</style>

      <div className="kos-toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`kos-toast kos-toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
            <span className="kos-toast-icon">{toast.type === "success" ? "✓" : toast.type === "error" ? "!" : "i"}</span>
            <span className="kos-toast-message">{toast.message}</span>
            <button type="button" className="kos-toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      {!inApp ? (
        <LandingPage onGetStarted={handleGetStarted} />
      ) : (
        <main className="kos-app">
          <img src="/images/kitchen-hero.png" alt="" className="kos-app-kitchen-image" draggable={false} />
          <div className="kos-app-overlay" />

          <div className="kos-app-content">
            <header className="kos-dashboard-header">
              <div>
                <button type="button" className="kos-logo-button" onClick={() => { setActiveTab("home"); setShowProfileDashboard(false); }}>
                  KITCHENOS
                </button>
                <p>Smart Kitchen</p>
              </div>

              <div className="kos-account-wrapper">
                {user ? (
                  <button type="button" className="kos-profile-button" onClick={() => setShowProfileDashboard(true)}>
                    <span className="kos-profile-avatar">{getInitials(user.name)}</span>
                    <span className="kos-profile-name">{user.name.split(" ")[0]}</span>
                    <span className="kos-profile-arrow">→</span>
                  </button>
                ) : (
                  <button type="button" className="kos-sign-in" onClick={() => openAuth("signin")}>
                    Sign In
                  </button>
                )}
              </div>
            </header>

            <section className="kos-main-section">
              {showProfileDashboard
                ? renderProfileDashboard()
                : activeTab === "home"
                ? renderHome()
                : activeTab === "pantry"
                ? renderPantry()
                : activeTab === "recipes"
                ? renderRecipes()
                : activeTab === "planner"
                ? renderPlanner()
                : activeTab === "shopping"
                ? renderShopping()
                : activeTab === "secondlife"
                ? renderSecondLife()
                : null}
            </section>

            <NavigationDock
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setShowProfileDashboard(false);
                if (tab === "secondlife") {
                  setExpiredCount(0);
                }
              }}
              expiredCount={expiredCount}
            />
          </div>

          {/* ADD INGREDIENT MODAL */}
          {isAddOpen && (
            <div className="kos-auth-backdrop" onClick={() => setIsAddOpen(false)}>
              <div className="kos-auth-modal kos-add-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="kos-auth-close" onClick={() => setIsAddOpen(false)}>×</button>
                <div className="kos-modal-icon">🥕</div>
                <h2>Add Ingredient</h2>
                <form onSubmit={handleAddIngredient}>
                  <label className="kos-modal-label">
                    Ingredient Name
                    <input type="text" placeholder="e.g. Potatoes" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} />
                  </label>

                  <label className="kos-modal-label">
                    Category
                    <select value={newIngredient.category} onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}>
                      {categories.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>

                  <div className="kos-form-row">
                    <label className="kos-modal-label">
                      Quantity
                      <input type="number" min="1" value={newIngredient.quantity} onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })} />
                    </label>

                    <label className="kos-modal-label">
                      Unit
                      <select value={newIngredient.unit} onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}>
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                      </select>
                    </label>
                  </div>

                  <label className="kos-modal-label">
                    Expiry Date
                    <input type="date" value={newIngredient.expiryDate} onChange={(e) => setNewIngredient({ ...newIngredient, expiryDate: e.target.value })} />
                  </label>

                  <button type="submit" className="kos-modal-submit">Add to Pantry</button>
                </form>
              </div>
            </div>
          )}

          {/* AUTH MODAL */}
          {isAuthOpen && (
            <div className="kos-auth-backdrop" onClick={closeAuth}>
              <div className="kos-auth-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="kos-auth-close" onClick={closeAuth}>×</button>
                <div className="kos-modal-icon">{authMode === "signup" ? "👋" : "🏠"}</div>
                <h2>{authMode === "signup" ? "Create your account" : "Welcome back"}</h2>
                <form onSubmit={handleAuthSubmit}>
                  {authMode === "signup" && (
                    <label className="kos-modal-label">
                      Your Name
                      <input type="text" placeholder="Enter your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
                    </label>
                  )}

                  <label className="kos-modal-label">
                    Email
                    <input type="email" placeholder="you@example.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
                  </label>

                  <label className="kos-modal-label">
                    Password
                    <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
                  </label>

                  {authMode === "signup" && (
                    <>
                      <label className="kos-modal-label">
                        Confirm Password
                        <input type="password" placeholder="Confirm Password" value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} />
                      </label>

                      <label className="kos-modal-label">
                        Phone Number (optional)
                        <input type="tel" placeholder="+919876543210" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
                      </label>
                    </>
                  )}

                  {authError && <div className="kos-auth-error">{authError}</div>}

                  <button type="submit" className="kos-modal-submit">
                    {authMode === "signup" ? "Create Account" : "Sign In"}
                  </button>
                </form>

                <div className="kos-auth-switch">
                  {authMode === "signup" ? "Already have an account?" : "New to KitchenOS?"}
                  <button type="button" onClick={() => openAuth(authMode === "signup" ? "signin" : "signup")}>
                    {authMode === "signup" ? "Sign In" : "Create Account"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VOICE INVENTORY LOGGING MODAL */}
          {isVoiceModalOpen && (
            <div className="kos-auth-backdrop" onClick={() => setIsVoiceModalOpen(false)}>
              <div className="kos-auth-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
                <button type="button" className="kos-auth-close" onClick={() => setIsVoiceModalOpen(false)}>×</button>
                <div className="kos-modal-icon">🎙️</div>
                <h2>Voice Inventory Logging</h2>
                <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(90, 33, 17, 0.8)", margin: "0 0 16px" }}>
                  Hands-free natural speech updates. Log pantry additions, partial consumptions, or discards.
                </p>

                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="kos-add-button"
                    onClick={handleStartVoiceListening}
                    style={{ borderRadius: "10px", width: "auto", height: "auto", padding: "8px 14px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <span>🎙️</span>
                    <span>Tap to Speak</span>
                  </button>
                  <button
                    type="button"
                    className="kos-category-button is-selected"
                    onClick={() => setVoiceInput("Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge")}
                    style={{ fontSize: "11px", padding: "6px 10px" }}
                  >
                    Quick Sample
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleVoiceCommand(voiceInput); }}>
                  <label className="kos-modal-label">
                    Natural Language Command
                    <textarea
                      rows={3}
                      placeholder='e.g., "Used half the paneer, added 1kg basmati rice, and threw away spoiled milk"'
                      value={voiceInput}
                      onChange={(e) => setVoiceInput(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(90, 33, 17, 0.2)",
                        background: "#ffffff",
                        color: "#5a2111",
                        fontFamily: "inherit",
                        fontSize: "13px",
                        resize: "vertical",
                        boxSizing: "border-box"
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    className="kos-modal-submit"
                    disabled={isVoiceProcessing || !voiceInput.trim()}
                    style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <span>{isVoiceProcessing ? "⏳" : "⚡"}</span>
                    <span>{isVoiceProcessing ? "Processing Speech..." : "Process Kitchen Update"}</span>
                  </button>
                </form>

                {lastVoiceResponse && (
                  <div style={{ marginTop: "16px", padding: "12px", background: "rgba(90, 33, 17, 0.05)", borderRadius: "10px", fontSize: "13px", color: "#5a2111" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong>Summary:</strong>
                      {lastVoiceResponse.audio_base64 && (
                        <button
                          type="button"
                          className="kos-add-button"
                          onClick={() => {
                            const audio = new Audio(lastVoiceResponse.audio_base64);
                            audio.play().catch(console.error);
                          }}
                          style={{ width: "auto", height: "auto", padding: "4px 8px", fontSize: "11px", borderRadius: "6px" }}
                        >
                          🔊 Replay Audio
                        </button>
                      )}
                    </div>
                    <p style={{ margin: "0 0 8px" }}>{lastVoiceResponse.natural_summary}</p>
                    {lastVoiceResponse.added_items && lastVoiceResponse.added_items.length > 0 && (
                      <p style={{ margin: "2px 0", fontSize: "12px" }}>
                        ✅ <strong>Added:</strong> {lastVoiceResponse.added_items.map((i: any) => `${i.quantity} ${i.unit} ${i.name}`).join(", ")}
                      </p>
                    )}
                    {lastVoiceResponse.consumed_items && lastVoiceResponse.consumed_items.length > 0 && (
                      <p style={{ margin: "2px 0", fontSize: "12px" }}>
                        🍳 <strong>Consumed:</strong> {lastVoiceResponse.consumed_items.map((i: any) => `${i.percentage_used ? i.percentage_used + '% of' : i.amount_used} ${i.name}`).join(", ")}
                      </p>
                    )}
                    {lastVoiceResponse.discarded_items && lastVoiceResponse.discarded_items.length > 0 && (
                      <p style={{ margin: "2px 0", fontSize: "12px" }}>
                        🗑️ <strong>Discarded:</strong> {lastVoiceResponse.discarded_items.map((i: any) => i.name).join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETERMINISTIC SPOILAGE ENGINE FRESHNESS MODAL */}
          {isFreshnessModalOpen && (
            <div className="kos-auth-backdrop" onClick={() => setIsFreshnessModalOpen(false)}>
              <div className="kos-auth-modal" style={{ maxWidth: "600px", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <button type="button" className="kos-auth-close" onClick={() => setIsFreshnessModalOpen(false)}>×</button>
                <div className="kos-modal-icon">🔬</div>
                <h2>Deterministic Spoilage Engine</h2>
                <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(90, 33, 17, 0.8)", margin: "0 0 16px" }}>
                  Real-time countdowns & non-linear freshness degradation curve calibrated with USDA FoodKeeper & Indian staple shelf-lives.
                </p>

                {freshnessAudit ? (
                  <div>
                    {/* Metrics Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "16px" }}>
                      <div style={{ padding: "8px", background: "rgba(90, 33, 17, 0.05)", borderRadius: "8px", textAlign: "center" }}>
                        <span style={{ fontSize: "10px", color: "#5a2111", fontWeight: 700 }}>AVG FRESHNESS</span>
                        <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 800, color: "#5a2111" }}>{freshnessAudit.average_freshness_pct}%</p>
                      </div>
                      <div style={{ padding: "8px", background: "rgba(22, 101, 52, 0.08)", borderRadius: "8px", textAlign: "center" }}>
                        <span style={{ fontSize: "10px", color: "#166534", fontWeight: 700 }}>FRESH</span>
                        <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 800, color: "#166534" }}>{freshnessAudit.fresh_count || 0}</p>
                      </div>
                      <div style={{ padding: "8px", background: "rgba(180, 83, 9, 0.08)", borderRadius: "8px", textAlign: "center" }}>
                        <span style={{ fontSize: "10px", color: "#b45309", fontWeight: 700 }}>EXPIRING SOON</span>
                        <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 800, color: "#b45309" }}>{freshnessAudit.expiring_soon_count || 0}</p>
                      </div>
                      <div style={{ padding: "8px", background: "rgba(185, 28, 28, 0.08)", borderRadius: "8px", textAlign: "center" }}>
                        <span style={{ fontSize: "10px", color: "#b91c1c", fontWeight: 700 }}>EXPIRED</span>
                        <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 800, color: "#b91c1c" }}>{freshnessAudit.expired_count || 0}</p>
                      </div>
                    </div>

                    {/* Freshness Item List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {freshnessAudit.items && freshnessAudit.items.map((item: any, idx: number) => {
                        const pct = item.freshness_percentage ?? 100;
                        const isExp = item.countdown?.is_expired;
                        const barColor = isExp ? "#b91c1c" : pct < 35 ? "#dc2626" : pct < 70 ? "#d97706" : "#16a34a";
                        return (
                          <div key={idx} style={{ padding: "10px 14px", background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(90, 33, 17, 0.12)", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "18px" }}>{item.icon || "📦"}</span>
                                <div>
                                  <strong style={{ fontSize: "13px", color: "#5a2111" }}>{item.name}</strong>
                                  <span style={{ fontSize: "11px", color: "rgba(90, 33, 17, 0.6)", marginLeft: "6px" }}>({item.quantity} {item.unit})</span>
                                </div>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: barColor }}>
                                {isExp ? "Expired" : `${pct}% Fresh`}
                              </span>
                            </div>

                            {/* Decay Progress Bar */}
                            <div style={{ width: "100%", height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "3px", overflow: "hidden", marginBottom: "6px" }}>
                              <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: barColor, borderRadius: "3px", transition: "width 0.3s" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(90, 33, 17, 0.75)" }}>
                              <span>⏱️ {item.countdown?.display || (isExp ? "Expired" : "Fresh")}</span>
                              <span>📍 {item.storage_location || "pantry"}</span>
                            </div>

                            {item.storage_tip && (
                              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(90, 33, 17, 0.85)", fontStyle: "italic" }}>
                                💡 {item.storage_tip}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <p>Loading freshness data from Spoilage Engine...</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    className="kos-modal-submit"
                    onClick={fetchFreshnessAudit}
                    style={{ flex: 1, margin: 0 }}
                  >
                    🔄 Recalculate Decay Timelines
                  </button>
                  <button
                    type="button"
                    className="kos-add-button"
                    onClick={() => {
                      setIsFreshnessModalOpen(false);
                      setActiveTab("recipes");
                      handleZeroWasteChef();
                    }}
                    style={{ width: "auto", height: "auto", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 700 }}
                  >
                    ⚡ Cook Expiring Stock
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