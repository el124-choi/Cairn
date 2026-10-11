
"use strict";

// ==========================================
// STARLING | JOURNEY HUB
// RETRO ARCADE GAME LOGIC
// ==========================================

const AVATAR_KEY = "starling-avatar-v1";
const ROADMAP_KEY = "roadmap-generated-v1";
const HUB_KEY = "starling-hub-v1";

const $ = selector => document.querySelector(selector);

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Save failed:", key, error);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// ==========================================
// DEMO ROADMAP
// ==========================================

const demo = {
  title: "My University Journey",
  milestones: [
    {
      title: "Explore your course",
      description: "Research your course options and modules.",
      due: "15-10-2026",
      done: true
    },
    {
      title: "Build a starter project",
      description: "Create a project and share what you learned.",
      due: "22-10-2026",
      done: true
    },
    {
      title: "Connect with a mentor",
      description: "Find someone who can answer your questions.",
      due: "30-10-2026",
      done: false
    },
    {
      title: "Create a study plan",
      description: "Set realistic weekly learning goals.",
      due: "08-11-2026",
      done: false
    },
    {
      title: "Share your progress",
      description: "Publish your work and reflect on your progress.",
      due: "20-11-2026",
      done: false
    }
  ]
};

// ==========================================
// DEFAULT PLAYER
// ==========================================

const defaultAvatar = {
  name: "Explorer",
  gender: "female",
  style: "feminine",
  hair: "long",
  hairColor: "#1c1720",
  highlight: "#f39ac5",
  top: "tshirt",
  topColor: "#f5a58e",
  pants: "jeans",
  pantsColor: "#56799e",
  hat: "none",
  hatColor: "#f6d77a",
  accessory: "none",
  skinColor: "#c58b66"
};

const defaults = {
  avatar: clone(defaultAvatar),
  journal: [],
  activityDates: [],
  helpRequests: []
};

let roadmap = load(ROADMAP_KEY, null);

let demoMode = !roadmap ||
  !Array.isArray(roadmap.milestones);

if (demoMode) {
  roadmap = clone(demo);
}

let hub = {
  ...clone(defaults),
  ...load(HUB_KEY, {})
};

if (!Array.isArray(hub.journal)) {
  hub.journal = [];
}

if (!Array.isArray(hub.activityDates)) {
  hub.activityDates = [];
}

// ==========================================
// AVATAR SYNCHRONISATION
// ==========================================

function getAvatar() {
  const saved = load(AVATAR_KEY, null);
  const oldPlayer = load("player", null);

  const source = saved || oldPlayer || hub.avatar || {};

  return {
    ...defaultAvatar,
    ...source,
    style: source.style ||
      (source.gender === "male"
        ? "masculine"
        : "feminine"),
    hairColor: source.hairColor || "#1c1720",
    highlight: source.highlight ||
      source.secondaryHairColor || "#f39ac5"
  };
}

hub.avatar = getAvatar();

function save() {
  store(HUB_KEY, hub);

  if (!demoMode) {
    store(ROADMAP_KEY, roadmap);
  }
}

// ==========================================
// XP AND LEVEL SYSTEM
// ==========================================

function completedCount() {
  return roadmap.milestones.filter(m => m.done).length;
}

function totalXP() {
  return completedCount() * 100 +
    Math.min(hub.journal.length, 10) * 15;
}

function playerLevel() {
  return Math.floor(totalXP() / 200) + 1;
}

function nextQuestIndex() {
  return roadmap.milestones.findIndex(m => !m.done);
}

// ==========================================
// DAILY STREAK
// ==========================================

function dateISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function recordActivity() {
  const today = dateISO();

  if (!hub.activityDates.includes(today)) {
    hub.activityDates.push(today);
  }

  save();
}

