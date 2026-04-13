const HOLD_TIME = 1200;
const HINT_SCORE_PENALTY = 75;
const MISTAKE_SCORE_PENALTY = 50;
const LEVELS = window.LEVELS || [];
const MUSIC_SETTING_KEY = "vr-assembly-music-enabled";
const MOBILE_VR_SETTING_KEY = "vr-assembly-mobile-vr-enabled";
const ROOM_BOUNDS = {
  minX: -8.6,
  maxX: 8.6,
  minZ: -4.6,
  maxZ: 8.6,
  fixedY: 1.6,
};
const PLAYER_START = {
  position: { x: 0, y: 1.6, z: 6 },
  yaw: 0,
};

const state = {
  levelIndex: 0,
  assembledCount: 0,
  mistakes: 0,
  hintsUsed: 0,
  score: 1000,
  startTime: null,
  elapsedSeconds: 0,
  playing: false,
  completed: false,
  currentHeldPart: null,
};

const PROJECT_CREDITS = {
  name: "Student Name",
  details: "Student ID | CMPT 461 | Spring 2026",
};

const ui = {
  splashScreen: document.querySelector("#splashScreen"),
  enterProjectButton: document.querySelector("#enterProjectButton"),
  creditName: document.querySelector("#creditName"),
  creditDetails: document.querySelector("#creditDetails"),
  menuPanel: document.querySelector("#menuPanel"),
  sidePanel: document.querySelector("#sidePanel"),
  mobileHud: document.querySelector("#mobileHud"),
  mobileHudDrawer: document.querySelector("#mobileHudDrawer"),
  mobileHudToggle: document.querySelector("#mobileHudToggle"),
  tutorialModal: document.querySelector("#tutorialModal"),
  resultsModal: document.querySelector("#resultsModal"),
  startButton: document.querySelector("#startButton"),
  tutorialButton: document.querySelector("#tutorialButton"),
  mobileVrButton: document.querySelector("#mobileVrButton"),
  levelSelect: document.querySelector("#levelSelect"),
  musicToggle: document.querySelector("#musicToggle"),
  mobileModeToggle: document.querySelector("#mobileModeToggle"),
  setupNote: document.querySelector("#setupNote"),
  closeTutorialButton: document.querySelector("#closeTutorialButton"),
  restartButton: document.querySelector("#restartButton"),
  mobileHintButton: document.querySelector("#mobileHintButton"),
  mobileRestartButton: document.querySelector("#mobileRestartButton"),
  hintButton: document.querySelector("#hintButton"),
  nextButton: document.querySelector("#nextButton"),
  resultContinueButton: document.querySelector("#resultContinueButton"),
  levelTitle: document.querySelector("#levelTitle"),
  levelSubtitle: document.querySelector("#levelSubtitle"),
  objectiveText: document.querySelector("#objectiveText"),
  timeLabel: document.querySelector("#timeLabel"),
  mobileTimeLabel: document.querySelector("#mobileTimeLabel"),
  scoreLabel: document.querySelector("#scoreLabel"),
  mobileScoreLabel: document.querySelector("#mobileScoreLabel"),
  mistakeLabel: document.querySelector("#mistakeLabel"),
  mobileMistakeLabel: document.querySelector("#mobileMistakeLabel"),
  bestLabel: document.querySelector("#bestLabel"),
  statusMessage: document.querySelector("#statusMessage"),
  mobileLevelTitle: document.querySelector("#mobileLevelTitle"),
  mobileLevelSubtitle: document.querySelector("#mobileLevelSubtitle"),
  mobileObjectiveText: document.querySelector("#mobileObjectiveText"),
  mobileStatusMessage: document.querySelector("#mobileStatusMessage"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  resultStars: document.querySelector("#resultStars"),
};

const scene = document.querySelector("#scene");
const worldRoot = document.querySelector("#worldRoot");
const rig = document.querySelector("#rig");
const camera = rig.querySelector("a-camera");
const handAnchor = document.querySelector("#handAnchor");
const pickupSound = document.querySelector("#pickupSound");
const equipSound = document.querySelector("#equipSound");
const bgMusic = document.querySelector("#bgMusic");
const textureIds = {
  wall: document.querySelector("#wallTexture"),
  floor: document.querySelector("#floorTexture"),
  metal: document.querySelector("#metalTexture"),
  panel: document.querySelector("#panelTexture"),
  warning: document.querySelector("#warningTexture"),
  red: document.querySelector("#partTextureRed"),
  blue: document.querySelector("#partTextureBlue"),
  orange: document.querySelector("#partTextureOrange"),
};

function isMusicEnabled() {
  const stored = localStorage.getItem(MUSIC_SETTING_KEY);
  return stored === null ? true : stored === "true";
}

function isMobileVrEnabled() {
  return localStorage.getItem(MOBILE_VR_SETTING_KEY) === "true";
}

function getCurrentLevel() {
  return LEVELS[state.levelIndex];
}

function formatTime(seconds) {
  return `${seconds.toFixed(1)}s`;
}

function clampScore(value) {
  return Math.max(0, Math.round(value));
}

function clampRigToRoom() {
  const rigPosition = rig.object3D?.position;
  if (!rigPosition) {
    return;
  }

  const clampedX = Math.min(ROOM_BOUNDS.maxX, Math.max(ROOM_BOUNDS.minX, rigPosition.x));
  const clampedZ = Math.min(ROOM_BOUNDS.maxZ, Math.max(ROOM_BOUNDS.minZ, rigPosition.z));

  if (
    Math.abs(clampedX - rigPosition.x) > 0.001 ||
    Math.abs(ROOM_BOUNDS.fixedY - rigPosition.y) > 0.001 ||
    Math.abs(clampedZ - rigPosition.z) > 0.001
  ) {
    rigPosition.set(clampedX, ROOM_BOUNDS.fixedY, clampedZ);
  }
}

function setStatus(message) {
  ui.statusMessage.textContent = message;
  if (ui.mobileStatusMessage) {
    ui.mobileStatusMessage.textContent = message;
  }
}

function createPatternDataUrl(draw) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  draw(ctx, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function initializeTextures() {
  textureIds.wall.src = createPatternDataUrl((ctx, width, height) => {
    ctx.fillStyle = "#aeb8b9";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#98a4a6";
    for (let y = 0; y < height; y += 48) {
      for (let x = 0; x < width; x += 64) {
        ctx.fillRect(x, y, 62, 42);
      }
    }
  });

  textureIds.floor.src = createPatternDataUrl((ctx, width, height) => {
    ctx.fillStyle = "#8bb174";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 3;
    for (let i = 0; i <= width; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
  });

  textureIds.metal.src = createPatternDataUrl((ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#798b95");
    gradient.addColorStop(0.5, "#c8d2d6");
    gradient.addColorStop(1, "#718089");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    for (let i = 0; i < 18; i += 1) {
      ctx.beginPath();
      ctx.arc(18 + i * 14, 20 + (i % 2) * 70, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  textureIds.panel.src = createPatternDataUrl((ctx, width, height) => {
    ctx.fillStyle = "#5a4b3f";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 4;
    for (let y = 18; y < height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y - 8);
      ctx.stroke();
    }
  });

  textureIds.warning.src = createPatternDataUrl((ctx, width, height) => {
    ctx.fillStyle = "#1c2d2f";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#e9c46a";
    ctx.lineWidth = 18;
    for (let x = -height; x < width; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
  });

  const paintPart = (element, base, accent) => {
    element.src = createPatternDataUrl((ctx, width, height) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = accent;
      for (let i = 0; i < 5; i += 1) {
        ctx.fillRect(0, 24 + i * 44, width, 16);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.24)";
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, width - 20, height - 20);
    });
  };

  paintPart(textureIds.red, "#cc4b5d", "#8f2234");
  paintPart(textureIds.blue, "#4a6fa5", "#263e66");
  paintPart(textureIds.orange, "#f08a24", "#b95d0f");
}

function playSound(audioEl) {
  if (!audioEl) {
    return;
  }

  audioEl.currentTime = 0;
  audioEl.play().catch(() => {
    // Browsers may block autoplay until the player interacts with the page.
  });
}

function syncMusicToggle() {
  if (ui.musicToggle) {
    ui.musicToggle.checked = isMusicEnabled();
  }
}

function syncMobileVrToggle() {
  if (ui.mobileModeToggle) {
    ui.mobileModeToggle.checked = isMobileVrEnabled();
  }
}

function playBackgroundMusic() {
  if (!bgMusic || !isMusicEnabled()) {
    return;
  }

  bgMusic.loop = true;
  bgMusic.volume = 0.35;
  bgMusic.play().catch(() => {
    // Waiting for a user interaction is fine on browsers that block autoplay.
  });
}

function stopBackgroundMusic() {
  if (!bgMusic) {
    return;
  }

  bgMusic.pause();
  bgMusic.currentTime = 0;
}

function setMusicEnabled(enabled) {
  localStorage.setItem(MUSIC_SETTING_KEY, String(enabled));
  syncMusicToggle();

  if (enabled) {
    playBackgroundMusic();
    return;
  }

  stopBackgroundMusic();
}

function setMobileVrEnabled(enabled) {
  localStorage.setItem(MOBILE_VR_SETTING_KEY, String(enabled));
  syncMobileVrToggle();
  scene.setAttribute("embedded", enabled ? "false" : "false");
  ui.setupNote.textContent = enabled
    ? "Mobile VR mode is on. Open this page on your phone, tap Enter Mobile VR, and place the phone into a cardboard headset."
    : "For stereoscopic mobile VR, turn on Mobile VR / Cardboard Mode and press Enter Mobile VR on your phone.";
}

function resetState() {
  state.assembledCount = 0;
  state.mistakes = 0;
  state.hintsUsed = 0;
  state.score = 1000;
  state.startTime = null;
  state.elapsedSeconds = 0;
  state.playing = false;
  state.completed = false;
  state.currentHeldPart = null;
}

function clearWorld() {
  worldRoot.innerHTML = "";
}

function clearRigAttachments() {
  [...handAnchor.children].forEach((child) => {
    handAnchor.removeChild(child);
  });
}

function resetPlayerPose() {
  rig.object3D.position.set(
    PLAYER_START.position.x,
    PLAYER_START.position.y,
    PLAYER_START.position.z,
  );
  rig.object3D.rotation.set(0, AFRAME.THREE.MathUtils.degToRad(PLAYER_START.yaw), 0);
  camera.object3D.rotation.set(0, 0, 0);

  const lookControls = camera.components["look-controls"];
  if (lookControls) {
    lookControls.pitchObject.rotation.x = 0;
    lookControls.yawObject.rotation.y = 0;
  }
}

function createEntity(definition, extraAttributes = {}) {
  const el = document.createElement(definition.primitive);

  if (definition.position) {
    el.setAttribute("position", definition.position);
  }

  if (definition.rotation) {
    el.setAttribute("rotation", definition.rotation);
  }

  if (definition.color) {
    el.setAttribute("color", definition.color);
  }

  if (definition.size) {
    el.setAttribute("width", definition.size.width);
    el.setAttribute("height", definition.size.height);
    el.setAttribute("depth", definition.size.depth);
  }

  if (definition.radius !== undefined) {
    el.setAttribute("radius", definition.radius);
  }

  if (definition.height !== undefined) {
    el.setAttribute("height", definition.height);
  }

  if (definition.radiusBottom !== undefined) {
    el.setAttribute("radius-bottom", definition.radiusBottom);
  }

  if (definition.radiusTop !== undefined) {
    el.setAttribute("radius-top", definition.radiusTop);
  }

  Object.entries(extraAttributes).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  return el;
}

function getPartTexture(partId) {
  if (partId.includes("body") || partId.includes("frame") || partId.includes("core")) {
    return "#partTextureRed";
  }

  if (partId.includes("wheel") || partId.includes("arm") || partId.includes("mast")) {
    return "#partTextureBlue";
  }

  return "#partTextureOrange";
}

function buildEnvironment(level) {
  scene.setAttribute("background", `color: ${level.environmentColor}`);

  const backWall = document.createElement("a-box");
  backWall.setAttribute("position", "0 2 -6");
  backWall.setAttribute("width", "20");
  backWall.setAttribute("height", "4");
  backWall.setAttribute("depth", "0.2");
  backWall.setAttribute("material", "src: #wallTexture; repeat: 5 1; roughness: 0.95");

  const leftWall = document.createElement("a-box");
  leftWall.setAttribute("position", "-10 2 0");
  leftWall.setAttribute("width", "0.2");
  leftWall.setAttribute("height", "4");
  leftWall.setAttribute("depth", "20");
  leftWall.setAttribute("material", "src: #wallTexture; repeat: 5 2; roughness: 0.95");

  const rightWall = document.createElement("a-box");
  rightWall.setAttribute("position", "10 2 0");
  rightWall.setAttribute("width", "0.2");
  rightWall.setAttribute("height", "4");
  rightWall.setAttribute("depth", "20");
  rightWall.setAttribute("material", "src: #wallTexture; repeat: 5 2; roughness: 0.95");

  const frontWall = document.createElement("a-box");
  frontWall.setAttribute("position", "0 2 10");
  frontWall.setAttribute("width", "20");
  frontWall.setAttribute("height", "4");
  frontWall.setAttribute("depth", "0.2");
  frontWall.setAttribute("material", "src: #wallTexture; repeat: 5 1; roughness: 0.95");

  const tray = document.createElement("a-box");
  tray.setAttribute("position", "-4 0.8 0");
  tray.setAttribute("width", "2.8");
  tray.setAttribute("height", "1");
  tray.setAttribute("depth", "2.4");
  tray.setAttribute("material", "src: #panelTexture; repeat: 2 2; roughness: 0.9");

  const trayLabel = document.createElement("a-text");
  trayLabel.setAttribute("value", level.partTrayLabel);
  trayLabel.setAttribute("position", "-5.25 1.9 0");
  trayLabel.setAttribute("width", "5");
  trayLabel.setAttribute("color", "#132220");

  const platform = document.createElement("a-box");
  platform.setAttribute("position", "1.5 0.5 0");
  platform.setAttribute("width", "4.8");
  platform.setAttribute("height", "0.3");
  platform.setAttribute("depth", "3.2");
  platform.setAttribute("material", "src: #metalTexture; repeat: 2 1; roughness: 0.8");

  const platformLabel = document.createElement("a-text");
  platformLabel.setAttribute("value", `${level.name} Blueprint`);
  platformLabel.setAttribute("position", "0 1.95 0");
  platformLabel.setAttribute("width", "6");
  platformLabel.setAttribute("color", "#132220");

  const ghostBase = document.createElement("a-box");
  ghostBase.setAttribute("position", "1.5 1.0 0");
  ghostBase.setAttribute("width", "2.6");
  ghostBase.setAttribute("height", "0.08");
  ghostBase.setAttribute("depth", "1.7");
  ghostBase.setAttribute("material", "src: #warningTexture; opacity: 0.35; transparent: true");

  const menuButton = document.createElement("a-box");
  menuButton.setAttribute("position", "-7.8 2.55 6.6");
  menuButton.setAttribute("width", "1.9");
  menuButton.setAttribute("height", "0.7");
  menuButton.setAttribute("depth", "0.2");
  menuButton.setAttribute("material", "src: #warningTexture; roughness: 0.9");
  menuButton.setAttribute("rotation", "0 90 0");
  menuButton.setAttribute("gaze-action", "action: menu; label: Return to Menu");

  const menuLabel = document.createElement("a-text");
  menuLabel.setAttribute("value", "Back To\nMenu");
  menuLabel.setAttribute("position", "-7.68 2.47 7.02");
  menuLabel.setAttribute("rotation", "0 90 0");
  menuLabel.setAttribute("width", "3.4");
  menuLabel.setAttribute("align", "center");
  menuLabel.setAttribute("color", "#fdf7ef");

  const menuFrame = document.createElement("a-box");
  menuFrame.setAttribute("position", "-7.95 2.55 6.6");
  menuFrame.setAttribute("width", "2.2");
  menuFrame.setAttribute("height", "1");
  menuFrame.setAttribute("depth", "0.08");
  menuFrame.setAttribute("material", "src: #metalTexture; roughness: 0.8");
  menuFrame.setAttribute("rotation", "0 90 0");

  worldRoot.append(
    backWall,
    leftWall,
    rightWall,
    frontWall,
    tray,
    trayLabel,
    platform,
    platformLabel,
    ghostBase,
    menuFrame,
    menuButton,
    menuLabel,
  );
}

function buildLevel(level) {
  clearWorld();
  buildEnvironment(level);

  level.parts.forEach((part) => {
    const partEl = createEntity(part, {
      material: `src: ${getPartTexture(part.id)}; color: ${part.color}; roughness: 0.72`,
      "gaze-part": `partId: ${part.id}; label: ${part.label}`,
    });
    worldRoot.appendChild(partEl);

    const target = {
      ...part.target,
      color: "#5dade2",
    };

    const zoneEl = createEntity(target, {
      opacity: "0.34",
      material: "transparent: true; opacity: 0.34; src: #warningTexture; color: #7fc8f8",
      "drop-zone": `accept: ${part.id}; label: ${part.label}`,
    });
    worldRoot.appendChild(zoneEl);
  });

  resetPlayerPose();
}

function updateHud() {
  const level = getCurrentLevel();
  ui.levelTitle.textContent = `${state.levelIndex + 1}. ${level.name}`;
  ui.levelSubtitle.textContent = level.subtitle;
  ui.objectiveText.textContent = level.objective;
  ui.mobileLevelTitle.textContent = `${state.levelIndex + 1}. ${level.name}`;
  ui.mobileLevelSubtitle.textContent = level.subtitle;
  ui.mobileObjectiveText.textContent = level.objective;
  ui.timeLabel.textContent = formatTime(state.elapsedSeconds);
  ui.mobileTimeLabel.textContent = formatTime(state.elapsedSeconds);
  ui.scoreLabel.textContent = String(clampScore(state.score));
  ui.mobileScoreLabel.textContent = String(clampScore(state.score));
  ui.mistakeLabel.textContent = String(state.mistakes);
  ui.mobileMistakeLabel.textContent = String(state.mistakes);

  const best = localStorage.getItem(level.bestTimeKey);
  ui.bestLabel.textContent = best ? formatTime(Number(best)) : "--";
  if (ui.levelSelect) {
    ui.levelSelect.value = String(state.levelIndex);
  }
}

function saveBestTime() {
  const level = getCurrentLevel();
  const best = Number(localStorage.getItem(level.bestTimeKey));
  if (!best || state.elapsedSeconds < best) {
    localStorage.setItem(level.bestTimeKey, String(state.elapsedSeconds));
  }
}

function startLevel() {
  const level = getCurrentLevel();
  resetState();
  clearRigAttachments();
  buildLevel(level);
  updateHud();
  playBackgroundMusic();
  ui.menuPanel.classList.add("hidden");
  ui.sidePanel.classList.remove("hidden");
  ui.mobileHud.classList.remove("hidden");
  ui.mobileHudDrawer.classList.add("hidden");
  ui.nextButton.classList.add("hidden");
  ui.resultsModal.classList.add("hidden");
  setStatus(`Build the ${level.name}. Start by collecting a part from the tray.`);
}

function returnToMenu() {
  resetState();
  clearRigAttachments();
  clearWorld();
  resetPlayerPose();
  document.exitPointerLock?.();
  stopBackgroundMusic();
  ui.sidePanel.classList.add("hidden");
  ui.mobileHud.classList.add("hidden");
  ui.mobileHudDrawer.classList.add("hidden");
  ui.resultsModal.classList.add("hidden");
  ui.resultsModal.setAttribute("aria-hidden", "true");
  ui.menuPanel.classList.remove("hidden");
  updateHud();
}

function openTutorial() {
  ui.tutorialModal.classList.remove("hidden");
  ui.tutorialModal.setAttribute("aria-hidden", "false");
}

function closeTutorial() {
  ui.tutorialModal.classList.add("hidden");
  ui.tutorialModal.setAttribute("aria-hidden", "true");
}

function beginTimerIfNeeded() {
  if (!state.startTime) {
    state.startTime = performance.now();
    state.playing = true;
  }
}

function getStars(elapsedSeconds, mistakes, hintsUsed, scoreTargets) {
  if (elapsedSeconds <= scoreTargets.threeStar && mistakes === 0 && hintsUsed === 0) {
    return 3;
  }

  if (elapsedSeconds <= scoreTargets.twoStar && mistakes <= 1) {
    return 2;
  }

  return 1;
}

function finishLevel() {
  state.completed = true;
  state.playing = false;
  saveBestTime();
  updateHud();

  const level = getCurrentLevel();
  const stars = getStars(state.elapsedSeconds, state.mistakes, state.hintsUsed, level.scoreTargets);
  const starText = `${"[#] ".repeat(stars)}${"[ ] ".repeat(3 - stars)}`.trim();

  ui.resultTitle.textContent = `${level.name} Complete`;
  ui.resultSummary.textContent =
    `Time ${formatTime(state.elapsedSeconds)} | Score ${clampScore(state.score)} | Mistakes ${state.mistakes}`;
  ui.resultStars.textContent = starText;
  ui.resultsModal.classList.remove("hidden");
  ui.resultsModal.setAttribute("aria-hidden", "false");

  if (state.levelIndex < LEVELS.length - 1) {
    ui.nextButton.classList.remove("hidden");
  } else {
    ui.nextButton.classList.add("hidden");
    setStatus("Workshop cleared. You completed all available builds.");
  }
}

function registerMistake(partLabel, zoneLabel) {
  state.mistakes += 1;
  state.score = clampScore(state.score - MISTAKE_SCORE_PENALTY);
  updateHud();
  setStatus(`${partLabel} does not belong on ${zoneLabel}. Try a different slot.`);
}

function handlePartPickup(partEl, label) {
  beginTimerIfNeeded();

  if (state.currentHeldPart && state.currentHeldPart !== partEl) {
    worldRoot.appendChild(state.currentHeldPart);
    state.currentHeldPart.setAttribute("position", state.currentHeldPart.dataset.homePosition);
    if (state.currentHeldPart.dataset.homeRotation) {
      state.currentHeldPart.setAttribute("rotation", state.currentHeldPart.dataset.homeRotation);
    }
  }

  state.currentHeldPart = partEl;
  partEl.setAttribute("position", "0 0 0");
  partEl.setAttribute("rotation", "0 0 0");
  handAnchor.appendChild(partEl);
  playSound(pickupSound);
  setStatus(`${label} collected. Find the matching blueprint slot.`);
}

function handlePartPlaced(partEl, zoneEl, label) {
  const targetPosition = zoneEl.getAttribute("position");
  const targetRotation = zoneEl.getAttribute("rotation");

  state.currentHeldPart = null;
  state.assembledCount += 1;
  state.score = clampScore(state.score + 200);

  worldRoot.appendChild(partEl);
  partEl.setAttribute("position", targetPosition);
  if (targetRotation) {
    partEl.setAttribute("rotation", targetRotation);
  }
  partEl.removeAttribute("gaze-part");
  zoneEl.setAttribute("material", "transparent: true; opacity: 0.22; color: #7ac74f");
  zoneEl.removeAttribute("drop-zone");
  playSound(equipSound);

  updateHud();
  setStatus(`${label} locked in. ${state.assembledCount}/${getCurrentLevel().parts.length} parts complete.`);

  if (state.assembledCount >= getCurrentLevel().parts.length) {
    finishLevel();
  }
}

function showHint() {
  if (state.completed) {
    return;
  }

  state.hintsUsed += 1;
  state.score = clampScore(state.score - HINT_SCORE_PENALTY);
  updateHud();

  const availableZones = [...document.querySelectorAll("[drop-zone]")];
  const availableParts = [...document.querySelectorAll("[gaze-part]")];

  if (state.currentHeldPart) {
    const heldData = state.currentHeldPart.getAttribute("gaze-part");
    const matchingZone = availableZones.find(
      (zone) => zone.getAttribute("drop-zone").accept === heldData.partId,
    );

    if (matchingZone) {
      matchingZone.setAttribute(
        "animation",
        "property: material.opacity; from: 0.34; to: 0.92; dir: alternate; dur: 260; loop: 8",
      );
      matchingZone.setAttribute(
        "animation__pulse",
        "property: scale; from: 1 1 1; to: 1.12 1.12 1.12; dir: alternate; dur: 260; loop: 8",
      );
      setStatus(`Hint: place ${heldData.label} on the glowing blueprint slot.`);
      return;
    }
  }

  const nextPart = availableParts[0];
  if (nextPart) {
    const currentScale = nextPart.getAttribute("scale") || { x: 1, y: 1, z: 1 };
    nextPart.setAttribute(
      "animation",
      `property: scale; from: ${currentScale.x} ${currentScale.y} ${currentScale.z}; to: ${
        currentScale.x * 1.18
      } ${currentScale.y * 1.18} ${currentScale.z * 1.18}; dir: alternate; dur: 320; loop: 8`,
    );
    const partData = nextPart.getAttribute("gaze-part");
    setStatus(`Hint: pick up ${partData.label} from the parts tray first.`);
    return;
  }

  setStatus("No hint available right now.");
}

AFRAME.registerComponent("game-manager", {
  tick() {
    clampRigToRoom();

    if (!state.playing || state.completed || !state.startTime) {
      return;
    }

    state.elapsedSeconds = (performance.now() - state.startTime) / 1000;
    updateHud();
  },
});

AFRAME.registerComponent("head-tilt-move", {
  init() {
    this.direction = new AFRAME.THREE.Vector3();
  },
  tick(_time, delta) {
    if (ui.menuPanel.classList.contains("hidden") === false || state.completed) {
      return;
    }

    const lookControls = camera.components["look-controls"];
    if (!lookControls) {
      return;
    }

    const pitch = AFRAME.THREE.MathUtils.radToDeg(lookControls.pitchObject.rotation.x);
    if (pitch > -22) {
      return;
    }

    const step = delta / 1000;
    camera.object3D.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();
    rig.object3D.position.x += this.direction.x * 1.6 * step;
    rig.object3D.position.z += this.direction.z * 1.6 * step;
  },
});

AFRAME.registerComponent("gaze-part", {
  schema: {
    partId: { type: "string" },
    label: { type: "string" },
  },
  init() {
    this.pickupTimer = null;
    this.el.dataset.homePosition = this.el.getAttribute("position");
    this.el.dataset.homeRotation = this.el.getAttribute("rotation") || "";

    this.el.addEventListener("mouseenter", () => {
      if (state.completed || state.currentHeldPart === this.el) {
        return;
      }

      this.pickupTimer = window.setTimeout(() => {
        handlePartPickup(this.el, this.data.label);
      }, HOLD_TIME);
    });

    this.el.addEventListener("mouseleave", () => {
      window.clearTimeout(this.pickupTimer);
    });
  },
  remove() {
    window.clearTimeout(this.pickupTimer);
  },
});

AFRAME.registerComponent("drop-zone", {
  schema: {
    accept: { type: "string" },
    label: { type: "string" },
  },
  init() {
    this.hoverTimer = null;

    this.el.addEventListener("mouseenter", () => {
      if (!state.currentHeldPart || state.completed) {
        return;
      }

      const heldPart = state.currentHeldPart;
      const heldData = heldPart.getAttribute("gaze-part");

      if (!heldData) {
        return;
      }

      this.hoverTimer = window.setTimeout(() => {
        if (heldData.partId === this.data.accept) {
          handlePartPlaced(heldPart, this.el, heldData.label);
          return;
        }

        registerMistake(heldData.label, this.data.label);
      }, HOLD_TIME);
    });

    this.el.addEventListener("mouseleave", () => {
      window.clearTimeout(this.hoverTimer);
    });
  },
  remove() {
    window.clearTimeout(this.hoverTimer);
  },
});

AFRAME.registerComponent("gaze-action", {
  schema: {
    action: { type: "string" },
    label: { type: "string" },
  },
  init() {
    this.actionTimer = null;

    this.el.addEventListener("mouseenter", () => {
      if (this.data.action !== "menu") {
        return;
      }

      setStatus(`Hold your gaze to ${this.data.label.toLowerCase()}.`);
      this.el.setAttribute("animation", "property: scale; from: 1 1 1; to: 1.08 1.08 1.08; dur: 220; dir: alternate; loop: true");

      this.actionTimer = window.setTimeout(() => {
        this.el.removeAttribute("animation");
        returnToMenu();
      }, HOLD_TIME);
    });

    this.el.addEventListener("mouseleave", () => {
      window.clearTimeout(this.actionTimer);
      this.el.removeAttribute("animation");
    });
  },
  remove() {
    window.clearTimeout(this.actionTimer);
  },
});

function openResultsOrAdvance() {
  ui.resultsModal.classList.add("hidden");
  ui.resultsModal.setAttribute("aria-hidden", "true");

  if (state.levelIndex < LEVELS.length - 1) {
    state.levelIndex += 1;
    startLevel();
  }
}

function populateLevelSelect() {
  if (!ui.levelSelect) {
    return;
  }

  ui.levelSelect.innerHTML = "";
  LEVELS.forEach((level, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${level.name}`;
    ui.levelSelect.appendChild(option);
  });
  ui.levelSelect.value = String(state.levelIndex);
}

function bindUi() {
  ui.enterProjectButton.addEventListener("click", () => {
    ui.splashScreen.classList.add("hidden");
    ui.menuPanel.classList.remove("hidden");
    playBackgroundMusic();
  });

  ui.startButton.addEventListener("click", () => {
    state.levelIndex = Number(ui.levelSelect?.value ?? 0);
    startLevel();
  });

  ui.tutorialButton.addEventListener("click", openTutorial);
  ui.mobileVrButton.addEventListener("click", () => {
    if (ui.mobileModeToggle.checked) {
      scene.enterVR();
      return;
    }

    setStatus("Turn on Mobile VR / Cardboard Mode in setup first, then use Enter Mobile VR on your phone.");
  });
  ui.closeTutorialButton.addEventListener("click", closeTutorial);
  ui.restartButton.addEventListener("click", startLevel);
  ui.mobileRestartButton.addEventListener("click", startLevel);
  ui.hintButton.addEventListener("click", showHint);
  ui.mobileHintButton.addEventListener("click", showHint);
  ui.nextButton.addEventListener("click", openResultsOrAdvance);
  ui.resultContinueButton.addEventListener("click", openResultsOrAdvance);
  ui.mobileHudToggle.addEventListener("click", () => {
    ui.mobileHudDrawer.classList.toggle("hidden");
  });
  ui.musicToggle.addEventListener("change", (event) => {
    setMusicEnabled(event.target.checked);
  });
  ui.mobileModeToggle.addEventListener("change", (event) => {
    setMobileVrEnabled(event.target.checked);
  });
  ui.levelSelect.addEventListener("change", (event) => {
    state.levelIndex = Number(event.target.value);
    updateHud();
  });
}

initializeTextures();
ui.creditName.textContent = PROJECT_CREDITS.name;
ui.creditDetails.textContent = PROJECT_CREDITS.details;
populateLevelSelect();
syncMusicToggle();
syncMobileVrToggle();
setMobileVrEnabled(isMobileVrEnabled());
bindUi();
updateHud();
