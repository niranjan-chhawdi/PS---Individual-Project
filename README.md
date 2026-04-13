# VR Assembly Challenge Manual

## Overview

`VR Assembly Challenge` is a browser-based A-Frame project built from your original `Assembler.html` class activity.

The current version includes:
- a main menu
- level selection
- a tutorial panel
- multiple assembly levels
- pickup and equip sound effects
- looping background music with a menu toggle
- gaze-based interaction
- a gaze-based in-game menu return button
- scoring, timer, mistakes, and hints

This manual explains how to run it locally and how to host it on GitHub.

---

## Project Files

Main files in the project:

- `index.html`
  Main webpage for the game.

- `styles.css`
  Menu and HUD styling.

- `js/game.js`
  Main gameplay logic.

- `js/levels.js`
  Level definitions and part layout data.

- `assets/sound/`
  Sound effects and background music.

---

## How To Run Locally

### Option 1: Open directly

You can try opening `index.html` directly in a browser.

Steps:
1. Go to the project folder.
2. Double-click `index.html`.
3. If the browser allows it, the game will load.

### Option 2: Use a local server

This is the better option because some browsers handle assets more reliably with a server.

Examples:

If you have Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

If you use VS Code:
- Install the `Live Server` extension.
- Right-click `index.html`.
- Choose `Open with Live Server`.

---

## Game Controls

The project currently uses the same basic camera control style as your original `Assembler.html`.

Controls:
- Move your view with the mouse or device look controls.
- Use the center gaze cursor.
- Look at a part for the fuse duration to pick it up.
- Look at the correct blueprint slot for the fuse duration to place it.
- Use the menu buttons on screen for start, tutorial, hint, restart, and level selection.
- Use the in-world gaze menu button to return to the main menu during gameplay.

---

## How The Game Works

### Main Menu

The menu lets the player:
- start the game
- choose a level
- open the tutorial
- turn background music on or off

### Gameplay

During a level:
- the player looks at parts to pick them up
- the player looks at the correct target zone to place them
- correct placement increases progress and score
- mistakes reduce score
- hints help guide the player

### Level Completion

When all required parts are placed:
- the level ends
- a result panel appears
- score and time are shown
- the player can continue to the next level

---

## How To Edit The Game

### Add a new level

Edit:

`js/levels.js`

Each level contains:
- `id`
- `name`
- `subtitle`
- `objective`
- `environmentColor`
- `bestTimeKey`
- `scoreTargets`
- `partTrayLabel`
- `parts`

Each part contains:
- `id`
- `label`
- `primitive`
- `color`
- `position`
- shape values like `size`, `radius`, `height`, or cone values
- `target`

### Change sounds

Replace or add files inside:

`assets/sound/`

Then update the matching audio references in:

`index.html`

### Change logic

Main logic is in:

`js/game.js`

Important sections:
- game state
- menu and HUD updates
- sound playback
- level building
- hint logic
- gaze interactions

---

## Hosting On GitHub

### Step 1: Create a GitHub repository

On GitHub:
1. Sign in.
2. Click `New repository`.
3. Name it something like `vr-assembly-challenge`.
4. Create the repository.

### Step 2: Upload the project

Inside your project folder, run:

```bash
git init
git add .
git commit -m "Initial VR Assembly Challenge"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/vr-assembly-challenge.git
git push -u origin main
```

Replace:

`YOUR-USERNAME`

with your GitHub username.

### Step 3: Enable GitHub Pages

On GitHub:
1. Open your repository.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`, choose:
   - `Source: Deploy from a branch`
   - `Branch: main`
   - `Folder: / (root)`
5. Save.

### Step 4: Open your hosted game

GitHub Pages will give you a URL like:

```text
https://YOUR-USERNAME.github.io/vr-assembly-challenge/
```

That URL will host your `index.html`.

---

## Important Hosting Notes

- Keep `index.html` in the root of the repository.
- Keep the `js` and `assets` folders in the repository exactly as they are.
- GitHub Pages will serve the game as a static website.
- Because the project uses A-Frame from a CDN, the player needs internet access when loading the page.

---

## Recommended GitHub Repo Structure

```text
vr-assembly-challenge/
├── index.html
├── styles.css
├── MANUAL.md
├── js/
│   ├── game.js
│   └── levels.js
└── assets/
    └── sound/
        ├── freesound_community-item-equip-6904.mp3
        ├── freesound_community-pick-up-sfx-38516.mp3
        └── hitslab-game-gaming-music-295075.mp3
```

---

## Common Problems

### Sounds do not play

Possible reasons:
- browser autoplay rules
- music toggle is off
- sound file path is wrong

Check:
- `assets/sound/`
- browser console
- menu music toggle

### Game does not load on GitHub Pages

Check:
- `index.html` is in the repository root
- GitHub Pages is enabled on the correct branch
- file names match exactly, including capitalization

### Gaze actions do not trigger

Check:
- the cursor is visible
- the player keeps the target centered long enough
- the fuse timeout has not been changed unexpectedly

---

## Suggested Next Improvements

Good next upgrades:
- add a proper README for the GitHub repo
- add screenshots and a gameplay GIF
- improve the hint visuals
- polish the first-person controls
- add better 3D models instead of simple primitives
- add more levels and more detailed workshop environments

---

## Final Note

If you host this on GitHub Pages, the project should work as a static web game with no backend required.

If you want, the next step I can do is create a polished `README.md` for GitHub as well, so your repository looks ready to submit or share.
