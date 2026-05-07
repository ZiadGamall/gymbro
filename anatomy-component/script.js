const MUSCLE_LABELS = {
  "pectoralis-major-front": "Chest (Pectoralis Major)",
  "deltoids-front": "Shoulders (Deltoids)",
  "biceps-front": "Biceps",
  "triceps-front": "Triceps",
  "forearms-front": "Forearms",
  "abs-front": "Abs (Rectus Abdominis)",
  "obliques-front": "Obliques",
  "quadriceps-front": "Quadriceps",
  "calves-front": "Calves",
  "trapezius-back": "Trapezius",
  "deltoids-back": "Shoulders (Deltoids)",
  "triceps-back": "Triceps",
  "forearms-back": "Forearms",
  "lats-back": "Lats (Latissimus Dorsi)",
  "glutes-back": "Glutes",
  "hamstrings-back": "Hamstrings",
  "calves-back": "Calves"
};

const MUSCLE_EXERCISE_MAP = {
  "pectoralis-major": ["Bench Press", "Push-Up", "Incline Dumbbell Press"],
  deltoids: ["Overhead Press", "Lateral Raise", "Arnold Press"],
  biceps: ["Barbell Curl", "Hammer Curl", "Preacher Curl"],
  triceps: ["Dips", "Triceps Pushdown", "Skull Crusher"],
  forearms: ["Wrist Curl", "Reverse Wrist Curl", "Farmer Carry"],
  abs: ["Cable Crunch", "Hanging Leg Raise", "Dead Bug"],
  obliques: ["Russian Twist", "Side Plank", "Landmine Rotation"],
  quadriceps: ["Back Squat", "Leg Press", "Walking Lunge"],
  hamstrings: ["Romanian Deadlift", "Leg Curl", "Good Morning"],
  calves: ["Standing Calf Raise", "Seated Calf Raise", "Jump Rope"],
  trapezius: ["Barbell Shrug", "Face Pull", "Upright Row"],
  lats: ["Pull-Up", "Lat Pulldown", "Single-Arm Row"],
  glutes: ["Hip Thrust", "Bulgarian Split Squat", "Glute Bridge"]
};

class MuscleAnatomyComponent {
  constructor(rootElement, options = {}) {
    this.root = rootElement;
    this.svgShell = this.root.querySelector("#svg-shell");
    this.tooltip = this.root.querySelector("#muscle-tooltip");
    this.selectedMuscleEl = this.root.querySelector("#selected-muscle");
    this.exerciseListEl = this.root.querySelector("#exercise-list");
    this.viewButtons = this.root.querySelectorAll(".view-btn");
    this.currentView = "front";

    this.onMuscleSelect =
      typeof options.onMuscleSelect === "function"
        ? options.onMuscleSelect
        : (muscleId) => {
            if (typeof window.onMuscleSelect === "function") {
              window.onMuscleSelect(muscleId);
            }
          };

    this.render();
    this.bindControls();
  }

  render() {
    this.svgShell.innerHTML = this.currentView === "front" ? this.frontSvg() : this.backSvg();
    this.bindMuscleEvents();
  }

