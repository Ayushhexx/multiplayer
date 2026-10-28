class MissionSystem {
    constructor(game) {
        this.game = game;
        this.currentMissionIndex = 0;
        this.missionEnemies = [];
        this.lanceEntity = null;
        this.bossEntity = null;
        this.missionVehicle = null;
        this.briefcaseMesh = null;
        this.deliveryTimer = 0;
        this.isTimerActive = false;
        this.currentWave = 0;

        // 3D Waypoint Marker in Scene
        this.initWaypointMarker();

        // 5 Core Vice City Action Campaign Missions
        this.missions = [
            {
                id: "mob_hit",
                title: "Mission 1: Ocean Drive Mob Hit",
                desc: "Eliminate 3 rival mobsters roaming Ocean Drive.",
                reward: 2500,
                rewardXP: 500,
                type: "mob_hit",
                targetCount: 3,
                progress: 0,
                completed: false,
                rewardClaimed: false,
                atmosphere: "sunset",
                mood: "exploration",
                waypoint: { x: -12, z: 20 }
            },
            {
                id: "package_delivery",
                title: "Mission 2: Package Delivery",
                desc: "Pick up the contraband briefcase at Marina docks and deliver it to North Warehouse in 90s!",
                reward: 4000,
                rewardXP: 800,
                type: "multi_step",
                step: 0,
                steps: [
                    { desc: "Proceed to the Beach Marina pier and secure the Contraband Briefcase.", waypoint: { x: 105, z: 125 } },
                    { desc: "RACE AGAINST TIME! Deliver the briefcase to North Industrial Warehouse!", waypoint: { x: -75, z: -210 }, hasTimer: true, timeLimit: 90.0 }
                ],
                completed: false,
                rewardClaimed: false,
                atmosphere: "sunset",
                mood: "pursuit"
            },
            {
                id: "protect_contact",
                title: "Mission 3: Protect Lance Vance",
                desc: "Meet Lance Vance at Ocean View terrace and defend him against 3 hostile syndicate waves!",
                reward: 6000,
                rewardXP: 1200,
                type: "protect_vip",
                step: 0,
                totalWaves: 3,
                currentWave: 0,
                completed: false,
                rewardClaimed: false,
                atmosphere: "night",
                mood: "hard_mission",
                waypoint: { x: -15, z: -30 }
            },
            {
                id: "stolen_wheels",
                title: "Mission 4: Stolen Wheels",
                desc: "Steal the marked syndicate Cheetah sports car, survive 3-Star pursuit, and reach Pay 'n' Spray!",
                reward: 8000,
                rewardXP: 1500,
                type: "car_theft",
                step: 0,
                completed: false,
                rewardClaimed: false,
                atmosphere: "night",
                mood: "pursuit",
                waypoint: { x: 35, z: 60 }
            },
            {
                id: "showdown",
                title: "Mission 5: Vice City Showdown",
                desc: "Infiltrate Diaz's Mansion on Starfish Island, eliminate security, and defeat Don Ricardo Diaz!",
                reward: 20000,
                rewardXP: 3000,
                type: "boss_showdown",
                step: 0,
                steps: [
                    { desc: "Infiltrate Diaz Mansion perimeter on Starfish Island.", waypoint: { x: 140, z: -80 } },
                    { desc: "Eliminate Diaz's 4 elite mansion guards.", waypoint: null, targetCount: 4, progress: 0 },
                    { desc: "ELIMINATE DON RICARDO DIAZ!", waypoint: null, isBoss: true }
                ],
                completed: false,
                rewardClaimed: false,
                atmosphere: "blood_moon",
                mood: "boss"
            }
        ];

        this.initUI();
        this.applyMissionAtmosphere();
        this.startCurrentMission();
    }

    initWaypointMarker() {
        this.markerGroup = new THREE.Group();

        // Pulsing glowing base ring
        const ringGeo = new THREE.RingGeometry(1.8, 2.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
        });
        this.markerRing = new THREE.Mesh(ringGeo, ringMat);
        this.markerRing.rotation.x = -Math.PI / 2;
        this.markerGroup.add(this.markerRing);

        // Vertical glowing light cylinder beam
        const beamGeo = new THREE.CylinderGeometry(0.5, 2.0, 14, 16, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        this.markerBeam = new THREE.Mesh(beamGeo, beamMat);
        this.markerBeam.position.y = 7;
        this.markerGroup.add(this.markerBeam);

        // Floating rotating mission diamond
        const diaGeo = new THREE.OctahedronGeometry(0.9, 0);
        const diaMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
        this.markerDiamond = new THREE.Mesh(diaGeo, diaMat);
        this.markerDiamond.position.y = 3.2;
        this.markerGroup.add(this.markerDiamond);

        this.markerGroup.visible = false;
        if (this.game && this.game.renderer && this.game.renderer.scene) {
            this.game.renderer.scene.add(this.markerGroup);
        }
    }

    getCurrentMission() {
        return this.missions[this.currentMissionIndex];
    }

    getCurrentWaypoint() {
        const cur = this.getCurrentMission();
        if (!cur || cur.completed) return null;

        if (cur.type === "multi_step" || cur.type === "boss_showdown") {
            const stepObj = cur.steps[cur.step];
            return stepObj ? stepObj.waypoint : null;
        } else if (cur.type === "car_theft") {
            if (cur.step === 0) return { x: 35, z: 60 };
            return { x: -55, z: 25 }; // Pay 'n' Spray destination
        }
        return cur.waypoint || null;
    }

    applyMissionAtmosphere() {
        const cur = this.getCurrentMission();
        if (!cur) return;

        if (this.game && this.game.renderer) {
            this.game.renderer.setAtmosphere(cur.atmosphere || "sunset");
        }
        if (this.game && this.game.audio) {
            this.game.audio.setMood(cur.mood || "exploration");
        }
    }

    initUI() {
        // Mission Objective HUD Card
        let mCard = document.getElementById('mission-card');
        if (!mCard) {
            mCard = document.createElement('div');
            mCard.id = 'mission-card';
            mCard.innerHTML = `
                <div class="m-tag">CAMPAIGN MISSION • [B] BLACK MARKET SHOP</div>
                <div id="m-title" class="m-title">Mission 1: Ocean Drive Mob Hit</div>
                <div id="m-desc" class="m-desc">Eliminate 3 rival mobsters roaming Ocean Drive.</div>
                <div class="m-progress-bar"><div id="m-fill" class="m-fill" style="width: 0%;"></div></div>
                <div id="m-status" class="m-status">0 / 3 Eliminated • Reward: $2,500 + 500 XP</div>
            `;
            document.body.appendChild(mCard);
        }

        // Black Market Shop Modal
        let shopModal = document.getElementById('shop-modal');
        if (!shopModal) {
            shopModal = document.createElement('div');
            shopModal.id = 'shop-modal';
            shopModal.innerHTML = `
                <div class="shop-content">
                    <div class="shop-header">
                        <h2>🌴 VICE CITY BLACK MARKET</h2>
                        <span class="shop-close" id="shop-close-btn">&times;</span>
                    </div>
                    <div class="shop-sub">Spend your earned bounty cash on military hardware & airdrops!</div>
                    <div class="shop-items">
                        <div class="shop-card" data-buy="armor" data-cost="500">
                            <div class="shop-icon">🛡️</div>
                            <div class="shop-name">Body Armor (Max)</div>
                            <div class="shop-cost">$500</div>
                            <button class="btn-buy">PURCHASE</button>
                        </div>
                        <div class="shop-card" data-buy="rpg" data-cost="2500">
                            <div class="shop-icon">🚀</div>
                            <div class="shop-name">RPG Launcher (8 Rockets)</div>
                            <div class="shop-cost">$2,500</div>
                            <button class="btn-buy">PURCHASE</button>
                        </div>
                        <div class="shop-card" data-buy="bike" data-cost="1500">
                            <div class="shop-icon">🏍️</div>
                            <div class="shop-name">Airdrop PCJ-600 Superbike</div>
                            <div class="shop-cost">$1,500</div>
                            <button class="btn-buy">AIRDROP</button>
                        </div>
                        <div class="shop-card" data-buy="tank" data-cost="6000">
                            <div class="shop-icon">🪖</div>
                            <div class="shop-name">Airdrop Rhino Military Tank</div>
                            <div class="shop-cost">$6,000</div>
                            <button class="btn-buy">AIRDROP</button>
                        </div>
                        <div class="shop-card" data-buy="helicopter" data-cost="9000">
                            <div class="shop-icon">🚁</div>
                            <div class="shop-name">Airdrop Hunter Attack Chopper</div>
                            <div class="shop-cost">$9,000</div>
                            <button class="btn-buy">AIRDROP</button>
                        </div>
                        <div class="shop-card" data-buy="boat" data-cost="3500">
                            <div class="shop-icon">🚤</div>
                            <div class="shop-name">Squalo Speedboat at Marina</div>
                            <div class="shop-cost">$3,500</div>
                            <button class="btn-buy">PURCHASE</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(shopModal);

            document.getElementById('shop-close-btn').addEventListener('click', () => {
                this.toggleShop(false);
            });

            shopModal.querySelectorAll('.shop-card').forEach(card => {
                card.querySelector('.btn-buy').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const item = card.dataset.buy;
                    const cost = parseInt(card.dataset.cost);
                    this.buyItem(item, cost);
                });
            });
        }

        // Toggle Shop with 'B' Key
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyB') {
                if (document.activeElement !== document.getElementById('chat-input')) {
                    this.toggleShop();
                }
            }
        });

        this.updateHUD();
    }

    toggleShop(forceState = null) {
        const modal = document.getElementById('shop-modal');
        if (!modal) return;
        const isOpen = (modal.style.display === 'flex');
        const shouldOpen = (forceState !== null) ? forceState : !isOpen;

        if (shouldOpen) {
            modal.style.display = 'flex';
            document.exitPointerLock();
        } else {
            modal.style.display = 'none';
            document.body.requestPointerLock();
        }
    }

    buyItem(item, cost) {
        const p = this.game.player;
        if (p.cash < cost) {
            HUD.showActionHint("⚠️ Not enough cash! Complete missions to earn money.");
            return;
        }

        p.cash -= cost;
        HUD.updateCash(p.cash);
        if (p.audio) p.audio.playCashSound();

        if (item === "armor") {
            p.armor = 100;
            HUD.updateVitals(p.health, p.armor);
            HUD.showActionHint("🛡️ Body Armor Equipped!");
        } else if (item === "rpg") {
            p.switchWeapon("rpg");
            p.weaponSystem.weapons.rpg.ammo += 8;
            HUD.updateWeapon(p.weaponSystem.getCurrentWeapon());
            HUD.showActionHint("🚀 RPG Launcher Acquired!");
        } else if (item === "tank") {
            this.spawnPlayerVehicle("tank", "Rhino Tank Airdropped nearby!");
        } else if (item === "helicopter") {
            this.spawnPlayerVehicle("helicopter", "Hunter Attack Chopper Airdropped nearby!");
        } else if (item === "bike") {
            this.spawnPlayerVehicle("bike", "PCJ-600 Superbike Delivered!");
        } else if (item === "boat") {
            this.spawnPlayerVehicle("boat", "Squalo Speedboat Docked at Marina!");
        }

        this.toggleShop(false);
    }

    spawnPlayerVehicle(type, msg) {
        const p = this.game.player;
        const vId = `airdrop_${Date.now()}`;
        const offset = new THREE.Vector3(Math.cos(p.rotY) * 6, 0, -Math.sin(p.rotY) * 6);
        const vData = {
            id: vId,
            type: type,
            x: (type === "boat") ? 170 : (p.position.x + offset.x),
            y: (type === "boat") ? 0.2 : 0.6,
            z: (type === "boat") ? 125 : (p.position.z + offset.z),
            rot: p.rotY,
            color: (type === "tank") ? "#475338" : ((type === "helicopter") ? "#303a2b" : "#ff007f")
        };

        const veh = new Vehicle(vId, vData, this.game.renderer.scene, this.game.audio);
        this.game.vehicles[vId] = veh;
        HUD.showActionHint(`✅ ${msg}`);
    }

    startCurrentMission() {
        const cur = this.getCurrentMission();
        if (!cur) return;

        this.clearMissionEntities();

        if (cur.id === "mob_hit") {
            // Spawn 3 roaming mobsters on Ocean Drive
            if (this.game.enemyManager) {
                const spawns = [
                    { x: -12, z: 20, waypoints: [{ x: -12, z: 20 }, { x: -12, z: 60 }, { x: -12, z: -10 }] },
                    { x: -10, z: -80, waypoints: [{ x: -10, z: -80 }, { x: -10, z: -140 }, { x: -10, z: -40 }] },
                    { x: -14, z: 110, waypoints: [{ x: -14, z: 110 }, { x: -14, z: 160 }, { x: -14, z: 50 }] }
                ];
                spawns.forEach((s, idx) => {
                    const e = this.game.enemyManager.spawnEnemy({
                        name: `Rival Mobster #${idx + 1}`,
                        persona: "mobster_pink",
                        weapon: "pistol",
                        health: 80,
                        damage: 10,
                        speed: 5.0,
                        bountyCash: 350,
                        bountyXP: 150,
                        x: s.x,
                        z: s.z,
                        waypoints: s.waypoints
                    });
                    this.missionEnemies.push(e);
                });
            }
        } else if (cur.id === "package_delivery") {
            cur.step = 0;
            this.spawnBriefcase(105, 125);
        } else if (cur.id === "protect_contact") {
            cur.step = 0;
            cur.currentWave = 0;
        } else if (cur.id === "stolen_wheels") {
            cur.step = 0;
            this.spawnStolenVehicle(35, 60);
        } else if (cur.id === "showdown") {
            cur.step = 0;
        }

        this.applyMissionAtmosphere();
        this.updateHUD();
    }

    spawnBriefcase(x, z) {
        if (this.briefcaseMesh) {
            this.game.renderer.scene.remove(this.briefcaseMesh);
        }
        const geo = new THREE.BoxGeometry(0.5, 0.35, 0.2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.4, metalness: 0.3 });
        this.briefcaseMesh = new THREE.Mesh(geo, mat);
        this.briefcaseMesh.position.set(x, 0.7, z);

        // Glowing ring underneath
        const ringGeo = new THREE.RingGeometry(0.5, 0.9, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.3;
        this.briefcaseMesh.add(ring);

        this.game.renderer.scene.add(this.briefcaseMesh);
    }

    spawnStolenVehicle(x, z) {
        const vId = "mission_cheetah";
        if (this.game.vehicles[vId]) return;

        const vData = {
            id: vId,
            type: "supercar",
            x: x,
            y: 0.6,
            z: z,
            rot: 0,
            color: "#ff0055"
        };
        this.missionVehicle = new Vehicle(vId, vData, this.game.renderer.scene, this.game.audio);
        this.game.vehicles[vId] = this.missionVehicle;
    }

    spawnLanceVance(x, z) {
        if (this.lanceEntity) return;

        const char = CharacterModel.create("white_suit");
        char.root.position.set(x, 1.0, z);
        this.game.renderer.scene.add(char.root);

        // Lance Vance overhead VIP health bar
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 40, 80, 0.85)';
        ctx.roundRect(8, 6, 240, 52, 6);
        ctx.fill();
        ctx.font = 'bold 18px Montserrat, sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText("LANCE VANCE (VIP)", 128, 28);
        ctx.fillStyle = '#222222';
        ctx.fillRect(20, 36, 216, 10);
        ctx.fillStyle = '#06d6a0';
        ctx.fillRect(20, 36, 216, 10);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(3.0, 0.75, 1);
        sprite.position.set(0, 2.3, 0);
        sprite.canvas = canvas;
        char.root.add(sprite);

        this.lanceEntity = {
            char,
            root: char.root,
            tagSprite: sprite,
            health: 150,
            maxHealth: 150,
            x, y: 1.0, z
        };
    }

    updateLanceTag() {
        if (!this.lanceEntity || !this.lanceEntity.tagSprite) return;
        const canvas = this.lanceEntity.tagSprite.canvas;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#222222';
        ctx.fillRect(20, 36, 216, 10);
        const ratio = Math.max(0, this.lanceEntity.health / this.lanceEntity.maxHealth);
        ctx.fillStyle = ratio > 0.4 ? '#06d6a0' : '#ff0055';
        ctx.fillRect(20, 36, 216 * ratio, 10);
        this.lanceEntity.tagSprite.material.map.needsUpdate = true;
    }

    spawnLanceWave(waveIndex) {
        if (!this.game.enemyManager) return;
        const count = 2 + waveIndex;
        HUD.showActionHint(`⚠️ SYNDICATE WAVE ${waveIndex}/3 ATTACKING! DEFEND LANCE!`);

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI;
            const ex = -15 + Math.cos(angle) * 22;
            const ez = -30 + Math.sin(angle) * 22;
            const e = this.game.enemyManager.spawnEnemy({
                name: `Syndicate Hitman`,
                persona: "black_suit",
                weapon: waveIndex === 3 ? "smg" : "pistol",
                health: 90,
                damage: 12,
                speed: 5.5,
                bountyCash: 250,
                bountyXP: 120,
                x: ex,
                z: ez,
                waypoints: [{ x: -15, z: -30 }]
            });
            this.missionEnemies.push(e);
        }
    }

    spawnDiazBoss() {
        if (!this.game.enemyManager) return;
        HUD.showActionHint("⚠️ DON RICARDO DIAZ HAS ENTERED THE SHOWDOWN!");
        if (this.game.audio) this.game.audio.playVictoryCue();

        const boss = this.game.enemyManager.spawnEnemy({
            name: "DON RICARDO DIAZ",
            persona: "black_suit",
            weapon: "rifle",
            health: 500,
            damage: 22,
            speed: 6.2,
            attackRange: 28,
            detectRadius: 40,
            bountyCash: 10000,
            bountyXP: 2500,
            isBoss: true,
            x: 140,
            z: -85,
            waypoints: [{ x: 140, z: -85 }, { x: 155, z: -70 }, { x: 125, z: -90 }]
        });

        this.bossEntity = boss;
        if (HUD.showBossHealth) HUD.showBossHealth("DON RICARDO DIAZ", 500, 500);
    }

    clearMissionEntities() {
        if (this.briefcaseMesh && this.briefcaseMesh.parent) {
            this.briefcaseMesh.parent.remove(this.briefcaseMesh);
            this.briefcaseMesh = null;
        }
        if (this.lanceEntity && this.lanceEntity.root.parent) {
            this.lanceEntity.root.parent.remove(this.lanceEntity.root);
            this.lanceEntity = null;
        }
        if (HUD.hideBossHealth) HUD.hideBossHealth();
        this.missionEnemies = [];
        this.bossEntity = null;
        this.isTimerActive = false;
    }

    onEnemyKilled(enemy) {
        const cur = this.getCurrentMission();
        if (!cur || cur.completed) return;

        if (cur.id === "mob_hit") {
            cur.progress++;
            HUD.showActionHint(`🎯 Mobster Eliminated! (${cur.progress}/${cur.targetCount})`);
            if (cur.progress >= cur.targetCount) {
                this.completeMission(cur);
            }
            this.updateHUD();
        } else if (cur.id === "protect_contact") {
            const alive = this.missionEnemies.filter(e => e.state !== "dead").length;
            if (alive <= 0) {
                cur.currentWave++;
                if (cur.currentWave < cur.totalWaves) {
                    setTimeout(() => {
                        this.spawnLanceWave(cur.currentWave + 1);
                    }, 2500);
                } else {
                    HUD.showActionHint("🏆 ALL SYNDICATE WAVES CLEARED! LANCE VANCE IS SAFE!");
                    this.completeMission(cur);
                }
            }
            this.updateHUD();
        } else if (cur.id === "showdown") {
            if (cur.step === 1) {
                const stepObj = cur.steps[1];
                stepObj.progress = (stepObj.progress || 0) + 1;
                HUD.showActionHint(`🎯 Guard Neutralized (${stepObj.progress}/${stepObj.targetCount})`);
                if (stepObj.progress >= stepObj.targetCount) {
                    cur.step = 2;
                    this.spawnDiazBoss();
                }
                this.updateHUD();
            } else if (cur.step === 2 && enemy.isBoss) {
                if (HUD.hideBossHealth) HUD.hideBossHealth();
                this.completeMission(cur);
            }
        }
    }

    update(dt, time) {
        const p = this.game.player;
        if (!p) return;

        const cur = this.getCurrentMission();
        if (!cur || cur.completed) {
            this.markerGroup.visible = false;
            return;
        }

        // 1. Update 3D Waypoint Visuals
        const wp = this.getCurrentWaypoint();
        if (wp) {
            this.markerGroup.visible = true;
            const groundY = this.game.world ? this.game.world.checkRampHeight(wp.x, wp.z) : 0.4;
            this.markerGroup.position.set(wp.x, groundY + 0.1, wp.z);

            const pulse = 1.0 + Math.sin(time * 4) * 0.15;
            this.markerRing.scale.set(pulse, pulse, pulse);
            this.markerDiamond.rotation.y = time * 2.5;
            this.markerDiamond.position.y = 3.2 + Math.sin(time * 3) * 0.4;

            // Proximity trigger to advance waypoint
            const dist = Math.hypot(p.position.x - wp.x, p.position.z - wp.z);
            if (dist < 4.8) {
                this.advanceMissionStep();
            }
        } else {
            this.markerGroup.visible = false;
        }

        // 2. Package Delivery Countdown Timer
        if (cur.id === "package_delivery" && this.isTimerActive) {
            this.deliveryTimer -= dt;
            const sec = Math.max(0, Math.ceil(this.deliveryTimer));
            HUD.showActionHint(`⏱️ PACKAGE DELIVERY TIMER: ${sec}s REMAINING!`);

            if (this.deliveryTimer <= 0) {
                this.isTimerActive = false;
                HUD.showActionHint("💥 TIME EXPIRED! CONTRABAND WAS INTERCEPTED! MISSION FAILED!");
                if (this.game.audio) this.game.audio.playFailureCue();
                setTimeout(() => {
                    this.startCurrentMission();
                }, 3500);
            }
        }

        // 3. Stolen Wheels Car Theft Check
        if (cur.id === "stolen_wheels") {
            if (cur.step === 0) {
                if (p.currentVehicle && p.currentVehicle.id === "mission_cheetah") {
                    cur.step = 1;
                    p.setWantedLevel(3);
                    HUD.showActionHint("🚨 3-STAR WANTED CHASE! EVADE POLICE & REACH PAY 'N' SPRAY!");
                    if (this.game.audio) this.game.audio.playVictoryCue();
                    this.updateHUD();
                }
            } else if (cur.step === 1) {
                // Check if player reached Pay 'n' Spray with the Cheetah
                const pnsDist = Math.hypot(p.position.x - (-55), p.position.z - 25);
                if (pnsDist < 10.0 && p.wantedLevel === 0) {
                    this.completeMission(cur);
                }
            }
        }

        // 4. Protect Lance Vance AI & Damage Check
        if (cur.id === "protect_contact" && this.lanceEntity) {
            // Animate Lance
            CharacterModel.updateAnimation(this.lanceEntity.char, "idle", 1.0, time);

            // Enemies shoot at Lance if nearby
            for (let e of this.missionEnemies) {
                if (e.state === "dead") continue;
                const distToLance = Math.hypot(e.x - this.lanceEntity.x, e.z - this.lanceEntity.z);
                if (distToLance < 18.0 && Math.random() < 0.03) {
                    this.lanceEntity.health -= 6;
                    this.updateLanceTag();
                    if (this.lanceEntity.health <= 0) {
                        HUD.showActionHint("💥 LANCE VANCE WAS ELIMINATED! MISSION FAILED!");
                        if (this.game.audio) this.game.audio.playFailureCue();
                        CharacterModel.updateAnimation(this.lanceEntity.char, "dead", 0, 0);
                        setTimeout(() => {
                            this.startCurrentMission();
                        }, 4000);
                        return;
                    }
                }
            }
        }

        // 5. Boss Showdown Health Update
        if (cur.id === "showdown" && this.bossEntity) {
            if (HUD.updateBossHealth) {
                HUD.updateBossHealth(this.bossEntity.health, this.bossEntity.maxHealth);
            }
        }

        // Briefcase Bobbing animation
        if (this.briefcaseMesh) {
            this.briefcaseMesh.rotation.y = time * 2.0;
            this.briefcaseMesh.position.y = 0.7 + Math.sin(time * 3.5) * 0.1;
        }
    }

    advanceMissionStep() {
        const cur = this.getCurrentMission();
        if (!cur || cur.completed) return;

        if (cur.id === "package_delivery") {
            if (cur.step === 0) {
                cur.step = 1;
                if (this.briefcaseMesh) {
                    this.game.renderer.scene.remove(this.briefcaseMesh);
                    this.briefcaseMesh = null;
                }
                this.isTimerActive = true;
                this.deliveryTimer = 90.0;
                HUD.showActionHint("💼 BRIEFCASE SECURED! DELIVER TO NORTH WAREHOUSE IN 90s!");
                if (this.game.audio) this.game.audio.playCashSound();
                this.updateHUD();
            } else if (cur.step === 1 && this.isTimerActive) {
                this.isTimerActive = false;
                this.completeMission(cur);
            }
        } else if (cur.id === "protect_contact") {
            if (cur.step === 0) {
                cur.step = 1;
                this.spawnLanceVance(-15, -30);
                this.spawnLanceWave(1);
                this.updateHUD();
            }
        } else if (cur.id === "showdown") {
            if (cur.step === 0) {
                cur.step = 1;
                // Spawn 4 elite guards
                if (this.game.enemyManager) {
                    for (let i = 0; i < 4; i++) {
                        const angle = (i / 4) * Math.PI * 2;
                        const ex = 140 + Math.cos(angle) * 14;
                        const ez = -80 + Math.sin(angle) * 14;
                        const e = this.game.enemyManager.spawnEnemy({
                            name: `Mansion Elite Guard`,
                            persona: "black_suit",
                            weapon: "rifle",
                            health: 110,
                            damage: 15,
                            speed: 5.6,
                            bountyCash: 400,
                            bountyXP: 200,
                            x: ex,
                            z: ez,
                            waypoints: [{ x: ex, z: ez }]
                        });
                        this.missionEnemies.push(e);
                    }
                }
                HUD.showActionHint("⚠️ MANSION LOCKDOWN! ELIMINATE 4 ELITE GUARDS!");
                this.updateHUD();
            }
        }
    }

    completeMission(m) {
        if (m.rewardClaimed) return;
        m.rewardClaimed = true;
        m.completed = true;

        const p = this.game.player;
        p.cash += m.reward;
        HUD.updateCash(p.cash);
        if (p.addXP) p.addXP(m.rewardXP || 500);

        if (this.game.audio) {
            this.game.audio.playVictoryCue();
        }

        HUD.showActionHint(`🏆 MISSION COMPLETE: ${m.title}! +$${m.reward.toLocaleString()} CASH & +${m.rewardXP} XP!`);
        this.clearMissionEntities();

        // Auto Save Game Progress
        if (window.SaveManager) {
            SaveManager.saveGame(p, this);
        }

        // Advance to next mission after 5 seconds
        setTimeout(() => {
            if (this.currentMissionIndex < this.missions.length - 1) {
                this.currentMissionIndex++;
                this.startCurrentMission();
                const nextM = this.getCurrentMission();
                HUD.showActionHint(`🌴 NEW MISSION UNLOCKED: ${nextM.title}!`);
            } else {
                HUD.showActionHint("👑 CONGRATULATIONS! ALL 5 CAMPAIGN MISSIONS COMPLETE! YOU ARE THE KING OF VICE CITY!");
                if (this.game.renderer) this.game.renderer.setAtmosphere("sunset");
            }
        }, 5000);
    }

    updateHUD() {
        const cur = this.getCurrentMission();
        if (!cur) return;

        const titleEl = document.getElementById('m-title');
        const descEl = document.getElementById('m-desc');
        const fillEl = document.getElementById('m-fill');
        const statusEl = document.getElementById('m-status');

        if (titleEl) titleEl.textContent = cur.title;

        let displayDesc = cur.desc;
        let pct = 0;
        let statusText = "";

        if (cur.type === "mob_hit") {
            pct = Math.min(100, Math.round((cur.progress / cur.targetCount) * 100));
            statusText = `${cur.progress} / ${cur.targetCount} Mobsters Eliminated • Reward: $${cur.reward.toLocaleString()} + ${cur.rewardXP} XP`;
        } else if (cur.id === "package_delivery") {
            displayDesc = cur.steps[cur.step]?.desc || cur.desc;
            pct = cur.step === 0 ? 30 : 75;
            statusText = cur.step === 0 ? "Briefcase at Marina • Reward: $4,000" : `Deliver Briefcase (${Math.ceil(this.deliveryTimer)}s left) • Reward: $4,000`;
        } else if (cur.id === "protect_contact") {
            pct = Math.round((cur.currentWave / cur.totalWaves) * 100);
            statusText = `Wave ${cur.currentWave} / ${cur.totalWaves} Cleared • Reward: $6,000 + 1,200 XP`;
        } else if (cur.id === "stolen_wheels") {
            pct = cur.step === 0 ? 35 : 80;
            statusText = cur.step === 0 ? "Steal Cheetah at Starfish • Reward: $8,000" : "Evade Police & Reach Pay 'n' Spray • Reward: $8,000";
        } else if (cur.id === "showdown") {
            displayDesc = cur.steps[cur.step]?.desc || cur.desc;
            pct = Math.round((cur.step / 3) * 100);
            statusText = `Stage ${cur.step + 1} / 3 • Reward: $20,000 + 3,000 XP`;
        }

        if (cur.completed) {
            pct = 100;
            statusText = `🏆 COMPLETED • +$${cur.reward.toLocaleString()} & +${cur.rewardXP} XP Awarded!`;
        }

        if (descEl) descEl.textContent = displayDesc;
        if (fillEl) fillEl.style.width = `${pct}%`;
        if (statusEl) statusEl.textContent = statusText;
    }

    checkHit(ray, hitData) {
        return { hit: false };
    }
}

window.MissionSystem = MissionSystem;
