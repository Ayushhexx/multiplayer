class PoliceManager {
    constructor(scene, world, audioSystem) {
        this.scene = scene;
        this.world = world;
        this.audio = audioSystem;

        this.wantedLevel = 0;
        this.wantedDecayTimer = 0;
        this.maxOfficers = 6;
        this.maxPursuitCars = 4;
        this.activeOfficers = [];
        this.spawnTimer = 0;
        this.dispatchTimer = 0;
        this.fiveStarAlerted = false;

        // Weapon mesh for officers
        this.gunGeo = new THREE.BoxGeometry(0.08, 0.12, 0.35);
        this.gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, metalness: 0.85, roughness: 0.3 });
    }

    setWantedLevel(level, player) {
        const prevLevel = this.wantedLevel;
        this.wantedLevel = Math.max(0, Math.min(5, level));
        if (player) player.wantedLevel = this.wantedLevel;
        HUD.updateWantedStars(this.wantedLevel);

        if (this.wantedLevel === 5 && prevLevel < 5) {
            // Trigger Dramatic Five-Star Alert!
            this.fiveStarAlerted = true;
            HUD.showActionHint("🚨 ★★★★★ MAXIMUM POLICE RESPONSE ACTIVATED! SWAT & TACTICAL FORCES DEPLOYED!");
            if (this.audio) {
                this.audio.playPoliceRadioDispatch();
                this.audio.setMood("pursuit");
            }
            if (window.gameInstance && window.gameInstance.renderer) {
                window.gameInstance.renderer.addScreenShake(0.5, 0.4);
            }
        } else if (this.wantedLevel >= 1 && prevLevel === 0) {
            if (this.audio) {
                this.audio.playPoliceRadioDispatch();
                this.audio.setMood("pursuit");
            }
        } else if (this.wantedLevel === 0 && prevLevel > 0) {
            this.clearWantedResponse();
        }

        this.wantedDecayTimer = 0;
    }

    clearWantedResponse(player = null) {
        console.log("[PoliceManager] Wanted level cleared. De-escalating police pursuit.");
        this.wantedLevel = 0;
        this.fiveStarAlerted = false;
        this.wantedDecayTimer = 0;
        HUD.updateWantedStars(0);

        if (player) {
            player.wantedLevel = 0;
        } else if (window.gameInstance && window.gameInstance.player) {
            window.gameInstance.player.wantedLevel = 0;
        }

        // Turn off sirens on all police squad cars
        if (window.gameInstance && window.gameInstance.vehicles) {
            for (let vid in window.gameInstance.vehicles) {
                const v = window.gameInstance.vehicles[vid];
                if (v && v.isPolice && v.sirenActive) {
                    v.toggleSiren();
                }
            }
        }

        // Clean up spawned officers
        this.activeOfficers.forEach(o => {
            if (o.root && o.root.parent) o.root.parent.remove(o.root);
        });
        this.activeOfficers = [];

        if (this.audio) {
            this.audio.setMood("exploration");
        }
    }

    disappearAllPolice(cheatName = "POLICE") {
        console.log(`[PoliceManager] Cheat '${cheatName}' activated! Removing all police.`);
        this.wantedLevel = 0;
        this.fiveStarAlerted = false;
        this.wantedDecayTimer = 0;
        HUD.updateWantedStars(0);

        if (window.gameInstance && window.gameInstance.player) {
            window.gameInstance.player.wantedLevel = 0;
        }

        // Clean up all active on-foot officers
        this.activeOfficers.forEach(o => {
            if (o.root && o.root.parent) o.root.parent.remove(o.root);
        });
        this.activeOfficers = [];

        // Remove / disappear all police vehicles in the city
        if (window.gameInstance && window.gameInstance.vehicles) {
            for (let vid in window.gameInstance.vehicles) {
                const v = window.gameInstance.vehicles[vid];
                if (v && v.isPolice) {
                    if (window.gameInstance.player && window.gameInstance.player.currentVehicle === v) {
                        if (v.sirenActive) v.toggleSiren();
                    } else {
                        if (v.mesh && v.mesh.parent) v.mesh.parent.remove(v.mesh);
                        delete window.gameInstance.vehicles[vid];
                    }
                }
            }
        }

        if (this.audio) {
            if (this.audio.playVictoryCue) this.audio.playVictoryCue();
            this.audio.setMood("exploration");
        }

        HUD.showActionHint(`⭐ CHEAT ACTIVATED: ${cheatName.toUpperCase()} (Police Chasing Stopped & Disappeared!)`);
    }

    spawnOfficer(x, z) {
        if (this.activeOfficers.length >= this.maxOfficers) return null;

        const char = CharacterModel.create("cop");
        const groundY = this.world ? this.world.checkRampHeight(x, z) : 0.4;
        char.root.position.set(x, groundY + 0.95, z);
        this.scene.add(char.root);

        // Attach officer service pistol to weaponSlot
        const gun = new THREE.Mesh(this.gunGeo, this.gunMat);
        gun.position.set(0, 0, 0.1);
        char.weaponSlot.add(gun);

        const officer = {
            char,
            root: char.root,
            gun,
            x,
            y: groundY + 0.95,
            z,
            rotY: 0,
            health: 65,
            maxHealth: 65,
            state: "pursue", // pursue, aim, shoot, dead
            speed: 6.2,
            shootTimer: 1.2 + Math.random() * 1.5,
            strafeDir: Math.random() > 0.5 ? 1 : -1,
            despawnTimer: 0
        };

        this.activeOfficers.push(officer);
        return officer;
    }

    update(dt, time, player, vehicles) {
        if (!player) return;

        // Keep local wanted level in sync
        if (player.wantedLevel !== this.wantedLevel) {
            this.wantedLevel = player.wantedLevel;
        }

        if (this.wantedLevel === 0) {
            // Clean up any remaining officers if wanted is 0
            if (this.activeOfficers.length > 0) {
                this.activeOfficers.forEach(o => {
                    if (o.root && o.root.parent) o.root.parent.remove(o.root);
                });
                this.activeOfficers = [];
            }
            // Ensure sirens on squad cars are off and cars come to a halt
            for (let vid in vehicles) {
                const v = vehicles[vid];
                if (v && v.isPolice) {
                    if (v.sirenActive) v.toggleSiren();
                    if (!v.driverId) v.speed = Math.max(0, v.speed - 20 * dt);
                }
            }
            return;
        }

        const playerPos = player.position;
        let closestCopDist = 999;

        // Check if player is currently in the ocean water (swimming or driving a boat)
        const isPlayerInWater = (player.currentVehicle && player.currentVehicle.type === "boat") || 
                                (this.world && this.world.isWater(playerPos.x, playerPos.z)) ||
                                (player.currentVehicle && player.currentVehicle.isDrowned);

        if (isPlayerInWater) {
            // Police cars CANNOT follow player into the water!
            for (let vid in vehicles) {
                const v = vehicles[vid];
                if (v && v.isPolice) {
                    if (v.sirenActive) v.toggleSiren();
                    if (!v.driverId) v.speed = Math.max(0, v.speed - 24 * dt);
                }
            }

            // Rapidly lose police heat when in water
            this.waterEvadeTimer = (this.waterEvadeTimer || 0) + dt;
            if (this.waterEvadeTimer > 2.5) {
                this.waterEvadeTimer = 0;
                this.clearWantedResponse(player);
                HUD.showActionHint("🌊 IN WATER: Ground police lost visual! Pursuit called off!");
                return;
            } else {
                HUD.showActionHint("🌊 IN WATER: Police squad cars cannot follow boats or enter ocean!");
            }
            return;
        } else {
            this.waterEvadeTimer = 0;
        }

        // 1. Coordinate Police Pursuit Vehicles
        let pursuitCarsCount = 0;
        const maxCars = Math.min(this.wantedLevel, this.maxPursuitCars);

        for (let vid in vehicles) {
            const v = vehicles[vid];
            if (!v || !v.isPolice) continue;

            // If police vehicle is blasted / destroyed: do NOT move, pursue, or siren again!
            if (v.isDestroyed) {
                if (v.sirenActive) v.toggleSiren();
                v.speed = 0;
                continue;
            }
            if (v.driverId) continue;

            const distToPlayer = Math.hypot(playerPos.x - v.x, playerPos.z - v.z);
            if (distToPlayer < closestCopDist) closestCopDist = distToPlayer;

            if (pursuitCarsCount < maxCars) {
                pursuitCarsCount++;

                // Ensure siren is blaring
                if (!v.sirenActive) v.toggleSiren();

                // Vehicle Pursuit AI
                if (distToPlayer > 3.5 && distToPlayer < 120) {
                    let targetX = playerPos.x;
                    let targetZ = playerPos.z;

                    // Roadblock / Interception behavior at Star 3+
                    if (this.wantedLevel >= 3 && pursuitCarsCount === 1) {
                        // Position slightly ahead of player heading
                        const pRot = player.currentVehicle ? player.currentVehicle.rot : player.rotY;
                        targetX += Math.sin(pRot) * 18;
                        targetZ += Math.cos(pRot) * 18;
                    }

                    // Police cars never target coordinates in the water zone
                    targetX = Math.min(140, targetX);

                    const targetAngle = Math.atan2(targetX - v.x, targetZ - v.z);
                    const angleDiff = Math.atan2(Math.sin(targetAngle - v.rot), Math.cos(targetAngle - v.rot));
                    v.rot += angleDiff * dt * (this.wantedLevel >= 4 ? 3.2 : 2.4);

                    const targetSpeed = 24 + this.wantedLevel * 4;
                    v.speed = Math.min(targetSpeed, v.speed + 18 * dt);

                    const nextX = v.x + Math.sin(v.rot) * v.speed * dt;
                    const nextZ = v.z + Math.cos(v.rot) * v.speed * dt;
                    const nextRamp = this.world ? this.world.checkRampHeight(nextX, nextZ) : 0;
                    const nextOnBridge = nextRamp >= 1.2;

                    // STRICT WATER BARRIER: Police cars cannot enter ocean water under any circumstance!
                    if (nextX > 140 && !nextOnBridge) {
                        v.speed = 0;
                    } else {
                        v.x = nextX;
                        v.z = nextZ;
                    }

                    v.mesh.position.set(v.x, v.y, v.z);
                    v.mesh.rotation.y = v.rot;

                    // Ram player vehicle if close and driving
                    if (player.currentVehicle && distToPlayer < 4.5 && this.wantedLevel >= 3) {
                        player.currentVehicle.speed *= 0.85;
                        if (this.audio && Math.random() < 0.2) this.audio.playPunch();
                    }
                }

                // If squad car is close to player and stopped or at 4-5 stars: dismount on-foot officers
                if (distToPlayer < 25 && this.wantedLevel >= 4 && this.activeOfficers.length < this.maxOfficers) {
                    this.spawnTimer += dt;
                    if (this.spawnTimer > 4.0) {
                        this.spawnTimer = 0;
                        const spawnX = v.x + (Math.random() - 0.5) * 4;
                        const spawnZ = v.z + (Math.random() - 0.5) * 4;
                        this.spawnOfficer(spawnX, spawnZ);
                    }
                }
            } else {
                // Non-pursuing police cars turn off sirens
                if (v.sirenActive) v.toggleSiren();
            }
        }

        // 2. Spawn on-foot tactical officers at valid distances at Star 4-5
        if (this.wantedLevel >= 4 && this.activeOfficers.length < Math.min(this.wantedLevel + 1, this.maxOfficers)) {
            this.spawnTimer += dt;
            if (this.spawnTimer > 3.5) {
                this.spawnTimer = 0;
                // Spawn 38 to 52 meters away in player's forward/flank hemisphere
                const spawnAngle = player.rotY + (Math.random() - 0.5) * 1.8;
                const spawnDist = 38 + Math.random() * 14;
                const sx = playerPos.x + Math.sin(spawnAngle) * spawnDist;
                const sz = playerPos.z + Math.cos(spawnAngle) * spawnDist;
                // Only spawn within city bounds
                if (Math.abs(sx) < 180 && Math.abs(sz) < 280) {
                    this.spawnOfficer(sx, sz);
                }
            }
        }

        // 3. Update active on-foot officers
        for (let i = this.activeOfficers.length - 1; i >= 0; i--) {
            const o = this.activeOfficers[i];

            if (o.state === "dead") {
                o.despawnTimer += dt;
                if (o.despawnTimer > 5.0) {
                    if (o.root && o.root.parent) o.root.parent.remove(o.root);
                    this.activeOfficers.splice(i, 1);
                }
                continue;
            }

            const dist = Math.hypot(playerPos.x - o.x, playerPos.z - o.z);
            if (dist < closestCopDist) closestCopDist = dist;

            const groundY = this.world ? this.world.checkRampHeight(o.x, o.z) : 0.4;
            o.y = groundY + 0.95;

            // Face Tommy
            const targetAngle = Math.atan2(playerPos.x - o.x, playerPos.z - o.z);
            const angleDiff = Math.atan2(Math.sin(targetAngle - o.rotY), Math.cos(targetAngle - o.rotY));
            o.rotY += angleDiff * dt * 6.0;

            if (dist > 18) {
                // Sprint towards player
                o.state = "pursue";
                o.x += Math.sin(o.rotY) * o.speed * dt;
                o.z += Math.cos(o.rotY) * o.speed * dt;
                CharacterModel.updateAnimation(o.char, "sprint", 1.4, time, false, 0);
            } else if (dist > 5) {
                // Tactical combat range: advance, strafe & aim
                o.state = "aim";
                const strafeAngle = o.rotY + (Math.PI / 2) * o.strafeDir;
                o.x += (Math.sin(o.rotY) * 0.4 + Math.sin(strafeAngle) * 0.6) * (o.speed * 0.4) * dt;
                o.z += (Math.cos(o.rotY) * 0.4 + Math.cos(strafeAngle) * 0.6) * (o.speed * 0.4) * dt;

                CharacterModel.updateAnimation(o.char, "walk", 0.9, time, true, 0);

                // Fire at player
                o.shootTimer -= dt;
                if (o.shootTimer <= 0) {
                    o.shootTimer = 1.6 + Math.random() * 1.2;
                    if (this.audio) this.audio.playCopGunshot();

                    // Check hit on player (accuracy depends on distance)
                    const hitChance = Math.max(0.25, 0.75 - dist * 0.03);
                    if (Math.random() < hitChance && !player.isDead) {
                        const dmg = 8 + Math.floor(Math.random() * 6);
                        player.takeDamage(dmg, "police_pistol");
                        if (player.renderer) player.renderer.addScreenShake(0.3, 0.15);
                    }
                }
            } else {
                // Point blank range: stand ground and rapid fire
                o.state = "shoot";
                CharacterModel.updateAnimation(o.char, "idle", 0.5, time, true, 0);
                o.shootTimer -= dt;
                if (o.shootTimer <= 0) {
                    o.shootTimer = 1.0 + Math.random() * 0.8;
                    if (this.audio) this.audio.playCopGunshot();
                    if (!player.isDead) {
                        player.takeDamage(12, "police_pistol");
                    }
                }

                // Check for Busted condition (if player is on foot, unarmed, low health, surrounded)
                if (!player.currentVehicle && player.health < 20 && !player.isDead) {
                    this.triggerBusted(player);
                }
            }

            o.root.position.set(o.x, o.y, o.z);
            o.root.rotation.y = o.rotY;
        }

        // 4. Radio Dispatch periodic chatter at 4-5 stars
        if (this.wantedLevel >= 4) {
            this.dispatchTimer += dt;
            if (this.dispatchTimer > 14.0) {
                this.dispatchTimer = 0;
                if (this.audio) this.audio.playPoliceRadioDispatch();
            }
        }

        // 5. Wanted Decay when player evades police
        if (closestCopDist > 80) {
            this.wantedDecayTimer += dt;
            if (this.wantedDecayTimer > 15.0) {
                this.wantedDecayTimer = 0;
                this.setWantedLevel(this.wantedLevel - 1, player);
                HUD.showActionHint(`⚠️ WANTED LEVEL DECAYING... (${this.wantedLevel} Stars Remaining)`);
            }
        } else {
            this.wantedDecayTimer = 0;
        }
    }

    checkHit(camRay, hitData) {
        let hitOfficer = null;
        let closestDist = Infinity;
        let hitPoint = null;

        for (let o of this.activeOfficers) {
            if (o.state === "dead") continue;
            const copCenter = new THREE.Vector3(o.x, o.y + 0.4, o.z);
            const copSphere = new THREE.Sphere(copCenter, 0.95);
            const intersect = new THREE.Vector3();

            if (camRay.intersectSphere(copSphere, intersect)) {
                const dist = camRay.origin.distanceTo(intersect);
                if (dist < (hitData.range || 90) && dist < closestDist) {
                    closestDist = dist;
                    hitOfficer = o;
                    hitPoint = intersect;
                }
            }
        }

        if (hitOfficer) {
            hitOfficer.health -= hitData.damage;
            if (hitOfficer.health <= 0) {
                hitOfficer.state = "dead";
                CharacterModel.updateAnimation(hitOfficer.char, "dead", 0, 0);
                return { hit: true, killed: true, officer: hitOfficer, hitPoint };
            }
            return { hit: true, killed: false, officer: hitOfficer, hitPoint };
        }

        return { hit: false };
    }

    triggerBusted(player) {
        if (player.isDead) return;
        console.log("[PoliceManager] Player BUSTED!");
        player.isDead = true;
        HUD.showActionHint("🚨 BUSTED! YOU WERE APPREHENDED BY VICE CITY POLICE! -$500 BAIL");
        if (this.audio) this.audio.playPoliceRadioDispatch();

        player.cash = Math.max(0, player.cash - 500);
        HUD.updateCash(player.cash);

        setTimeout(() => {
            this.clearWantedResponse();
            player.respawn();
        }, 3500);
    }
}

window.PoliceManager = PoliceManager;
