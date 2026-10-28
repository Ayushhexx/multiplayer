# 🌴 GTA Vice City Multiplayer 3D

[![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Starlette](https://img.shields.io/badge/Starlette-Async-4B8BBE?style=for-the-badge)](https://www.starlette.io/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--time-010101?style=for-the-badge&logo=socket.dot_io)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

An open-world 3D action game inspired by Grand Theft Auto: Vice City, built completely for the web using **Three.js**, **Web Audio API**, and **Python WebSockets**. Features third-person combat, realistic vehicle driving and destruction, motorcycle drive-by shooting, dynamic weather and day/night cycles, a 5-star tactical police AI system, prehistoric Dinosaur Island encounters, full story missions, and seamless real-time multiplayer.

---

## 📸 Key Features

### 🌆 Expanded 3D Vice City World
* **Iconic Ocean Drive Strip**: Expanded 1,100-meter boulevard flanked by neon Art Deco hotels, sidewalks, zebra crossings, and swaying palm trees.
* **Realistic Ocean & Beaches**: Deep tropical Caribbean blue ocean with real-time vertex wave displacement and glistening shoreline sand.
* **Twin Water-Crossing Bridges**:
  * **Vice Bay Bridge** ($z = 0$) connecting downtown to Starfish Island.
  * **South Bay Ocean Causeway Bridge** ($z = 180$, $x = 25 \rightarrow 225$) offering multi-lane elevated highway crossings.
* **Prehistoric Dinosaur Island**: Isolated jungle territory populated by T-Rex and Velociraptors.
* **Interactive City Landmarks**: Pay 'n' Spray repair garage, Beach Marina piers, downtown skyscrapers, stunt ramps, and a working lighthouse.

### 🚗 Vehicles, Physics & Drive-By Combat
* **Diverse Vehicle Fleet**: Sports cars (Infernus, Cheetah, Cruiser), PCJ-600 racing motorcycle, heavy Rhino military tank with rotating cannon, police cruisers, and speedboats.
* **Detailed Motorcycle Overhaul**: PCJ-600 built with an aluminum perimeter frame, 4-cylinder engine block, bubble windscreen, inverted forks, digital dash cluster, dual disc brakes with Brembo calipers, and clip-on bars.
* **Simultaneous Bike Drive-By Shooting**: Steer, accelerate, and brake while aiming and firing weapons with a live crosshair in third-person.
* **Realistic Vehicle Destruction**: Vehicles take ballistic damage, explode into fire and shockwaves, turn into charred matte black wreckage, and automatically despawn after 30 seconds.
* **Water Drowning Physics**: Ground vehicles entering ocean water stall their engine, sink into the surf, emit splash bubbles, and disable throttle. Speedboats navigate water smoothly.

### 🔫 Weapons & Gunplay
* **Arsenal**: Fists, Pistol, SMG, Shotgun, M4 Assault Rifle, Sniper Rifle, RPG, and Minigun.
* **Unlimited Reserve Ammo**: Weapons feature infinite reserve ammunition while keeping realistic magazine limits and manual reload mechanics (<kbd>R</kbd>).
* **Combat Feedback**: Over-the-shoulder aiming zoom (Right-Click), dynamic reticle, confirmed hit markers, blood spurts, bullet tracers, and screen shake.
* **Low-Health Auto-Regen**: When health drops below 30 HP, Tommy slowly recovers health back up to 30 HP once safe behind cover (8-second combat cooldown).

### 🚨 5-Star Wanted System & Tactical Police
* **20-Person Kill Rule**: Police ignore minor scuffles; **only when you eliminate 20 persons is 1 Wanted Star awarded**. Under 20 kills, wanted heat remains at 0 stars and police will not follow or pursue.
* **Animal & Dinosaur Immunity**: Eliminating ambient animals (dogs, cats) or prehistoric dinosaurs on Dinosaur Island never increases wanted level or alerts police squads.
* **Ocean Water Pursuit Barrier**: Police squad cars cannot drive into ocean water or follow boats. When you enter the water, pursuing squad cars immediately halt at the shoreline, turn off sirens, and call off the pursuit within 2.5 seconds.
* **Dynamic 5-Star Heat**:
  * **1 Star** (20 Kills): Patrol cars investigate and pursue.
  * **2 Stars** (40 Kills): Multiple cruisers join high-speed pursuit.
  * **3 Stars** (60 Kills): Coordinated roadblocks and interception tactics.
  * **4 Stars** (80 Kills): Aggressive PIT maneuvers and armed SWAT ground units.
  * **5 Stars** (100 Kills): Maximum tactical pursuit with coordinated roadblocks and lethal on-foot crossfire.
* **`police` & `escapepolice` Cheats**: Type `police` or `escapepolice` anywhere during gameplay (or type in chat or tap the mobile ⭐ POLICE button) to instantly clear wanted stars, cancel all pursuits, and dismiss all police units.
* **Blown-Up Police Car Neutralization**: When a police vehicle is damaged and explodes into flames, it turns charred black, sirens extinguish, engine completely stalls, and it never moves again, safely despawning after 30 seconds.

### ⛰️ Vice Mountain Pass & Scenic Highway
* **Coast-to-Summit Highway**: Direct paved asphalt mountain pass connecting the bridge water shoreline ($x = 228, z = 0, y = 0.8$) to the mountain foothills ($y = 4.2$), switchback ridge ($y = 8.8$), and the volcanic peak summit ($y = 14.5$).
* **Mountain Peak Observatory**: Elevated scenic plateau ($x = 430, z = -140$) equipped with safety stone walls, neon signage, and panoramic vistas over the ocean and city skyline.
* **Continuous Gradient Elevation**: Accurate 3D ramp physics allowing cars, supercars, and motorbikes to climb seamlessly from water level up to the mountain peak.

### 📱 Full Mobile Support & LAN Crossplay
* **Complete Touch Controls**:
  * **Virtual Joystick** (Left thumb): Analog 360° steering, walking, and running.
  * **Free-Look Camera Zone** (Right screen half): Natural touch drag aiming and 3D camera rotation.
  * **Touch Action Buttons**: Dedicated on-screen buttons for `FIRE`, `RELOAD`, `GUN ◄►` (cycle weapons), `VEHICLE`, `JUMP`, `SPRINT`, `CROUCH`, and `⭐ POLICE` (instant cheat).
* **Simultaneous PC & Mobile Crossplay**:
  * Built-in `/api/lan-info` auto-detects host machine's Wi-Fi IP (e.g. `http://192.168.x.x:8000`).
  * Live URL displayed on the main menu and pause menu for immediate smartphone connection.
  * PC and mobile players play in the same 3D world simultaneously in real-time.

### 🏎️ Exotic Supercars & Speedboat Water-Only Physics
* **High-Performance Supercars**:
  * **Banshee GTS**: V10 twin-turbo with aggressive hood power bulge, white center racing stripe, sidepipe door-sill exhausts, and rear ducktail spoiler (Top speed: 58 m/s).
  * **Turismo V12**: Radical hypercar with carbon fiber roof scoop, aerodynamic front canards, high-mount carbon GT wing on swan-neck pylons, and quad center titanium exhaust tips (Top speed: 62 m/s).
* **Speedboat Water Operations**:
  * Speedboats are placed directly in the bay and marina water ($x = 170, z = 125$).
  * **Water-Only Constraint**: Speedboats only operate when afloat in water; if placed on dry land or asphalt roads, the propeller cannot get traction, the throttle stalls, and speed rapidly decelerates to 0 with on-screen guidance.

### 🦖 Dinosaur Island (Prehistoric Encounters)
* **Ground-Based Dinosaurs**: T-Rex boss and hunting Velociraptor packs with terrain-clamped collision, patrol AI, stalking behavior, and melee lunges.
* **Infinite Regeneration**: Defeated dinosaurs automatically regenerate and respawn at their territory after a 10-second timer.
* **Dino Bounties**: Substantial cash and XP rewards for taking down apex predators.

### ⛅ Dynamic Weather & Day/Night System
* **24-Hour Cycle**: Continuous day, sunset, night, and dawn lighting transitions with adaptive fog and ambient light.
* **Miami Thunderstorms**: Procedural rainstorms with 2,500 particles centered around the player, diagonal rain streak HUD overlays, and lightning flashes paired with delayed procedural thunder rumbling.
* **HUD Clock & Compass**: In-game digital clock showing AM/PM time alongside a 360° rotating compass rose with cardinal directions (`N`, `NE`, `E`, etc.).

### 🎯 Story Campaign & Progression
* **5 Campaign Missions**:
  1. *Ocean Drive Mob Hit* — Eliminate rival syndicates.
  2. *Package Delivery* — High-speed timed contraband delivery.
  3. *Protect Lance Vance* — Defend VIP contact against multi-wave ambushes.
  4. *Stolen Wheels* — Steal marked supercar, survive 3-star pursuit, and reach Pay 'n' Spray.
  5. *Vice City Showdown* — Infiltrate Diaz's Starfish Island mansion and defeat Don Ricardo Diaz.
* **Progression System**: Earn XP, level up, unlock health/armor bonuses, and spend cash in the Black Market Shop (<kbd>B</kbd>).
* **Procedural Audio**: Interactive 80s synthwave radio stations (Wave 103, Flash FM, V-Rock), car horns, surface-aware footstep audio (concrete vs sand), engine revs, and siren oscillators synthesized directly via the Web Audio API.

### 🌐 Real-Time Multiplayer
* WebSocket backend architecture built with Starlette and Uvicorn.
* Synchronizes player positions, yaw/pitch, walking/running/biking animations, vehicle driving, weapon firing, rocket projectiles, damage, and killfeeds.
* In-game multiplayer text chat (<kbd>T</kbd>).

---

## 🎮 Controls

| Action | Key / Input |
| :--- | :--- |
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> |
| **Look / Aim** | <kbd>Mouse</kbd> |
| **Sprint** | <kbd>Left Shift</kbd> |
| **Crouch** | <kbd>C</kbd> or <kbd>Ctrl</kbd> |
| **Jump / Handbrake** | <kbd>Space</kbd> |
| **Enter / Exit Vehicle** | <kbd>F</kbd> or <kbd>Enter</kbd> |
| **Fire Weapon / Punch** | <kbd>Left Click</kbd> |
| **Motorcycle Drive-By** | <kbd>Left Click</kbd> (while riding bike) |
| **Aim Zoom Reticle** | <kbd>Right Click</kbd> |
| **Reload Weapon** | <kbd>R</kbd> (Unlimited reserve ammo) |
| **Vehicle Radio** | <kbd>R</kbd> (while in vehicle) |
| **Car Horn** | <kbd>H</kbd> (while in vehicle) |
| **Black Market Shop** | <kbd>B</kbd> |
| **Toggle Radar Zoom** | <kbd>M</kbd> |
| **Flash Weapon Info** | <kbd>G</kbd> |
| **Weapon Selection** | <kbd>1</kbd> - <kbd>5</kbd>, <kbd>0</kbd> (or Scroll Wheel) |
| **Chat** | <kbd>T</kbd> |
| **Controls Help** | <kbd>H</kbd> |
| **Pause Menu** | <kbd>Esc</kbd> |
| **Cheat: Dismiss Police**| Type `escapepolice` during gameplay |

---

## 🛠️ Tech Stack

* **Frontend**:
  * [Three.js (r128)](https://threejs.org/) — 3D scene rendering, cameras, custom geometries, shadow maps.
  * [UnrealBloomPass & EffectComposer](https://threejs.org/examples/?q=bloom#webgl_postprocessing_unreal_bloom) — Neon glow post-processing.
  * **Web Audio API** — Real-time synthesized vehicle engines, gunshots, radio stations, footsteps, rain, and thunder (no heavy external audio files required).
  * **HTML5 Canvas & CSS3** — Minimap radar, HUD vitals, compass rose, crosshairs, and retro typography.
* **Backend**:
  * **Python 3.8+**
  * **Starlette & Uvicorn** — High-performance asynchronous HTTP and WebSocket server.
  * **Asyncio** — Broadcast state distribution and collision validation.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Ayushhexx/multiplayer.git
cd multiplayer
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Game Server
```bash
python server.py
```
*(On Windows, you can also double-click `run.bat`)*

### 4. Play
Open your browser and navigate to:
```
http://localhost:8000
```

---

## 👥 Multiplayer Networking

* **LAN Play**: Anyone on your Wi-Fi or local network can join by opening `http://<your-local-ip>:8000`.
* **Instant Online Tunneling**: Run `share_online.bat` (or use `ngrok http 8000`) to generate an instant, shareable public HTTPS link for friends anywhere in the world.
* **Cloud Deployment**: Ready to deploy for free on [Render.com](https://render.com), Railway, or Fly.io as a Python Web Service.

---

## 📄 License
This project is an educational, non-commercial fan homage created for demonstration, portfolio, and experimental game development purposes. Built with ❤️ using modern web standards.
