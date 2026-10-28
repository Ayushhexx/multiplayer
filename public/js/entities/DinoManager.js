class DinoManager {
    constructor(scene, audioSystem) {
        this.scene = scene;
        this.audio = audioSystem;
        this.dinosaurs = [];

        this.spawnDinosaurs();
    }

    spawnDinosaurs() {
        // Clear any existing dinosaurs
        this.dinosaurs.forEach(d => {
            if (d.root && d.root.parent) d.root.parent.remove(d.root);
        });
        this.dinosaurs = [];

        // 1. Apex Boss: Tyrannosaurus Rex (T-Rex)
        const tRex = this.createTRex(380, 0.6, 20);
        this.dinosaurs.push(tRex);

        // 2. Velociraptor Pack (Ground-based pack hunters)
        const raptorPositions = [
            { x: 310, z: -40, name: "Velociraptor Alpha" },
            { x: 340, z: 70, name: "Velociraptor Flanker #1" },
            { x: 410, z: 40, name: "Velociraptor Flanker #2" },
            { x: 430, z: -80, name: "Velociraptor Hunter #3" },
            { x: 370, z: -110, name: "Velociraptor Stalker #4" }
        ];

        raptorPositions.forEach((pos, idx) => {
            const raptor = this.createRaptor(pos.x, 0.6, pos.z, idx, pos.name);
            this.dinosaurs.push(raptor);
        });

        console.log(`[DinoManager] Spawned ${this.dinosaurs.length} ground-based dinosaurs on Dinosaur Island.`);
    }

    createTRex(x, y, z) {
        const root = new THREE.Group();
        const dinoMat = new THREE.MeshStandardMaterial({ color: 0x3d4b26, roughness: 0.85, metalness: 0.1 });
        const underbellyMat = new THREE.MeshStandardMaterial({ color: 0xc2a677, roughness: 0.8 });
        const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });

        // Massive Torso / Body
        const bodyGeo = new THREE.BoxGeometry(2.4, 2.6, 4.8);
        const body = new THREE.Mesh(bodyGeo, dinoMat);
        body.position.y = 3.6;
        body.rotation.x = -0.15;
        body.castShadow = true;
        root.add(body);

        // Neck
        const neck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 2.2), dinoMat);
        neck.position.set(0, 4.4, 2.8);
        neck.rotation.x = 0.35;
        root.add(neck);

        // Head Group
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 5.2, 3.8);

        const upperJaw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 2.8), dinoMat);
        upperJaw.position.set(0, 0.2, 1.0);
        upperJaw.castShadow = true;
        headGroup.add(upperJaw);

        // Lower Jaw (Articulated for roaring & biting)
        const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 2.6), underbellyMat);
        lowerJaw.position.set(0, -0.6, 0.9);
        headGroup.add(lowerJaw);

        // Razor Teeth
        for (let t = -1.0; t <= 1.0; t += 0.35) {
            [-0.65, 0.65].forEach(tx => {
                const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), toothMat);
                tooth.rotation.x = Math.PI;
                tooth.position.set(tx, -0.4, 1.0 + t);
                headGroup.add(tooth);
            });
        }

        // Glowing predatory eyes
        [-0.78, 0.78].forEach(ex => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), eyeMat);
            eye.position.set(ex, 0.5, 0.6);
            headGroup.add(eye);
        });

        root.add(headGroup);

        // Counterbalancing Tail Segments
        const tail1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 3.4), dinoMat);
        tail1.position.set(0, 3.2, -3.2);
        tail1.rotation.x = 0.2;
        root.add(tail1);

        const tail2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 3.8), dinoMat);
        tail2.position.set(0, 2.5, -6.2);
        root.add(tail2);

        // Muscular Hind Legs (Pivot at hip y = 3.2, foot touches y = 0)
        const thighGeo = new THREE.BoxGeometry(0.9, 2.4, 1.4);
        const footGeo = new THREE.BoxGeometry(1.1, 0.5, 1.8);

        const leftLeg = new THREE.Group();
        leftLeg.position.set(-1.4, 3.2, 0);
        const leftThigh = new THREE.Mesh(thighGeo, dinoMat);
        leftThigh.position.y = -1.0;
        leftLeg.add(leftThigh);
        const leftFoot = new THREE.Mesh(footGeo, dinoMat);
        leftFoot.position.set(0, -2.4, 0.3);
        leftLeg.add(leftFoot);
        root.add(leftLeg);

        const rightLeg = new THREE.Group();
        rightLeg.position.set(1.4, 3.2, 0);
        const rightThigh = new THREE.Mesh(thighGeo, dinoMat);
        rightThigh.position.y = -1.0;
        rightLeg.add(rightThigh);
        const rightFoot = new THREE.Mesh(footGeo, dinoMat);
        rightFoot.position.set(0, -2.4, 0.3);
        rightLeg.add(rightFoot);
        root.add(rightLeg);

        // Forelimbs / Small Arms
        [-0.9, 0.9].forEach(ax => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.3), dinoMat);
            arm.position.set(ax, 3.2, 2.4);
            arm.rotation.x = -0.5;
            root.add(arm);
        });

        root.position.set(x, y, z);
        this.scene.add(root);

        // Boss Health Billboard
        const nameSprite = this.createDinoTag("TYRANNOSAURUS REX (APEX BOSS)", 500, 500);
        nameSprite.position.set(0, 7.5, 0);
        root.add(nameSprite);

        return {
            type: "trex",
            name: "Tyrannosaurus Rex",
            root,
            headGroup,
            lowerJaw,
            leftLeg,
            rightLeg,
            tail1,
            tail2,
            tagSprite: nameSprite,
            x, y, z,
            spawnX: x,
            spawnZ: z,
            respawnTimer: 0,
            rotY: 0,
            targetRotY: 0,
            health: 500,
            maxHealth: 500,
            speed: 8.2,
            damage: 38,
            state: "patrol", // patrol, chase, attack, dead
            patrolWaypoints: [
                { x: 380, z: 20 },
                { x: 420, z: 80 },
                { x: 440, z: -30 },
                { x: 350, z: -80 }
            ],
            patrolIdx: 0,
            walkPhase: 0,
            roarTimer: 0,
            attackCooldown: 0,
            footstepTimer: 0,
            isBoss: true
        };
    }

    createRaptor(x, y, z, index, name = null) {
        const root = new THREE.Group();
        const raptorMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.75 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

        // Slender Agile Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 2.2), raptorMat);
        body.position.y = 1.4;
        body.rotation.x = -0.2;
        body.castShadow = true;
        root.add(body);

        // Neck & Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 2.1, 1.4);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 1.4), raptorMat);
        snout.position.set(0, 0, 0.6);
        headGroup.add(snout);

        [-0.32, 0.32].forEach(ex => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), eyeMat);
            eye.position.set(ex, 0.2, 0.4);
            headGroup.add(eye);
        });
        root.add(headGroup);

        // Long Balancing Tail
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 2.8), raptorMat);
        tail.position.set(0, 1.4, -2.4);
        tail.rotation.x = 0.1;
        root.add(tail);

        // Fast Sprinting Legs
        const leftLeg = new THREE.Group();
        leftLeg.position.set(-0.55, 1.3, 0);
        const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.5), raptorMat);
        lLegMesh.position.y = -0.5;
        leftLeg.add(lLegMesh);
        root.add(leftLeg);

        const rightLeg = new THREE.Group();
        rightLeg.position.set(0.55, 1.3, 0);
        const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.5), raptorMat);
        rLegMesh.position.y = -0.5;
        rightLeg.add(rLegMesh);
        root.add(rightLeg);

        root.position.set(x, y, z);
        this.scene.add(root);

        const displayName = name || `Velociraptor #${index + 1}`;
        const nameSprite = this.createDinoTag(displayName, 120, 120);
        nameSprite.position.set(0, 3.2, 0);
        root.add(nameSprite);

        return {
            type: "raptor",
            name: displayName,
            root,
            headGroup,
            leftLeg,
            rightLeg,
            tail,
            tagSprite: nameSprite,
            x, y, z,
            spawnX: x,
            spawnZ: z,
            respawnTimer: 0,
            rotY: Math.random() * Math.PI * 2,
            targetRotY: 0,
            health: 120,
            maxHealth: 120,
            speed: 10.8,
            damage: 22,
            state: "patrol", // patrol, hunt, attack, dead
            packIndex: index,
            walkPhase: Math.random() * Math.PI,
            patrolTimer: Math.random() * 5,
            attackCooldown: 0,
            footstepTimer: 0,
            isBoss: false
        };
    }

    createDinoTag(name, health, maxHealth) {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(20, 10, 5, 0.85)';
        ctx.roundRect(10, 8, 280, 48, 8);
        ctx.fill();

        ctx.font = 'bold 18px Montserrat, sans-serif';
        ctx.fillStyle = '#ffb703';
        ctx.textAlign = 'center';
        ctx.fillText(name, 150, 30);

        ctx.fillStyle = '#222222';
        ctx.fillRect(25, 38, 250, 10);

        ctx.fillStyle = '#ff0055';
        ctx.fillRect(25, 38, 250 * (health / maxHealth), 10);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(3.2, 0.7, 1);
        sprite.canvas = canvas;
        sprite.ctx = ctx;
        sprite.maxHealth = maxHealth;
        sprite.dinoName = name;
        return sprite;
    }

    updateDinoTag(dino) {
        if (!dino.tagSprite || !dino.tagSprite.ctx) return;
        const ctx = dino.tagSprite.ctx;
        ctx.clearRect(0, 0, 300, 64);

        ctx.fillStyle = 'rgba(20, 10, 5, 0.85)';
        ctx.roundRect(10, 8, 280, 48, 8);
        ctx.fill();

        ctx.font = 'bold 18px Montserrat, sans-serif';
        ctx.fillStyle = (dino.health <= 0) ? '#888888' : '#ffb703';
        ctx.textAlign = 'center';
        ctx.fillText((dino.health <= 0) ? `${dino.dinoName || dino.name} (DEAD)` : (dino.dinoName || dino.name), 150, 30);

        ctx.fillStyle = '#222222';
        ctx.fillRect(25, 38, 250, 10);

        const ratio = Math.max(0, Math.min(1, dino.health / dino.maxHealth));
        ctx.fillStyle = (ratio > 0.5) ? '#06d6a0' : ((ratio > 0.25) ? '#ffd166' : '#ff0055');
        ctx.fillRect(25, 38, 250 * ratio, 10);

        dino.tagSprite.material.map.needsUpdate = true;
    }

    update(dt, time, player, world) {
        const playerPos = player ? player.position : null;
        let anyDinoAlerted = false;

        // First check if any dinosaur has detected player to coordinate pack
        let playerNearbyDinoIsland = playerPos && (playerPos.x > 220);

        for (let dino of this.dinosaurs) {
            // Infinite Dinosaurs: Automatically regenerate and respawn 10 seconds after defeat!
            if (dino.state === "dead") {
                dino.respawnTimer = (dino.respawnTimer || 0) + dt;
                if (dino.respawnTimer >= 10.0) {
                    dino.state = "patrol";
                    dino.health = dino.maxHealth || 120;
                    dino.x = dino.spawnX || dino.x;
                    dino.z = dino.spawnZ || dino.z;
                    dino.root.rotation.z = 0;
                    dino.root.position.set(dino.x, dino.y || 0.6, dino.z);
                    dino.respawnTimer = 0;
                    this.updateDinoTag(dino);
                    if (this.audio) this.audio.playDinoRoar();
                    HUD.showActionHint(`🦖 ${dino.name.toUpperCase()} HAS REGENERATED ON DINOSAUR ISLAND!`);
                }
                continue;
            }

            const distToPlayer = playerPos ? Math.hypot(playerPos.x - dino.x, playerPos.z - dino.z) : 999;
            const detectRadius = dino.isBoss ? 65 : 45;

            // Ground alignment via terrain height calculation
            const groundY = world ? world.checkRampHeight(dino.x, dino.z) : 0.6;
            dino.y = groundY;

            let moveSpeed = 0;

            if (distToPlayer < detectRadius && playerNearbyDinoIsland) {
                anyDinoAlerted = true;
                dino.state = dino.isBoss ? "chase" : "hunt";

                // Pack AI: Calculate flanking angle offset for raptors
                let targetAngle = Math.atan2(playerPos.x - dino.x, playerPos.z - dino.z);
                if (dino.type === "raptor") {
                    // Angular offset to surround player
                    const flankOffset = (dino.packIndex - 2) * 0.65;
                    targetAngle += flankOffset;
                }

                // Smooth turning
                const angleDiff = Math.atan2(Math.sin(targetAngle - dino.rotY), Math.cos(targetAngle - dino.rotY));
                dino.rotY += angleDiff * dt * (dino.isBoss ? 3.0 : 5.5);

                if (distToPlayer > 3.6) {
                    moveSpeed = dino.speed;
                    dino.x += Math.sin(dino.rotY) * moveSpeed * dt;
                    dino.z += Math.cos(dino.rotY) * moveSpeed * dt;
                } else {
                    // In biting range!
                    dino.attackCooldown -= dt;
                    if (dino.attackCooldown <= 0) {
                        dino.attackCooldown = dino.isBoss ? 1.5 : 1.1;
                        if (this.audio) {
                            if (dino.isBoss) this.audio.playDinoRoar();
                            else this.audio.playDinoAttack();
                        }
                        if (player) {
                            player.takeDamage(dino.damage, "dino_bite");
                            HUD.showActionHint(`⚠️ ATTACKED BY ${dino.name}!`);
                        }
                    }
                }

                // T-Rex roar & camera shake when first engaging
                if (dino.isBoss) {
                    if (dino.roarTimer <= 0) {
                        if (this.audio) this.audio.playDinoRoar();
                        if (window.gameInstance && window.gameInstance.renderer) {
                            window.gameInstance.renderer.addScreenShake(0.65, 0.4);
                        }
                        dino.roarTimer = 10.0;
                    } else {
                        dino.roarTimer -= dt;
                    }
                }
            } else {
                // Peaceful Idle Patrol
                dino.state = "patrol";
                if (dino.isBoss && dino.patrolWaypoints) {
                    // T-Rex follows territorial patrol waypoints
                    const wp = dino.patrolWaypoints[dino.patrolIdx];
                    const distToWp = Math.hypot(wp.x - dino.x, wp.z - dino.z);
                    if (distToWp < 5.0) {
                        dino.patrolIdx = (dino.patrolIdx + 1) % dino.patrolWaypoints.length;
                    }
                    const targetAngle = Math.atan2(wp.x - dino.x, wp.z - dino.z);
                    const angleDiff = Math.atan2(Math.sin(targetAngle - dino.rotY), Math.cos(targetAngle - dino.rotY));
                    dino.rotY += angleDiff * dt * 2.0;
                    moveSpeed = dino.speed * 0.4;
                    dino.x += Math.sin(dino.rotY) * moveSpeed * dt;
                    dino.z += Math.cos(dino.rotY) * moveSpeed * dt;
                } else {
                    // Raptors wander with periodic direction changes
                    dino.patrolTimer = (dino.patrolTimer || 0) - dt;
                    if (dino.patrolTimer <= 0) {
                        dino.patrolTimer = 4 + Math.random() * 4;
                        dino.targetRotY = dino.rotY + (Math.random() - 0.5) * 2.5;
                    }
                    const angleDiff = Math.atan2(Math.sin(dino.targetRotY - dino.rotY), Math.cos(dino.targetRotY - dino.rotY));
                    dino.rotY += angleDiff * dt * 2.5;
                    moveSpeed = dino.speed * 0.35;
                    dino.x += Math.sin(dino.rotY) * moveSpeed * dt;
                    dino.z += Math.cos(dino.rotY) * moveSpeed * dt;
                }
            }

            // Keep firmly within Dinosaur Island boundaries
            dino.x = Math.max(235, Math.min(485, dino.x));
            dino.z = Math.max(-235, Math.min(235, dino.z));

            // Set final grounded position & rotation
            dino.root.position.set(dino.x, dino.y, dino.z);
            dino.root.rotation.y = dino.rotY;

            // Natural leg walking/running animation
            if (moveSpeed > 0.1) {
                dino.walkPhase += dt * moveSpeed * (dino.isBoss ? 1.5 : 2.2);
                const legSwing = Math.sin(dino.walkPhase) * (dino.isBoss ? 0.6 : 0.8);
                dino.leftLeg.rotation.x = legSwing;
                dino.rightLeg.rotation.x = -legSwing;

                // Footstep sound when foot strikes ground
                dino.footstepTimer += dt;
                const footInterval = dino.isBoss ? 0.65 : 0.35;
                if (dino.footstepTimer >= footInterval) {
                    dino.footstepTimer = 0;
                    if (this.audio && distToPlayer < 75) {
                        this.audio.playDinoFootstep(dino.isBoss);
                    }
                }
            } else {
                dino.leftLeg.rotation.x = 0;
                dino.rightLeg.rotation.x = 0;
            }

            // Tail sway
            if (dino.tail1) dino.tail1.rotation.y = Math.sin(time * 5) * 0.25;
            if (dino.tail2) dino.tail2.rotation.y = Math.sin(time * 5 + 0.5) * 0.35;
            if (dino.tail) dino.tail.rotation.y = Math.sin(time * 7) * 0.3;

            // T-Rex lower jaw snapping on roar or attack
            if (dino.lowerJaw) {
                const jawOpen = (dino.attackCooldown > 0.7 || dino.roarTimer > 8.5) ? -0.55 : -0.05;
                dino.lowerJaw.rotation.x = jawOpen;
            }
        }

        // Contextual music mood integration
        if (anyDinoAlerted && this.audio && window.gameInstance && (!window.gameInstance.player.wantedLevel || window.gameInstance.player.wantedLevel === 0)) {
            this.audio.setMood("dino_encounter");
        }
    }
}

window.DinoManager = DinoManager;
