class AnimalManager {
    constructor(scene, audioSystem) {
        this.scene = scene;
        this.audio = audioSystem;
        this.animals = [];

        this.spawnAnimals();
    }

    spawnAnimals() {
        // Spawn 8 dogs accompanying pedestrians along Ocean Drive & Beach
        const dogConfigs = [
            { x: -21.0, z: -40, type: "dog_golden", color: 0xd4a373 },
            { x: -21.0, z: 20, type: "dog_dalmatian", color: 0xeeeeee },
            { x: 22.0, z: -10, type: "dog_golden", color: 0xca6702 },
            { x: 22.0, z: 60, type: "dog_black", color: 0x222222 },
            { x: 22.0, z: 120, type: "dog_golden", color: 0xee9b00 },
            { x: -21.0, z: -110, type: "dog_dalmatian", color: 0xffffff },
            { x: -21.0, z: 90, type: "dog_golden", color: 0xd4a373 },
            { x: 35.0, z: -25, type: "dog_golden", color: 0xca6702 }
        ];

        dogConfigs.forEach(cfg => {
            const dog = this.createDog(cfg.x, 0.4, cfg.z, cfg.color);
            this.animals.push(dog);
        });

        // Spawn 4 cats lounging around hotels and palms
        const catConfigs = [
            { x: -24.5, z: -35, color: 0xf77f00 },
            { x: -24.5, z: 40, color: 0x111111 },
            { x: -24.5, z: 105, color: 0xffffff },
            { x: -24.5, z: -85, color: 0xd62828 }
        ];

        catConfigs.forEach(cfg => {
            const cat = this.createCat(cfg.x, 0.35, cfg.z, cfg.color);
            this.animals.push(cat);
        });
    }

    createDog(x, y, z, coatColor) {
        const root = new THREE.Group();
        const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.85 });
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });

        // Body / Torso
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.85), coatMat);
        body.position.y = 0.42;
        body.castShadow = true;
        root.add(body);

        // Head & Snout
        const head = new THREE.Group();
        head.position.set(0, 0.65, 0.48);

        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.35), coatMat);
        head.add(skull);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.32), coatMat);
        snout.position.set(0, -0.06, 0.26);
        head.add(snout);

        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), noseMat);
        nose.position.set(0, 0.02, 0.42);
        head.add(nose);

        // Floppy Ears
        [-0.18, 0.18].forEach(ex => {
            const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.14), coatMat);
            ear.position.set(ex, 0.08, -0.02);
            ear.rotation.z = (ex > 0 ? -0.2 : 0.2);
            head.add(ear);
        });

        root.add(head);

        // Wagging Tail
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.45), coatMat);
        tail.position.set(0, 0.52, -0.55);
        tail.rotation.x = 0.55;
        root.add(tail);

        // 4 Walking Legs
        const legGeo = new THREE.BoxGeometry(0.12, 0.38, 0.14);
        const legs = [];
        [
            { x: -0.15, z: 0.3 },
            { x: 0.15, z: 0.3 },
            { x: -0.15, z: -0.3 },
            { x: 0.15, z: -0.3 }
        ].forEach(lp => {
            const leg = new THREE.Mesh(legGeo, coatMat);
            leg.position.set(lp.x, 0.19, lp.z);
            leg.castShadow = true;
            root.add(leg);
            legs.push(leg);
        });

        root.position.set(x, y, z);
        this.scene.add(root);

        return {
            type: "dog",
            root,
            tail,
            legs,
            x, y, z,
            speed: 1.8 + Math.random() * 0.6,
            dirZ: Math.random() > 0.5 ? 1 : -1,
            barkTimer: 5 + Math.random() * 15
        };
    }

    createCat(x, y, z, color) {
        const root = new THREE.Group();
        const furMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });

        // Sleek body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.55), furMat);
        body.position.y = 0.22;
        body.castShadow = true;
        root.add(body);

        // Head & Pointy Ears
        const head = new THREE.Group();
        head.position.set(0, 0.36, 0.32);
        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), furMat);
        head.add(skull);

        [-0.08, 0.08].forEach(ex => {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), furMat);
            ear.position.set(ex, 0.16, 0);
            head.add(ear);
        });
        root.add(head);

        // Curved Tail
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45), furMat);
        tail.position.set(0, 0.32, -0.36);
        tail.rotation.x = -0.6;
        root.add(tail);

        root.position.set(x, y, z);
        this.scene.add(root);

        return {
            type: "cat",
            root,
            tail,
            x, y, z,
            idleTimer: 3.0,
            dirZ: 1
        };
    }

    update(dt, time) {
        for (let a of this.animals) {
            if (a.type === "dog") {
                // Dogs walk back and forth along sidewalks
                a.z += a.dirZ * a.speed * dt;
                if (a.z > 260) a.dirZ = -1;
                if (a.z < -260) a.dirZ = 1;

                a.root.position.set(a.x, a.y, a.z);
                a.root.rotation.y = (a.dirZ > 0) ? 0 : Math.PI;

                // Animated tail wagging
                a.tail.rotation.y = Math.sin(time * 16) * 0.45;

                // Animated leg swings
                const swing = Math.sin(time * 10) * 0.4;
                if (a.legs && a.legs.length === 4) {
                    a.legs[0].rotation.x = swing;
                    a.legs[1].rotation.x = -swing;
                    a.legs[2].rotation.x = -swing;
                    a.legs[3].rotation.x = swing;
                }

                // Random Barking
                a.barkTimer -= dt;
                if (a.barkTimer <= 0) {
                    a.barkTimer = 10 + Math.random() * 20;
                    if (this.audio && Math.random() < 0.3) {
                        this.audio.playDogBark();
                    }
                }
            } else if (a.type === "cat") {
                // Cats swish their tails leisurely
                a.tail.rotation.z = Math.sin(time * 3) * 0.3;
            }
        }
    }
}

window.AnimalManager = AnimalManager;
