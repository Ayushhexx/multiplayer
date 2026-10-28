class Enemy {
    constructor(id, config, scene, world, audioSystem) {
        this.id = id;
        this.name = config.name || "Hostile";
        this.persona = config.persona || "mobster_pink";
        this.weaponKey = config.weapon || "pistol";
        this.maxHealth = config.health || 80;
        this.health = this.maxHealth;
        this.damage = config.damage || 12;
        this.speed = config.speed || 5.2;
        this.attackRange = config.attackRange || 24;
        this.detectRadius = config.detectRadius || 36;
        this.bountyCash = config.bountyCash || 200;
        this.bountyXP = config.bountyXP || 100;
        this.isBoss = config.isBoss || false;

        this.scene = scene;
        this.world = world;
        this.audio = audioSystem;

        // Position & Waypoints
        this.x = config.x || 0;
        this.y = config.y || 1.0;
        this.z = config.z || 0;
        this.rotY = config.rotY || 0;
        this.waypoints = config.waypoints || [{ x: this.x, z: this.z }];
        this.currentWpIndex = 0;
        this.wpWaitTimer = 0;

        // State Machine: "patrol" -> "detect" -> "chase" -> "attack" -> "cover" -> "dead"
        this.state = "patrol";
        this.shootTimer = 1.0 + Math.random() * 1.5;
        this.loseTargetTimer = 0;
        this.coverTimer = 0;
        this.strafeDir = Math.random() > 0.5 ? 1 : -1;
        this.despawnTimer = 0;

        // Build 3D Model
        this.char = CharacterModel.create(this.persona);
        this.root = this.char.root;
        this.root.position.set(this.x, this.y, this.z);
        this.scene.add(this.root);

        // Attach Weapon Model
        this.attachWeapon(this.weaponKey);

        // Overhead Health Bar Billboard
        this.tagSprite = this.createTagSprite();
        this.root.add(this.tagSprite);
    }

    attachWeapon(key) {
        const gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.3 });
        if (key === "rifle") {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.45), gunMat);
            body.position.set(0, 0, 0.15);
            this.char.weaponSlot.add(body);
        } else if (key === "shotgun") {
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65), gunMat);
            body.rotation.x = Math.PI / 2;
            body.position.set(0, 0, 0.25);
            this.char.weaponSlot.add(body);
        } else if (key === "smg" || key === "uzi") {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.26), gunMat);
            body.position.set(0, 0, 0.1);
            this.char.weaponSlot.add(body);
        } else {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.2), gunMat);
            body.position.set(0, 0, 0.08);
            this.char.weaponSlot.add(body);
        }
    }

    createTagSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(15, 10, 20, 0.85)';
        ctx.roundRect(8, 6, 240, 52, 6);
        ctx.fill();

        ctx.font = 'bold 18px Montserrat, sans-serif';
        ctx.fillStyle = this.isBoss ? '#ff0055' : '#ffb703';
        ctx.textAlign = 'center';
        ctx.fillText(this.name.toUpperCase(), 128, 28);

        ctx.fillStyle = '#222222';
        ctx.fillRect(20, 36, 216, 10);

        ctx.fillStyle = '#06d6a0';
        ctx.fillRect(20, 36, 216, 10);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(this.isBoss ? 4.0 : 2.6, this.isBoss ? 1.0 : 0.65, 1);
        sprite.position.set(0, this.isBoss ? 2.6 : 2.2, 0);
        sprite.canvas = canvas;
        sprite.ctx = ctx;
        return sprite;
    }

    updateTagSprite() {
        if (!this.tagSprite || !this.tagSprite.ctx) return;
        const ctx = this.tagSprite.ctx;
        ctx.clearRect(0, 0, 256, 64);

        ctx.fillStyle = 'rgba(15, 10, 20, 0.85)';
        ctx.roundRect(8, 6, 240, 52, 6);
        ctx.fill();

        ctx.font = 'bold 18px Montserrat, sans-serif';
        ctx.fillStyle = this.health <= 0 ? '#888888' : (this.isBoss ? '#ff0055' : '#ffb703');
        ctx.textAlign = 'center';
        const label = this.health <= 0 ? `${this.name} (DEAD)` : this.name;
        ctx.fillText(label.toUpperCase(), 128, 28);

        ctx.fillStyle = '#222222';
        ctx.fillRect(20, 36, 216, 10);

        const ratio = Math.max(0, Math.min(1, this.health / this.maxHealth));
        ctx.fillStyle = ratio > 0.5 ? '#06d6a0' : (ratio > 0.25 ? '#ffd166' : '#ff0055');
        ctx.fillRect(20, 36, 216 * ratio, 10);

        this.tagSprite.material.map.needsUpdate = true;
    }

    takeDamage(amount) {
        if (this.state === "dead") return false;
        this.health = Math.max(0, this.health - amount);
        this.updateTagSprite();

        // Alert enemy if attacked from outside sight
        if (this.state === "patrol" || this.state === "detect") {
            this.state = "chase";
        }

        // Low health cover reaction
        if (this.health < this.maxHealth * 0.4 && this.state !== "dead" && Math.random() < 0.6) {
            this.state = "cover";
            this.coverTimer = 3.5 + Math.random() * 2.5;
        }

        if (this.health <= 0) {
            this.die();
            return true; // was killed
        }
        return false;
    }

    die() {
        this.state = "dead";
        this.updateTagSprite();
        CharacterModel.updateAnimation(this.char, "dead", 0, 0);

        // Reward player with cash and XP
        if (window.gameInstance && window.gameInstance.player) {
            const p = window.gameInstance.player;
            p.cash += this.bountyCash;
            HUD.updateCash(p.cash);
            if (p.addXP) p.addXP(this.bountyXP);
            HUD.showActionHint(`🏆 ${this.name} Defeated! +$${this.bountyCash} | +${this.bountyXP} XP`);
        }

        // Drop Pickup at corpse position
        if (window.gameInstance && window.gameInstance.pickups) {
            const pickupType = Math.random() < 0.4 ? "money" : (Math.random() < 0.7 ? "ammo" : "health");
            window.gameInstance.pickups.spawnPickup(pickupType, this.x, this.z);
        }
    }

    update(dt, time, player) {
        if (this.state === "dead") {
            this.despawnTimer += dt;
            return;
        }

        const playerPos = player ? player.position : null;
        const distToPlayer = playerPos ? Math.hypot(playerPos.x - this.x, playerPos.z - this.z) : 999;

        // Ground snapping
        const groundY = this.world ? this.world.checkRampHeight(this.x, this.z) : 0.4;
        this.y = groundY + 0.95;

        // State Machine Execution
        switch (this.state) {
            case "patrol": {
                // Check player detection
                if (distToPlayer < this.detectRadius && !player.isDead) {
                    this.state = "chase";
                    this.loseTargetTimer = 0;
                    break;
                }

                // Follow patrol waypoints
                if (this.waypoints.length > 0) {
                    const wp = this.waypoints[this.currentWpIndex];
                    const distToWp = Math.hypot(wp.x - this.x, wp.z - this.z);

                    if (distToWp < 1.5) {
                        this.wpWaitTimer += dt;
                        CharacterModel.updateAnimation(this.char, "idle", 0.5, time);
                        if (this.wpWaitTimer > 3.0) {
                            this.wpWaitTimer = 0;
                            this.currentWpIndex = (this.currentWpIndex + 1) % this.waypoints.length;
                        }
                    } else {
                        const targetAngle = Math.atan2(wp.x - this.x, wp.z - this.z);
                        const angleDiff = Math.atan2(Math.sin(targetAngle - this.rotY), Math.cos(targetAngle - this.rotY));
                        this.rotY += angleDiff * dt * 4.0;

                        const step = this.speed * 0.4 * dt;
                        this.x += Math.sin(this.rotY) * step;
                        this.z += Math.cos(this.rotY) * step;
                        CharacterModel.updateAnimation(this.char, "walk", 0.8, time);
                    }
                } else {
                    CharacterModel.updateAnimation(this.char, "idle", 0.5, time);
                }
                break;
            }

            case "chase": {
                if (distToPlayer > this.detectRadius * 1.5 || player.isDead) {
                    this.loseTargetTimer += dt;
                    if (this.loseTargetTimer > 8.0) {
                        this.state = "patrol";
                        break;
                    }
                } else {
                    this.loseTargetTimer = 0;
                }

                // If in attack range, switch to attack
                if (distToPlayer <= this.attackRange) {
                    this.state = "attack";
                    break;
                }

                // Sprint toward player
                const targetAngle = Math.atan2(playerPos.x - this.x, playerPos.z - this.z);
                const angleDiff = Math.atan2(Math.sin(targetAngle - this.rotY), Math.cos(targetAngle - this.rotY));
                this.rotY += angleDiff * dt * 6.0;

                const step = this.speed * dt;
                const nextX = this.x + Math.sin(this.rotY) * step;
                const nextZ = this.z + Math.cos(this.rotY) * step;

                if (!this.world || !this.world.checkCollision(nextX, nextZ, 0.45)) {
                    this.x = nextX;
                    this.z = nextZ;
                }
                CharacterModel.updateAnimation(this.char, "sprint", 1.3, time);
                break;
            }

            case "attack": {
                if (distToPlayer > this.attackRange * 1.25) {
                    this.state = "chase";
                    break;
                }

                // Face Tommy
                const targetAngle = Math.atan2(playerPos.x - this.x, playerPos.z - this.z);
                const angleDiff = Math.atan2(Math.sin(targetAngle - this.rotY), Math.cos(targetAngle - this.rotY));
                this.rotY += angleDiff * dt * 7.0;

                // Tactical strafe while aiming
                const strafeAngle = this.rotY + (Math.PI / 2) * this.strafeDir;
                const strafeStep = (this.speed * 0.35) * dt;
                const nextX = this.x + Math.sin(strafeAngle) * strafeStep;
                const nextZ = this.z + Math.cos(strafeAngle) * strafeStep;

                if (!this.world || !this.world.checkCollision(nextX, nextZ, 0.45)) {
                    this.x = nextX;
                    this.z = nextZ;
                } else {
                    this.strafeDir *= -1;
                }

                CharacterModel.updateAnimation(this.char, "walk", 0.8, time, true, 0);

                // Fire weapon
                this.shootTimer -= dt;
                if (this.shootTimer <= 0) {
                    this.shootTimer = this.isBoss ? 0.75 : (1.4 + Math.random() * 1.1);
                    this.fireAtPlayer(player, distToPlayer);
                }
                break;
            }

            case "cover": {
                this.coverTimer -= dt;
                if (this.coverTimer <= 0 || distToPlayer < 5.0) {
                    this.state = "attack";
                    break;
                }

                // Move defensively away / strafe into cover position
                const targetAngle = Math.atan2(this.x - playerPos.x, this.z - playerPos.z);
                this.rotY = targetAngle;
                CharacterModel.updateAnimation(this.char, "crouch_walk", 0.7, time, true);

                // Occasionally shoot back from cover
                this.shootTimer -= dt;
                if (this.shootTimer <= 0) {
                    this.shootTimer = 2.0 + Math.random();
                    this.fireAtPlayer(player, distToPlayer);
                }
                break;
            }
        }

        // Apply position
        this.root.position.set(this.x, this.y, this.z);
        this.root.rotation.y = this.rotY;
    }

    fireAtPlayer(player, dist) {
        if (!player || player.isDead) return;

        // Play SFX
        if (this.audio) {
            if (this.weaponKey === "rifle" && this.audio.playAssaultRifle) {
                this.audio.playAssaultRifle();
            } else if (this.weaponKey === "shotgun") {
                this.audio.playShotgun();
            } else if (this.weaponKey === "smg" || this.weaponKey === "uzi") {
                this.audio.playUzi();
            } else {
                this.audio.playCopGunshot();
            }
        }

        // Visual muzzle flash
        if (window.gameInstance && window.gameInstance.weaponSystem) {
            const muzzlePos = new THREE.Vector3(
                this.x + Math.sin(this.rotY) * 0.7,
                this.y + 0.35,
                this.z + Math.cos(this.rotY) * 0.7
            );
            window.gameInstance.weaponSystem.spawnMuzzleFlash(muzzlePos);
        }

        // Accuracy falloff with distance
        const hitChance = Math.max(0.2, 0.75 - dist * 0.025);
        if (Math.random() < hitChance) {
            const dmg = this.damage + Math.floor(Math.random() * 5);
            player.takeDamage(dmg, this.weaponKey);
            if (player.renderer) {
                player.renderer.addScreenShake(0.3, 0.15);
            }
        }
    }

    destroy() {
        if (this.root && this.root.parent) {
            this.root.parent.remove(this.root);
        }
    }
}

