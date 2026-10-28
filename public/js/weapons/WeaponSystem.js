class WeaponSystem {
    constructor(scene, audioSystem) {
        this.scene = scene;
        this.audio = audioSystem;

        this.weapons = {
            pistol: {
                slot: 1,
                key: "pistol",
                name: "COLT .45",
                icon: "🔫",
                magSize: 12,
                magAmmo: 12,
                reserveAmmo: Infinity,
                maxReserve: Infinity,
                damage: 35,
                fireRate: 0.22,
                reloadTime: 1.4,
                range: 85,
                spread: 0.016,
                recoil: 0.02,
                type: "gun"
            },
            smg: {
                slot: 2,
                key: "smg",
                name: "MAC-10 UZI",
                icon: "⚡",
                magSize: 30,
                magAmmo: 30,
                reserveAmmo: Infinity,
                maxReserve: Infinity,
                damage: 24,
                fireRate: 0.085,
                reloadTime: 1.8,
                range: 70,
                spread: 0.035,
                recoil: 0.014,
                type: "rapid"
            },
            shotgun: {
                slot: 3,
                key: "shotgun",
                name: "SPAS-12 SHOTGUN",
                icon: "💥",
                magSize: 8,
                magAmmo: 8,
                reserveAmmo: Infinity,
                maxReserve: Infinity,
                damage: 20,
                pellets: 8,
                fireRate: 0.75,
                reloadTime: 2.3,
                range: 48,
                spread: 0.075,
                recoil: 0.045,
                type: "shotgun"
            },
            rifle: {
                slot: 4,
                key: "rifle",
                name: "M4 ASSAULT RIFLE",
                icon: "🎯",
                magSize: 30,
                magAmmo: 30,
                reserveAmmo: Infinity,
                maxReserve: Infinity,
                damage: 42,
                fireRate: 0.115,
                reloadTime: 2.1,
                range: 130,
                spread: 0.018,
                recoil: 0.022,
                type: "rifle"
            },
            rpg: {
                slot: 5,
                key: "rpg",
                name: "ROCKET LAUNCHER",
                icon: "🚀",
                magSize: 1,
                magAmmo: 1,
                reserveAmmo: Infinity,
                maxReserve: Infinity,
                damage: 220,
                fireRate: 1.5,
                reloadTime: 2.6,
                range: 160,
                recoil: 0.05,
                type: "projectile"
            },
            fists: {
                slot: 0,
                key: "fists",
                name: "FISTS",
                icon: "👊",
                magSize: Infinity,
                magAmmo: Infinity,
                reserveAmmo: Infinity,
                maxReserve: Infinity,
                damage: 25,
                fireRate: 0.35,
                reloadTime: 0,
                range: 2.2,
                type: "melee"
            }
        };

        // Alias for backwards compatibility with any uzi references
        this.weapons.uzi = this.weapons.smg;

        this.currentWeaponKey = "pistol";
        this.lastFireTime = 0;

        // Reload state
        this.isReloading = false;
        this.reloadTimer = 0;
        this.reloadDuration = 0;

        // Visual FX pools
        this.projectiles = [];
        this.tracers = [];
        this.particles = [];
        this.muzzleFlashes = [];
    }

    getCurrentWeapon() {
        return this.weapons[this.currentWeaponKey];
    }

    setWeapon(key, weaponSlot) {
        if (!this.weapons[key]) return;
        this.currentWeaponKey = key;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.attachWeaponModel(key, weaponSlot);
        if (window.HUD && window.HUD.updateWeapon) {
            window.HUD.updateWeapon(this.weapons[key]);
        }
    }

    attachWeaponModel(key, slot) {
        if (!slot) return;
        while (slot.children.length > 0) {
            slot.remove(slot.children[0]);
        }

        const gunMat = new THREE.MeshStandardMaterial({ color: 0x161616, metalness: 0.85, roughness: 0.25 });
        const stockMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.7 });

        if (key === "pistol") {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.22), gunMat);
            body.position.set(0, 0, 0.08);
            slot.add(body);
        } else if (key === "smg" || key === "uzi") {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.28), gunMat);
            body.position.set(0, 0, 0.1);
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.05), gunMat);
            mag.position.set(0, -0.12, 0.05);
            slot.add(body);
            slot.add(mag);
        } else if (key === "shotgun") {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7), gunMat);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0, 0.28);
            const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.24), stockMat);
            stock.position.set(0, -0.04, -0.14);
            slot.add(barrel);
            slot.add(stock);
        } else if (key === "rifle") {
            // M4 Assault Rifle Model
            const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.38), gunMat);
            receiver.position.set(0, 0, 0.12);
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.45), gunMat);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0.02, 0.48);
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.2, 0.08), gunMat);
            mag.rotation.x = 0.2;
            mag.position.set(0, -0.12, 0.16);
            const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.1, 0.26), gunMat);
            stock.position.set(0, -0.02, -0.16);
            const sight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.14), gunMat);
            sight.position.set(0, 0.09, 0.08);

            slot.add(receiver);
            slot.add(barrel);
            slot.add(mag);
            slot.add(stock);
            slot.add(sight);
        } else if (key === "rpg") {
            const tubeMat = new THREE.MeshStandardMaterial({ color: 0x243e36, metalness: 0.75, roughness: 0.3 });
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.95), tubeMat);
            tube.rotation.x = Math.PI / 2;
            tube.position.set(0, 0.1, 0.2);
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), new THREE.MeshBasicMaterial({ color: 0xba181b }));
            cone.rotation.x = Math.PI / 2;
            cone.position.set(0, 0.1, 0.78);
            slot.add(tube);
            slot.add(cone);
        }
    }

    reload() {
        if (this.isReloading) return false;
        const w = this.getCurrentWeapon();
        if (!w || w.type === "melee") return false;
        if (w.magAmmo >= w.magSize) return false;

        this.isReloading = true;
        this.reloadDuration = w.reloadTime || 1.4;
        this.reloadTimer = w.reloadTime || 1.4;

        if (this.audio && this.audio.playReload) {
            this.audio.playReload();
        }
        if (window.HUD && window.HUD.showReloading) {
            window.HUD.showReloading(this.reloadDuration);
        }
        return true;
    }

    addAmmo(weaponKey, amount) {
        const w = this.weapons[weaponKey];
        if (w && w.reserveAmmo !== Infinity) {
            w.reserveAmmo = Math.min(w.maxReserve, w.reserveAmmo + amount);
            return true;
        }
        return false;
    }

    refillAllAmmo() {
        for (let k in this.weapons) {
            const w = this.weapons[k];
            if (w.magAmmo !== Infinity) {
                w.magAmmo = w.magSize;
                w.reserveAmmo = w.maxReserve;
            }
        }
    }

    canFire(now) {
        if (this.isReloading) return false;
        const w = this.getCurrentWeapon();
        if (w.magAmmo <= 0) return false;
        return (now - this.lastFireTime) >= w.fireRate;
    }

    fire(shooterPos, shootDir, isLocal = true, onHitCallback = null) {
        const now = performance.now() / 1000;
        const w = this.getCurrentWeapon();

        if (this.isReloading) return null;

        // Auto reload if empty and clicked
        if (w.magAmmo <= 0) {
            if (this.audio && this.audio.playEmptyClick) {
                this.audio.playEmptyClick();
            }
            if (w.reserveAmmo > 0) {
                this.reload();
            }
            return null;
        }

        if ((now - this.lastFireTime) < w.fireRate) return null;

        this.lastFireTime = now;

        if (w.magAmmo !== Infinity) {
            w.magAmmo--;
        }
        if (window.HUD && window.HUD.updateWeapon) {
            window.HUD.updateWeapon(w);
        }

        const muzzlePos = (shooterPos.y > 1.1) 
            ? shooterPos.clone()
            : new THREE.Vector3(
                shooterPos.x + shootDir.x * 0.85,
                shooterPos.y + 0.35,
                shooterPos.z + shootDir.z * 0.85
            );

        if (w.type === "melee") {
            if (this.audio && this.audio.playPunch) this.audio.playPunch();
            if (onHitCallback) {
                onHitCallback({ type: "melee", damage: w.damage, range: w.range });
            }
            return { type: "melee", weapon: this.currentWeaponKey, recoil: 0 };
        }

        // Play SFX
        if (this.audio) {
            if (this.currentWeaponKey === "pistol") this.audio.playPistol();
            else if (this.currentWeaponKey === "smg" || this.currentWeaponKey === "uzi") this.audio.playUzi();
            else if (this.currentWeaponKey === "shotgun") this.audio.playShotgun();
            else if (this.currentWeaponKey === "rifle") {
                if (this.audio.playAssaultRifle) this.audio.playAssaultRifle();
                else this.audio.playPistol();
            } else if (this.currentWeaponKey === "rpg") this.audio.playRPGLaunch();
        }

        this.spawnMuzzleFlash(muzzlePos);

        if (this.currentWeaponKey === "rpg") {
            this.spawnRocket(muzzlePos, shootDir, onHitCallback);
            return { type: "rpg", origin: muzzlePos, direction: shootDir, recoil: w.recoil || 0.04 };
        }

        const count = (w.type === "shotgun") ? w.pellets : 1;
        for (let i = 0; i < count; i++) {
            const spreadX = (Math.random() - 0.5) * (w.spread || 0);
            const spreadY = (Math.random() - 0.5) * (w.spread || 0);
            const spreadZ = (Math.random() - 0.5) * (w.spread || 0);

            const dir = shootDir.clone().add(new THREE.Vector3(spreadX, spreadY, spreadZ)).normalize();
            this.spawnTracer(muzzlePos, dir, w.range);

            if (onHitCallback) {
                onHitCallback({
                    type: "bullet",
                    damage: w.damage,
                    origin: muzzlePos,
                    dir: dir,
                    range: w.range
                });
            }
        }

        return { 
            type: "bullet", 
            weapon: this.currentWeaponKey, 
            origin: muzzlePos, 
            direction: shootDir,
            recoil: w.recoil || 0.02
        };
    }

    spawnMuzzleFlash(pos) {
        const flashGeo = new THREE.SphereGeometry(0.24, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(pos);
        this.scene.add(flash);

        const flashLight = new THREE.PointLight(0xffaa00, 3.5, 12);
        flashLight.position.copy(pos);
        this.scene.add(flashLight);

        this.muzzleFlashes.push({ mesh: flash, light: flashLight, life: 0.05 });
    }

    spawnTracer(origin, dir, maxRange) {
        const tracerGeo = new THREE.BufferGeometry().setFromPoints([
            origin,
            origin.clone().add(dir.clone().multiplyScalar(maxRange))
        ]);
        const tracerMat = new THREE.LineBasicMaterial({
            color: 0xfff066,
            transparent: true,
            opacity: 0.95,
            linewidth: 2
        });
        const line = new THREE.Line(tracerGeo, tracerMat);
        this.scene.add(line);
        this.tracers.push({ line, life: 0.08 });
    }

    spawnRocket(origin, dir, onHitCallback) {
        const rocketGroup = new THREE.Group();
        const rMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65), rMat);
        body.rotation.x = Math.PI / 2;
        rocketGroup.add(body);

        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.22, 8), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
        tip.rotation.x = Math.PI / 2;
        tip.position.z = 0.44;
        rocketGroup.add(tip);

        rocketGroup.position.copy(origin);
        rocketGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        this.scene.add(rocketGroup);

        this.projectiles.push({
            mesh: rocketGroup,
            dir: dir.clone(),
            speed: 48,
            life: 3.5,
            onHit: onHitCallback
        });
    }

    createExplosion(pos) {
        if (this.audio && this.audio.playExplosion) this.audio.playExplosion();

        const boomLight = new THREE.PointLight(0xff6600, 8.0, 35);
        boomLight.position.copy(pos);
        this.scene.add(boomLight);

        const boomGeo = new THREE.SphereGeometry(2.8, 14, 14);
        const boomMat = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 0.95
        });
        const boom = new THREE.Mesh(boomGeo, boomMat);
        boom.position.copy(pos);
        this.scene.add(boom);

        this.particles.push({
            mesh: boom,
            light: boomLight,
            type: "explosion_core",
            scale: 1,
            maxScale: 4.2,
            life: 0.55
        });

        const ringGeo = new THREE.RingGeometry(1.0, 1.8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffea00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pos.x, 0.1, pos.z);
        this.scene.add(ring);

        this.particles.push({
            mesh: ring,
            type: "shockwave",
            scale: 1.0,
            life: 0.45
        });

        for (let i = 0; i < 8; i++) {
            const smokeGeo = new THREE.SphereGeometry(1.2 + Math.random() * 0.8, 8, 8);
            const smokeMat = new THREE.MeshBasicMaterial({
                color: 0x1f1f2e,
                transparent: true,
                opacity: 0.7
            });
            const smoke = new THREE.Mesh(smokeGeo, smokeMat);
            smoke.position.set(
                pos.x + (Math.random() - 0.5) * 2,
                pos.y + Math.random() * 1.5,
                pos.z + (Math.random() - 0.5) * 2
            );
            this.scene.add(smoke);

            this.particles.push({
                mesh: smoke,
                type: "smoke",
                scale: 1.0,
                life: 1.2 + Math.random() * 0.4,
                velY: 2.5 + Math.random() * 1.5
            });
        }

        for (let i = 0; i < 20; i++) {
            const sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
            const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.copy(pos);
            this.scene.add(spark);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 22,
                Math.random() * 16 + 5,
                (Math.random() - 0.5) * 22
            );
            this.particles.push({
                mesh: spark,
                vel,
                type: "spark",
                life: 0.85
            });
        }
    }

    createBloodSpurt(pos) {
        const bloodMat = new THREE.MeshBasicMaterial({ color: 0xaa0022 });
        for (let i = 0; i < 7; i++) {
            const bloodGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
            const blood = new THREE.Mesh(bloodGeo, bloodMat);
            blood.position.copy(pos);
            this.scene.add(blood);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 4 + 1.5,
                (Math.random() - 0.5) * 5
            );
            this.particles.push({
                mesh: blood,
                vel,
                type: "blood",
                life: 0.45
            });
        }
    }

    createImpactSparks(pos) {
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        for (let i = 0; i < 5; i++) {
            const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.copy(pos);
            this.scene.add(spark);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 6 + 2,
                (Math.random() - 0.5) * 8
            );
            this.particles.push({
                mesh: spark,
                vel,
                type: "spark",
                life: 0.35
            });
        }
    }

    update(dt, world, vehicles, remotePlayers, localPlayer) {
        // Update Reloading
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                const w = this.getCurrentWeapon();
                if (w && w.magSize) {
                    w.magAmmo = w.magSize;
                    w.reserveAmmo = Infinity;
                }
                this.isReloading = false;
                this.reloadTimer = 0;
                if (window.HUD && window.HUD.updateWeapon) {
                    window.HUD.updateWeapon(w);
                }
            }
        }

        // Muzzle flashes
        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            const mf = this.muzzleFlashes[i];
            mf.life -= dt;
            if (mf.life <= 0) {
                this.scene.remove(mf.mesh);
                if (mf.light) this.scene.remove(mf.light);
                this.muzzleFlashes.splice(i, 1);
            }
        }

        // Tracers
        for (let i = this.tracers.length - 1; i >= 0; i--) {
            const tr = this.tracers[i];
            tr.life -= dt;
            if (tr.life <= 0) {
                this.scene.remove(tr.line);
                this.tracers.splice(i, 1);
            }
        }

        // RPG Rockets
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= dt;
            const moveDist = p.speed * dt;
            p.mesh.position.addScaledVector(p.dir, moveDist);

            let explode = false;
            if (p.mesh.position.y <= 0.2) {
                explode = true;
            } else if (world && world.checkCollision(p.mesh.position.x, p.mesh.position.z, 0.6)) {
                explode = true;
            }

            if (explode || p.life <= 0) {
                this.createExplosion(p.mesh.position);
                if (p.onHit) {
                    p.onHit({ type: "explosion", pos: p.mesh.position, damage: 180, radius: 9 });
                }
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }

        // Particles & Smoke
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.life -= dt;

            if (pt.type === "explosion_core") {
                pt.scale += dt * 7;
                pt.mesh.scale.set(pt.scale, pt.scale, pt.scale);
                pt.mesh.material.opacity = Math.max(0, pt.life * 2);
                if (pt.light) pt.light.intensity = pt.life * 14;
            } else if (pt.type === "shockwave") {
                pt.scale += dt * 16;
                pt.mesh.scale.set(pt.scale, pt.scale, 1);
                pt.mesh.material.opacity = Math.max(0, pt.life * 2);
            } else if (pt.type === "smoke") {
                pt.scale += dt * 1.5;
                pt.mesh.scale.set(pt.scale, pt.scale, pt.scale);
                pt.mesh.position.y += pt.velY * dt;
                pt.mesh.material.opacity = Math.max(0, pt.life * 0.6);
            } else if (pt.type === "spark") {
                pt.vel.y -= 25 * dt;
                pt.mesh.position.addScaledVector(pt.vel, dt);
            } else if (pt.type === "blood") {
                pt.vel.y -= 18 * dt;
                pt.mesh.position.addScaledVector(pt.vel, dt);
                pt.mesh.scale.multiplyScalar(0.96);
            }

            if (pt.life <= 0) {
                this.scene.remove(pt.mesh);
                if (pt.light) this.scene.remove(pt.light);
                this.particles.splice(i, 1);
            }
        }
    }
}

window.WeaponSystem = WeaponSystem;
