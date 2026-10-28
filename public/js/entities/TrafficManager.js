class TrafficManager {
    constructor(scene, world, audioSystem) {
        this.scene = scene;
        this.world = world;
        this.audio = audioSystem;

        this.pedestrians = [];
        this.maxPedestrians = 36; // Increased population for expanded map

        this.spawnPedestrians();
    }

    spawnPedestrians() {
        const personas = [
            "cop",
            "beach_roller",
            "tourist",
            "mobster_pink",
            "white_suit",
            "hawaiian_cyan",
            "hawaiian_pink",
            "black_suit"
        ];

        for (let i = 0; i < this.maxPedestrians; i++) {
            // Distribute along West sidewalk (Hotels) and East sidewalk (Beach promenade)
            const side = (i % 2 === 0) ? -21.5 : 21.5;
            const z = (Math.random() - 0.5) * 980;
            const persona = personas[i % personas.length];

            const char = CharacterModel.create(persona);
            char.root.position.set(side + (Math.random() - 0.5) * 2.5, 1.0, z);
            this.scene.add(char.root);

            this.pedestrians.push({
                char,
                x: char.root.position.x,
                y: 1.0,
                z: z,
                speed: 1.6 + Math.random() * 1.0,
                dirZ: Math.random() > 0.5 ? 1 : -1,
                state: "walk", // walk, panic, dead
                panicTimer: 0,
                health: 40,
                persona: persona
            });
        }
    }

    alertNearbyPedestrians(pos, radius = 30) {
        this.pedestrians.forEach(p => {
            if (p.state === "dead") return;
            const dist = Math.hypot(p.x - pos.x, p.z - pos.z);
            if (dist < radius) {
                p.state = "panic";
                p.panicTimer = 7.0;
                p.dirZ = (p.z > pos.z) ? 1 : -1;
                p.speed = 6.8; // sprint away in fear
            }
        });
    }

    checkHit(pos, radius, damage, onKillCallback) {
        for (let p of this.pedestrians) {
            if (p.state === "dead") continue;
            const dist = Math.hypot(p.x - pos.x, p.z - pos.z);
            if (dist < radius) {
                p.health -= damage;
                if (p.health <= 0) {
                    p.state = "dead";
                    CharacterModel.updateAnimation(p.char, "dead", 0, 0);
                    if (onKillCallback) onKillCallback(p);
                } else {
                    p.state = "panic";
                    p.panicTimer = 8.0;
                    p.speed = 7.2;
                }
                return true;
            }
        }
        return false;
    }

    update(dt, time, player) {
        for (let p of this.pedestrians) {
            if (p.state === "dead") continue;

            if (p.state === "panic") {
                p.panicTimer -= dt;
                if (p.panicTimer <= 0) {
                    p.state = "walk";
                    p.speed = 1.8 + Math.random() * 0.5;
                }
            }

            p.z += p.dirZ * p.speed * dt;

            // Turn around at city ends of expanded map
            if (p.z > 510) p.dirZ = -1;
            if (p.z < -510) p.dirZ = 1;

            p.char.root.position.set(p.x, p.y, p.z);
            p.char.root.rotation.y = (p.dirZ > 0) ? 0 : Math.PI;

            const anim = (p.state === "panic") ? "sprint" : "walk";
            CharacterModel.updateAnimation(p.char, anim, (p.state === "panic") ? 1.6 : 0.85, time);

            // Car collision with pedestrians
            if (player && player.currentVehicle) {
                const v = player.currentVehicle;
                const vDist = Math.hypot(p.x - v.x, p.z - v.z);
                if (vDist < 2.2 && Math.abs(v.speed) > 5) {
                    p.state = "dead";
                    CharacterModel.updateAnimation(p.char, "dead", 0, 0);
                    if (player.audio) player.audio.playPunch();
                    player.cash += 150;
                    HUD.updateCash(player.cash);

                    player.pedKillCount = (player.pedKillCount || 0) + 1;
                    const requiredKills = 20;
                    if (player.pedKillCount < requiredKills) {
                        if (player.wantedLevel > 0) player.setWantedLevel(0);
                        HUD.showActionHint(`🎯 Person Down: ${player.pedKillCount}/${requiredKills} Kills (Police will only investigate at 20 Kills!)`);
                    } else {
                        const targetWanted = Math.min(5, Math.floor(player.pedKillCount / requiredKills));
                        if (targetWanted > player.wantedLevel) {
                            player.setWantedLevel(targetWanted);
                            HUD.showActionHint(`⚠️ WANTED LEVEL ${player.wantedLevel} STAR! (${player.pedKillCount} Kills Reached!)`);
                        }
                    }

                    if (window.gameInstance && window.gameInstance.missions) {
                        window.gameInstance.missions.onTargetKilled(p.persona || "pedestrian");
                    }
                }
            }
        }
    }
}

window.TrafficManager = TrafficManager;
