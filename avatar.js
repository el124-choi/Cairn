
const player = {
  name: "",
  top: "tshirt",
  pants: "jeans",
  hat: "top",
  xp: 0,
  level: 1,
  completedMilestones: [],
  unlockedItems: [
    "tshirt",
    "hoodie",
    "jeans",
    "coral",
    "top",
    "cap"
  ]
};

const nameInput = document.getElementById("player-name");
const previewName = document.getElementById("preview-name");
const errorMessage = document.getElementById("error-message");

const clothingGroups = {
  top: ["tshirt", "hoodie"],
  pants: ["jeans", "coral"],
  hat: ["top", "cap"]
};

function updateAvatar() {
  for (const [category, options] of Object.entries(clothingGroups)) {
    options.forEach(option => {
      const element = document.getElementById(`${category}-${option}`);

      element.classList.toggle(
        "hidden",
        player[category] !== option
      );
    });
  }
}

nameInput.addEventListener("input", () => {
  player.name = nameInput.value.trim();
  previewName.textContent =
    player.name || "PLAYER ONE";

  errorMessage.textContent = "";
});

document.querySelectorAll(".option").forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.category;
    const value = button.dataset.value;

    player[category] = value;

    document.querySelectorAll(
      `.option[data-category="${category}"]`
    ).forEach(option => {
      const selected = option === button;
      option.classList.toggle("active", selected);
      option.setAttribute("aria-pressed", String(selected));
    });

    updateAvatar();
  });
});

document.getElementById("create-player")
  .addEventListener("click", () => {

    if (!player.name) {
      errorMessage.textContent =
        "✦ ENTER YOUR PLAYER NAME FIRST!";
      nameInput.focus();
      return;
    }

    // Save player locally in this browser.
    localStorage.setItem(
      "roadmapPlayer",
      JSON.stringify(player)
    );

    // Go to the next screen once it exists.
    window.location.href = "roadmap.html";
  });

updateAvatar();