function getStreak() {
  const dates = new Set(hub.activityDates);
  const date = new Date();

  if (!dates.has(dateISO(date))) {
    date.setDate(date.getDate() - 1);
  }

  let days = 0;

  while (dates.has(dateISO(date))) {
    days++;
    date.setDate(date.getDate() - 1);
  }

  return days;
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

function getBadges() {
  const completed = completedCount();

  return [
    {
      icon: "icon-star",
      name: "First Steps",
      unlocked: completed >= 1
    },
    {
      icon: "icon-xp",
      name: "Quest Master",
      unlocked: completed >= 3
    },
    {
      icon: "icon-trophy",
      name: "Roadmap Champion",
      unlocked: roadmap.milestones.length > 0 &&
        completed === roadmap.milestones.length
    },
    {
      icon: "icon-journal",
      name: "Reflective Learner",
      unlocked: hub.journal.length >= 1
    },
    {
      icon: "icon-flag",
      name: "On a Roll",
      unlocked: getStreak() >= 3
    },
    {
      icon: "icon-xp",
      name: "Level 3 Explorer",
      unlocked: playerLevel() >= 3
    }
  ];
}

// ==========================================
// NOTIFICATIONS
// ==========================================

let toastTimer;

function toast(message) {
  const element = $("#toast");
  if (!element) return;

  element.textContent = message;
  element.style.display = "block";

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.style.display = "none";
  }, 2800);
}

// ==========================================
// PIXEL SVG HELPER
// ==========================================

function pixelIcon(id) {
  const svg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );

  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("aria-hidden", "true");

  const use = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "use"
  );

  use.setAttribute("href", "#" + id);
  svg.append(use);

  return svg;
}

// ==========================================
// AVATAR RENDERER
// ==========================================

function rect(x, y, w, h, fill) {
  return `<rect x="${x}" y="${y}"
    width="${w}" height="${h}"
    fill="${fill}"/>`;
}

function safeColor(value, fallback) {
  return typeof value === "string" &&
    /^#[0-9a-fA-F]{3,8}$/.test(value)
    ? value : fallback;
}

function drawAvatar() {
  const target = $("#avatar");
  if (!target) return;

  const a = hub.avatar;

  const skin = safeColor(a.skinColor, "#c58b66");
  const outline = "#342820";
  const hair = safeColor(a.hairColor, "#1c1720");
  const highlight = safeColor(a.highlight, "#f39ac5");
  const top = safeColor(a.topColor, "#f5a58e");
  const pants = safeColor(a.pantsColor, "#56799e");
  const hat = safeColor(a.hatColor, "#f6d77a");

  let svg = "";

  // Shoes
  svg += rect(63, 178, 23, 20, outline);
  svg += rect(96, 178, 23, 20, outline);
  svg += rect(66, 178, 17, 17, "#f9e8d4");
  svg += rect(99, 178, 17, 17, "#f9e8d4");

  // Trousers
  svg += rect(65, 126, 51, 54, outline);
  svg += rect(69, 129, 20, 46, pants);
  svg += rect(92, 129, 20, 46, pants);

  if (a.pants === "shorts") {
    svg += rect(68, 151, 21, 25, skin);
    svg += rect(92, 151, 21, 25, skin);
  }

  if (a.pants === "cargo") {
    svg += rect(69, 144, 10, 15, "#e0c08a");
    svg += rect(103, 144, 10, 15, "#e0c08a");
  }

  // Arms
  svg += rect(45, 85, 17, 52, skin);
  svg += rect(120, 85, 17, 52, skin);

  // Shirt
  svg += rect(57, 80, 68, 56, outline);
  svg += rect(61, 84, 60, 47, top);

  if (a.top === "hoodie") {
    svg += rect(76, 84, 31, 12, outline);
    svg += rect(80, 85, 23, 11, top);
    svg += rect(87, 106, 8, 20, "#fff4dd");
  }

  if (a.top === "jacket") {
    svg += rect(87, 84, 8, 47, "#fff4dd");
    svg += rect(63, 84, 15, 45, top);
    svg += rect(105, 84, 15, 45, top);
  }

  // Neck
  svg += rect(74, 65, 35, 20, skin);

  // Hair behind head
  if (a.hair === "long" || a.hair === "bob") {
    svg += rect(
      56,
      34,
      69,
      a.hair === "long" ? 81 : 60,
      hair
    );
  }

  // Face
  svg += rect(63, 31, 57, 52, outline);
  svg += rect(67, 35, 49, 46, skin);

  // Hairline
  svg += rect(60, 24, 64, 22, hair);
  svg += rect(60, 39, 11, 26, hair);
  svg += rect(113, 38, 11, 28, hair);

  if (a.hair === "short") {
    svg += rect(67, 24, 51, 15, hair);
  }

  if (a.hair === "curly") {
    for (let x = 59; x < 122; x += 12) {
      svg += rect(x, 24 + (x % 3) * 3, 16, 17, hair);
    }
  }

  // Secondary hair colour
  svg += rect(105, 27, 12, 10, highlight);
  svg += rect(107, 37, 7, 12, highlight);

  // Eyes and mouth
  svg += rect(78, 58, 6, 6, outline);
  svg += rect(100, 58, 6, 6, outline);
  svg += rect(87, 69, 10, 3, "#a45452");

  if (a.style === "masculine" || a.gender === "male") {
    svg += rect(59, 35, 12, 12, hair);
  }

  // Hats
  if (a.hat === "cap") {
    svg += rect(60, 19, 65, 16, hat);
    svg += rect(103, 32, 35, 7, hat);
  }

  if (a.hat === "beanie") {
    svg += rect(61, 15, 64, 25, hat);
    svg += rect(58, 36, 70, 7, outline);
  }

  if (a.hat === "crown") {
    svg += rect(65, 18, 56, 23, "#f4c84d");
    svg += rect(65, 9, 13, 12, "#f4c84d");
    svg += rect(87, 5, 13, 16, "#f4c84d");
    svg += rect(108, 9, 13, 12, "#f4c84d");
  }

  // Accessories
  if (a.accessory === "glasses") {
    svg += `<rect x="73" y="55" width="15"
      height="13" fill="none"
      stroke="${outline}" stroke-width="3"/>`;

    svg += `<rect x="97" y="55" width="15"
      height="13" fill="none"
      stroke="${outline}" stroke-width="3"/>`;

    svg += rect(88, 59, 9, 3, outline);
  }

  if (a.accessory === "star") {
    svg += rect(104, 105, 12, 12, "#f6d77a");
    svg += rect(108, 101, 4, 20, "#f6d77a");
  }

  target.innerHTML = svg;
}

