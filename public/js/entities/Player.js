class Player {
    constructor(scene, camera, renderer, audioSystem, world, weaponSystem) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.audio = audioSystem;
        this.world = world;
        this.weaponSystem = weaponSystem;

        // Player Data & Stats
        this.id = null;
        this.name = "Tommy_Vercetti";
        this.shirtType = "hawaiian_cyan";
        this.health = 100;
        this.armor = 50;
        this.cash = 5000;
        this.wantedLevel = 0;
        this.isDead = false;

        // Position & Movement
        this.position = new THREE.Vector3(0, 1.0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotY = 0;
        this.pitch = 0;
        this.walkSpeed = 5.5;
        this.sprintSpeed = 10.5;
        this.crouchSpeed = 2.8;
        this.jumpForce = 7.5;
        this.isGrounded = true;

        // Stamina System
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaExhausted = false;

        // Crouch state
        this.isCrouched = false;

        // Player Level & XP Progression
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 1000;

        // Input state
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            jump: false,
            handbrake: false,
            aim: false,
            crouch: false,
            interact: false
        };

        // Camera control & OTS (Over-The-Shoulder) system
        this.cameraDistance = 3.6;
        this.targetCameraDistance = 3.6;
        this.shoulderOffset = 0.62;
        this.targetShoulderOffset = 0.62;
        this.cameraHeight = 1.68;
        this.targetCameraHeight = 1.68;
        this.aimTimer = 0;
        this.isPointerLocked = false;

        // Vehicle interaction
        this.currentVehicle = null;
        this.nearestVehicle = null;

        // 3D Model
        this.char = CharacterModel.create(this.shirtType);
        this.mesh = this.char.root;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        // Bind initial weapon
        this.weaponSystem.setWeapon("pistol", this.char.weaponSlot);
        if (window.HUD && window.HUD.updateWeapon) {
            window.HUD.updateWeapon(this.weaponSystem.getCurrentWeapon());
        }

        // Setup input listeners
        this.setupControls();
    }

    setOutfit(shirtType) {
        this.shirtType = shirtType;
        this.scene.remove(this.mesh);
        this.char = CharacterModel.create(this.shirtType);
        this.mesh = this.char.root;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        this.weaponSystem.setWeapon(this.weaponSystem.currentWeaponKey, this.char.weaponSlot);
        if (window.HUD && window.HUD.updateWeapon) {
            window.HUD.updateWeapon(this.weaponSystem.getCurrentWeapon());
        }
    }

    setupControls() {
        const dom = document.body;
        let isMouseDown = false;

        // On-screen Reload Button
        const hudReloadBtn = document.getElementById('btn-reload-hud');
        if (hudReloadBtn) {
            hudReloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.reloadWeapon();
            });
        }

        dom.addEventListener('click', (e) => {
            if (e.target.closest('#join-modal, #pause-modal, #settings-modal, #help-modal, #shop-modal, #chat-container, button, input')) return;
            const joinModal = document.getElementById('join-modal');
            if (joinModal && joinModal.style.display !== 'none') return;
            if (!this.isPointerLocked) {
                try { dom.requestPointerLock(); } catch(err) {}
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === dom;
        });

        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('#join-modal, #pause-modal, #settings-modal, #help-modal, #shop-modal, #chat-container, button, input')) return;
            isMouseDown = true;
        });
        document.addEventListener('mouseup', () => { isMouseDown = false; });

        document.addEventListener('mousemove', (e) => {
            const joinModal = document.getElementById('join-modal');
            if (joinModal && joinModal.style.display !== 'none') return;
            const pauseModal = document.getElementById('pause-modal');
            if (pauseModal && pauseModal.style.display === 'flex') return;

            // Allow camera rotation when pointer is locked OR mouse is being dragged
            if (!this.isPointerLocked && !isMouseDown) return;

            const sens = window.gameSettings ? (window.gameSettings.mouseSensitivity || 0.0022) : 0.0022;
            const invertY = window.gameSettings ? (window.gameSettings.invertY ? -1 : 1) : 1;
            const dx = e.movementX || 0;
            const dy = e.movementY || 0;
            this.rotY -= dx * sens;
            this.pitch -= dy * sens * invertY;
            this.pitch = Math.max(-1.1, Math.min(1.1, this.pitch));
        });

        window.addEventListener('keydown', (e) => {
            // Chat typing guard - ONLY block if chat box is visibly open
            const chatWrap = document.getElementById('chat-input-wrapper');
            const isChatOpen = chatWrap && chatWrap.style.display !== 'none';
            if (isChatOpen && document.activeElement === document.getElementById('chat-input')) {
                if (e.key === "Enter") {
                    this.sendChatMessage();
                } else if (e.key === "Escape") {
                    chatWrap.style.display = 'none';
                    document.getElementById('chat-input').blur();
                    try { dom.requestPointerLock(); } catch(err) {}
                }
                return;
            }

            const code = e.code || "";
            const key = (e.key || "").toLowerCase();

            // Support WASD, Arrow Keys, and international layouts (AZERTY Z/Q)
            if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup' || key === 'z') {
                this.input.forward = true;
            }
            if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
                this.input.backward = true;
            }
            if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft' || key === 'q') {
                this.input.left = true;
            }
            if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
                this.input.right = true;
            }

            if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
                this.input.sprint = true;
                if (this.isCrouched) this.setCrouch(false);
            }
            if (code === 'KeyC' || key === 'c') {
                this.toggleCrouch();
            }
            if (code === 'ControlLeft' || code === 'ControlRight' || key === 'control') {
                this.setCrouch(true);
            }
            if (code === 'KeyE' || key === 'e') {
                this.input.interact = true;
            }
            if (code === 'Space' || key === ' ') {
                if (this.currentVehicle) {
                    this.input.handbrake = true;
                } else if (this.isGrounded) {
                    if (this.isCrouched) {
                        this.setCrouch(false);
                    } else {
                        this.velocity.y = this.jumpForce;
                        this.isGrounded = false;
                    }
                }
            }
            if (code === 'KeyF' || code === 'Enter' || key === 'f' || key === 'enter') {
                this.toggleVehicle();
            }

            switch (code) {
                case 'Digit1': this.switchWeapon("pistol"); break;
                case 'Digit2': this.switchWeapon("smg"); break;
                case 'Digit3': this.switchWeapon("shotgun"); break;
                case 'Digit4': this.switchWeapon("rifle"); break;
                case 'Digit5': this.switchWeapon("rpg"); break;
                case 'Digit0': this.switchWeapon("fists"); break;
                case 'KeyR':
                    if (this.currentVehicle && this.audio) {
                        const stationName = this.audio.nextRadioStation();
                        HUD.showRadioBanner(stationName);
                    } else if (!this.currentVehicle) {
                        this.reloadWeapon();
                    }
                    break;
                case 'KeyH':
                    if (this.currentVehicle && this.audio) {
                        this.audio.playHorn();
                    } else {
                        HUD.toggleHelp();
                    }
                    break;
                case 'KeyL':
                    if (this.currentVehicle) {
                        this.currentVehicle.toggleSiren();
                    }
                    break;
                case 'KeyT':
                    e.preventDefault();
                    document.exitPointerLock();
                    document.getElementById('chat-input-wrapper').style.display = 'block';
                    document.getElementById('chat-input').focus();
                    break;
                case 'KeyB': {
                    const shopModal = document.getElementById('shop-modal');
                    if (shopModal) {
                        const isOpen = shopModal.style.display === 'flex';
                        shopModal.style.display = isOpen ? 'none' : 'flex';
                        if (!isOpen) document.exitPointerLock();
                        else document.body.requestPointerLock();
                    }
                    break;
                }
                case 'KeyM': {
                    // Toggle full interactive World Map
                    if (window.HUD && window.HUD.toggleWorldMap) {
                        window.HUD.toggleWorldMap(this);
                    }
                    break;
                }
                case 'KeyG': {
                    // Toggle weapon name display briefly
                    const wn = document.getElementById('weapon-name');
                    if (wn) {
                        wn.style.display = 'block';
                        clearTimeout(wn._hideTimer);
                        wn._hideTimer = setTimeout(() => { wn.style.display = 'none'; }, 3000);
                    }
                    break;
                }
            }

            // Real-time cheat code detection ("police" or "escapepolice")
            if (e.key && e.key.length === 1) {
                this.cheatBuffer = ((this.cheatBuffer || "") + e.key.toLowerCase()).slice(-20);
                if (this.cheatBuffer.endsWith("police") || this.cheatBuffer.endsWith("escapepolice")) {
                    this.cheatBuffer = "";
                    if (window.gameInstance && window.gameInstance.police) {
                        window.gameInstance.police.disappearAllPolice("POLICE");
                    }
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code || "";
            const key = (e.key || "").toLowerCase();

            if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup' || key === 'z') {
                this.input.forward = false;
            }
            if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
                this.input.backward = false;
            }
            if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft' || key === 'q') {
                this.input.left = false;
            }
            if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
                this.input.right = false;
            }
            if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
                this.input.sprint = false;
            }
            if (code === 'ControlLeft' || code === 'ControlRight' || key === 'control') {
                this.setCrouch(false);
            }
            if (code === 'KeyE' || key === 'e') {
                this.input.interact = false;
            }
            if (code === 'Space' || key === ' ') {
                this.input.handbrake = false;
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('#join-modal, #pause-modal, #settings-modal, #help-modal, #shop-modal, #chat-container, button, input')) return;

            // Clicking canvas restores game input focus
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                document.activeElement.blur();
            }
            const chatWrap = document.getElementById('chat-input-wrapper');
            if (chatWrap && chatWrap.style.display !== 'none') {
                chatWrap.style.display = 'none';
            }

            const joinModal = document.getElementById('join-modal');
            if (joinModal && joinModal.style.display !== 'none') return;
            const pauseModal = document.getElementById('pause-modal');
            if (pauseModal && pauseModal.style.display === 'flex') return;

            // Try to acquire pointer lock on game click if not locked
            if (!this.isPointerLocked) {
                try { document.body.requestPointerLock(); } catch(err) {}
            }

            if (e.button === 0) {
                // Shoot on foot, fire tank cannon, or bike drive-by shooting!
                if (this.currentVehicle && this.currentVehicle.type === "tank") {
                    this.currentVehicle.fireCannon();
                } else if (this.currentVehicle && (this.currentVehicle.type === "bike" || this.currentVehicle.type === "sanchez")) {
                    this.shootFromBike();
                } else if (!this.currentVehicle) {
                    this.shoot();
                }
            } else if (e.button === 2) {
                // Aim zoom (Over-the-shoulder combat focus)
                this.input.aim = true;
                this.targetCameraDistance = 1.95;
                this.targetShoulderOffset = 0.72;
                this.targetCameraHeight = 1.55;
                const ch = document.getElementById('crosshair');
                if (ch) ch.classList.add('aiming');
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.input.aim = false;
                this.targetCameraDistance = 3.6;
                this.targetShoulderOffset = 0.62;
                this.targetCameraHeight = 1.68;
                const ch = document.getElementById('crosshair');
                if (ch) ch.classList.remove('aiming');
            }
        });

        // Mouse wheel weapon switch
        window.addEventListener('wheel', (e) => {
            if (!this.isPointerLocked) return;
            const wList = ["fists", "pistol", "smg", "shotgun", "rifle", "rpg"];
            let idx = wList.indexOf(this.weaponSystem.currentWeaponKey);
            if (idx === -1) idx = 1;
            if (e.deltaY > 0) idx = (idx + 1) % wList.length;
            else idx = (idx - 1 + wList.length) % wList.length;
            this.switchWeapon(wList[idx]);
        });
    }

    toggleCrouch() {
        if (this.currentVehicle || this.isDead) return;
        this.setCrouch(!this.isCrouched);
    }

    setCrouch(val) {
        if (this.currentVehicle || this.isDead) {
            this.isCrouched = false;
            return;
        }
        this.isCrouched = !!val;
        if (this.isCrouched) {
            this.targetCameraHeight = 1.25;
            this.input.sprint = false;
        } else {
            this.targetCameraHeight = 1.68;
        }
    }

    reloadWeapon() {
        if (this.isDead) return;
        if (this.currentVehicle && !this.currentVehicle.specs?.isBike) return;
        if (this.weaponSystem) {
            const reloaded = this.weaponSystem.reload();
            if (reloaded) {
                const w = this.weaponSystem.getCurrentWeapon();
                if (HUD.showReloading) {
                    HUD.showReloading(w ? (w.reloadTime || 1.8) : 1.8);
                }
            }
        }
    }

    shootFromBike() {
        if (this.isDead || !this.currentVehicle || (!this.currentVehicle.specs?.isBike && this.currentVehicle.type !== "sanchez")) return;

        // Auto-switch to pistol if fists are equipped
        if (this.weaponSystem.currentWeaponKey === "fists") {
            this.switchWeapon("pistol");
        }

        // Aim straight ahead towards crosshair from camera direction
        const shootDir = new THREE.Vector3();
        this.camera.getWorldDirection(shootDir);

        const rightX = Math.cos(this.rotY);
        const rightZ = -Math.sin(this.rotY);
        const muzzlePos = new THREE.Vector3(
            this.position.x + rightX * 0.45 + shootDir.x * 0.6,
            this.position.y + 1.25,
            this.position.z + rightZ * 0.45 + shootDir.z * 0.6
        );

        const shotResult = this.weaponSystem.fire(muzzlePos, shootDir, true, (hitData) => {
            this.handleLocalHit(hitData);
        });

        if (shotResult && shotResult.recoil) {
            const rPitch = typeof shotResult.recoil === 'object' ? (shotResult.recoil.pitch || 0.02) : (Number(shotResult.recoil) || 0.02);
            const rYaw = typeof shotResult.recoil === 'object' ? (shotResult.recoil.yaw || 0.01) : rPitch * 0.4;
            const curPitch = isNaN(this.pitch) ? 0 : this.pitch;
            const curRotY = isNaN(this.rotY) ? 0 : this.rotY;
            this.pitch = Math.min(1.1, curPitch + rPitch * 0.5);
            this.rotY = curRotY + (Math.random() - 0.5) * rYaw * 0.5;
        }

        if (shotResult && window.networkClient) {
            window.networkClient.sendWeaponFire(shotResult);
        }

        if (shotResult && window.gameInstance && window.gameInstance.traffic) {
            window.gameInstance.traffic.alertNearbyPedestrians(this.position, 30);
        }
    }

    addXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level++;
            this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.5);
            this.health = 100;
            this.armor = 100;
            this.cash += 1000;
            HUD.updateVitals(this.health, this.armor);
            HUD.updateCash(this.cash);
            if (this.audio) {
                if (this.audio.playLevelUpSound) this.audio.playLevelUpSound();
                else if (this.audio.playLevelUp) this.audio.playLevelUp();
            }
            if (HUD.showToast) HUD.showToast(`⭐ LEVEL UP! LEVEL ${this.level} UNLOCKED! (Health/Armor Full + $1,000)`, 'success', 3500);
            HUD.showActionHint(`⭐ LEVEL UP! LEVEL ${this.level} UNLOCKED! (Health/Armor Full + $1,000)`);
        }
        if (HUD.updateLevel) HUD.updateLevel(this.level, this.xp, this.xpToNextLevel);
    }

    getBoxRayIntersection(ox, oz, dx, dz, minX, maxX, minZ, maxZ, maxDist) {
        let tmin = 0;
        let tmax = maxDist;

        if (Math.abs(dx) > 0.0001) {
            let t1 = (minX - ox) / dx;
            let t2 = (maxX - ox) / dx;
            if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
            tmin = Math.max(tmin, t1);
            tmax = Math.min(tmax, t2);
            if (tmin > tmax) return null;
        } else if (ox < minX || ox > maxX) {
            return null;
        }

        if (Math.abs(dz) > 0.0001) {
            let t1 = (minZ - oz) / dz;
            let t2 = (maxZ - oz) / dz;
            if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
            tmin = Math.max(tmin, t1);
            tmax = Math.min(tmax, t2);
            if (tmin > tmax) return null;
        } else if (oz < minZ || oz > maxZ) {
            return null;
        }

        return (tmin >= 0 && tmin <= maxDist) ? tmin : null;
    }

    switchWeapon(key) {
        this.weaponSystem.setWeapon(key, this.char.weaponSlot);
        const w = this.weaponSystem.getCurrentWeapon();
        HUD.updateWeapon(w);
        const wn = document.getElementById('weapon-name');
        if (wn && w && w.name) {
            wn.textContent = w.name.toUpperCase();
            wn.style.display = 'inline-block';
            clearTimeout(wn._hideTimer);
            wn._hideTimer = setTimeout(() => { wn.style.display = 'none'; }, 2400);
        }
    }

    shoot() {
        if (this.isDead) return;
        this.aimTimer = 0.55;

        // Calculate aim direction from camera center (crosshair)
        const shootDir = new THREE.Vector3();
        this.camera.getWorldDirection(shootDir);

        // Calculate weapon muzzle position in world space
        let muzzlePos = new THREE.Vector3();
        if (this.char && this.char.weaponSlot) {
            this.char.weaponSlot.getWorldPosition(muzzlePos);
        }
        if (muzzlePos.lengthSq() < 0.1) {
            const rightX = Math.cos(this.rotY);
            const rightZ = -Math.sin(this.rotY);
            muzzlePos.set(
                this.position.x + rightX * 0.35 + shootDir.x * 0.5,
                this.position.y + 1.35,
                this.position.z + rightZ * 0.35 + shootDir.z * 0.5
            );
        }

        const shotResult = this.weaponSystem.fire(muzzlePos, shootDir, true, (hitData) => {
            this.handleLocalHit(hitData);
        });

        // Apply realistic recoil pitch kick & yaw shake
        if (shotResult && shotResult.recoil) {
            const rPitch = typeof shotResult.recoil === 'object' ? (shotResult.recoil.pitch || 0.02) : (Number(shotResult.recoil) || 0.02);
            const rYaw = typeof shotResult.recoil === 'object' ? (shotResult.recoil.yaw || 0.01) : rPitch * 0.4;
            const curPitch = isNaN(this.pitch) ? 0 : this.pitch;
            const curRotY = isNaN(this.rotY) ? 0 : this.rotY;
            this.pitch = Math.min(1.1, curPitch + rPitch);
            this.rotY = curRotY + (Math.random() - 0.5) * rYaw;
        }

        if (shotResult && window.networkClient) {
            window.networkClient.sendWeaponFire(shotResult);
        }

        // Firing weapon alerts nearby pedestrians
        if (shotResult && this.weaponSystem.currentWeaponKey !== "fists") {
            if (window.gameInstance && window.gameInstance.traffic) {
                window.gameInstance.traffic.alertNearbyPedestrians(this.position, 28);
            }
        }
    }

    handleLocalHit(hitData) {
        const shootDir = new THREE.Vector3();
        this.camera.getWorldDirection(shootDir);
        const camRay = new THREE.Ray(this.camera.position, shootDir);
        const meleeOrigin = this.position.clone().add(new THREE.Vector3(shootDir.x * 1.2, 0.4, shootDir.z * 1.2));

        let hitSomething = false;

        // 0. Check hits against EnemyManager hostiles & Bosses
        if (window.gameInstance && window.gameInstance.enemyManager) {
            const eHit = window.gameInstance.enemyManager.checkHit(camRay, hitData);
            if (eHit.hit) {
                hitSomething = true;
                this.weaponSystem.createBloodSpurt(eHit.hitPoint);
                HUD.showHitMarker();
                if (eHit.killed && window.gameInstance.missions) {
                    window.gameInstance.missions.onEnemyKilled(eHit.enemy);
                }
            }
        }

        // 1. Check hits against Ambient Pedestrians
        if (window.gameInstance && window.gameInstance.traffic && window.gameInstance.traffic.pedestrians) {
            let closestDist = Infinity;
            let hitPed = null;
            let hitPoint = null;

            for (let p of window.gameInstance.traffic.pedestrians) {
                if (p.state === "dead") continue;
                const pedCenter = new THREE.Vector3(p.x, p.y + 0.9, p.z);
                const pedSphere = new THREE.Sphere(pedCenter, 0.85);

                if (hitData.type === "melee") {
                    const dist = meleeOrigin.distanceTo(pedCenter);
                    if (dist < 2.2 && dist < closestDist) {
                        closestDist = dist;
                        hitPed = p;
                        hitPoint = pedCenter;
                    }
                } else {
                    const intersect = new THREE.Vector3();
                    if (camRay.intersectSphere(pedSphere, intersect)) {
                        const dist = this.camera.position.distanceTo(intersect);
                        if (dist < (hitData.range || 85) && dist < closestDist) {
                            closestDist = dist;
                            hitPed = p;
                            hitPoint = intersect;
                        }
                    }
                }
            }

            if (hitPed) {
                hitSomething = true;
                hitPed.health -= hitData.damage;
                this.weaponSystem.createBloodSpurt(hitPoint);
                HUD.showHitMarker();

                if (hitPed.health <= 0) {
                    hitPed.state = "dead";
                    CharacterModel.updateAnimation(hitPed.char, "dead", 0, 0);
                    const bounty = 150 + Math.floor(Math.random() * 200);
                    this.cash += bounty;
                    HUD.updateCash(this.cash);
                    HUD.showActionHint(`+$${bounty} Cash Collected!`);

                    // Crime Rule: Only when you kill 20 persons does 1 star get considered!
                    this.pedKillCount = (this.pedKillCount || 0) + 1;
                    const requiredKills = 20;

                    if (this.pedKillCount < requiredKills) {
                        if (this.wantedLevel > 0) {
                            this.setWantedLevel(0);
                        }
                        HUD.showActionHint(`🎯 Person Down: ${this.pedKillCount}/${requiredKills} Kills (Police will only investigate at 20 Kills!)`);
                    } else {
                        const targetWanted = Math.min(5, Math.floor(this.pedKillCount / requiredKills));
                        if (targetWanted > this.wantedLevel) {
                            this.setWantedLevel(targetWanted);
                            HUD.showActionHint(`⚠️ WANTED LEVEL ${this.wantedLevel} STAR! (${this.pedKillCount} Kills Reached!)`);
                        } else {
                            HUD.showActionHint(`⚠️ Wanted Star ${this.wantedLevel} Active (${this.pedKillCount} Kills)`);
                        }
                    }

                    // Progress missions
                    if (window.gameInstance && window.gameInstance.missions) {
                        window.gameInstance.missions.onTargetKilled(hitPed.persona || "mobster_pink");
                    }
                } else {
                    hitPed.state = "panic";
                    hitPed.panicTimer = 8.0;
                    hitPed.speed = 7.5;
                    hitPed.dirZ = (hitPed.z > this.position.z) ? 1 : -1;
                }

                if (window.gameInstance.traffic) {
                    window.gameInstance.traffic.alertNearbyPedestrians(this.position, 28);
                }
            }
        }

        // 2. Check hits against Remote Players
        if (!hitSomething && window.gameInstance && window.gameInstance.remotePlayers) {
            let closestDist = Infinity;
            let hitPlayerId = null;
            let hitPoint = null;

            for (let [pid, rp] of Object.entries(window.gameInstance.remotePlayers)) {
                const rpCenter = rp.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0));
                const rpSphere = new THREE.Sphere(rpCenter, 0.95);

                if (hitData.type === "melee") {
                    const dist = meleeOrigin.distanceTo(rpCenter);
                    if (dist < 2.2 && dist < closestDist) {
                        closestDist = dist;
                        hitPlayerId = pid;
                        hitPoint = rpCenter;
                    }
                } else {
                    const intersect = new THREE.Vector3();
                    if (camRay.intersectSphere(rpSphere, intersect)) {
                        const dist = this.camera.position.distanceTo(intersect);
                        if (dist < (hitData.range || 85) && dist < closestDist) {
                            closestDist = dist;
                            hitPlayerId = pid;
                            hitPoint = intersect;
                        }
                    }
                }
            }

            if (hitPlayerId) {
                hitSomething = true;
                this.weaponSystem.createBloodSpurt(hitPoint);
                HUD.showHitMarker();
                if (window.networkClient) {
                    window.networkClient.sendPlayerHit(hitPlayerId, hitData.damage, this.weaponSystem.currentWeaponKey);
                }
                this.cash += 250;
                HUD.updateCash(this.cash);
            }
        }

        // 3. Check hits against Vehicles
        if (!hitSomething && window.gameInstance && window.gameInstance.vehicles) {
            for (let [vid, veh] of Object.entries(window.gameInstance.vehicles)) {
                if (veh === this.currentVehicle) continue;
                const vehCenter = veh.mesh.position.clone().add(new THREE.Vector3(0, 0.7, 0));
                const vehSphere = new THREE.Sphere(vehCenter, 2.5);

                let isVehHit = false;
                const intersect = new THREE.Vector3();
                if (camRay.intersectSphere(vehSphere, intersect)) {
                    isVehHit = true;
                    this.weaponSystem.createImpactSparks(intersect);
                } else if (hitData.type === "explosion" && this.position.distanceTo(vehCenter) < 6.0) {
                    isVehHit = true;
                }

                if (isVehHit) {
                    hitSomething = true;
                    if (veh.takeDamage) {
                        veh.takeDamage(hitData.damage);
                    } else {
                        veh.health = Math.max(0, veh.health - hitData.damage);
                        if (veh.health <= 0 && veh.explodeAndBurn) veh.explodeAndBurn();
                    }
                    HUD.showHitMarker();
                    if (veh.isDestroyed) {
                        this.cash += 500;
                        HUD.updateCash(this.cash);
                        HUD.showActionHint("💥 +$500 Vehicle Blasted! (Will disappear in 30s)");
                    }
                    break;
                }
            }
        }

        // 4. Check hits against Dinosaurs (T-Rex, Raptors, Pterodactyls)
        if (!hitSomething && window.gameInstance && window.gameInstance.dinos && window.gameInstance.dinos.dinosaurs) {
            let closestDist = Infinity;
            let hitDino = null;
            let hitPoint = null;

            for (let d of window.gameInstance.dinos.dinosaurs) {
                if (d.state === "dead") continue;
                const radius = (d.type === "trex") ? 3.6 : 1.5;
                const dinoCenter = new THREE.Vector3(d.x, d.y + (d.type === "trex" ? 3.5 : 1.2), d.z);
                const dinoSphere = new THREE.Sphere(dinoCenter, radius);

                const intersect = new THREE.Vector3();
                if (camRay.intersectSphere(dinoSphere, intersect)) {
                    const dist = this.camera.position.distanceTo(intersect);
                    if (dist < (hitData.range || 120) && dist < closestDist) {
                        closestDist = dist;
                        hitDino = d;
                        hitPoint = intersect;
                    }
                }
            }

            if (hitDino) {
                hitSomething = true;
                hitDino.health -= hitData.damage;
                this.weaponSystem.createBloodSpurt(hitPoint);
                HUD.showHitMarker();
                window.gameInstance.dinos.updateDinoTag(hitDino);

                if (hitDino.health <= 0) {
                    hitDino.state = "dead";
                    hitDino.root.rotation.z = Math.PI / 2;
                    hitDino.root.position.y = (hitDino.y || 0.6) + 0.3;

                    const bounty = (hitDino.type === "trex") ? 5000 : 1000;
                    this.cash += bounty;
                    HUD.updateCash(this.cash);
                    if (this.audio) this.audio.playCashSound();
                    HUD.showActionHint(`🏆 ${hitDino.name.toUpperCase()} ELIMINATED! +$${bounty} BOUNTY!`);

                    if (window.gameInstance && window.gameInstance.missions) {
                        window.gameInstance.missions.onTargetKilled(hitDino.type);
                    }
                }
            }
        }

        // 5. Check hits against On-Foot Police Officers
        if (!hitSomething && window.gameInstance && window.gameInstance.police) {
            const copHit = window.gameInstance.police.checkHit(camRay, hitData);
            if (copHit.hit) {
                hitSomething = true;
                this.weaponSystem.createBloodSpurt(copHit.hitPoint);
                HUD.showHitMarker();
                if (copHit.killed) {
                    this.cash += 200;
                    HUD.updateCash(this.cash);
                    this.pedKillCount = (this.pedKillCount || 0) + 1;
                    const requiredKills = 20;
                    if (this.pedKillCount >= requiredKills) {
                        const targetWanted = Math.min(5, Math.floor(this.pedKillCount / requiredKills));
                        if (targetWanted > this.wantedLevel) this.setWantedLevel(targetWanted);
                    }
                    HUD.showActionHint(`👮 Officer Down! +$200 (${this.pedKillCount}/20 Kills)`);
                }
            }
        }

        // 6. Check hits against Mission Enemies (if custom mission target exists)
        if (!hitSomething && window.gameInstance && window.gameInstance.missions && typeof window.gameInstance.missions.checkHit === 'function') {
            const mHit = window.gameInstance.missions.checkHit(camRay, hitData);
            if (mHit && mHit.hit) {
                hitSomething = true;
                this.weaponSystem.createBloodSpurt(mHit.hitPoint);
                HUD.showHitMarker();
                if (mHit.killed) {
                    this.cash += 250;
                    HUD.updateCash(this.cash);
                    HUD.showActionHint("🎯 Mission Hostile Neutralized! +$250");
                }
            }
        }
    }

    toggleVehicle() {
        if (this.currentVehicle) {
            // Exit vehicle cleanly to the side
            const v = this.currentVehicle;
            const exitOffset = new THREE.Vector3(Math.cos(v.rot) * 2.4, 0, -Math.sin(v.rot) * 2.4);
            this.position.set(v.x + exitOffset.x, 1.0, v.z + exitOffset.z);
            this.mesh.position.copy(this.position);
            this.mesh.rotation.set(0, v.rot, 0);
            this.mesh.visible = true;
            CharacterModel.updateAnimation(this.char, "idle", 0, 0, false, 0);

            if (this.audio) this.audio.stopEngineSound();
            if (window.networkClient) {
                window.networkClient.sendVehicleExit(v.id, this.position);
            }

            this.currentVehicle.driverId = null;
            this.currentVehicle = null;
            this.input.handbrake = false;
            HUD.hideSpeedometer();
            if (window.gameInstance && window.gameInstance.updateMobileControlMode) {
                window.gameInstance.updateMobileControlMode(false);
            }
        } else if (this.nearestVehicle) {
            // Enter vehicle
            this.currentVehicle = this.nearestVehicle;
            this.currentVehicle.driverId = this.id;
            this.mesh.visible = (this.currentVehicle.type === "bike" || this.currentVehicle.type === "sanchez");

            this.input.forward = false;
            this.input.backward = false;
            this.input.left = false;
            this.input.right = false;
            this.input.handbrake = false;

            if (this.audio) {
                this.audio.startEngineSound();
                const st = this.audio.setRadioStation(0);
                HUD.showRadioBanner(st);
            }

            if (window.networkClient) {
                window.networkClient.sendVehicleEnter(this.currentVehicle.id);
            }

            HUD.showSpeedometer();
            if (window.gameInstance && window.gameInstance.updateMobileControlMode) {
                window.gameInstance.updateMobileControlMode(true);
            }
        }
    }

    takeDamage(dmg, weapon = "bullet") {
        if (this.isDead) return;

        if (this.armor > 0) {
            const absorb = Math.min(this.armor, dmg);
            this.armor -= absorb;
            dmg -= absorb;
        }

        this.health = Math.max(0, this.health - dmg);
        this._regenCooldown = 8.0; // 8s delay before regen starts
        HUD.updateVitals(this.health, this.armor);
        if (HUD.triggerDamageVignette) HUD.triggerDamageVignette();
        this.renderer.addScreenShake(0.6, 0.25);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        HUD.showWasted();
        if (this.currentVehicle) this.toggleVehicle();
        CharacterModel.updateAnimation(this.char, "dead", 0, 0);

        setTimeout(() => {
            this.respawn();
        }, 3200);
    }

    respawn() {
        this.isDead = false;
        this.health = 100;
        this.armor = 50;
        this.wantedLevel = 0;
        this.position.set(-15, 1.0, -40); // Spawn at Ocean View Hotel
        this.mesh.position.copy(this.position);
        this.char.root.rotation.x = 0;
        HUD.hideWasted();
        HUD.updateVitals(this.health, this.armor);
        HUD.updateWantedStars(0);
        if (window.gameInstance && window.gameInstance.police) {
            window.gameInstance.police.clearWantedResponse();
        }

        if (window.networkClient) {
            window.networkClient.sendRespawn();
        }
    }

    setWantedLevel(level) {
        this.wantedLevel = Math.max(0, Math.min(5, level));
        HUD.updateWantedStars(this.wantedLevel);
        if (window.gameInstance && window.gameInstance.police) {
            window.gameInstance.police.setWantedLevel(this.wantedLevel, this);
        }
    }

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (text) {
            const lower = text.toLowerCase();
            if (lower === "police" || lower === "/police" || lower === "escapepolice" || lower === "/escapepolice") {
                if (window.gameInstance && window.gameInstance.police) {
                    window.gameInstance.police.disappearAllPolice("POLICE");
                }
            } else if (window.networkClient) {
                window.networkClient.sendChat(text);
            }
        }
        input.value = '';
        document.getElementById('chat-input-wrapper').style.display = 'none';
        input.blur();
        document.body.requestPointerLock();
    }

    update(dt, time, vehicles) {
        if (this.isDead) return;

        // Check for nearby vehicles to enter
        this.nearestVehicle = null;
        let minDist = 4.2;
        if (vehicles && !this.currentVehicle) {
            for (let [vid, v] of Object.entries(vehicles)) {
                const dist = this.position.distanceTo(v.mesh.position);
                if (dist < minDist && (!v.driverId || v.driverId === this.id)) {
                    minDist = dist;
                    this.nearestVehicle = v;
                }
            }
        }

        if (this.nearestVehicle) {
            HUD.showActionHint(`Press [F] to Drive ${this.nearestVehicle.specs.name}`);
        } else if (!this.currentVehicle) {
            HUD.hideActionHint();
        }

        if (this.currentVehicle) {
            const isBike = (this.currentVehicle.type === "bike" || this.currentVehicle.type === "sanchez");
            const ch = document.getElementById('crosshair');
            if (ch) ch.style.display = isBike ? 'block' : 'none';

            // Pay 'n' Spray Garage Check (Ocean Drive Service Garage at x: -55, z: 25)
            const pnsDist = Math.hypot(this.position.x - (-55), this.position.z - 25);
            if (pnsDist < 12.0) {
                HUD.showActionHint("Press [E] for Pay 'n' Spray ($100: Repair Vehicle & Clear Wanted)");
                if (this.input.interact) {
                    this.input.interact = false;
                    if (this.cash >= 100) {
                        this.cash -= 100;
                        this.setWantedLevel(0);
                        this.currentVehicle.health = 100;
                        if (this.audio && this.audio.playPayNSpray) this.audio.playPayNSpray();
                        HUD.updateCash(this.cash);
                        HUD.showActionHint("🚗 VEHICLE REPAIRED & RESCHEDULED! WANTED STARS CLEARED!");
                    } else {
                        HUD.showActionHint("⚠️ Not enough cash for Pay 'n' Spray ($100 required)");
                    }
                }
            }

            // Driving Vehicle Update
            this.currentVehicle.updatePhysics(dt, this.input, this.world);
            this.rotY = this.currentVehicle.rot;

            if (isBike) {
                this.mesh.visible = true;
                this.position.set(this.currentVehicle.x, this.currentVehicle.y + 0.35, this.currentVehicle.z);
                this.mesh.position.copy(this.position);
                this.mesh.rotation.y = this.rotY;
                this.mesh.rotation.z = this.currentVehicle.mesh.rotation.z;
                const isShootingOrAiming = this.input.aim || (this.aimTimer > 0);
                CharacterModel.updateAnimation(this.char, isShootingOrAiming ? "biking" : "biking", 1.0, time, isShootingOrAiming, this.pitch);
            } else {
                this.mesh.visible = false;
                this.position.set(this.currentVehicle.x, this.currentVehicle.y + 0.6, this.currentVehicle.z);
            }

            // Update Speedometer HUD
            const mph = Math.abs(Math.round(this.currentVehicle.speed * 1.8));
            HUD.updateSpeed(mph);

            // Dynamic Arcade Chase Camera with high-speed distance scaling
            const isHeavy = (this.currentVehicle.type === "truck" || this.currentVehicle.type === "bus" || this.currentVehicle.type === "tank");
            const camDist = (isBike ? 5.2 : (isHeavy ? 10.5 : 7.5)) + (mph / 100) * 2.5;
            const camHeight = (isBike ? 2.3 : (isHeavy ? 4.8 : 3.2)) + (mph / 100) * 0.8;
            const camOffset = new THREE.Vector3(
                -Math.sin(this.rotY) * camDist,
                camHeight,
                -Math.cos(this.rotY) * camDist
            );
            const targetCamPos = this.position.clone().add(camOffset);
            this.camera.position.lerp(targetCamPos, dt * 9);
            this.camera.lookAt(this.position.clone().add(new THREE.Vector3(0, isBike ? 1.0 : 1.2, 0)));

            // Network vehicle sync
            if (window.networkClient) {
                window.networkClient.sendVehicleUpdate({
                    id: this.currentVehicle.id,
                    x: this.currentVehicle.x,
                    y: this.currentVehicle.y,
                    z: this.currentVehicle.z,
                    rot: this.currentVehicle.rot,
                    speed: this.currentVehicle.speed,
                    steering: this.currentVehicle.steering
                });
            }
            return;
        }

        // On-Foot Movement Physics with Stamina & Crouch Handling
        const moveVec = new THREE.Vector3();
        if (this.input.forward) moveVec.z += 1;
        if (this.input.backward) moveVec.z -= 1;
        if (this.input.left) moveVec.x += 1;
        if (this.input.right) moveVec.x -= 1;

        const isMoving = moveVec.lengthSq() > 0;
        const isTryingToSprint = this.input.sprint && isMoving && !this.isCrouched;

        // Stamina drain & regeneration
        if (isTryingToSprint && !this.staminaExhausted) {
            this.stamina = Math.max(0, this.stamina - dt * 24);
            if (this.stamina <= 0) {
                this.staminaExhausted = true;
            }
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + dt * 16);
            if (this.stamina >= 25) {
                this.staminaExhausted = false;
            }
        }
        HUD.updateStamina(this.stamina, this.maxStamina);

        // Slow health regeneration when health is below 30 and not in combat
        if (this.health > 0 && this.health < 30) {
            this._regenCooldown = (this._regenCooldown || 0) - dt;
            if (this._regenCooldown <= 0) {
                this.health = Math.min(30, this.health + dt * 1.5);
                HUD.updateVitals(this.health, this.armor);
                this._regenCooldown = 0;
            }
        }

        const canSprint = isTryingToSprint && !this.staminaExhausted;
        let speed = this.walkSpeed;
        if (this.isCrouched) {
            speed = this.crouchSpeed;
        } else if (canSprint) {
            speed = this.sprintSpeed;
        }

        if (isMoving) {
            moveVec.normalize();

            // Footstep sounds
            if (this.audio && this.isGrounded) {
                this._footstepTimer = (this._footstepTimer || 0) + dt;
                const stepInterval = canSprint ? 0.28 : 0.42;
                if (this._footstepTimer >= stepInterval) {
                    this._footstepTimer = 0;
                    const surface = (this.position.x > 25 && this.position.x < 144) ? 'sand' : 'concrete';
                    if (this.audio.playFootstep) this.audio.playFootstep(surface);
                }
            }

            // Transform movement relative to camera yaw
            const forward = new THREE.Vector3(Math.sin(this.rotY), 0, Math.cos(this.rotY));
            const right = new THREE.Vector3(Math.cos(this.rotY), 0, -Math.sin(this.rotY));

            const dir = forward.multiplyScalar(moveVec.z).add(right.multiplyScalar(moveVec.x)).normalize();
            const stepX = dir.x * speed * dt;
            const stepZ = dir.z * speed * dt;

            const nextX = this.position.x + stepX;
            const nextZ = this.position.z + stepZ;

            // Check world collision with anti-stuck resolution
            const isCurrentlyStuck = this.world.checkCollision(this.position.x, this.position.z, 0.45);
            const colX = this.world.checkCollision(nextX, this.position.z, 0.45);
            if (!colX || isCurrentlyStuck) {
                this.position.x = nextX;
            }
            const colZ = this.world.checkCollision(this.position.x, nextZ, 0.45);
            if (!colZ || isCurrentlyStuck) {
                this.position.z = nextZ;
            }
        }

        // Gravity & Vertical Movement
        this.velocity.y -= 20 * dt;
        this.position.y += this.velocity.y * dt;

        let groundY = 1.0;
        const rampHeight = this.world ? this.world.checkRampHeight(this.position.x, this.position.z) : 0;
        const inWater = this.world ? this.world.isWater(this.position.x, this.position.z) : false;
        if (rampHeight > 0) {
            groundY = Math.max(1.0, rampHeight + 0.6);
        } else if (inWater) {
            // Swimming on ocean water surface
            groundY = 0.35 + Math.sin(time * 3.0) * 0.12;
        }

        if (this.position.y <= groundY) {
            this.position.y = groundY;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // Expanded Map Boundaries (Z: -490 to +490, X: -190 to 940)
        this.position.x = Math.max(-190, Math.min(940, this.position.x));
        this.position.z = Math.max(-490, Math.min(490, this.position.z));

        if (isNaN(this.pitch)) this.pitch = 0;
        if (isNaN(this.rotY)) this.rotY = 0;
        if (isNaN(this.position.x)) this.position.x = 0;
        if (isNaN(this.position.y)) this.position.y = 1.0;
        if (isNaN(this.position.z)) this.position.z = 0;

        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = 0;
        this.mesh.rotation.y = this.rotY;
        this.mesh.rotation.z = 0;

        // Ensure crosshair is visible on foot
        const ch = document.getElementById('crosshair');
        if (ch && ch.style.display === 'none') ch.style.display = 'block';

        // Update aim timer countdown
        if (this.aimTimer > 0) {
            this.aimTimer -= dt;
        }

        const isAimingActive = this.input.aim || this.aimTimer > 0;

        // Smooth camera FOV zoom (Combat focus when holding Right-Click)
        const targetFov = this.input.aim ? 55 : (window.gameSettings ? (window.gameSettings.fov || 72) : 72);
        if (Math.abs(this.camera.fov - targetFov) > 0.1) {
            this.camera.fov += (targetFov - this.camera.fov) * dt * 10;
            this.camera.updateProjectionMatrix();
        }

        // Determine animation (crouch, crouch_walk, sprint, run, idle)
        let anim = "idle";
        if (this.isCrouched) {
            anim = isMoving ? "crouch_walk" : "crouch";
        } else if (isMoving) {
            anim = canSprint ? "sprint" : "run";
        }
        CharacterModel.updateAnimation(this.char, anim, canSprint ? 1.5 : 1.0, time, isAimingActive, this.pitch);

        // Third-Person Over-the-Shoulder Camera System with Obstacle Collision
        this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * dt * 10;
        this.shoulderOffset += (this.targetShoulderOffset - this.shoulderOffset) * dt * 10;
        this.cameraHeight += (this.targetCameraHeight - this.cameraHeight) * dt * 10;

        const fwdX = Math.sin(this.rotY);
        const fwdZ = Math.cos(this.rotY);
        const rightX = Math.cos(this.rotY);
        const rightZ = -Math.sin(this.rotY);

        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);

        const viewDirX = fwdX * cosPitch;
        const viewDirY = sinPitch;
        const viewDirZ = fwdZ * cosPitch;

        // Shoulder anchor point: Tommy's position + height + right shoulder offset
        const anchorX = this.position.x + rightX * this.shoulderOffset;
        const anchorY = this.position.y + this.cameraHeight;
        const anchorZ = this.position.z + rightZ * this.shoulderOffset;

        // Check camera obstacle collision against world buildings / colliders
        let effectiveCamDist = this.cameraDistance;
        if (this.world && this.world.colliders) {
            const rayDirX = -viewDirX;
            const rayDirZ = -viewDirZ;
            for (let col of this.world.colliders) {
                const hitT = this.getBoxRayIntersection(
                    anchorX, anchorZ,
                    rayDirX, rayDirZ,
                    col.minX - 0.3, col.maxX + 0.3,
                    col.minZ - 0.3, col.maxZ + 0.3,
                    effectiveCamDist
                );
                if (hitT !== null && hitT < effectiveCamDist) {
                    effectiveCamDist = Math.max(0.65, hitT - 0.35);
                }
            }
        }

        // Position camera behind shoulder anchor along view direction clamped by collision
        const camX = anchorX - viewDirX * effectiveCamDist;
        const camY = anchorY - viewDirY * effectiveCamDist;
        const camZ = anchorZ - viewDirZ * effectiveCamDist;

        this.camera.position.set(camX, camY, camZ);

        // Direct camera straight ahead along viewDir (screen center/crosshair looks past Tommy's shoulder into the open field!)
        this.camera.lookAt(
            camX + viewDirX * 50.0,
            camY + viewDirY * 50.0,
            camZ + viewDirZ * 50.0
        );

        // Network state transmission (30 times/sec)
        if (window.networkClient) {
            window.networkClient.sendPlayerUpdate({
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                rotY: this.rotY,
                pitch: this.pitch,
                anim: anim,
                weapon: this.weaponSystem.currentWeaponKey,
                health: this.health,
                armor: this.armor,
                wantedLevel: this.wantedLevel
            });
        }
    }
}

window.Player = Player;
