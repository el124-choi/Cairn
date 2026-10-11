const AVATAR_KEY = "starling-avatar-v1";
const ROADMAP_KEY = "roadmap-generated-v1";
const HUB_KEY = "starling-hub-v1";

const $ = selector => document.querySelector(selector);

// Sample roadmap used when no generated roadmap exists
const demo = {
  title: "My University Journey",
  milestones: [
    {
      title: "Explore your course",
      description: "Research course options and modules.",
      due: "15-10-2026",
      done: true
    },
    {
      title: "Build a starter project",
      description: "Create a small project and share what you learned.",
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

// Default avatar and saved hub data
const defaults = {
  avatar: {
    name: "Explorer",
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
    accessory: "none"
  },
  journal: [],
  activityDates: [],
  helpRequests: []
};

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

// Connect to the existing roadmap
let roadmap = load(ROADMAP_KEY, null);

let demoMode = !roadmap ||
  !Array.isArray(roadmap.milestones);

if (demoMode) {
  roadmap = structuredClone(demo);
}

let hub = {
  ...structuredClone(defaults),
  ...load(HUB_KEY, {})
};

function getSharedAvatar() {
  return {
    ...defaults.avatar,
    ...load(AVATAR_KEY, hub.avatar)
  };
}

hub.avatar = getSharedAvatar();

function save() {
  localStorage.setItem(HUB_KEY, JSON.stringify(hub));

  if (!demoMode) {
    localStorage.setItem(
      ROADMAP_KEY,
      JSON.stringify(roadmap)
    );
  }
}

// XP AND LEVEL SYSTEM

function count() {
  return roadmap.milestones.filter(m => m.done).length;
}

function xp() {
  return count() * 100 +
    Math.min(hub.journal.length, 10) * 15;
}

function level() {
  return Math.floor(xp() / 200) + 1;
}

const unlocks = {
  jacket: 2,
  cargo: 3,
  crown: 4,
  star: 3
};

function next() {
  return roadmap.milestones.findIndex(m => !m.done);
}

// DAILY STREAKS

function dateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function activity() {
  const today = dateISO();

  if (!hub.activityDates.includes(today)) {
    hub.activityDates.push(today);
  }

  save();
}

function streak() {
  let days = 0;
  const dates = new Set(hub.activityDates);
  const date = new Date();

  if (!dates.has(dateISO(date))) {
    date.setDate(date.getDate() - 1);
  }

  while (dates.has(dateISO(date))) {
    days++;
    date.setDate(date.getDate() - 1);
  }

  return days;
}

// ACHIEVEMENTS

function badges() {
  return [
    {
      icon: "🌱",
      name: "First Steps",
      ok: count() >= 1
    },
    {
      icon: "⚡",
      name: "Quest Master",
      ok: count() >= 3
    },
    {
      icon: "🏆",
      name: "Roadmap Champion",
      ok: roadmap.milestones.length > 0 &&
          count() === roadmap.milestones.length
    },
    {
      icon: "📓",
      name: "Reflective Learner",
      ok: hub.journal.length >= 1
    },
    {
      icon: "🔥",
      name: "On a Roll",
      ok: streak() >= 3
    },
    {
      icon: "⭐",
      name: "Level 3 Explorer",
      ok: level() >= 3
    }
  ];
}

// NOTIFICATIONS

function toast(message) {
  const element = $("#toast");

  element.textContent = message;
  element.style.display = "block";

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    element.style.display = "none";
  }, 2800);
}

// MAIN DASHBOARD

function render() {
  const total = roadmap.milestones.length;
  const done = count();
  const percentage = total
    ? Math.round(done / total * 100)
    : 0;

  const index = next();

  $("#progressPct").textContent = percentage + "%";
  $("#progressFill").style.width = percentage + "%";

  $("#progressDescription").textContent =
    `${done} of ${total} milestones complete`;

  $("#completedStat").textContent = done;
  $("#totalStat").textContent = total;

  $("#badgeStat").textContent =
    badges().filter(b => b.ok).length;

  $("#levelBadge").textContent = "LVL " + level();

  const currentXP = xp() % 200;

  $("#xpLabel").textContent = currentXP + " / 200 XP";
  $("#xpFill").style.width =
    (currentXP / 200 * 100) + "%";

  $("#streak").textContent =
    "🔥 " + streak() + " DAY STREAK";

  $("#subtitle").textContent =
    roadmap.title || "Build skills. Complete quests. Level up.";

  $("#avatarName").textContent = hub.avatar.name;

  $("#questNumber").textContent = index < 0
    ? "✓ DONE"
    : "#" + String(index + 1).padStart(2, "0");

  const milestone = roadmap.milestones[index];

  $("#nextQuestTitle").textContent =
    milestone?.title || "All quests completed!";

  $("#nextQuestDesc").textContent =
    milestone?.description ||
    "You finished your journey. Create a new roadmap for your next adventure.";

  $("#nextQuestDue").textContent = milestone?.due
    ? "TARGET: " + milestone.due
    : "";

  $("#completeQuest").disabled = index < 0;
  $("#questHelp").disabled = index < 0;

  // Build the mini roadmap
  $("#journey").replaceChildren();

  roadmap.milestones.forEach((m, i) => {
    const card = document.createElement("div");

    card.className = "quest " +
      (m.done ? "done" : i === index ? "current" : "");

    const icon = document.createElement("div");
    icon.className = "dot";
    icon.textContent = m.done
      ? "✓"
      : i === index ? "🚩" : "🔒";

    const title = document.createElement("b");
    title.textContent = m.title;

    const due = document.createElement("small");
    due.textContent = m.due || "No deadline";

    card.append(icon, title, due);
    $("#journey").append(card);
  });

  drawAvatar();
}

// PIXEL AVATAR RENDERER

function rect(x, y, width, height, fill) {
  return `<rect x="${x}" y="${y}"
    width="${width}" height="${height}"
    fill="${fill}"/>`;
}

function drawAvatar() {
  const a = hub.avatar;

  let svg = "";

  const skin = "#c58b66";
  const outline = "#342820";
  const hair = a.hairColor;
  const highlight = a.highlight;

  // Shoes
  svg += rect(63, 178, 23, 20, outline);
  svg += rect(96, 178, 23, 20, outline);
  svg += rect(66, 178, 17, 17, "#f9e8d4");
  svg += rect(99, 178, 17, 17, "#f9e8d4");

  // Trousers
  svg += rect(65, 126, 51, 54, outline);
  svg += rect(69, 129, 20, 46, a.pantsColor);
  svg += rect(92, 129, 20, 46, a.pantsColor);

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

  // Top
  svg += rect(57, 80, 68, 56, outline);
  svg += rect(61, 84, 60, 47, a.topColor);

  if (a.top === "hoodie") {
    svg += rect(76, 84, 31, 12, outline);
    svg += rect(80, 85, 23, 11, a.topColor);
    svg += rect(87, 106, 8, 20, "#fff4dd");
  }

  if (a.top === "jacket") {
    svg += rect(87, 84, 8, 47, "#fff4dd");
    svg += rect(63, 84, 15, 45, "#594e6e");
    svg += rect(105, 84, 15, 45, "#594e6e");
  }

  // Neck
  svg += rect(74, 65, 35, 20, skin);

  // Long hair or bob
  if (a.hair === "long" || a.hair === "bob") {
    svg += rect(
      56, 34, 69,
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

  // Pink secondary hair highlight
  svg += rect(105, 27, 12, 10, highlight);
  svg += rect(107, 37, 7, 12, highlight);

  // Eyes and mouth
  svg += rect(78, 58, 6, 6, outline);
  svg += rect(100, 58, 6, 6, outline);
  svg += rect(87, 69, 10, 3, "#a45452");

  // Masculine hair detail
  if (a.style === "masculine") {
    svg += rect(59, 35, 12, 12, hair);
  }

  // Hats
  if (a.hat === "cap") {
    svg += rect(60, 19, 65, 16, a.hatColor);
    svg += rect(103, 32, 35, 7, a.hatColor);
  }

  if (a.hat === "beanie") {
    svg += rect(61, 15, 64, 25, a.hatColor);
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
    svg += `<rect x="73" y="55" width="15" height="13"
      fill="none" stroke="${outline}" stroke-width="3"/>`;

    svg += `<rect x="97" y="55" width="15" height="13"
      fill="none" stroke="${outline}" stroke-width="3"/>`;

    svg += rect(88, 59, 9, 3, outline);
  }

  if (a.accessory === "star") {
    svg += '<text x="105" y="116" font-size="20">⭐</text>';
  }

  $("#avatar").innerHTML = svg;
}

// AVATAR EDITOR

const avatarFields = {
  name: "editName",
  style: "editStyle",
  hair: "editHair",
  hairColor: "editHairColor",
  highlight: "editHighlight",
  top: "editTop",
  topColor: "editTopColor",
  pants: "editPants",
  pantsColor: "editPantsColor",
  hat: "editHat",
  hatColor: "editHatColor",
  accessory: "editAccessory"
};

function fillAvatar() {
  const avatar = hub.avatar;

  for (const [field, id] of Object.entries(avatarFields)) {
    $("#" + id).value = avatar[field];
  }

  for (const selector of [
    "editTop", "editPants", "editHat", "editAccessory"
  ]) {
    for (const option of $("#" + selector).options) {
      const item = option.value;

      option.disabled = Boolean(
        unlocks[item] && level() < unlocks[item]
      );
    }
  }
}

$("#saveAvatar").addEventListener("click", () => {
  const updated = {};

  for (const [field, id] of Object.entries(avatarFields)) {
    const value = $("#" + id).value;

    if (unlocks[value] && level() < unlocks[value]) {
      toast("That item is still locked!");
      return;
    }

    updated[field] = value;
  }

  hub.avatar = updated;

  save();
  render();

  $("#avatarModal").close();
  toast("Avatar saved!");
});

// DEADLINE PARSING

function parseDue(value) {
  if (!value) return Infinity;

  const match = value.match(
    /^(\d{2})-(\d{2})-(\d{4})$/
  );

  if (match) {
    return new Date(
      +match[3],
      +match[2] - 1,
      +match[1]
    ).getTime();
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp)
    ? Infinity
    : timestamp;
}

// RESOURCES, MENTORS, DEADLINES, BADGES AND JOURNAL

function populate() {
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
      "Practice Git and GitHub",
      "https://skills.github.com/"
    ],
    [
      "UCAS",
      "University course and application guidance",
      "https://www.ucas.com/"
    ],
    [
      "OpenLearn",
      "Free university-level learning",
      "https://www.open.edu/openlearn/"
    ]
  ];

  $("#resourceList").innerHTML = resources.map(
    ([name, description, url]) => `
      <div class="mini-card">
        <b>${name}</b>
        <p>${description}</p>
        <a href="${url}" target="_blank" rel="noopener">
          OPEN RESOURCE ↗
        </a>
      </div>
    `
  ).join("");

  // Demo mentor profiles
  const mentors = [
    ["Alex", "Computer Science", "Projects and coding"],
    ["Sam", "Physics", "Studying and research"],
    ["Jamie", "Student mentor", "University applications"]
  ];

  $("#mentorList").innerHTML = mentors.map(
    ([name, subject, specialty]) => `
      <div class="mini-card">
        <b>👤 ${name} · ${subject}</b>
        <p>${specialty}</p>
        <button class="btn small yellow mentor-request">
          REQUEST INTRO (DEMO)
        </button>
      </div>
    `
  ).join("");

  document.querySelectorAll(".mentor-request").forEach(
    button => button.addEventListener("click", () => {
      toast("Demo only: mentor messaging is not connected yet.");
    })
  );

  // Upcoming deadlines
  const remaining = roadmap.milestones
    .filter(m => !m.done)
    .sort((a, b) => parseDue(a.due) - parseDue(b.due));

  $("#deadlineList").replaceChildren();

  remaining.forEach(milestone => {
    const card = document.createElement("div");
    card.className = "mini-card";

    const title = document.createElement("b");
    title.textContent = milestone.title;

    const date = document.createElement("p");
    date.textContent = milestone.due || "No deadline";

    card.append(title, date);
    $("#deadlineList").append(card);
  });

  if (!remaining.length) {
    $("#deadlineList").textContent =
      "No upcoming milestones.";
  }

  // Achievements
  $("#achievementList").innerHTML = badges().map(
    badge => `
      <div class="mini-card">
        ${badge.icon}
        <b>${badge.name}</b>
        · ${badge.ok ? "UNLOCKED" : "LOCKED"}
      </div>
    `
  ).join("");

  // Journal entries
  $("#journalEntries").replaceChildren();

  hub.journal.slice().reverse().forEach(entry => {
    const card = document.createElement("div");
    card.className = "mini-card";

    const date = document.createElement("b");
    date.textContent = entry.date;

    const text = document.createElement("p");
    text.textContent = entry.text;

    card.append(date, text);
    $("#journalEntries").append(card);
  });
}

// POPUP MANAGEMENT

function openModal(id) {
  if (id === "avatarModal") {
    fillAvatar();
  }

  if (id === "helpModal") {
    $("#helpQuest").textContent =
      roadmap.milestones[next()]?.title || "Your next goal";
  }

  populate();
  $("#" + id).showModal();
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    openModal(button.dataset.open);
  });
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    button.closest("dialog").close();
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
    button.closest("dialog").close();
    openModal(button.dataset.switch);
  });
});

