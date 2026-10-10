
// ==================================
// ROADMAP - GAME LOGIC
// ==================================

const STORAGE_KEY = "roadmap-game-v1";

const xpRewards = {
  easy: 20,
  medium: 50,
  hard: 100
};

const categoryLabels = {
  study: "📚 STUDY",
  health: "🌿 HEALTH",
  career: "✦ CAREER",
  personal: "☀ PERSONAL"
};

const defaultQuests = [
  {
    id: 1,
    title: "Plan your week",
    category: "personal",
    difficulty: "easy",
    completed: false,
    completedAt: null
  },
  {
    id: 2,
    title: "Finish a study session",
    category: "study",
    difficulty: "medium",
    completed: false,
    completedAt: null
  },
  {
    id: 3,
    title: "Work on a personal project",
    category: "career",
    difficulty: "hard",
    completed: false,
    completedAt: null
  }
];

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && Array.isArray(saved.quests)) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not load saved game:", error);
  }

  return {
    quests: defaultQuests,
    totalXp: 0
  };
}

let game = loadGame();
let currentFilter = "all";

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
}

// ==================================
// XP AND LEVELS
// ==================================

function getLevel() {
  return Math.floor(game.totalXp / 100) + 1;
}

function getLevelProgress() {
  return game.totalXp % 100;
}

function getCompletedQuests() {
  return game.quests.filter(quest => quest.completed);
}

// Consecutive calendar days with completed quests.
// Multiple quests on one day count as one day.

function getStreak() {
  const dates = new Set(
    getCompletedQuests()
      .filter(q => q.completedAt)
      .map(q => {
        const d = new Date(q.completedAt);
        return [
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, "0"),
          String(d.getDate()).padStart(2, "0")
        ].join("-");
      })
  );

  let streak = 0;
  const day = new Date();
  day.setHours(0, 0, 0, 0);

  // A streak remains active until the end of the next day.
  const todayKey = localDateKey(day);

  if (!dates.has(todayKey)) {
    day.setDate(day.getDate() - 1);
    if (!dates.has(localDateKey(day))) return 0;
  }

  while (dates.has(localDateKey(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }

  return streak;
}

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

// ==================================
// UPDATE DASHBOARD
// ==================================

function updateDashboard() {
  const level = getLevel();
  const progress = getLevelProgress();
  const completed = getCompletedQuests().length;

  document.getElementById("headerLevel").textContent =
    `LVL ${level}`;

  document.getElementById("levelText").textContent =
    `LEVEL ${String(level).padStart(2, "0")}`;

  document.getElementById("xpText").textContent =
    `${progress} / 100 XP`;

  document.getElementById("xpFill").style.width =
    `${progress}%`;

  document.getElementById("completedStat").textContent =
    completed;

  document.getElementById("streakStat").textContent =
    getStreak();

  document.getElementById("totalXpStat").textContent =
    game.totalXp;

  updateAchievements();
}

// ==================================
// RENDER QUESTS
// ==================================

function renderQuests() {
  const grid = document.getElementById("questGrid");
  grid.replaceChildren();

  let quests = game.quests;

  if (currentFilter === "active") {
    quests = quests.filter(q => !q.completed);
  }

  if (currentFilter === "completed") {
    quests = quests.filter(q => q.completed);
  }

  if (quests.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "✦ No quests here yet. Your adventure awaits!";
    grid.appendChild(empty);
    return;
  }

  quests.forEach(quest => {
    const card = document.createElement("article");
    card.className =
      `quest-card ${quest.completed ? "completed" : ""}`;

    const top = document.createElement("div");
    top.className = "quest-card-top";

    const category = document.createElement("span");
    category.className = "quest-category";
    category.textContent =
      categoryLabels[quest.category] || "✦ OTHER";

    const xp = document.createElement("span");
    xp.className = "quest-xp";
    xp.textContent =
      `+${xpRewards[quest.difficulty] || 20} XP`;

    top.append(category, xp);

    const title = document.createElement("h3");
    title.textContent = quest.title;

    const difficulty = document.createElement("div");
    difficulty.className = "quest-difficulty";
    difficulty.textContent =
      `DIFFICULTY: ${quest.difficulty.toUpperCase()}`;

    const button = document.createElement("button");
    button.className = "quest-complete";
    button.textContent = quest.completed
      ? "✓ QUEST COMPLETED"
      : "✓ COMPLETE QUEST";

    button.disabled = quest.completed;

    if (!quest.completed) {
      button.addEventListener("click", () => {
        completeQuest(quest.id);
      });
    }

    card.append(top, title, difficulty, button);
    grid.appendChild(card);
  });
}

// ==================================
// COMPLETE A QUEST
// ==================================

function completeQuest(id) {
  const quest = game.quests.find(q => q.id === id);

  if (!quest || quest.completed) return;

  const previousLevel = getLevel();

  quest.completed = true;
  quest.completedAt = new Date().toISOString();

  const earnedXp = xpRewards[quest.difficulty] || 20;
  game.totalXp += earnedXp;

  saveGame();
  renderQuests();
  updateDashboard();

  if (getLevel() > previousLevel) {
    showToast(`✦ LEVEL UP! YOU REACHED LEVEL ${getLevel()}!`);
  } else {
    showToast(`✦ QUEST COMPLETE! +${earnedXp} XP`);
  }
}

// ==================================
// ACHIEVEMENTS
// ==================================

function updateAchievements() {
  const completed = getCompletedQuests().length;
  const level = getLevel();

  setAchievement("badgeFirst", completed >= 1);
  setAchievement("badgeFive", completed >= 5);
  setAchievement("badgeLevel", level >= 3);
}

function setAchievement(id, unlocked) {
  const element = document.getElementById(id);

  element.classList.toggle("unlocked", unlocked);

  element.querySelector(".unlock-status").textContent =
    unlocked ? "✦ UNLOCKED" : "LOCKED";
}

// ==================================
// NEW QUEST MODAL
// ==================================

const modal = document.getElementById("modal");

function openModal() {
  modal.classList.add("open");
  document.getElementById("questTitle").focus();
}

function closeModal() {
  modal.classList.remove("open");
}

document.getElementById("startQuest")
  .addEventListener("click", openModal);

document.getElementById("addQuest")
  .addEventListener("click", openModal);

document.getElementById("closeModal")
  .addEventListener("click", closeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

// ==================================
// CREATE A QUEST
// ==================================

document.getElementById("questForm")
  .addEventListener("submit", event => {
    event.preventDefault();

    const title =
      document.getElementById("questTitle").value.trim();

    const category =
      document.getElementById("questCategory").value;

    const difficulty =
      document.getElementById("questDifficulty").value;

    if (!title) return;

    const newQuest = {
      id: Date.now() + Math.random(),
      title,
      category,
      difficulty,
      completed: false,
      completedAt: null
    };

    game.quests.unshift(newQuest);

    saveGame();

    currentFilter = "all";
    updateFilterButtons();
    renderQuests();
    updateDashboard();

    event.target.reset();
    closeModal();

    document.getElementById("quests").scrollIntoView({
      behavior: "smooth"
    });

    showToast("✦ NEW QUEST ADDED!");
  });

// ==================================
// QUEST FILTERS
// ==================================

const filterButtons = document.querySelectorAll(".filter");

function updateFilterButtons() {
  filterButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.filter === currentFilter
    );
  });
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    renderQuests();
  });
});

// ==================================
// NOTIFICATION TOAST
// ==================================

let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ==================================
// INITIALISE GAME
// ==================================

renderQuests();
updateDashboard();
