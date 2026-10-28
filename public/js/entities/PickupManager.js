class Pickup {
    constructor(id, type, x, z, scene, world, isStatic = false) {
        this.id = id;
        this.type = type; // "health", "armor", "ammo", "money", "weapon_crate"
        this.x = x;
        this.z = z;
        this.scene = scene;
        this.world = world;
        this.isStatic = isStatic;
        this.collected = false;
        this.respawnTimer = 0;
        this.respawnDelay = 45.0; // static world pickups respawn after 45s

        const groundY = this.world ? this.world.checkRampHeight(this.x, this.z) : 0.4;
        this.baseY = groundY + 0.6;

        this.root = new THREE.Group();
        this.root.position.set(this.x, this.baseY, this.z);
        this.scene.add(this.root);

        this.buildMesh();
    }

    buildMesh() {
        // Floor glowing aura ring
        let ringColor = 0x06d6a0;
        if (this.type === "armor") ringColor = 0x00f0ff;
        else if (this.type === "ammo") ringColor = 0xffb703;
        else if (this.type === "money") ringColor = 0x55ff55;
        else if (this.type === "weapon_crate") ringColor = 0xff007f;

        const ringGeo = new THREE.RingGeometry(0.35, 0.7, 16);
        const ringMat = new THREE.MeshBasicMaterial({
            color: ringColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.65
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.55;
        this.root.add(ring);

        // Core 3D item geometry
        if (this.type === "health") {
            // Medical Cross
            const crossMat = new THREE.MeshStandardMaterial({
                color: 0x06d6a0,
                emissive: 0x024a35,
                roughness: 0.3,
                metalness: 0.2
            });
            const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), crossMat);
            const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.2), crossMat);
            this.itemGroup = new THREE.Group();
            this.itemGroup.add(vBar);
            this.itemGroup.add(hBar);
            this.root.add(this.itemGroup);
        } else if (this.type === "armor") {
            // Tactical Armor Shield Diamond
            const shieldMat = new THREE.MeshStandardMaterial({
                color: 0x00b4d8,
                emissive: 0x003554,
                roughness: 0.2,
                metalness: 0.8
            });
            const shieldGeo = new THREE.OctahedronGeometry(0.38, 0);
            this.itemGroup = new THREE.Mesh(shieldGeo, shieldMat);
            this.itemGroup.scale.set(0.9, 1.3, 0.5);
            this.root.add(this.itemGroup);
        } else if (this.type === "ammo") {
            // Golden Ammo Crate
            const ammoMat = new THREE.MeshStandardMaterial({
                color: 0xffb703,
                emissive: 0x553800,
                roughness: 0.4,
                metalness: 0.6
            });
            const ammoGeo = new THREE.BoxGeometry(0.5, 0.3, 0.35);
            this.itemGroup = new THREE.Mesh(ammoGeo, ammoMat);
            this.root.add(this.itemGroup);
        } else if (this.type === "money") {
            // Cash stack
            const cashMat = new THREE.MeshStandardMaterial({
                color: 0x2ec4b6,
                emissive: 0x0f423d,
                roughness: 0.5,
                metalness: 0.1
            });
            const cashGeo = new THREE.BoxGeometry(0.42, 0.22, 0.28);
            this.itemGroup = new THREE.Mesh(cashGeo, cashMat);
            this.root.add(this.itemGroup);
        } else {
            // Heavy Weapon Crate
            const crateMat = new THREE.MeshStandardMaterial({
                color: 0xff007f,
                emissive: 0x4a0025,
                roughness: 0.3,
                metalness: 0.7
            });
            const crateGeo = new THREE.BoxGeometry(0.65, 0.28, 0.35);
            this.itemGroup = new THREE.Mesh(crateGeo, crateMat);
            this.root.add(this.itemGroup);
        }
    }

    update(dt, time, player) {
        if (this.collected) {
            if (this.isStatic) {
                this.respawnTimer -= dt;
                if (this.respawnTimer <= 0) {
                    this.collected = false;
                    this.root.visible = true;
                }
            }
            return;
        }

        // Float & spin animation
        if (this.itemGroup) {
            this.itemGroup.rotation.y = time * 2.2;
            this.itemGroup.position.y = Math.sin(time * 3.5) * 0.12;
        }

        // Proximity detection with local player
        if (!player || player.isDead) return;
        const dist = Math.hypot(player.position.x - this.x, player.position.z - this.z);
        if (dist < 1.75 && Math.abs(player.position.y - this.baseY) < 2.0) {
            this.onPickup(player);
        }
    }

    onPickup(player) {
        let applied = false;

        switch (this.type) {
            case "health":
                if (player.health < 100) {
                    player.health = Math.min(100, player.health + 40);
                    HUD.updateVitals(player.health, player.armor);
                    HUD.showActionHint("💚 +40 HEALTH RESTORED");
                    applied = true;
                }
                break;

            case "armor":
                if (player.armor < 100) {
                    player.armor = Math.min(100, player.armor + 50);
                    HUD.updateVitals(player.health, player.armor);
                    HUD.showActionHint("🛡️ +50 BODY ARMOR RESTORED");
                    applied = true;
                }
                break;

            case "ammo": {
                const curW = player.weaponSystem.getCurrentWeapon();
                if (curW && curW.key !== "fists") {
                    curW.magAmmo = curW.magSize;
                    curW.reserveAmmo = Infinity;
                    curW.maxReserve = Infinity;
                    HUD.updateWeapon(curW);
                    HUD.showActionHint("📦 AMMO CRATE: MAGAZINE REFILLED & UNLIMITED AMMO!");
                    applied = true;
                }
                break;
            }

            case "money": {
                const amount = 250 + Math.floor(Math.random() * 250);
                player.cash += amount;
                HUD.updateCash(player.cash);
                HUD.showActionHint(`💵 +$${amount} CASH COLLECTED`);
                applied = true;
                break;
            }

            case "weapon_crate": {
                const guns = ["smg", "shotgun", "rifle", "rpg"];
                const pick = guns[Math.floor(Math.random() * guns.length)];
                player.switchWeapon(pick);
                const w = player.weaponSystem.getCurrentWeapon();
                if (w) {
                    w.magAmmo = w.magSize;
                    w.reserveAmmo = Infinity;
                    w.maxReserve = Infinity;
                }
                HUD.updateWeapon(player.weaponSystem.getCurrentWeapon());
                HUD.showActionHint(`🔫 MILITARY WEAPON CRATE: ${w ? w.name : pick.toUpperCase()} (UNLIMITED AMMO)!`);
                applied = true;
                break;
            }
        }

        if (applied) {
            this.collected = true;
            this.root.visible = false;
            if (player.audio) {
                if (player.audio.playPickupSound) player.audio.playPickupSound();
                else if (player.audio.playPickup) player.audio.playPickup();
                else if (player.audio.playCashSound) player.audio.playCashSound();
            }

            if (this.isStatic) {
                this.respawnTimer = this.respawnDelay;
            } else {
                this.destroy();
            }
        }
    }

    destroy() {
        if (this.root && this.root.parent) {
            this.root.parent.remove(this.root);
        }
    }
}