// ==========================================
// MAIN DASHBOARD
// ==========================================

function render() {
  const total = roadmap.milestones.length;
  const done = completedCount();

  const percentage = total
    ? Math.round(done / total * 100)
    : 0;

  const index = nextQuestIndex();
  const currentXP = totalXP() % 200;

  $("#progressPct").textContent = percentage + "%";
  $("#progressFill").style.width = percentage + "%";

  $("#progressDescription").textContent =
    `${done} of ${total} milestones complete`;

  $("#completedStat").textContent = done;
  $("#totalStat").textContent = total;

  $("#badgeStat").textContent =
    getBadges().filter(b => b.unlocked).length;

  $("#levelBadge").textContent =
    "LVL " + playerLevel();

  $("#xpLabel").textContent =
    currentXP + " / 200 XP";

  $("#xpFill").style.width =
    (currentXP / 200 * 100) + "%";

  $("#streak").textContent =
    getStreak() + " DAY STREAK";

  $("#subtitle").textContent =
    roadmap.title ||
    "Build skills. Complete quests. Level up.";

  $("#avatarName").textContent =
    hub.avatar.name || "Explorer";

  $("#questNumber").textContent =
    index < 0
      ? "DONE"
      : "#" + String(index + 1).padStart(2, "0");

  const milestone = roadmap.milestones[index];

  $("#nextQuestTitle").textContent =
    milestone?.title || "All quests completed!";

  $("#nextQuestDesc").textContent =
    milestone?.description ||
    "You completed your journey!";

  $("#nextQuestDue").textContent =
    milestone?.due
      ? "TARGET: " + milestone.due
      : "";

  $("#completeQuest").disabled = index < 0;
  $("#questHelp").disabled = index < 0;

  // Journey map
  const journey = $("#journey");
  journey.replaceChildren();

  roadmap.milestones.forEach((m, i) => {
    const card = document.createElement("div");

    card.className = "quest " +
      (m.done ? "done" : i === index ? "current" : "");

    const iconBox = document.createElement("div");
    iconBox.className = "dot";

    const iconName = m.done
      ? "icon-check"
      : i === index
        ? "icon-flag"
        : "icon-lock";

    iconBox.append(pixelIcon(iconName));

    const title = document.createElement("b");
    title.textContent = m.title || "Untitled quest";

    const due = document.createElement("small");
    due.textContent = m.due || "No deadline";

    card.append(iconBox, title, due);
    journey.append(card);
  });

  drawAvatar();
}