class EnemyManager {
    constructor(scene, world, audioSystem) {
        this.scene = scene;
        this.world = world;
        this.audio = audioSystem;
        this.enemies = [];
        this.nextId = 1;
    }

    spawnEnemy(config) {
        const id = `enemy_${this.nextId++}`;
        const enemy = new Enemy(id, config, this.scene, this.world, this.audio);
        this.enemies.push(enemy);
        return enemy;
    }

    clearEnemies() {
        this.enemies.forEach(e => e.destroy());
        this.enemies = [];
    }

    update(dt, time, player) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, time, player);

            // Clean up dead bodies after 8 seconds
            if (e.state === "dead" && e.despawnTimer > 8.0) {
                e.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }

    checkHit(camRay, hitData) {
        let hitEnemy = null;
        let closestDist = Infinity;
        let hitPoint = null;

        for (let e of this.enemies) {
            if (e.state === "dead") continue;
            const enemyCenter = new THREE.Vector3(e.x, e.y + 0.45, e.z);
            const enemySphere = new THREE.Sphere(enemyCenter, e.isBoss ? 1.4 : 0.95);
            const intersect = new THREE.Vector3();

            if (camRay.intersectSphere(enemySphere, intersect)) {
                const dist = camRay.origin.distanceTo(intersect);
                if (dist < (hitData.range || 90) && dist < closestDist) {
                    closestDist = dist;
                    hitEnemy = e;
                    hitPoint = intersect;
                }
            }
        }

        if (hitEnemy) {
            const killed = hitEnemy.takeDamage(hitData.damage);
            return { hit: true, killed, enemy: hitEnemy, hitPoint };
        }

        return { hit: false };
    }

    getAliveCount() {
        return this.enemies.filter(e => e.state !== "dead").length;
    }
}

window.Enemy = Enemy;
window.EnemyManager = EnemyManager;
