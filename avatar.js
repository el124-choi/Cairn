
const player = {
  name: "",
  gender: "male",

  top: "tshirt",
  pants: "jeans",
  hair: "short",
  hat: "none",

  topColor: "#FFFFFF",
  pantsColor: "#FFFFFF",
  hairColor: "#222222",
  hatColor: "#FFFFFF",

  xp: 0,
  level: 1,
  completedMilestones: [],

  unlockedItems: [
    "tshirt",
    "hoodie",
    "jeans",
    "coral",
    "short",
    "long",
    "top",
    "cap"
  ]
};

let currentStep = 0;

const steps = document.querySelectorAll(".creator-step");
const backButton = document.getElementById("back-button");
const nextButton = document.getElementById("next-button");
const nameInput = document.getElementById("player-name");
const previewName = document.getElementById("preview-name");
const errorMessage = document.getElementById("error-message");

const clothingGroups = {
  top: ["tshirt", "hoodie"],
  pants: ["jeans", "coral"],
  hair: ["short", "long"],
  hat: ["top", "cap"]
};

const colourClasses = {
  topColor: ".avatar-top-fill",
  pantsColor: ".avatar-pants-fill",
  hairColor: ".avatar-hair-fill",
  hatColor: ".avatar-hat-fill"
};

function updateAvatar() {
  // Show only the selected clothing styles.
  for (const [category, options] of Object.entries(clothingGroups)) {
    options.forEach(value => {
      const element = document.getElementById(`${category}-${value}`);

      if (element) {
        element.classList.toggle(
          "hidden",
          player[category] !== value
        );
      }
    });
  }

  // Show the matching fringe.
  const shortFringe = document.getElementById("hair-short-fringe");
  const longFringe = document.getElementById("hair-long-fringe");

  shortFringe.classList.toggle("hidden", player.hair !== "short");
  longFringe.classList.toggle("hidden", player.hair !== "long");

  // Apply selected colours.
  for (const [category, selector] of Object.entries(colourClasses)) {
    document.querySelectorAll(selector).forEach(shape => {
      shape.setAttribute("fill", player[category]);
    });
  }
}

function showStep() {
  steps.forEach((step, index) => {
    step.classList.toggle("active-step", index === currentStep);
  });

  document.getElementById("step-label").textContent =
    `STEP ${currentStep + 1} OF ${steps.length}`;

  document.getElementById("progress-fill").style.width =
    `${((currentStep + 1) / steps.length) * 100}%`;

  backButton.disabled = currentStep === 0;

  nextButton.textContent =
    currentStep === steps.length - 1
      ? "▶ CREATE PLAYER"
      : "NEXT ▶";

  errorMessage.textContent = "";
}

// Handle style and gender choices.
document.querySelectorAll(".choice").forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.category;
    const value = button.dataset.value;

    player[category] = value;

    // Starting hairstyle changes with character choice.
    if (category === "gender") {
      if (value === "female") {
        player.hair = "long";
      } else {
        player.hair = "short";
      }

      // Update selected hairstyle button.
      document.querySelectorAll(
        '.choice[data-category="hair"]'
      ).forEach(hairButton => {
        const selected = hairButton.dataset.value === player.hair;
        hairButton.classList.toggle("selected", selected);
        hairButton.setAttribute("aria-pressed", String(selected));
      });
    }

    // Update selected state in the current group.
    button.parentElement.querySelectorAll(".choice").forEach(choice => {
      const selected = choice === button;

      choice.classList.toggle("selected", selected);
      choice.setAttribute("aria-pressed", String(selected));
    });

    updateAvatar();
  });
});

// Handle colour selection.
document.querySelectorAll(".colour-choices").forEach(group => {
  group.querySelectorAll(".colour-choice").forEach(button => {
    button.addEventListener("click", () => {
      const category = group.dataset.category;

      player[category] = button.dataset.value;

      group.querySelectorAll(".colour-choice").forEach(choice => {
        const selected = choice === button;

        choice.classList.toggle("selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      });

      updateAvatar();
    });
  });
});

// Live player-name preview.
nameInput.addEventListener("input", () => {
  player.name = nameInput.value.trim();
  previewName.textContent = player.name || "PLAYER ONE";
  errorMessage.textContent = "";
});

// Back button.
backButton.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    showStep();
  }
});

// Next button / Create player.
nextButton.addEventListener("click", () => {
  if (currentStep < steps.length - 1) {
    currentStep++;
    showStep();
    return;
  }

  player.name = nameInput.value.trim();

  if (!player.name) {
    errorMessage.textContent = "ENTER A PLAYER NAME FIRST!";
    nameInput.focus();
    return;
  }

  localStorage.setItem(
    "roadmapPlayer",
    JSON.stringify(player)
  );

  window.location.href = "roadmapPage.html";
});

updateAvatar();
showStep();
