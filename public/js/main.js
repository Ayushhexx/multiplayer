class Game {
    constructor() {
        this.renderer = null;
        this.world = null;
        this.audio = null;
        this.weaponSystem = null;
        this.player = null;
        this.traffic = null;
        this.police = null;
        this.dinos = null;
        this.animals = null;
        this.enemyManager = null;
        this.pickups = null;
        this.missions = null;
        this.network = null;

        this.remotePlayers = {};
        this.vehicles = {};

        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.isPaused = false;
        this.selectedOutfit = "hawaiian_cyan";

        // Global settings from SaveManager
        window.gameSettings = window.SaveManager ? SaveManager.loadSettings() : {
            mouseSensitivity: 0.0022,
            invertY: false,
            fov: 72,
            masterVolume: 0.8,
            sfxVolume: 0.8,
            musicVolume: 0.7,
            graphicsQuality: "high"
        };
    }

    init() {
        // Init HUD
        HUD.init();

        // Audio System
        this.audio = new AudioSystem();

        // 3D Engine & Miami Sunset Renderer
        this.renderer = new EngineRenderer('game-container');
        if (this.renderer.camera && window.gameSettings.fov) {
            this.renderer.camera.fov = window.gameSettings.fov;
            this.renderer.camera.updateProjectionMatrix();
        }

        // World Map (Ocean Drive, beach, hotels, ramps)
        this.world = new World(this.renderer.scene);

        // Weapon System
        this.weaponSystem = new WeaponSystem(this.renderer.scene, this.audio);

        // Local Player
        this.player = new Player(
            this.renderer.scene,
            this.renderer.camera,
            this.renderer,
            this.audio,
            this.world,
            this.weaponSystem
        );

        // World Pickups (Health, Armor, Ammo, Cash, Weapons)
        this.pickups = new PickupManager(this.renderer.scene, this.world, this.audio);

        // Tactical Enemy Manager (AI Hostiles, Mobsters, Boss Don Diaz)
        this.enemyManager = new EnemyManager(this.renderer.scene, this.world, this.audio);

        // Ambient Pedestrians
        this.traffic = new TrafficManager(this.renderer.scene, this.world, this.audio);

        // 5-Star Wanted System & Tactical Police Combat
        this.police = new PoliceManager(this.renderer.scene, this.world, this.audio);

        // Dinosaurs on Dinosaur Island
        this.dinos = new DinoManager(this.renderer.scene, this.audio);

        // Ambient Animals (Dogs & Cats)
        this.animals = new AnimalManager(this.renderer.scene, this.audio);

        // 5-Mission Action Campaign & Black Market Shop
        this.missions = new MissionSystem(this);

        // Network Client
        this.network = new NetworkClient(this);
        window.networkClient = this.network;

        // Setup Main Menu, Pause Menu, Settings Modal & Mobile Controls
        this.setupModal();
        this.setupPauseMenu();
        this.setupSettingsModal();
        this.setupMobileControls();

        // Start render loop
        this.isRunning = true;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupModal() {
        const modal = document.getElementById('join-modal');
        const startBtn = document.getElementById('btn-enter-game');
        const continueBtn = document.getElementById('btn-continue-game');
        const nameInput = document.getElementById('player-name-input');
        const outfitCards = document.querySelectorAll('.outfit-card');
        const menuSettingsBtn = document.getElementById('btn-menu-settings');
        const menuControlsBtn = document.getElementById('btn-menu-controls');

        // Show Continue button if saved data exists
        if (window.SaveManager && SaveManager.hasSaveData() && continueBtn) {
            continueBtn.style.display = 'block';
        }

        // Outfit selection
        outfitCards.forEach(card => {
            card.addEventListener('click', () => {
                outfitCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedOutfit = card.dataset.outfit;
            });
        });

        const enterGameSession = (isContinue = false) => {
            try {
                this.audio.init();
                this.audio.resume();
            } catch(e) {
                console.warn("[Audio] Audio init notice:", e);
            }

            const name = nameInput ? (nameInput.value.trim() || "Tommy_Vercetti") : "Tommy_Vercetti";
            this.player.name = name;
            try {
                this.player.setOutfit(this.selectedOutfit);
            } catch(e) {
                console.warn("[Player] setOutfit notice:", e);
            }

            if (isContinue && window.SaveManager) {
                try {
                    SaveManager.loadGame(this.player, this.missions);
                } catch(e) {
                    console.warn("[SaveManager] loadGame notice:", e);
                }
            }

            if (nameInput) nameInput.blur();
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                document.activeElement.blur();
            }
            if (modal) modal.style.display = 'none';
            try {
                document.body.requestPointerLock();
            } catch(e) {}

            // Connect to multiplayer server
            try {
                this.network.connect();
            } catch(e) {
                console.warn("[Network] connect notice:", e);
            }
            HUD.addChatMessage("system", `Welcome to Vice City, ${this.player.name}!`);
        };

        // New Game Button
        if (startBtn) {
            startBtn.addEventListener('click', () => enterGameSession(false));
        }

        // Continue Game Button
        if (continueBtn) {
            continueBtn.addEventListener('click', () => enterGameSession(true));
        }

        // Main Menu Settings & Controls Buttons
        if (menuSettingsBtn) {
            menuSettingsBtn.addEventListener('click', () => this.openSettingsModal());
        }
        if (menuControlsBtn) {
            menuControlsBtn.addEventListener('click', () => HUD.toggleHelp());
        }
    }

    setupPauseMenu() {
        const pauseModal = document.getElementById('pause-modal');
        const resumeBtn = document.getElementById('btn-resume-game');
        const restartMissionBtn = document.getElementById('btn-restart-mission');
        const pauseSettingsBtn = document.getElementById('btn-pause-settings');
        const saveGameBtn = document.getElementById('btn-save-game');
        const pauseHelpBtn = document.getElementById('btn-pause-help');
        const exitMainMenuBtn = document.getElementById('btn-exit-mainmenu');

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (document.activeElement === document.getElementById('chat-input')) return;
                const joinModal = document.getElementById('join-modal');
                if (joinModal && joinModal.style.display !== 'none') return;

                const helpModal = document.getElementById('help-modal');
                if (helpModal && helpModal.style.display === 'block') {
                    helpModal.style.display = 'none';
                    document.body.requestPointerLock();
                    return;
                }

                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal && settingsModal.style.display === 'flex') {
                    settingsModal.style.display = 'none';
                    if (this.isPaused) pauseModal.style.display = 'flex';
                    else document.body.requestPointerLock();
                    return;
                }

                this.togglePause();
            }
        });

        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.togglePause(false);
                document.body.requestPointerLock();
            });
        }

        if (restartMissionBtn) {
            restartMissionBtn.addEventListener('click', () => {
                this.togglePause(false);
                if (this.missions) {
                    this.missions.startCurrentMission();
                    HUD.showActionHint("🔄 Mission Reset to Beginning!");
                }
                document.body.requestPointerLock();
            });
        }

        if (pauseSettingsBtn) {
            pauseSettingsBtn.addEventListener('click', () => {
                pauseModal.style.display = 'none';
                this.openSettingsModal();
            });
        }

        if (saveGameBtn) {
            saveGameBtn.addEventListener('click', () => {
                if (window.SaveManager) {
                    SaveManager.saveGame(this.player, this.missions);
                }
            });
        }

        if (pauseHelpBtn) {
            pauseHelpBtn.addEventListener('click', () => {
                pauseModal.style.display = 'none';
                HUD.toggleHelp();
            });
        }

        if (exitMainMenuBtn) {
            exitMainMenuBtn.addEventListener('click', () => {
                this.togglePause(false);
                const joinModal = document.getElementById('join-modal');
                if (joinModal) {
                    joinModal.style.display = 'flex';
                    const continueBtn = document.getElementById('btn-continue-game');
                    if (continueBtn) continueBtn.style.display = 'block';
                }
                document.exitPointerLock();
            });
        }
    }

    togglePause(forceState = null) {
        const pauseModal = document.getElementById('pause-modal');
        if (!pauseModal) return;

        this.isPaused = (forceState !== null) ? forceState : !this.isPaused;
        if (this.isPaused) {
            pauseModal.style.display = 'flex';
            document.exitPointerLock();
        } else {
            pauseModal.style.display = 'none';
        }
    }

    setupSettingsModal() {
        const settingsModal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('btn-close-settings');
        const sensInput = document.getElementById('setting-sens');
        const fovInput = document.getElementById('setting-fov');
        const invertInput = document.getElementById('setting-inverty');
        const volInput = document.getElementById('setting-vol');
        const graphicsSelect = document.getElementById('setting-graphics');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.gameSettings.mouseSensitivity = parseFloat(sensInput.value);
                window.gameSettings.fov = parseInt(fovInput.value);
                window.gameSettings.invertY = !!invertInput.checked;
                window.gameSettings.masterVolume = parseFloat(volInput.value);
                window.gameSettings.graphicsQuality = graphicsSelect.value;

                if (window.SaveManager) {
                    SaveManager.saveSettings(window.gameSettings);
                }

                if (this.renderer && this.renderer.camera) {
                    this.renderer.camera.fov = window.gameSettings.fov;
                    this.renderer.camera.updateProjectionMatrix();
                }

                settingsModal.style.display = 'none';
                if (this.isPaused) {
                    const pauseModal = document.getElementById('pause-modal');
                    if (pauseModal) pauseModal.style.display = 'flex';
                } else {
                    document.body.requestPointerLock();
                }
            });
        }
    }

    openSettingsModal() {
        const settingsModal = document.getElementById('settings-modal');
        if (!settingsModal) return;

        const sensInput = document.getElementById('setting-sens');
        const fovInput = document.getElementById('setting-fov');
        const invertInput = document.getElementById('setting-inverty');
        const volInput = document.getElementById('setting-vol');
        const graphicsSelect = document.getElementById('setting-graphics');

        if (sensInput) sensInput.value = window.gameSettings.mouseSensitivity || 0.0022;
        if (fovInput) fovInput.value = window.gameSettings.fov || 72;
        if (invertInput) invertInput.checked = !!window.gameSettings.invertY;
        if (volInput) volInput.value = window.gameSettings.masterVolume || 0.8;
        if (graphicsSelect) graphicsSelect.value = window.gameSettings.graphicsQuality || "high";

        settingsModal.style.display = 'flex';
        document.exitPointerLock();
    }

    setupMobileControls() {
        const mobileContainer = document.getElementById('mobile-controls');
        const rotateOverlay = document.getElementById('mobile-rotate-overlay');
        const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

        if (isTouch && mobileContainer) {
            mobileContainer.style.display = 'block';
        }

        // --- Mobile Screen Orientation Check & Landscape Prompt ---
        this._dismissRotateOverlay = false;
        const checkOrientation = () => {
            if (!rotateOverlay) return;
            const isPortrait = window.innerHeight > window.innerWidth;
            if (isTouch && isPortrait && !this._dismissRotateOverlay) {
                rotateOverlay.style.display = 'flex';
            } else {
                rotateOverlay.style.display = 'none';
            }
        };

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        checkOrientation();

        const btnRequestRotate = document.getElementById('btn-request-rotate');
        if (btnRequestRotate) {
            btnRequestRotate.addEventListener('click', async () => {
                try {
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                    }
                    if (screen.orientation && screen.orientation.lock) {
                        await screen.orientation.lock('landscape');
                    }
                } catch (e) {
                    console.log("[Mobile] Orientation lock not supported or user gesture needed:", e);
                }
                if (rotateOverlay) rotateOverlay.style.display = 'none';
            });
        }

        const btnDismissRotate = document.getElementById('btn-dismiss-rotate');
        if (btnDismissRotate) {
            btnDismissRotate.addEventListener('click', () => {
                this._dismissRotateOverlay = true;
                if (rotateOverlay) rotateOverlay.style.display = 'none';
            });
        }

        // Fetch Local Network IP so Mobile and PC can connect easily together
        fetch('/api/lan-info')
            .then(res => res.json())
            .then(data => {
                if (data && data.url) {
                    const el1 = document.getElementById('lan-url-display');
                    const el2 = document.getElementById('lan-pause-display');
                    if (el1) el1.textContent = data.url;
                    if (el2) el2.textContent = data.url;
                }
            })
            .catch(() => {});

        // Virtual Touch Joystick (Left Thumb)
        const joystickBase = document.getElementById('touch-joystick-base');
        const joystickKnob = document.getElementById('touch-joystick-knob');
        if (joystickBase && joystickKnob) {
            let activeTouchId = null;
            let startX = 0, startY = 0;

            const onTouchStart = (e) => {
                for (let touch of e.changedTouches) {
                    const rect = joystickBase.getBoundingClientRect();
                    const zone = document.getElementById('touch-joystick-zone');
                    const zRect = zone ? zone.getBoundingClientRect() : rect;
                    const inZone = (touch.clientX >= (zRect.left - 30) && touch.clientX <= (zRect.right + 30) &&
                                    touch.clientY >= (zRect.top - 30) && touch.clientY <= (zRect.bottom + 30)) ||
                                   (touch.clientX < window.innerWidth * 0.42 && touch.clientY > window.innerHeight * 0.45);
                    if (inZone) {
                        activeTouchId = touch.identifier;
                        startX = rect.left + rect.width / 2;
                        startY = rect.top + rect.height / 2;
                        break;
                    }
                }
            };

            const onTouchMove = (e) => {
                if (activeTouchId === null) return;
                for (let touch of e.changedTouches) {
                    if (touch.identifier === activeTouchId) {
                        const dx = touch.clientX - startX;
                        const dy = touch.clientY - startY;
                        const dist = Math.hypot(dx, dy);
                        const maxRadius = 45;
                        const angle = Math.atan2(dy, dx);
                        const clampedDist = Math.min(dist, maxRadius);

                        const knobX = Math.cos(angle) * clampedDist;
                        const knobY = Math.sin(angle) * clampedDist;
                        joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

                        // Feed input to player (on foot movement or vehicle driving)
                        if (this.player && this.player.input) {
                            this.player.input.forward = dy < -12;
                            this.player.input.backward = dy > 12;
                            this.player.input.left = dx < -12;
                            this.player.input.right = dx > 12;
                        }
                        break;
                    }
                }
            };

            const onTouchEnd = (e) => {
                for (let touch of e.changedTouches) {
                    if (touch.identifier === activeTouchId) {
                        activeTouchId = null;
                        joystickKnob.style.transform = `translate(-50%, -50%)`;
                        if (this.player && this.player.input) {
                            this.player.input.forward = false;
                            this.player.input.backward = false;
                            this.player.input.left = false;
                            this.player.input.right = false;
                        }
                        break;
                    }
                }
            };

            window.addEventListener('touchstart', onTouchStart, { passive: false });
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onTouchEnd, { passive: false });
            window.addEventListener('touchcancel', onTouchEnd, { passive: false });
        }

        // Touch Look / Aim Zone (Right screen half touch drag)
        const lookZone = document.getElementById('touch-look-zone');
        if (lookZone) {
            let lookTouchId = null;
            let lastLookX = 0, lastLookY = 0;

            lookZone.addEventListener('touchstart', (e) => {
                for (let touch of e.changedTouches) {
                    if (lookTouchId === null) {
                        lookTouchId = touch.identifier;
                        lastLookX = touch.clientX;
                        lastLookY = touch.clientY;
                        break;
                    }
                }
            }, { passive: false });

            lookZone.addEventListener('touchmove', (e) => {
                if (lookTouchId === null || !this.player) return;
                for (let touch of e.changedTouches) {
                    if (touch.identifier === lookTouchId) {
                        const dx = touch.clientX - lastLookX;
                        const dy = touch.clientY - lastLookY;
                        lastLookX = touch.clientX;
                        lastLookY = touch.clientY;

                        const sens = 0.005; // Smooth responsive touch camera sensitivity
                        this.player.rotY -= dx * sens;
                        this.player.pitch -= dy * sens;
                        this.player.pitch = Math.max(-1.1, Math.min(1.1, this.player.pitch));
                        break;
                    }
                }
            }, { passive: false });

            const onLookEnd = (e) => {
                for (let touch of e.changedTouches) {
                    if (touch.identifier === lookTouchId) {
                        lookTouchId = null;
                        break;
                    }
                }
            };
            lookZone.addEventListener('touchend', onLookEnd, { passive: false });
            lookZone.addEventListener('touchcancel', onLookEnd, { passive: false });
        }

        // Helper to bind tap actions (both touch and pointer/mouse clicks)
        const bindTapBtn = (id, callback) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback();
            };
            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('click', handler);
        };

        // Helper to bind continuous press / hold actions (e.g. gas, brake, drift)
        const bindHoldBtn = (id, onStart, onEnd) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const startHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                onStart();
            };
            const endHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onEnd) onEnd();
            };
            btn.addEventListener('touchstart', startHandler, { passive: false });
            btn.addEventListener('touchend', endHandler, { passive: false });
            btn.addEventListener('touchcancel', endHandler, { passive: false });
            btn.addEventListener('mousedown', startHandler);
            btn.addEventListener('mouseup', endHandler);
            btn.addEventListener('mouseleave', endHandler);
        };

        // --- ON-FOOT ACTIONS ---
        bindTapBtn('tbtn-fire', () => {
            if (this.player) this.player.shoot();
        });

        bindTapBtn('tbtn-reload', () => {
            if (this.player) this.player.reloadWeapon();
        });

        bindTapBtn('tbtn-weapon', () => {
            if (!this.player || !this.player.weaponSystem) return;
            const weaponOrder = ["fists", "pistol", "smg", "shotgun", "rifle", "rpg"];
            const curKey = this.player.weaponSystem.currentWeaponKey;
            const idx = weaponOrder.indexOf(curKey);
            const nextKey = weaponOrder[(idx + 1) % weaponOrder.length];
            this.player.selectWeapon(nextKey);
            const w = this.player.weaponSystem.getCurrentWeapon();
            if (HUD.showActionHint) HUD.showActionHint(`Equipped: ${w.name}`);
        });

        bindTapBtn('tbtn-jump', () => {
            if (this.player && this.player.isGrounded) {
                this.player.velocity.y = this.player.jumpForce;
                this.player.isGrounded = false;
            }
        });

        bindTapBtn('tbtn-sprint', () => {
            if (this.player) this.player.input.sprint = !this.player.input.sprint;
        });

        bindTapBtn('tbtn-crouch', () => {
            if (this.player) this.player.toggleCrouch();
        });

        bindTapBtn('tbtn-enter', () => {
            if (this.player) this.player.toggleVehicle();
        });

        bindTapBtn('tbtn-cheat', () => {
            if (window.gameInstance && window.gameInstance.police) {
                window.gameInstance.police.disappearAllPolice("POLICE");
            }
        });

        bindTapBtn('tbtn-map', () => {
            if (window.HUD && window.HUD.toggleWorldMapModal) {
                window.HUD.toggleWorldMapModal();
            }
        });

        // --- IN-VEHICLE DRIVING CONTROLS (Authentic Pedals) ---
        bindHoldBtn('tbtn-v-gas', () => {
            if (this.player && this.player.input) this.player.input.forward = true;
        }, () => {
            if (this.player && this.player.input) this.player.input.forward = false;
        });

        bindHoldBtn('tbtn-v-reverse', () => {
            if (this.player && this.player.input) this.player.input.backward = true;
        }, () => {
            if (this.player && this.player.input) this.player.input.backward = false;
        });

        bindHoldBtn('tbtn-v-handbrake', () => {
            if (this.player && this.player.input) this.player.input.handbrake = true;
        }, () => {
            if (this.player && this.player.input) this.player.input.handbrake = false;
        });

        bindTapBtn('tbtn-v-exit', () => {
            if (this.player) this.player.toggleVehicle();
        });

        bindTapBtn('tbtn-v-horn', () => {
            if (this.player && this.player.currentVehicle && this.player.audio) {
                this.player.audio.playHorn();
            }
        });

        bindTapBtn('tbtn-v-fire', () => {
            if (this.player) this.player.shoot();
        });

        bindTapBtn('tbtn-v-cheat', () => {
            if (window.gameInstance && window.gameInstance.police) {
                window.gameInstance.police.disappearAllPolice("POLICE");
            }
        });

        bindTapBtn('tbtn-v-map', () => {
            if (window.HUD && window.HUD.toggleWorldMapModal) {
                window.HUD.toggleWorldMapModal();
            }
        });
    }

    updateMobileControlMode(inVehicle) {
        const onfoot = document.getElementById('mobile-onfoot-controls');
        const vehicle = document.getElementById('mobile-vehicle-controls');
        if (onfoot && vehicle) {
            onfoot.style.display = inVehicle ? 'none' : 'grid';
            vehicle.style.display = inVehicle ? 'grid' : 'none';
        }
    }

    // --- Multiplayer Server Event Handlers ---
    onServerInit(data) {
        console.log("[Game] Initialized from server:", data);
        this.player.id = data.yourId;

        // Spawn vehicles
        if (data.vehicles) {
            data.vehicles.forEach(vData => {
                if (!this.vehicles[vData.id]) {
                    this.vehicles[vData.id] = new Vehicle(vData.id, vData, this.renderer.scene, this.audio);
                }
            });
        }

        // Spawn existing remote players
        if (data.players) {
            data.players.forEach(pData => {
                if (pData.id !== this.player.id && !this.remotePlayers[pData.id]) {
                    this.remotePlayers[pData.id] = new RemotePlayer(pData, this.renderer.scene);
                }
            });
        }
    }

    onPlayerJoin(pData) {
        if (pData.id === this.player.id) return;
        if (!this.remotePlayers[pData.id]) {
            this.remotePlayers[pData.id] = new RemotePlayer(pData, this.renderer.scene);
            HUD.addChatMessage("system", `${pData.name} arrived in Vice City.`);
        }
    }

    onPlayerLeave(id) {
        if (this.remotePlayers[id]) {
            HUD.addChatMessage("system", `${this.remotePlayers[id].name} left the city.`);
            this.remotePlayers[id].destroy();
            delete this.remotePlayers[id];
        }
    }

    onPlayerMoved(data) {
        if (this.remotePlayers[data.id]) {
            this.remotePlayers[data.id].setTargetState(data);
        }
    }

    onVehicleMoved(vid, data) {
        if (this.vehicles[vid]) {
            // Only sync if local player is not driving it
            if (this.player.currentVehicle !== this.vehicles[vid]) {
                this.vehicles[vid].setNetworkState(data);
            }
        }
    }

    onVehicleEntered(data) {
        if (this.vehicles[data.vehicleId]) {
            this.vehicles[data.vehicleId].driverId = data.playerId;
        }
        if (this.remotePlayers[data.playerId] && this.remotePlayers[data.playerId].mesh) {
            this.remotePlayers[data.playerId].mesh.visible = false;
        }
    }

    onVehicleExited(data) {
        if (this.vehicles[data.vehicleId]) {
            this.vehicles[data.vehicleId].driverId = null;
        }
        if (this.remotePlayers[data.playerId] && this.remotePlayers[data.playerId].mesh) {
            this.remotePlayers[data.playerId].mesh.visible = true;
        }
    }

    onRemoteWeaponFired(data) {
        if (data.origin && data.direction) {
            const origin = new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z);
            const dir = new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z);

            this.weaponSystem.spawnMuzzleFlash(origin);

            if (data.weapon === "rpg") {
                this.weaponSystem.spawnRocket(origin, dir);
            } else {
                this.weaponSystem.spawnTracer(origin, dir, 70);
            }
        }
    }

    onDamageDealt(data) {
        if (data.targetId === this.player.id) {
            this.player.takeDamage(data.damage, data.weapon);
        }

        if (this.remotePlayers[data.targetId]) {
            this.remotePlayers[data.targetId].updateNameTag(data.health);
        }

        if (data.isDead) {
            const targetName = (data.targetId === this.player.id) ? this.player.name : (this.remotePlayers[data.targetId]?.name || "Player");
            const killerName = (data.attackerId === this.player.id) ? this.player.name : (this.remotePlayers[data.attackerId]?.name || "Player");
            HUD.addKillfeed(`${killerName} wasted ${targetName} (${data.weapon || "pistol"})`);
        }
    }

    onPlayerRespawned(data) {
        if (this.remotePlayers[data.playerId]) {
            this.remotePlayers[data.playerId].setTargetState(data.player);
            this.remotePlayers[data.playerId].updateNameTag(100);
        }
    }

    // --- Main Game Loop ---
    animate() {
        requestAnimationFrame(this.animate);

        const dt = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();

        if (this.isPaused) {
            // Only render still scene while paused
            this.renderer.render();
            return;
        }

        // Update world environment & water displacement
        this.world.update(dt);

        // Update local player
        this.player.update(dt, time, this.vehicles);

        // Update weapons & projectiles
        this.weaponSystem.update(dt, this.world, this.vehicles, this.remotePlayers, this.player);

        // Update world pickups & respawns
        if (this.pickups) this.pickups.update(dt, time, this.player);

        // Update tactical enemies & hostile AI
        if (this.enemyManager) this.enemyManager.update(dt, time, this.player);

        // Update traffic & pedestrians
        this.traffic.update(dt, time, this.player);

        // Update 5-Star Wanted System & Police Tactical AI
        if (this.police) this.police.update(dt, time, this.player, this.vehicles);

        // Update Dinosaurs on Dinosaur Island
        if (this.dinos) this.dinos.update(dt, time, this.player, this.world);

        // Update Ambient Animals (Dogs & Cats)
        if (this.animals) this.animals.update(dt, time);

        // Update 5 Campaign Thriller Missions
        if (this.missions) this.missions.update(dt, time);

        // Update remote players
        for (let pid in this.remotePlayers) {
            this.remotePlayers[pid].update(dt, time);
        }

        // Update vehicle lightbars, destroyed wreckages, and effects
        for (let vid in this.vehicles) {
            const v = this.vehicles[vid];
            if (!v) continue;

            // Update wreckage burn smoke and 30-sec disappearance for destroyed vehicles
            if (v.isDestroyed) {
                v.updateDestroyed(dt);
                continue;
            }

            if (v !== this.player.currentVehicle) {
                if (v.isPolice && v.lightbar && !v.isDestroyed) {
                    v.lightbar.timer += dt * 8;
                    const flash = Math.sin(v.lightbar.timer) > 0;
                    v.lightbar.blueMesh.material.color.setHex(flash ? 0x00f0ff : 0x002266);
                    v.lightbar.redMesh.material.color.setHex(!flash ? 0xff0055 : 0x660011);
                }
            }
        }

        // Render Radar Minimap
        HUD.renderRadar(this.player, this.remotePlayers, this.vehicles);

        // Render Interactive World Map if open
        if (HUD.isWorldMapOpen) {
            HUD.renderWorldMap(this.player, this.remotePlayers, this.vehicles);
        }

        // Update game clock from world day/night cycle
        if (this.world && this.world.dayTime !== undefined) {
            HUD.updateGameClock(this.world.dayTime);
        }
        // Update compass from player rotation
        if (this.player) {
            HUD.updateCompass(this.player.rotY);
        }

        // Update screen shake & render 3D Scene
        this.renderer.update(dt);
        this.renderer.render();
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
    window.gameInstance.init();
});