  bindControls() {
    this.viewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.viewButtons.forEach((btn) => {
          btn.classList.remove("is-active");
          btn.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");

        this.currentView = button.dataset.view;
        this.render();
      });
    });
  }

  bindMuscleEvents() {
    const muscles = this.svgShell.querySelectorAll(".muscle-path");

    muscles.forEach((musclePath) => {
      musclePath.addEventListener("mouseenter", (event) => {
        this.showTooltip(event.currentTarget.dataset.muscleName, event.clientX, event.clientY);
      });

      musclePath.addEventListener("mousemove", (event) => {
        this.moveTooltip(event.clientX, event.clientY);
      });

      musclePath.addEventListener("mouseleave", () => {
        this.hideTooltip();
      });

      musclePath.addEventListener("click", (event) => {
        const muscleId = event.currentTarget.id;
        const muscleName = event.currentTarget.dataset.muscleName;

        this.svgShell.querySelectorAll(".muscle-path").forEach((path) => {
          path.classList.remove("is-active");
        });

        event.currentTarget.classList.add("is-active");
        this.selectedMuscleEl.textContent = muscleName;

        console.log("Selected muscle:", muscleName, `(${muscleId})`);
        this.onMuscleSelect(muscleId);

        this.renderExerciseLinks(muscleId);
      });
    });
  }

  showTooltip(text, x, y) {
    this.tooltip.textContent = text;
    this.moveTooltip(x, y);
    this.tooltip.classList.add("is-visible");
    this.tooltip.setAttribute("aria-hidden", "false");
  }

  moveTooltip(x, y) {
    const rect = this.root.getBoundingClientRect();
    this.tooltip.style.left = `${x - rect.left}px`;
    this.tooltip.style.top = `${y - rect.top}px`;
  }

  hideTooltip() {
    this.tooltip.classList.remove("is-visible");
    this.tooltip.setAttribute("aria-hidden", "true");
  }

  renderExerciseLinks(muscleId) {
    const key = this.normalizeMuscleId(muscleId);
    const exercises = MUSCLE_EXERCISE_MAP[key] || ["No linked exercises configured yet."];

    this.exerciseListEl.innerHTML = exercises.map((exercise) => `<li>${exercise}</li>`).join("");
  }

  normalizeMuscleId(muscleId) {
    if (muscleId.startsWith("pectoralis-major")) {
      return "pectoralis-major";
    }

    if (muscleId.startsWith("deltoids")) {
      return "deltoids";
    }

    if (muscleId.startsWith("trapezius")) {
      return "trapezius";
    }

    if (muscleId.startsWith("quadriceps")) {
      return "quadriceps";
    }

    if (muscleId.startsWith("hamstrings")) {
      return "hamstrings";
    }

    if (muscleId.startsWith("calves")) {
      return "calves";
    }

    if (muscleId.startsWith("lats")) {
      return "lats";
    }

    if (muscleId.startsWith("glutes")) {
      return "glutes";
    }

    if (muscleId.startsWith("biceps")) {
      return "biceps";
    }

    if (muscleId.startsWith("triceps")) {
      return "triceps";
    }

    if (muscleId.startsWith("forearms")) {
      return "forearms";
    }

    if (muscleId.startsWith("abs")) {
      return "abs";
    }

    if (muscleId.startsWith("obliques")) {
      return "obliques";
    }

    return muscleId;
  }

  frontSvg() {
    return `<svg class="anatomy-svg" viewBox="0 0 320 700" xmlns="http://www.w3.org/2000/svg" aria-label="Front muscle anatomy" role="img">
      <g>
        <path id="deltoids-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["deltoids-front"]}" d="M98 140 C82 150,76 172,85 196 C93 219,106 230,122 224 C135 218,142 205,145 190 C149 170,142 151,128 140 Z M222 140 C238 150,244 172,235 196 C227 219,214 230,198 224 C185 218,178 205,175 190 C171 170,178 151,192 140 Z" />
        <path id="pectoralis-major-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["pectoralis-major-front"]}" d="M132 148 C148 142,168 143,182 152 C193 160,197 177,190 195 C181 213,165 222,145 220 C130 215,118 203,114 188 C109 172,116 156,132 148 Z M188 152 C202 143,222 142,238 148 C254 156,261 172,256 188 C252 203,240 215,225 220 C205 222,189 213,180 195 C173 177,177 160,188 152 Z" />
        <path id="biceps-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["biceps-front"]}" d="M96 226 C88 240,87 262,94 277 C102 293,115 300,127 294 C134 278,135 261,129 243 C124 230,112 220,96 226 Z M224 226 C232 240,233 262,226 277 C218 293,205 300,193 294 C186 278,185 261,191 243 C196 230,208 220,224 226 Z" />
        <path id="triceps-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["triceps-front"]}" d="M82 218 C72 236,71 268,82 291 C90 307,102 313,113 308 C118 292,117 274,111 255 C105 239,95 224,82 218 Z M238 218 C248 236,249 268,238 291 C230 307,218 313,207 308 C202 292,203 274,209 255 C215 239,225 224,238 218 Z" />
        <path id="forearms-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["forearms-front"]}" d="M92 297 C82 320,83 350,97 372 C106 386,118 391,130 386 C137 366,136 343,126 321 C120 309,107 298,92 297 Z M228 297 C238 320,237 350,223 372 C214 386,202 391,190 386 C183 366,184 343,194 321 C200 309,213 298,228 297 Z" />
        <path id="abs-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["abs-front"]}" d="M146 226 C155 220,165 220,174 226 C179 240,180 254,179 269 C178 284,175 299,170 312 C164 318,156 318,150 312 C145 299,142 284,141 269 C140 254,141 240,146 226 Z M145 315 C154 320,166 320,175 315 C178 328,178 342,174 356 C168 363,152 363,146 356 C142 342,142 328,145 315 Z" />
        <path id="obliques-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["obliques-front"]}" d="M118 238 C106 247,99 267,101 287 C103 305,112 319,124 326 C132 311,136 292,136 272 C136 258,130 244,118 238 Z M202 238 C214 247,221 267,219 287 C217 305,208 319,196 326 C188 311,184 292,184 272 C184 258,190 244,202 238 Z" />
        <path id="quadriceps-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["quadriceps-front"]}" d="M126 370 C112 392,107 433,114 470 C120 500,134 516,152 512 C162 482,165 443,162 406 C159 389,145 373,126 370 Z M194 370 C208 392,213 433,206 470 C200 500,186 516,168 512 C158 482,155 443,158 406 C161 389,175 373,194 370 Z" />
        <path id="calves-front" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["calves-front"]}" d="M130 520 C119 540,118 575,129 603 C136 619,147 627,158 624 C163 602,163 577,157 551 C152 535,143 523,130 520 Z M190 520 C201 540,202 575,191 603 C184 619,173 627,162 624 C157 602,157 577,163 551 C168 535,177 523,190 520 Z" />
      </g>
    </svg>`;
  }

  backSvg() {
    return `<svg class="anatomy-svg" viewBox="0 0 320 700" xmlns="http://www.w3.org/2000/svg" aria-label="Back muscle anatomy" role="img">
      <g>
        <path id="trapezius-back" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["trapezius-back"]}" d="M150 120 C160 108,170 108,180 120 C195 136,203 156,202 178 C190 190,176 196,160 197 C144 196,130 190,118 178 C117 156,125 136,140 120 Z" />
        <path id="deltoids-back" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["deltoids-back"]}" d="M100 148 C84 161,80 187,90 211 C99 232,115 240,132 232 C144 220,149 200,147 177 C145 162,132 150,100 148 Z M220 148 C236 161,240 187,230 211 C221 232,205 240,188 232 C176 220,171 200,173 177 C175 162,188 150,220 148 Z" />
        <path id="triceps-back" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["triceps-back"]}" d="M98 234 C86 249,83 280,94 306 C102 324,115 332,128 327 C134 307,132 285,124 263 C118 248,110 238,98 234 Z M222 234 C234 249,237 280,226 306 C218 324,205 332,192 327 C186 307,188 285,196 263 C202 248,210 238,222 234 Z" />
        <path id="forearms-back" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["forearms-back"]}" d="M104 327 C92 349,94 384,110 408 C119 421,131 426,143 420 C148 398,145 373,134 348 C127 336,117 329,104 327 Z M216 327 C228 349,226 384,210 408 C201 421,189 426,177 420 C172 398,175 373,186 348 C193 336,203 329,216 327 Z" />
        <path id="lats-back" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["lats-back"]}" d="M132 198 C118 213,108 244,108 278 C109 309,118 337,133 356 C147 348,157 325,160 292 C163 257,161 225,152 205 C146 199,139 197,132 198 Z M188 198 C202 213,212 244,212 278 C211 309,202 337,187 356 C173 348,163 325,160 292 C157 257,159 225,168 205 C174 199,181 197,188 198 Z" />
        <path id="glutes-back" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["glutes-back"]}" d="M132 360 C117 374,113 402,122 426 C129 445,144 455,160 452 C173 447,179 432,179 414 C179 390,168 370,149 360 Z M188 360 C203 374,207 402,198 426 C191 445,176 455,160 452 C147 447,141 432,141 414 C141 390,152 370,171 360 Z" />
        <path id="hamstrings-back" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["hamstrings-back"]}" d="M132 454 C118 473,113 510,120 545 C126 575,139 592,156 589 C164 563,166 531,164 497 C162 478,150 460,132 454 Z M188 454 C202 473,207 510,200 545 C194 575,181 592,164 589 C156 563,154 531,156 497 C158 478,170 460,188 454 Z" />
        <path id="calves-back" class="muscle-path" data-muscle-name="${MUSCLE_LABELS["calves-back"]}" d="M132 590 C122 608,121 640,132 666 C139 681,149 688,160 685 C166 665,166 643,161 620 C157 605,146 594,132 590 Z M188 590 C198 608,199 640,188 666 C181 681,171 688,160 685 C154 665,154 643,159 620 C163 605,174 594,188 590 Z" />
      </g>
    </svg>`;
  }
}

window.onMuscleSelect = function onMuscleSelect(muscleId) {
  console.log("onMuscleSelect called with:", muscleId);
};

const root = document.querySelector('[data-component="muscle-anatomy"]');
if (root) {
  const anatomy = new MuscleAnatomyComponent(root, {
    onMuscleSelect: (muscleId) => {
      console.log("External callback:", muscleId);
      window.onMuscleSelect(muscleId);
    }
  });

  window.muscleAnatomy = anatomy;
}