class PickupManager {
    constructor(scene, world, audioSystem) {
        this.scene = scene;
        this.world = world;
        this.audio = audioSystem;
        this.pickups = [];
        this.nextId = 1;

        // Populate permanent city world pickups
        this.initWorldPickups();
    }

    initWorldPickups() {
        const locations = [
            // Ocean View Hotel Front & Alley
            { type: "health", x: -14, z: -46 },
            { type: "armor",  x: -35, z: -40 },
            { type: "ammo",   x: -12, z: 2 },
            // Ocean Drive Beach Boardwalk
            { type: "health", x: 26, z: -70 },
            { type: "money",  x: 32, z: 20 },
            { type: "weapon_crate", x: 28, z: 110 },
            // South Docks / Marina Pier
            { type: "armor",  x: 95, z: 120 },
            { type: "ammo",   x: 125, z: 140 },
            // North Industrial Compound
            { type: "weapon_crate", x: -75, z: -210 },
            { type: "health", x: -60, z: -190 },
            // Starfish Island Bridge Approach
            { type: "armor",  x: 40, z: -20 },
            { type: "ammo",   x: 55, z: -30 },
            // Pay 'n' Spray Garage Alley
            { type: "armor",  x: -58, z: 22 },
            { type: "ammo",   x: -50, z: 28 },
            // South Causeway Bridge at z = 180
            { type: "armor",  x: 65, z: 180 },
            { type: "ammo",   x: 140, z: 180 },
            // Malibu Club Strip
            { type: "armor",  x: -30, z: 40 },
            { type: "weapon_crate", x: -25, z: 60 },
            // Lighthouse Beach
            { type: "armor",  x: 118, z: 115 },
            // Dinosaur Island Entry
            { type: "weapon_crate", x: 235, z: 0 },
            { type: "armor",  x: 245, z: 15 },
            { type: "ammo",   x: 245, z: -15 },
            // North & South Ocean Drive
            { type: "armor",  x: -15, z: -280 },
            { type: "ammo",   x: 15, z: -280 },
            { type: "armor",  x: -15, z: 280 },
            { type: "ammo",   x: 15, z: 280 }
        ];

        locations.forEach(loc => {
            const id = `world_pickup_${this.nextId++}`;
            const p = new Pickup(id, loc.type, loc.x, loc.z, this.scene, this.world, true);
            this.pickups.push(p);
        });
    }

    spawnPickup(type, x, z) {
        const id = `drop_pickup_${this.nextId++}`;
        const p = new Pickup(id, type, x, z, this.scene, this.world, false);
        this.pickups.push(p);
        return p;
    }

    update(dt, time, player) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            p.update(dt, time, player);

            if (p.collected && !p.isStatic) {
                this.pickups.splice(i, 1);
            }
        }
    }
}

window.Pickup = Pickup;
window.PickupManager = PickupManager;