// ==========================================
// DEADLINE PARSING
// ==========================================

function parseDue(value) {
  if (!value) return Infinity;

  const match = String(value).match(
    /^(\d{2})-(\d{2})-(\d{4})$/
  );

  if (match) {
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1])
    ).getTime();
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp)
    ? Infinity
    : timestamp;
}

// ==========================================
// RESOURCES
// ==========================================

function populateResources() {
  const resources = [
    [
      "freeCodeCamp",
      "Free programming tutorials",
      "https://www.freecodecamp.org/"
    ],
    [
      "Khan Academy",
      "Maths, science and study skills",
      "https://www.khanacademy.org/"
    ],
    [
      "GitHub Skills",
      "Learn Git and GitHub",
      "https://skills.github.com/"
    ],
    [
      "UCAS",
      "University application guidance",
      "https://www.ucas.com/"
    ],
    [
      "OpenLearn",
      "Free university learning",
      "https://www.open.edu/openlearn/"
    ]
  ];

  const list = $("#resourceList");
  list.replaceChildren();

  resources.forEach(([name, description, url]) => {
    const card = document.createElement("div");
    card.className = "mini-card";

    const title = document.createElement("b");
    title.textContent = name;

    const info = document.createElement("p");
    info.textContent = description;

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "OPEN RESOURCE";

    card.append(title, info, link);
    list.append(card);
  });
}

// ==========================================
// MENTORS
// ==========================================

function populateMentors() {
  const mentors = [
    ["Alex", "Computer Science", "Projects and coding"],
    ["Sam", "Physics", "Studying and research"],
    ["Jamie", "Student mentor", "University applications"]
  ];

  const list = $("#mentorList");
  list.replaceChildren();

  mentors.forEach(([name, subject, specialty]) => {
    const card = document.createElement("div");
    card.className = "mini-card";

    const title = document.createElement("b");
    title.textContent = name + " | " + subject;

    const info = document.createElement("p");
    info.textContent = specialty;

    const button = document.createElement("button");
    button.className = "btn small yellow";
    button.textContent = "REQUEST INTRO";

    button.addEventListener("click", () => {
      toast("Mentor messaging is not connected yet.");
    });

    card.append(title, info, button);
    list.append(card);
  });
}

// ==========================================
// DEADLINES
// ==========================================

function populateDeadlines() {
  const list = $("#deadlineList");
  list.replaceChildren();

  const remaining = roadmap.milestones
    .filter(m => !m.done)
    .sort((a, b) => parseDue(a.due) - parseDue(b.due));

  if (!remaining.length) {
    list.textContent = "No upcoming milestones.";
    return;
  }

  remaining.forEach(m => {
    const card = document.createElement("div");
    card.className = "mini-card";

    const title = document.createElement("b");
    title.textContent = m.title || "Untitled quest";

    const date = document.createElement("p");
    date.textContent = m.due || "No deadline";

    card.append(title, date);
    list.append(card);
  });
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

function populateAchievements() {
  const list = $("#achievementList");
  list.replaceChildren();

  getBadges().forEach(badge => {
    const card = document.createElement("div");

    card.className = "mini-card " +
      (badge.unlocked ? "unlocked" : "locked");

    const icon = pixelIcon(badge.icon);

    const info = document.createElement("div");

    const title = document.createElement("b");
    title.textContent = badge.name;

    const status = document.createElement("small");
    status.textContent =
      badge.unlocked ? "UNLOCKED" : "LOCKED";

    info.append(title, status);
    card.append(icon, info);
    list.append(card);
  });
}

// ==========================================
// JOURNAL
// ==========================================

function populateJournal() {
  const list = $("#journalEntries");
  list.replaceChildren();

  hub.journal.slice().reverse().forEach(entry => {
    const card = document.createElement("div");
    card.className = "mini-card";

    const date = document.createElement("b");
    date.textContent = entry.date;

    const text = document.createElement("p");
    text.textContent = entry.text;

    card.append(date, text);
    list.append(card);
  });
}

function populate() {
  populateResources();
  populateMentors();
  populateDeadlines();
  populateAchievements();
  populateJournal();
}

// ==========================================
// MODALS
// ==========================================

function openModal(id) {
  const modal = document.getElementById(id);

  if (!modal) {
    console.warn("Modal not found:", id);
    return;
  }

  populate();

  if (id === "helpModal") {
    const next = roadmap.milestones[nextQuestIndex()];

    $("#helpQuest").textContent =
      next?.title || "Your next goal";
  }

  if (!modal.open) {
    modal.showModal();
  }
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    openModal(button.dataset.open);
  });
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    button.closest("dialog")?.close();
  });
});