// COMPLETE A QUEST

$("#completeQuest").addEventListener("click", () => {
  const index = next();

  if (index < 0) return;

  roadmap.milestones[index].done = true;

  activity();
  save();
  render();

  toast("QUEST COMPLETE! +100 XP ✦");
});

// HELP BUTTON

$("#questHelp").addEventListener("click", () => {
  openModal("helpModal");
});

// LEARNING JOURNAL

$("#addJournal").addEventListener("click", () => {
  const text = $("#journalText").value.trim();

  if (!text) return;

  hub.journal.push({
    date: new Date().toLocaleString(),
    text
  });

  $("#journalText").value = "";

  activity();
  save();
  render();
  populate();

  toast("Journal entry saved!");
});

// SAVE A HELP QUESTION

$("#saveHelp").addEventListener("click", () => {
  const text = $("#helpNote").value.trim();

  if (!text) return;

  hub.journal.push({
    date: new Date().toLocaleString(),
    text: "QUESTION: " + text
  });

  $("#helpNote").value = "";

  activity();
  save();
  render();

  $("#helpModal").close();

  toast("Question saved to journal");
});

// RESET DEMO

$("#resetDemo").addEventListener("click", () => {
  if (!confirm(
    "Reset the hub? This will not erase your real roadmap."
  )) {
    return;
  }

  if (demoMode) {
    roadmap = structuredClone(demo);
  }

  hub = structuredClone(defaults);

  save();
  render();

  toast("Hub reset");
});

// SYNC ROADMAP CHANGES FROM OTHER TABS

window.addEventListener("storage", event => {
  if (event.key === ROADMAP_KEY) {
    const incoming = load(ROADMAP_KEY, null);

    if (incoming?.milestones) {
      roadmap = incoming;
      demoMode = false;
      render();
    }
  }
});

// START THE HUB

render();
