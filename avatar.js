
const player = {
  name: "",
  gender: "male",
  top: "tshirt",
  pants: "jeans",
  hat: "top",
  topColor: "#FFFFFF",
  pantsColor: "#FFFFFF",
  hatColor: "#FFFFFF",
  xp: 0,
  level: 1,
  completedMilestones: [],
  unlockedItems: [
    "tshirt", "hoodie",
    "jeans", "coral",
    "top", "cap"
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
  hat: ["top", "cap"]
};

const colourClasses = {
  topColor: ".avatar-top-fill",
  pantsColor: ".avatar-pants-fill",
  hatColor: ".avatar-hat-fill"
};

function updateAvatar() {
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

document.querySelectorAll(".choice").forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.category;
    const value = button.dataset.value;

    player[category] = value;

    button.parentElement.querySelectorAll(".choice")
      .forEach(choice => {
        const selected = choice === button;
        choice.classList.toggle("selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      });

    updateAvatar();
  });
});

document.querySelectorAll(".colour-choices").forEach(group => {
  group.querySelectorAll(".colour-choice").forEach(button => {
    button.addEventListener("click", () => {
      const category = group.dataset.category;

      player[category] = button.dataset.value;

      group.querySelectorAll(".colour-choice")
        .forEach(choice => {
          const selected = choice === button;
          choice.classList.toggle("selected", selected);
          choice.setAttribute("aria-pressed", String(selected));
        });

      updateAvatar();
    });
  });
});

nameInput.addEventListener("input", () => {
  player.name = nameInput.value.trim();
  previewName.textContent = player.name || "PLAYER ONE";
});

backButton.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    showStep();
  }
});

nextButton.addEventListener("click", () => {
  if (currentStep < steps.length - 1) {
    currentStep++;
    showStep();
    return;
  }

  if (!player.name) {
    errorMessage.textContent = "ENTER A PLAYER NAME FIRST!";
    nameInput.focus();
    return;
  }

  localStorage.setItem("roadmapPlayer", JSON.stringify(player));

  window.location.href = "roadmap.html";
});

updateAvatar();
showStep();