document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});

document.querySelectorAll("[data-switch]").forEach(button => {
  button.addEventListener("click", () => {
    button.closest("dialog")?.close();
    openModal(button.dataset.switch);
  });
});

// ==========================================
// COMPLETE QUEST
// ==========================================

$("#completeQuest").addEventListener("click", () => {
  const index = nextQuestIndex();
  if (index < 0) return;

  roadmap.milestones[index].done = true;

  recordActivity();
  save();
  render();
  populate();

  toast("QUEST COMPLETE! +100 XP");
});

// ==========================================
// HELP
// ==========================================

$("#questHelp").addEventListener("click", () => {
  openModal("helpModal");
});

// ==========================================
// SAVE JOURNAL
// ==========================================

$("#addJournal").addEventListener("click", () => {
  const input = $("#journalText");
  const text = input.value.trim();

  if (!text) {
    toast("Write something first!");
    return;
  }

  hub.journal.push({
    date: new Date().toLocaleString(),
    text
  });

  input.value = "";

  recordActivity();
  save();
  render();
  populate();

  toast("JOURNAL SAVED! +15 XP");
});

// ==========================================
// SAVE HELP QUESTION
// ==========================================

$("#saveHelp").addEventListener("click", () => {
  const input = $("#helpNote");
  const text = input.value.trim();

  if (!text) {
    toast("Write your question first!");
    return;
  }

  hub.journal.push({
    date: new Date().toLocaleString(),
    text: "QUESTION: " + text
  });

  input.value = "";

  recordActivity();
  save();
  render();
  populate();

  $("#helpModal").close();

  toast("QUESTION SAVED TO JOURNAL");
});

// ==========================================
// RESET DEMO
// ==========================================

$("#resetDemo").addEventListener("click", () => {
  const confirmed = confirm(
    "Reset Hub progress? Your avatar and generated roadmap will be kept."
  );

  if (!confirmed) return;

  if (demoMode) {
    roadmap = clone(demo);
  }

  hub.journal = [];
  hub.activityDates = [];
  hub.helpRequests = [];

  save();
  render();
  populate();

  toast("HUB PROGRESS RESET");
});

// ==========================================
// SYNC BETWEEN PAGES
// ==========================================

function refreshSharedData() {
  const savedRoadmap = load(ROADMAP_KEY, null);

  if (
    savedRoadmap &&
    Array.isArray(savedRoadmap.milestones)
  ) {
    roadmap = savedRoadmap;
    demoMode = false;
  }

  hub.avatar = getAvatar();

  render();
  populate();
}

window.addEventListener("storage", event => {
  if (
    event.key === ROADMAP_KEY ||
    event.key === AVATAR_KEY ||
    event.key === "player"
  ) {
    refreshSharedData();
  }
});

window.addEventListener("pageshow", () => {
  refreshSharedData();
});

// ==========================================
// START GAME
// ==========================================

render();
populate();

console.log("STARLING HUB READY");
