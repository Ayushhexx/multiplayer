class Vehicle {
    constructor(id, data, scene, audioSystem) {
        this.id = id;
        this.type = data.type || "infernus";
        this.color = data.color || "#ff0055";
        this.isPolice = data.isPolice || false;
        this.scene = scene;
        this.audio = audioSystem;

        // Position & physics state
        this.x = data.x || 0;
        this.y = data.y || 0.4;
        this.z = data.z || 0;
        this.rot = data.rot || 0;
        this.speed = 0;
        this.steering = 0;
        this.maxSteer = 0.55;
        this.drift = 0;

        // Spec by vehicle type
        this.specs = this.getSpecs(this.type);
        this.health = data.health || 100;
        this.maxHealth = this.health;
        this.driverId = data.driverId || null;
        this.sirenActive = data.siren || false;
        this.headlightsActive = true;

        // Damage & Destruction States
        this.isDestroyed = false;
        this.despawnTimer = 0;
        this.isDrowned = false;
        this.burnSmokeTimer = 0;

        // Ballistic Flight & Stunt Jump Physics
        this.vy = 0;
        this.inAir = false;
        this.airTime = 0;
        this.jumpStartX = 0;
        this.jumpStartZ = 0;
        this.jumpStartY = 0;

        // Visuals
        this.mesh = new THREE.Group();
        this.bodyMesh = null;
        this.frontWheels = [];
        this.rearWheels = [];
        this.lightbar = null;
        this.taillights = [];
        this.underglowMesh = null;
        this.smokeParticles = [];

        this.buildModel();
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.rotation.y = this.rot;
        this.scene.add(this.mesh);
    }

    getSpecs(type) {
        switch (type) {
            case "infernus":
                return { maxSpeed: 55, accel: 36, brake: 44, turnSpeed: 2.8, mass: 1200, name: "Infernus", underglow: 0xff007f };
            case "cheetah":
                return { maxSpeed: 52, accel: 34, brake: 42, turnSpeed: 2.9, mass: 1250, name: "Cheetah", underglow: 0x00f0ff };
            case "banshee":
                return { maxSpeed: 58, accel: 39, brake: 46, turnSpeed: 3.1, mass: 1180, name: "Banshee GTS", underglow: 0x3a0ca3 };
            case "turismo":
                return { maxSpeed: 62, accel: 44, brake: 50, turnSpeed: 3.2, mass: 1100, name: "Turismo V12", underglow: 0x06d6a0 };
            case "police":
                return { maxSpeed: 48, accel: 30, brake: 40, turnSpeed: 2.6, mass: 1500, name: "VCPD Cruiser", underglow: 0x0066ff };
            case "cruiser":
                return { maxSpeed: 44, accel: 26, brake: 36, turnSpeed: 2.4, mass: 1600, name: "Ocean Cruiser", underglow: 0xffb703 };
            case "bike":
                return { maxSpeed: 60, accel: 42, brake: 48, turnSpeed: 3.5, mass: 400, name: "PCJ-600", underglow: 0x7209b7, isBike: true };
            case "sanchez":
                return { maxSpeed: 58, accel: 46, brake: 48, turnSpeed: 3.6, mass: 350, name: "Sanchez 450 Enduro", underglow: 0x00ff88, isBike: true, isDirtBike: true };
            case "truck":
                return { maxSpeed: 42, accel: 24, brake: 34, turnSpeed: 2.2, mass: 4500, name: "Mule Box Truck", underglow: 0xffaa00, isTruck: true };
            case "bus":
                return { maxSpeed: 40, accel: 20, brake: 32, turnSpeed: 2.0, mass: 8500, name: "Coach Transit Bus", underglow: 0x00f0ff, isBus: true };
            case "tank":
                return { maxSpeed: 30, accel: 20, brake: 38, turnSpeed: 1.8, mass: 60000, name: "Rhino Military Tank", underglow: 0x556b2f, armor: 600, isTank: true };
            case "helicopter":
                return { maxSpeed: 70, accel: 38, brake: 30, turnSpeed: 2.4, mass: 3500, name: "Hunter Attack Chopper", underglow: 0x00f0ff, isFlying: true };
            case "boat":
                return { maxSpeed: 48, accel: 26, brake: 26, turnSpeed: 2.2, mass: 2200, name: "Squalo Speedboat", underglow: 0x0077b6, isBoat: true };
            default:
                return { maxSpeed: 46, accel: 28, brake: 36, turnSpeed: 2.5, mass: 1300, name: "Sports Car", underglow: 0xff0055 };
        }
    }

    buildModel() {
        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.3,
            metalness: 0.7
        });
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x121216, roughness: 0.6, metalness: 0.4 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x080814,
            roughness: 0.1,
            metalness: 0.85,
            transparent: true,
            opacity: 0.82
        });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.85 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.12 });
        const discMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });

        // Neon Underglow Ground Kit
        const underglowColor = this.specs.underglow || 0x00f0ff;
        const underglowGeo = new THREE.PlaneGeometry(2.3, 3.8);
        const underglowMat = new THREE.MeshBasicMaterial({
            color: underglowColor,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.underglowMesh = new THREE.Mesh(underglowGeo, underglowMat);
        this.underglowMesh.rotation.x = -Math.PI / 2;
        this.underglowMesh.position.y = 0.05;
        this.mesh.add(this.underglowMesh);

        if (this.type === "bike") {
            // --- Realistic 3D PCJ-600 Super Sport Motorcycle ---
            const goldForkMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.95, roughness: 0.15 });
            const engineMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.5, metalness: 0.85 });
            const caliperMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.3 });
            const seatMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.75 });
            const discMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });

            // 1. Aluminum Twin-Spar Perimeter Frame
            const frameGeo = new THREE.BoxGeometry(0.48, 0.48, 1.55);
            const frame = new THREE.Mesh(frameGeo, trimMat);
            frame.position.set(0, 0.62, 0);
            frame.castShadow = true;
            this.mesh.add(frame);

            // 2. Inline-4 Engine Block with Cylinders & Crankcase
            const engine = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.65), engineMat);
            engine.position.set(0, 0.45, 0.05);
            engine.castShadow = true;
            this.mesh.add(engine);

            // Round Clutch Cover (Right side)
            const clutch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), engineMat);
            clutch.rotation.z = Math.PI / 2;
            clutch.position.set(0.24, 0.38, -0.05);
            this.mesh.add(clutch);

            // 3. Ergonomic Sculpted Fuel Tank
            const tankGeo = new THREE.BoxGeometry(0.46, 0.38, 0.72);
            const tank = new THREE.Mesh(tankGeo, bodyMat);
            tank.position.set(0, 0.98, 0.18);
            tank.castShadow = true;
            this.mesh.add(tank);

            // Chrome Gas Filler Cap
            const gasCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), chromeMat);
            gasCap.position.set(0, 1.18, 0.25);
            this.mesh.add(gasCap);

            // 4. Stepped Sport Racing Seat (Rider saddle + Pillion cowl)
            const seatRider = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.48), seatMat);
            seatRider.position.set(0, 0.88, -0.32);
            seatRider.rotation.x = -0.1;
            this.mesh.add(seatRider);

            const seatPillion = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.4), bodyMat);
            seatPillion.position.set(0, 1.02, -0.65);
            seatPillion.rotation.x = 0.18;
            this.mesh.add(seatPillion);

            // 5. Aggressive Front Aerodynamic Cowl & Windscreen
            const fairingGeo = new THREE.ConeGeometry(0.36, 0.85, 4);
            const fairing = new THREE.Mesh(fairingGeo, bodyMat);
            fairing.rotation.x = Math.PI / 2.3;
            fairing.position.set(0, 0.96, 0.82);
            fairing.castShadow = true;
            this.mesh.add(fairing);

            // Bubble Windscreen
            const screen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.04), glassMat);
            screen.position.set(0, 1.2, 0.74);
            screen.rotation.x = -0.48;
            this.mesh.add(screen);

            // Twin Projector Headlights
            [-0.12, 0.12].forEach(hx => {
                const hl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                hl.position.set(hx, 0.92, 1.08);
                this.mesh.add(hl);
            });

            // 6. Gold Inverted Telescopic Forks
            [-0.18, 0.18].forEach(fx => {
                const forkUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.55), goldForkMat);
                forkUpper.position.set(fx, 0.82, 0.78);
                forkUpper.rotation.x = 0.32;
                this.mesh.add(forkUpper);

                const forkLower = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45), chromeMat);
                forkLower.position.set(fx, 0.5, 0.92);
                forkLower.rotation.x = 0.32;
                this.mesh.add(forkLower);
            });

            // Handlebars & Triple Clamp
            const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.82), chromeMat);
            handleBar.rotation.z = Math.PI / 2;
            handleBar.position.set(0, 1.1, 0.6);
            this.mesh.add(handleBar);

            // Digital Dash Gauge Screen
            const dash = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
            dash.position.set(0, 1.12, 0.68);
            dash.rotation.x = -0.6;
            this.mesh.add(dash);

            // Dual Aerodynamic Rearview Mirrors
            [-0.35, 0.35].forEach(mx => {
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), trimMat);
                arm.position.set(mx * 0.7, 1.18, 0.65);
                arm.rotation.z = (mx > 0 ? -0.3 : 0.3);
                const mir = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.03), chromeMat);
                mir.position.set(mx, 1.22, 0.68);
                this.mesh.add(arm);
                this.mesh.add(mir);
            });

            // 7. Upswept Titanium Exhaust with Carbon Shield
            const exhaustHeader = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), chromeMat);
            exhaustHeader.rotation.x = Math.PI / 2.6;
            exhaustHeader.position.set(0.24, 0.35, -0.1);
            this.mesh.add(exhaustHeader);

            const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.75), chromeMat);
            silencer.rotation.x = Math.PI / 2.2;
            silencer.position.set(0.28, 0.62, -0.65);
            this.mesh.add(silencer);

            // 8. Wheels: Front & Rear with Floating Brake Discs & Calipers
            [
                { posZ: 0.95, isFront: true, posY: 0.36 },
                { posZ: -0.78, isFront: false, posY: 0.36 }
            ].forEach(wInfo => {
                const wGroup = new THREE.Group();
                wGroup.position.set(0, wInfo.posY, wInfo.posZ);

                // Deep Tread Motorcycle Tire
                const tireGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.17, 20);
                const tire = new THREE.Mesh(tireGeo, wheelMat);
                tire.rotation.z = Math.PI / 2;
                tire.castShadow = true;
                wGroup.add(tire);

                // Multi-spoke Alloy Wheel Rim
                const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.18, 10), rimMat);
                rim.rotation.z = Math.PI / 2;
                wGroup.add(rim);

                // Perforated Brake Disc Rotor
                const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.19, 12), discMat);
                disc.rotation.z = Math.PI / 2;
                wGroup.add(disc);

                // Red Brembo Racing Brake Caliper
                const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.1), caliperMat);
                caliper.position.set(0.11, 0.14, 0.05);
                wGroup.add(caliper);

                this.mesh.add(wGroup);
                if (wInfo.isFront) this.frontWheels.push(wGroup);
                else this.rearWheels.push(wGroup);
            });

            // LED Tail Light
            const tailLed = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
            tailLed.position.set(0, 0.95, -0.92);
            this.mesh.add(tailLed);
            this.taillights.push(tailLed);

            return;
        }

        

        if (this.type === "sanchez") {
            // --- Realistic 3D Sanchez Motocross / Enduro Dirt Bike (Matching Image 5) ---
            const goldForkMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.95, roughness: 0.15 });
            const engineMat = new THREE.MeshStandardMaterial({ color: 0x3d4048, roughness: 0.6, metalness: 0.8 });
            const seatMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.85 });
            const chromePipeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.15 });
            const discMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });

            // 1. High-Clearance Steel Cradle Frame
            const frameGeo = new THREE.BoxGeometry(0.38, 0.55, 1.6);
            const frame = new THREE.Mesh(frameGeo, trimMat);
            frame.position.set(0, 0.72, 0);
            frame.castShadow = true;
            this.mesh.add(frame);

            // 2. 450cc 4-Stroke Engine Block with Cooling Fins & Crankcase
            const engine = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.42, 0.55), engineMat);
            engine.position.set(0, 0.55, 0.05);
            engine.castShadow = true;
            this.mesh.add(engine);

            // Round Stator / Clutch Covers
            [-0.19, 0.19].forEach(cx => {
                const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), engineMat);
                cover.rotation.z = Math.PI / 2;
                cover.position.set(cx, 0.48, 0.02);
                this.mesh.add(cover);
            });

            // 3. Motocross Fuel Tank with Radiator Shrouds
            const tankGeo = new THREE.BoxGeometry(0.42, 0.35, 0.65);
            const tank = new THREE.Mesh(tankGeo, bodyMat);
            tank.position.set(0, 1.05, 0.22);
            tank.castShadow = true;
            this.mesh.add(tank);

            // Left & Right Radiator Air Scoops
            [-0.24, 0.24].forEach(sx => {
                const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.42), bodyMat);
                shroud.position.set(sx, 0.92, 0.32);
                shroud.rotation.y = (sx > 0 ? 0.2 : -0.2);
                this.mesh.add(shroud);
            });

            // 4. Long Flat Motocross Seat (Image 5)
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.95), seatMat);
            seat.position.set(0, 1.06, -0.35);
            seat.rotation.x = -0.06;
            this.mesh.add(seat);

            // 5. High Motocross Front Mudguard Fender Beak (Image 5)
            const beakGeo = new THREE.BoxGeometry(0.28, 0.04, 0.62);
            const beak = new THREE.Mesh(beakGeo, bodyMat);
            beak.position.set(0, 1.05, 0.92);
            beak.rotation.x = -0.15;
            beak.castShadow = true;
            this.mesh.add(beak);

            // High Tail Fender
            const tailGeo = new THREE.BoxGeometry(0.28, 0.04, 0.55);
            const tail = new THREE.Mesh(tailGeo, bodyMat);
            tail.position.set(0, 1.08, -0.85);
            tail.rotation.x = 0.22;
            tail.castShadow = true;
            this.mesh.add(tail);

            // Motocross Number Plate & Headlight
            const headPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            headPlate.position.set(0, 1.25, 0.72);
            this.mesh.add(headPlate);
            const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.04), new THREE.MeshBasicMaterial({ color: 0xffea00 }));
            headlight.position.set(0, 1.25, 0.75);
            this.mesh.add(headlight);

            // 6. Long-Travel Inverted Telescopic Front Forks (Image 5)
            [-0.16, 0.16].forEach(fx => {
                const forkUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.65), goldForkMat);
                forkUpper.position.set(fx, 0.95, 0.72);
                forkUpper.rotation.x = 0.34;
                this.mesh.add(forkUpper);

                const forkLower = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.55), chromePipeMat);
                forkLower.position.set(fx, 0.55, 0.88);
                forkLower.rotation.x = 0.34;
                this.mesh.add(forkLower);
            });

            // Wide Motocross Handlebars with Handguards (Image 5)
            const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.92), trimMat);
            handleBar.rotation.z = Math.PI / 2;
            handleBar.position.set(0, 1.34, 0.58);
            this.mesh.add(handleBar);

            [-0.42, 0.42].forEach(hx => {
                const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), bodyMat);
                handguard.position.set(hx, 1.34, 0.62);
                this.mesh.add(handguard);
            });

            // 7. Upswept Motocross Racing Exhaust System (Image 5)
            const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.9), chromePipeMat);
            exhaustPipe.rotation.x = Math.PI / 2.3;
            exhaustPipe.position.set(0.18, 0.52, -0.15);
            this.mesh.add(exhaustPipe);

            const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.72), chromePipeMat);
            silencer.rotation.x = Math.PI / 2.15;
            silencer.position.set(0.19, 0.88, -0.72);
            this.mesh.add(silencer);

            // 8. Knobby Spoked Dirt Bike Wheels (21" Front, 18" Rear - Image 5)
            [
                { posZ: 0.98, isFront: true, posY: 0.44, radius: 0.44 },
                { posZ: -0.78, isFront: false, posY: 0.40, radius: 0.40 }
            ].forEach(wInfo => {
                const wGroup = new THREE.Group();
                wGroup.position.set(0, wInfo.posY, wInfo.posZ);

                // Deep Knobby Off-Road Tire
                const tireGeo = new THREE.CylinderGeometry(wInfo.radius, wInfo.radius, 0.14, 18);
                const tire = new THREE.Mesh(tireGeo, wheelMat);
                tire.rotation.z = Math.PI / 2;
                tire.castShadow = true;
                wGroup.add(tire);

                // Spoked Rim Hub
                const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12), rimMat);
                hub.rotation.z = Math.PI / 2;
                wGroup.add(hub);

                // Wire Spokes (4 cross spokes)
                for (let s = 0; s < 4; s++) {
                    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.015, wInfo.radius * 1.8, 0.015), chromePipeMat);
                    spoke.rotation.x = (s / 4) * Math.PI;
                    wGroup.add(spoke);
                }

                // Wave Brake Disc
                const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 12), discMat);
                disc.rotation.z = Math.PI / 2;
                wGroup.add(disc);

                this.mesh.add(wGroup);
                if (wInfo.isFront) this.frontWheels.push(wGroup);
                else this.rearWheels.push(wGroup);
            });

            // Rear LED Tail light
            const tailLed = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
            tailLed.position.set(0, 1.05, -1.02);
            this.mesh.add(tailLed);
            this.taillights.push(tailLed);

            return;
        }

        

        if (this.type === "tank") {
            // --- 3D Rhino Military Tank ---
            const tankMat = new THREE.MeshStandardMaterial({ color: 0x475338, roughness: 0.85, metalness: 0.25 });
            const treadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });

            // Armored Hull
            const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 5.8), tankMat);
            hull.position.y = 0.95;
            hull.castShadow = true;
            hull.receiveShadow = true;
            this.mesh.add(hull);

            // Left & Right Track Treads
            [-1.5, 1.5].forEach(tx => {
                const tread = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 5.6), treadMat);
                tread.position.set(tx, 0.55, 0);
                tread.castShadow = true;
                this.mesh.add(tread);

                // Road wheels
                for (let wz = -2.2; wz <= 2.2; wz += 1.1) {
                    const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.58, 12), trimMat);
                    rw.rotation.z = Math.PI / 2;
                    rw.position.set(tx, 0.45, wz);
                    this.mesh.add(rw);
                }
            });

            // Rotating 360-degree Turret
            this.turret = new THREE.Group();
            this.turret.position.set(0, 1.55, 0);

            const turretDome = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.55, 0.8, 10), tankMat);
            turretDome.castShadow = true;
            this.turret.add(turretDome);

            // Heavy 120mm Rifled Cannon
            this.cannon = new THREE.Group();
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 4.2), trimMat);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0.15, 2.3);
            barrel.castShadow = true;
            this.cannon.add(barrel);

            const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.65), trimMat);
            muzzleBrake.position.set(0, 0.15, 4.3);
            this.cannon.add(muzzleBrake);

            // Commander Hatch & Machine Gun
            const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8), trimMat);
            hatch.position.set(0.45, 0.48, -0.2);
            this.turret.add(hatch);

            const mg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.9), chromeMat);
            mg.position.set(0.45, 0.68, 0.1);
            this.turret.add(mg);

            this.turret.add(this.cannon);
            this.mesh.add(this.turret);
            return;
        }

        

        if (this.type === "helicopter") {
            // --- 3D Hunter Attack Helicopter ---
            const camoMat = new THREE.MeshStandardMaterial({ color: 0x303a2b, roughness: 0.7, metalness: 0.3 });
            const rotorMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.3 });

            // Streamlined Attack Fuselage
            const fuselage = new THREE.Mesh(new THREE.ConeGeometry(1.2, 7.8, 8), camoMat);
            fuselage.rotation.x = Math.PI / 2;
            fuselage.position.set(0, 1.6, -0.6);
            fuselage.castShadow = true;
            this.mesh.add(fuselage);

            // Tandem Attack Cockpit Canopy
            const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 2.8), glassMat);
            canopy.position.set(0, 1.95, 1.0);
            this.mesh.add(canopy);

            // Landing Skids
            [-0.9, 0.9].forEach(sx => {
                const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.5), chromeMat);
                skid.rotation.x = Math.PI / 2;
                skid.position.set(sx, 0.25, 0);
                this.mesh.add(skid);

                [-1.2, 1.2].forEach(sz => {
                    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95), chromeMat);
                    strut.position.set(sx, 0.7, sz);
                    strut.rotation.z = (sx > 0 ? -0.2 : 0.2);
                    this.mesh.add(strut);
                });
            });

            // Weapon Wings with Rocket Pods
            const wings = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.65), camoMat);
            wings.position.set(0, 1.6, 0.4);
            this.mesh.add(wings);

            [-1.5, 1.5].forEach(wx => {
                const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.1, 8), trimMat);
                pod.rotation.x = Math.PI / 2;
                pod.position.set(wx, 1.45, 0.4);
                this.mesh.add(pod);
            });

            // Chin Gatling 20mm Cannon
            const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), chromeMat);
            gun.rotation.x = Math.PI / 2;
            gun.position.set(0, 0.9, 2.4);
            this.mesh.add(gun);

            // Main Overhead Spinning Rotor
            this.mainRotor = new THREE.Group();
            this.mainRotor.position.set(0, 2.7, 0.5);

            const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6), chromeMat);
            this.mainRotor.add(mast);

            for (let b = 0; b < 4; b++) {
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 4.2), rotorMat);
                blade.rotation.y = (b / 4) * Math.PI * 2;
                blade.position.set(0, 0.25, 2.0);
                blade.rotation.z = 0.05;
                this.mainRotor.add(blade);
            }
            this.mesh.add(this.mainRotor);

            // Tail Rotor
            this.tailRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 8), rotorMat);
            this.tailRotor.rotation.z = Math.PI / 2;
            this.tailRotor.position.set(0.18, 2.6, -4.3);
            this.mesh.add(this.tailRotor);

            return;
        }

        

        if (this.type === "boat") {
            // --- 3D Squalo Speedboat ---
            const hullMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.25, metalness: 0.4 });
            const deckMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6 });

            // V-Hull
            const hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 6.4), hullMat);
            hull.position.y = 0.45;
            hull.castShadow = true;
            this.mesh.add(hull);

            // Bow Wedge
            const bow = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 4), hullMat);
            bow.rotation.x = Math.PI / 2;
            bow.position.set(0, 0.55, 3.8);
            this.mesh.add(bow);

            // Teak Wood Cockpit Deck
            const deck = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 4.6), deckMat);
            deck.position.set(0, 0.88, 0.2);
            this.mesh.add(deck);

            // Wrap-around Windshield
            const screen = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.08), glassMat);
            screen.position.set(0, 1.15, 1.2);
            screen.rotation.x = -0.3;
            this.mesh.add(screen);

            // Twin Outboard Motors
            [-0.6, 0.6].forEach(ox => {
                const motor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.85, 0.55), trimMat);
                motor.position.set(ox, 0.55, -3.4);
                this.mesh.add(motor);
            });

            return;
        }

        if (this.type === "truck") {
            // --- 3D Commercial Delivery Box Truck (Image 5 bottom-left) ---
            const cabMat = new THREE.MeshStandardMaterial({ color: this.color || 0xf8f9fa, roughness: 0.35, metalness: 0.5 });
            const boxMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.55, metalness: 0.2 });
            const chassisMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.8 });
            const rollDoorMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d5, roughness: 0.45, metalness: 0.6 });

            // 1. Heavy Heavy-Duty Chassis Rails
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 7.8), chassisMat);
            chassis.position.set(0, 0.45, -0.4);
            chassis.castShadow = true;
            this.mesh.add(chassis);

            // 2. Commercial Driver Cab
            const cabBase = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.45, 1.8), cabMat);
            cabBase.position.set(0, 1.25, 2.3);
            cabBase.castShadow = true;
            this.mesh.add(cabBase);
            this.bodyMesh = cabBase;

            // Cab Windshield (Large flat commercial glass with sun visor)
            const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.85), glassMat);
            windshield.position.set(0, 1.45, 3.22);
            windshield.rotation.x = -0.15;
            this.mesh.add(windshield);

            const sunVisor = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.12, 0.35), trimMat);
            sunVisor.position.set(0, 1.95, 3.2);
            sunVisor.rotation.x = 0.2;
            this.mesh.add(sunVisor);

            // Driver & Passenger Side Windows
            [-1.19, 1.19].forEach(sx => {
                const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.65), glassMat);
                sideWin.rotation.y = (sx > 0 ? Math.PI / 2 : -Math.PI / 2);
                sideWin.position.set(sx, 1.45, 2.3);
                this.mesh.add(sideWin);

                // Heavy Side Mirrors
                const mirrorBracket = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), chromeMat);
                mirrorBracket.position.set(sx * 1.08, 1.45, 2.85);
                const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.18), trimMat);
                mirrorHead.position.set(sx > 0 ? 0.14 : -0.14, 0, 0);
                mirrorBracket.add(mirrorHead);
                this.mesh.add(mirrorBracket);

                // Cab side entry steps
                const step = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.55), trimMat);
                step.position.set(sx, 0.45, 2.3);
                this.mesh.add(step);
            });

            // Aerodynamic Cab Roof Wind Deflector Fairing (Image 5)
            const fairingGeo = new THREE.BoxGeometry(2.2, 0.55, 1.1);
            const fairing = new THREE.Mesh(fairingGeo, cabMat);
            fairing.position.set(0, 2.15, 2.2);
            fairing.rotation.x = -0.32;
            this.mesh.add(fairing);

            // Heavy Chrome Front Bumper & Honeycomb Grille
            const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.42, 0.35), chromeMat);
            frontBumper.position.set(0, 0.48, 3.25);
            frontBumper.castShadow = true;
            this.mesh.add(frontBumper);

            const truckGrille = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.08), trimMat);
            truckGrille.position.set(0, 0.95, 3.22);
            this.mesh.add(truckGrille);

            // Tall Vertical Chrome Exhaust Stack (Right side behind cab)
            const exhaustStack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 12), chromeMat);
            exhaustStack.position.set(1.15, 2.2, 1.25);
            this.mesh.add(exhaustStack);

            const exhaustCurvedCap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12), chromeMat);
            exhaustCurvedCap.rotation.x = 0.6;
            exhaustCurvedCap.position.set(1.15, 3.45, 1.18);
            this.mesh.add(exhaustCurvedCap);

            // Cylindrical Fuel Tank (Left side under chassis)
            const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 16), chromeMat);
            fuelTank.rotation.x = Math.PI / 2;
            fuelTank.position.set(-1.0, 0.52, 0.4);
            this.mesh.add(fuelTank);

            // 3. Huge Corrugated Commercial Freight Cargo Box (Image 5)
            const boxGeo = new THREE.BoxGeometry(2.45, 2.3, 5.2);
            const cargoBox = new THREE.Mesh(boxGeo, boxMat);
            cargoBox.position.set(0, 1.85, -1.35);
            cargoBox.castShadow = true;
            this.mesh.add(cargoBox);

            // Freight Box Side Corrugation Ribs
            for (let rz = -3.5; rz <= 0.8; rz += 0.48) {
                [-1.24, 1.24].forEach(rx => {
                    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.1, 0.06), trimMat);
                    rib.position.set(rx, 1.85, rz);
                    this.mesh.add(rib);
                });
            }

            // Box Livery Accent Stripe (Vice City Courier Teal Stripe)
            const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00b4d8 });
            [-1.24, 1.24].forEach(sx => {
                const sideStripe = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.35), stripeMat);
                sideStripe.rotation.y = (sx > 0 ? Math.PI / 2 : -Math.PI / 2);
                sideStripe.position.set(sx * 1.01, 1.85, -1.35);
                this.mesh.add(sideStripe);
            });

            // Rear Roll-Up Freight Door (Image 5)
            const rollDoor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.05, 0.08), rollDoorMat);
            rollDoor.position.set(0, 1.85, -3.96);
            this.mesh.add(rollDoor);

            // Rear Door Slats & Lock Lever
            for (let dy = 1.0; dy <= 2.7; dy += 0.28) {
                const slat = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.03, 0.02), trimMat);
                slat.position.set(0, dy, -4.01);
                this.mesh.add(slat);
            }
            const doorLatch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2), chromeMat);
            doorLatch.position.set(0.4, 1.7, -4.02);
            this.mesh.add(doorLatch);

            // Rear Heavy Loading Dock Bumper & Rubber Buffers
            const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.25), chassisMat);
            rearBumper.position.set(0, 0.48, -4.0);
            this.mesh.add(rearBumper);

            // Headlights & Tail Lights
            const hlMat = new THREE.MeshBasicMaterial({ color: 0xfff6cc });
            [-0.85, 0.85].forEach(hx => {
                const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.06), hlMat);
                hl.position.set(hx, 0.65, 3.4);
                this.mesh.add(hl);
            });

            const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
            [-0.9, 0.9].forEach(tx => {
                const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.06), tlMat);
                tl.position.set(tx, 0.52, -4.13);
                this.mesh.add(tl);
                this.taillights.push(tl);
            });

            // 6 Heavy Duty Truck Wheels (Front Steer Single, Rear Tandem Duallys)
            const truckWheelPositions = [
                { x: -1.15, y: 0.48, z: 2.3, isFront: true, isDual: false },
                { x: 1.15, y: 0.48, z: 2.3, isFront: true, isDual: false },
                { x: -1.15, y: 0.48, z: -1.8, isFront: false, isDual: true },
                { x: 1.15, y: 0.48, z: -1.8, isFront: false, isDual: true },
                { x: -1.15, y: 0.48, z: -3.0, isFront: false, isDual: true },
                { x: 1.15, y: 0.48, z: -3.0, isFront: false, isDual: true }
            ];

            truckWheelPositions.forEach(wp => {
                const wGroup = new THREE.Group();
                wGroup.position.set(wp.x, wp.y, wp.z);

                const width = wp.isDual ? 0.36 : 0.26;
                const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, width, 18), wheelMat);
                tire.rotation.z = Math.PI / 2;
                tire.castShadow = true;
                wGroup.add(tire);

                const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, width + 0.02, 12), rimMat);
                rim.rotation.z = Math.PI / 2;
                wGroup.add(rim);

                // Heavy 10-stud commercial wheel hub
                const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, width + 0.06, 10), trimMat);
                hub.rotation.z = Math.PI / 2;
                wGroup.add(hub);

                this.mesh.add(wGroup);
                if (wp.isFront) this.frontWheels.push(wGroup);
                else this.rearWheels.push(wGroup);
            });

            return;
        }

        if (this.type === "bus") {
            // --- 3D Vice City Transit Coach Bus (Image 5 bottom-right) ---
            const busBodyMat = new THREE.MeshStandardMaterial({ color: this.color || 0x0077b6, roughness: 0.3, metalness: 0.4 });
            const busSkirtMat = new THREE.MeshStandardMaterial({ color: 0x023e8a, roughness: 0.5, metalness: 0.3 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.5 });
            const windowMat = new THREE.MeshStandardMaterial({ color: 0x0a1118, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.88 });

            // 1. Aerodynamic Transit Coach Body Shell (9.6m long)
            const busBody = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.5, 9.6), busBodyMat);
            busBody.position.set(0, 1.45, 0);
            busBody.castShadow = true;
            this.mesh.add(busBody);
            this.bodyMesh = busBody;

            // Lower Ground Aerodynamic Skirt
            const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.55, 9.65), busSkirtMat);
            skirt.position.set(0, 0.55, 0);
            this.mesh.add(skirt);

            // Clean White Aerodynamic Roof
            const roof = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.28, 9.5), roofMat);
            roof.position.set(0, 2.25, 0);
            this.mesh.add(roof);

            // Roof Air-Conditioning Units
            [-1.8, 1.8].forEach(rz => {
                const acUnit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 1.8), roofMat);
                acUnit.position.set(0, 2.45, rz);
                acUnit.castShadow = true;
                this.mesh.add(acUnit);
            });

            // 2. Front Curved Panoramic Windshield & Destination Marquee (Image 5)
            const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), windowMat);
            frontWindshield.position.set(0, 1.55, 4.82);
            frontWindshield.rotation.x = -0.12;
            this.mesh.add(frontWindshield);

            // Electronic Orange LED Destination Marquee Display ("VICE CITY TRANSIT")
            const marqueeBox = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.32, 0.12), trimMat);
            marqueeBox.position.set(0, 2.2, 4.78);
            this.mesh.add(marqueeBox);

            const marqueeDisplay = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.24), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
            marqueeDisplay.position.set(0, 2.2, 4.85);
            this.mesh.add(marqueeDisplay);

            // 3. Side Panoramic Continuous Tinted Windows
            [-1.29, 1.29].forEach(sx => {
                const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 0.85), windowMat);
                sideGlass.rotation.y = (sx > 0 ? Math.PI / 2 : -Math.PI / 2);
                sideGlass.position.set(sx, 1.62, -0.1);
                this.mesh.add(sideGlass);

                // Window pillar dividers
                for (let pz = -3.8; pz <= 3.8; pz += 1.3) {
                    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.08), trimMat);
                    pillar.position.set(sx, 1.62, pz);
                    this.mesh.add(pillar);
                }

                // Dual Long Coach Mirrors
                const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5), chromeMat);
                mirrorArm.position.set(sx * 1.15, 1.6, 4.6);
                const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.15), trimMat);
                mirrorHead.position.set(sx > 0 ? 0.12 : -0.12, 0, 0);
                mirrorArm.add(mirrorHead);
                this.mesh.add(mirrorArm);
            });

            // Passenger Entry Folding Doors on Right Side
            const doorMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.5 });
            const passDoor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.7, 1.2), doorMat);
            passDoor.position.set(1.29, 1.15, 3.4);
            this.mesh.add(passDoor);

            // Rear Fastback Panel with Engine Grille Vents
            const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.75), windowMat);
            rearWindow.rotation.y = Math.PI;
            rearWindow.position.set(0, 1.65, -4.82);
            this.mesh.add(rearWindow);

            const engineVent = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.08), trimMat);
            engineVent.position.set(0, 0.9, -4.82);
            this.mesh.add(engineVent);

            // Front Xenon Dual Headlights
            const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            [-0.95, 0.95].forEach(hx => {
                const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.06), hlMat);
                hl.position.set(hx, 0.65, 4.83);
                this.mesh.add(hl);
            });

            // Rear Vertical LED Taillights
            const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
            [-1.1, 1.1].forEach(tx => {
                const tl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.06), tlMat);
                tl.position.set(tx, 0.85, -4.83);
                this.mesh.add(tl);
                this.taillights.push(tl);
            });

            // 6 Wheels: Front Steer Axle + Dual Rear Tandem Axles (Image 5)
            const busWheelPositions = [
                { x: -1.18, y: 0.48, z: 3.3, isFront: true },
                { x: 1.18, y: 0.48, z: 3.3, isFront: true },
                { x: -1.18, y: 0.48, z: -2.3, isFront: false },
                { x: 1.18, y: 0.48, z: -2.3, isFront: false },
                { x: -1.18, y: 0.48, z: -3.6, isFront: false },
                { x: 1.18, y: 0.48, z: -3.6, isFront: false }
            ];

            busWheelPositions.forEach(wp => {
                const wGroup = new THREE.Group();
                wGroup.position.set(wp.x, wp.y, wp.z);

                const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.28, 18), wheelMat);
                tire.rotation.z = Math.PI / 2;
                tire.castShadow = true;
                wGroup.add(tire);

                const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.30, 12), rimMat);
                rim.rotation.z = Math.PI / 2;
                wGroup.add(rim);

                this.mesh.add(wGroup);
                if (wp.isFront) this.frontWheels.push(wGroup);
                else this.rearWheels.push(wGroup);
            });

            return;
        }

        

        // --- 3D Car Model (Infernus, Cheetah, Police, Cruiser) ---
        // Lower aerodynamic chassis floor / front splitter
        const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 4.5), trimMat);
        splitter.position.y = 0.25;
        splitter.castShadow = true;
        this.mesh.add(splitter);

        // Main Mid Body Section
        const midBodyGeo = new THREE.BoxGeometry(2.1, 0.45, 2.0);
        const midBody = new THREE.Mesh(midBodyGeo, bodyMat);
        midBody.position.set(0, 0.5, 0);
        midBody.castShadow = true;
        this.mesh.add(midBody);
        this.bodyMesh = midBody;

        // Wedge Hood (Tapered down at front nose for sports car aerodynamics)
        const hoodGeo = new THREE.BoxGeometry(2.05, 0.32, 1.5);
        const hood = new THREE.Mesh(hoodGeo, bodyMat);
        hood.position.set(0, 0.46, 1.45);
        hood.rotation.x = 0.08;
        hood.castShadow = true;
        this.mesh.add(hood);

        // Front Grille & Air Intakes
        const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.1), trimMat);
        grille.position.set(0, 0.32, 2.26);
        this.mesh.add(grille);

        // Rear Trunk / Engine Bay Deck
        const rearDeckGeo = new THREE.BoxGeometry(2.05, 0.42, 1.25);
        const rearDeck = new THREE.Mesh(rearDeckGeo, bodyMat);
        rearDeck.position.set(0, 0.52, -1.35);
        rearDeck.castShadow = true;
        this.mesh.add(rearDeck);

        // Side Air-Intake Strakes (Testarossa style along doors)
        if (this.type === "infernus" || this.type === "cheetah") {
            [-1.07, 1.07].forEach(sx => {
                for (let si = 0; si < 3; si++) {
                    const strake = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.2), trimMat);
                    strake.position.set(sx, 0.42 + si * 0.1, 0);
                    this.mesh.add(strake);
                }
            });
        }

        // Custom Supercar Aero & Styling: Banshee GTS
        if (this.type === "banshee") {
            // White Racing Stripe down center
            const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const hoodStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 1.5), stripeMat);
            hoodStripe.rotation.x = -Math.PI / 2 + 0.08;
            hoodStripe.position.set(0, 0.63, 1.45);
            this.mesh.add(hoodStripe);

            const roofStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 1.8), stripeMat);
            roofStripe.rotation.x = -Math.PI / 2;
            roofStripe.position.set(0, 1.24, -0.15);
            this.mesh.add(roofStripe);

            // Aggressive Hood Power Bulge / Air Scoop
            const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.8), trimMat);
            scoop.position.set(0, 0.65, 1.4);
            scoop.rotation.x = 0.08;
            this.mesh.add(scoop);

            // Sidepipe Exhausts exiting along door sills
            [-1.08, 1.08].forEach(sx => {
                const sidePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), chromeMat);
                sidePipe.rotation.x = Math.PI / 2;
                sidePipe.position.set(sx, 0.22, -0.4);
                this.mesh.add(sidePipe);
            });
        }

        // Custom Supercar Aero & Styling: Turismo V12 Hypercar
        if (this.type === "turismo") {
            const carbonMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.35, metalness: 0.7 });

            // Roof Air Induction Scoop
            const roofScoop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.75), carbonMat);
            roofScoop.position.set(0, 1.3, -0.1);
            this.mesh.add(roofScoop);

            // Front Bumper Aerodynamic Canards / Dive Planes
            [-1.1, 1.1].forEach(cx => {
                const canard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.35), carbonMat);
                canard.rotation.z = (cx > 0 ? -0.25 : 0.25);
                canard.position.set(cx, 0.38, 2.1);
                this.mesh.add(canard);
            });

            // Quad Center Titanium Exhausts
            [-0.22, -0.07, 0.07, 0.22].forEach(tx => {
                const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), chromeMat);
                tip.rotation.x = Math.PI / 2;
                tip.position.set(tx, 0.42, -2.26);
                this.mesh.add(tip);
            });
        }

        // Side Mirrors
        [-1.12, 1.12].forEach(mx => {
            const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.08), bodyMat);
            mirrorArm.position.set(mx, 0.85, 0.7);
            const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.16), bodyMat);
            mirrorHead.position.set(mx > 0 ? 0.08 : -0.08, 0.02, 0);
            mirrorArm.add(mirrorHead);
            this.mesh.add(mirrorArm);
        });

        // Cabin & Windows
        if (this.type === "cruiser") {
            // Open-top Convertible with 3D Interior!
            const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 1.8), trimMat);
            interiorFloor.position.set(0, 0.45, -0.1);
            this.mesh.add(interiorFloor);

            // 2 Leather Bucket Seats with Headrests
            [-0.45, 0.45].forEach(sx => {
                const seatMat = new THREE.MeshStandardMaterial({ color: 0x660708, roughness: 0.6 });
                const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.65), seatMat);
                seatBase.position.set(sx, 0.55, -0.2);
                const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.18), seatMat);
                seatBack.position.set(sx, 0.85, -0.48);
                this.mesh.add(seatBase);
                this.mesh.add(seatBack);
            });

            // 3D Steering Wheel
            const column = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), chromeMat);
            column.rotation.x = Math.PI / 3;
            column.position.set(-0.45, 0.75, 0.35);
            this.mesh.add(column);
            const wheelTorus = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), trimMat);
            wheelTorus.rotation.x = Math.PI / 3;
            wheelTorus.position.set(-0.45, 0.9, 0.26);
            this.mesh.add(wheelTorus);

            // Slanted Windscreen Frame
            const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.5, 0.08), chromeMat);
            winFrame.position.set(0, 0.95, 0.65);
            winFrame.rotation.x = -0.42;
            this.mesh.add(winFrame);
        } else {
            // Coupe / Sedan Cabin (Slanted Windshield & Fastback Roof)
            const cabinLength = (this.isPolice ? 2.3 : 1.9);
            const cabinGeo = new THREE.BoxGeometry(1.72, 0.54, cabinLength);
            const cabinMat = (this.isPolice ? new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.4 }) : glassMat);
            const cabin = new THREE.Mesh(cabinGeo, cabinMat);
            cabin.position.set(0, 0.96, (this.isPolice ? 0.0 : -0.15));
            cabin.castShadow = true;
            this.mesh.add(cabin);

            // Windshield glass plate with sleek 45-degree rake
            const windShield = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 0.75), glassMat);
            windShield.position.set(0, 0.92, (this.isPolice ? 1.15 : 0.82));
            windShield.rotation.x = -0.58;
            this.mesh.add(windShield);

            // Rear Fastback Slanted Glass
            const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.65), glassMat);
            rearGlass.position.set(0, 0.92, (this.isPolice ? -1.15 : -1.12));
            rearGlass.rotation.x = 0.62;
            this.mesh.add(rearGlass);
        }

        // Rear Spoiler (GT Wing on Infernus, Cheetah, & Turismo; Ducktail on Banshee)
        if (this.type === "infernus" || this.type === "cheetah" || this.type === "turismo") {
            const isTurismo = this.type === "turismo";
            const wingGeo = new THREE.BoxGeometry(isTurismo ? 2.25 : 2.1, 0.08, isTurismo ? 0.52 : 0.45);
            const wing = new THREE.Mesh(wingGeo, isTurismo ? new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.35, metalness: 0.7 }) : bodyMat);
            wing.position.set(0, isTurismo ? 1.28 : 1.18, -2.05);
            this.mesh.add(wing);

            [-0.75, 0.75].forEach(x => {
                const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, isTurismo ? 0.52 : 0.42, 0.12), trimMat);
                strut.position.set(x, isTurismo ? 1.04 : 0.98, -2.05);
                this.mesh.add(strut);
            });
        } else if (this.type === "banshee") {
            // Aggressive Ducktail Lip Spoiler
            const lip = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.14, 0.28), bodyMat);
            lip.position.set(0, 0.88, -2.02);
            lip.rotation.x = -0.25;
            this.mesh.add(lip);
        }

        // Dual Chrome Exhaust Pipes
        [-0.55, 0.55].forEach(ex => {
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 12), chromeMat);
            pipe.rotation.x = Math.PI / 2;
            pipe.position.set(ex, 0.32, -2.26);
            this.mesh.add(pipe);
        });

        // Police Bullbar & Strobes
        if (this.isPolice) {
            // Front Heavy Black Push Bumper / Bullbar
            const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.15), trimMat);
            bullbar.position.set(0, 0.42, 2.32);
            this.mesh.add(bullbar);

            // Green & White Police Door Decals
            [-1.06, 1.06].forEach(px => {
                const policeStripe = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.35), new THREE.MeshStandardMaterial({ color: 0x0a5c36, roughness: 0.5 }));
                policeStripe.rotation.y = (px > 0 ? Math.PI / 2 : -Math.PI / 2);
                policeStripe.position.set(px, 0.5, 0);
                this.mesh.add(policeStripe);
            });

            // Roof Lightbar
            const lightbarBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.3), trimMat);
            lightbarBase.position.set(0, 1.3, 0);
            this.mesh.add(lightbarBase);

            const blueMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.28), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
            blueMesh.position.set(-0.35, 0, 0);
            lightbarBase.add(blueMesh);

            const redMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.28), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
            redMesh.position.set(0.35, 0, 0);
            lightbarBase.add(redMesh);

            this.lightbar = { lightbar: lightbarBase, blueMesh, redMesh, timer: 0 };
        }

        // Headlights (Pop-Up Housings with Crisp White Bulbs)
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xfff6cc });
        [-0.75, 0.75].forEach(x => {
            const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.12), trimMat);
            hlHousing.position.set(x, 0.52, 2.22);
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.05), hlMat);
            hl.position.set(0, 0, 0.05);
            hlHousing.add(hl);
            this.mesh.add(hlHousing);
        });

        // Taillights (Rear Neon Red Bar)
        const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        [-0.75, 0.75].forEach(x => {
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), tlMat);
            tl.position.set(x, 0.54, -2.22);
            this.mesh.add(tl);
            this.taillights.push(tl);
        });

        // 4 Detailed 3D Wheels (Wide Rubber Tires + 5-Spoke Star Rims)
        const wheelPositions = [
            { x: -1.06, y: 0.38, z: 1.35, isFront: true },
            { x: 1.06, y: 0.38, z: 1.35, isFront: true },
            { x: -1.06, y: 0.38, z: -1.35, isFront: false },
            { x: 1.06, y: 0.38, z: -1.35, isFront: false }
        ];

        wheelPositions.forEach(wp => {
            const wGroup = new THREE.Group();
            wGroup.position.set(wp.x, wp.y, wp.z);

            // Wide Rubber Tire
            const wGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 18);
            const wMesh = new THREE.Mesh(wGeo, wheelMat);
            wMesh.rotation.z = Math.PI / 2;
            wMesh.castShadow = true;
            wGroup.add(wMesh);

            // Chrome Lip & Center Hub
            const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.29, 10);
            const rimMesh = new THREE.Mesh(rimGeo, rimMat);
            rimMesh.rotation.z = Math.PI / 2;
            wGroup.add(rimMesh);

            // Silver brake disc rotor
            const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.27, 14), discMat);
            disc.rotation.z = Math.PI / 2;
            wGroup.add(disc);

            // Red Brembo-style brake caliper
            const caliperMat = new THREE.MeshBasicMaterial({ color: 0xee1111 });
            const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.08), caliperMat);
            caliper.position.set(wp.x > 0 ? 0.08 : -0.08, 0.12, 0);
            wGroup.add(caliper);

            // 5-Spoke Star Alloy Details
            for (let s = 0; s < 5; s++) {
                const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.03), chromeMat);
                spoke.rotation.x = (s / 5) * Math.PI * 2;
                spoke.position.x = (wp.x > 0 ? 0.14 : -0.14);
                wGroup.add(spoke);
            }

            this.mesh.add(wGroup);
            if (wp.isFront) this.frontWheels.push(wGroup);
            else this.rearWheels.push(wGroup);
        });
    }

    takeDamage(amount) {
        if (this.isDestroyed) return;
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.explodeAndBurn();
        }
    }

    explodeAndBurn() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.health = 0;
        this.speed = 0;
        this.steering = 0;
        this.despawnTimer = 30.0; // Automatically disappears after exactly 30 seconds

        // Blast explosion FX & Audio
        const blastPos = this.mesh.position.clone().add(new THREE.Vector3(0, 0.7, 0));
        if (window.gameInstance && window.gameInstance.weaponSystem) {
            window.gameInstance.weaponSystem.createExplosion(blastPos);
        }
        if (this.audio) {
            if (this.audio.playBlast) this.audio.playBlast();
            else if (this.audio.playExplosion) this.audio.playExplosion();
        }
        if (window.gameInstance && window.gameInstance.renderer) {
            window.gameInstance.renderer.addScreenShake(0.85, 0.5);
        }

        // If local player was inside, eject them and apply blast damage
        if (window.gameInstance && window.gameInstance.player && window.gameInstance.player.currentVehicle === this) {
            window.gameInstance.player.toggleVehicle();
            window.gameInstance.player.takeDamage(25, "vehicle_explosion");
            HUD.showActionHint("💥 VEHICLE BLASTED! EJECTED!");
        }

        // Change vehicle body & parts to scorched charred matte black
        const charredMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.95,
            metalness: 0.05
        });
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.material = charredMat;
            }
        });

        // Hide underglow, siren strobes, and lights
        if (this.underglowMesh) this.underglowMesh.visible = false;
        if (this.lightbar && this.lightbar.lightbar) this.lightbar.lightbar.visible = false;
        this.taillights.forEach(tl => { tl.visible = false; });
    }

    spawnBurntSmoke(pos) {
        const smokeGeo = new THREE.SphereGeometry(0.5, 6, 6);
        const smokeMat = new THREE.MeshBasicMaterial({
            color: 0x111116,
            transparent: true,
            opacity: 0.8
        });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.set(pos.x + (Math.random() - 0.5) * 1.2, pos.y + 0.6, pos.z + (Math.random() - 0.5) * 1.2);
        this.scene.add(smoke);
        this.smokeParticles.push({ mesh: smoke, life: 1.2, scale: 1.0, isBlack: true });
    }

    spawnWaterSplash(pos) {
        const splashGeo = new THREE.SphereGeometry(0.4, 6, 6);
        const splashMat = new THREE.MeshBasicMaterial({
            color: 0x90e0ef,
            transparent: true,
            opacity: 0.7
        });
        const splash = new THREE.Mesh(splashGeo, splashMat);
        splash.position.set(pos.x + (Math.random() - 0.5) * 1.5, pos.y + 0.2, pos.z + (Math.random() - 0.5) * 1.5);
        this.scene.add(splash);
        this.smokeParticles.push({ mesh: splash, life: 0.45, scale: 1.0 });
    }

    spawnTireSmoke(pos) {
        const smokeGeo = new THREE.SphereGeometry(0.4, 6, 6);
        const smokeMat = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.5
        });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.set(pos.x + (Math.random() - 0.5) * 0.4, 0.3, pos.z + (Math.random() - 0.5) * 0.4);
        this.scene.add(smoke);
        this.smokeParticles.push({ mesh: smoke, life: 0.55, scale: 1.0 });
    }

    updateDestroyed(dt) {
        if (!this.isDestroyed) return;
        this.speed = 0;
        this.steering = 0;
        this.burnSmokeTimer += dt;
        if (this.burnSmokeTimer >= 0.2) {
            this.burnSmokeTimer = 0;
            this.spawnBurntSmoke(this.mesh.position);
        }

        // Update smoke particles on wreckage
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= dt;
            p.scale += dt * (p.isBlack ? 2.5 : 3.5);
            p.mesh.scale.set(p.scale, p.scale, p.scale);
            p.mesh.position.y += dt * 1.8;
            p.mesh.material.opacity = Math.max(0, p.life * 0.8);
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.smokeParticles.splice(i, 1);
            }
        }

        // Countdown 30 seconds before automatic disappearance
        this.despawnTimer -= dt;
        if (this.despawnTimer <= 0) {
            this.scene.remove(this.mesh);
            if (window.gameInstance && window.gameInstance.vehicles) {
                delete window.gameInstance.vehicles[this.id];
            }
        }
    }

    updatePhysics(dt, input, world) {
        // Destroyed Wreckage Handling
        if (this.isDestroyed) {
            this.updateDestroyed(dt);
            return;
        }

        

        if (!input) return;

        const specs = this.specs;

        // Water and Land Zone Verification
        const isInWaterZone = world ? world.isWater(this.x, this.z) : false;
        const isBoatOnLand = (this.type === "boat" && !isInWaterZone);

        // Acceleration / Reverse (Blocked if car engine is drowned, or if boat is on dry land!)
        if (input.forward && !this.isDrowned && !isBoatOnLand) {
            this.speed += specs.accel * dt;
            if (this.speed > specs.maxSpeed) this.speed = specs.maxSpeed;
        } else if (input.backward && !this.isDrowned && !isBoatOnLand) {
            this.speed -= (specs.brake * 0.7) * dt;
            if (this.speed < -specs.maxSpeed * 0.4) this.speed = -specs.maxSpeed * 0.4;
        } else {
            this.speed *= Math.max(0, 1.0 - dt * (this.isDrowned || isBoatOnLand ? 5.0 : 1.5));
            if (Math.abs(this.speed) < 0.1) this.speed = 0;
        }

        if (isBoatOnLand && (input.forward || input.backward)) {
            if (this.driverId && window.gameInstance && window.gameInstance.player && window.gameInstance.player.currentVehicle === this) {
                HUD.showActionHint("⚠️ BOATS ONLY WORK IN WATER! Cannot drive on roads or dry land!");
            }
        }

        // Taillights brighten on brake
        const isBraking = input.backward || input.handbrake;
        this.taillights.forEach(tl => {
            tl.material.color.setHex(isBraking ? 0xff0000 : 0x880022);
        });

        // Handbrake & Drift Smoke
        if (input.handbrake && !this.isDrowned) {
            this.drift = Math.min(this.drift + dt * 4, 1.0);
            this.speed *= Math.max(0, 1.0 - dt * 2.5);
            if (Math.abs(this.speed) > 8) {
                if (this.audio) this.audio.playTireScreech();
                this.rearWheels.forEach(w => {
                    const worldPos = new THREE.Vector3();
                    w.getWorldPosition(worldPos);
                    this.spawnTireSmoke(worldPos);
                });
            }
        } else {
            this.drift = Math.max(this.drift - dt * 3, 0);
        }

        // Steering (A/Left turns Left, D/Right turns Right)
        let steerInput = 0;
        if (input.left) steerInput -= 1;
        if (input.right) steerInput += 1;

        this.steering += (steerInput * this.maxSteer - this.steering) * dt * 14;

        this.frontWheels.forEach(w => {
            w.rotation.y = this.steering * 0.8;
        });

        if (Math.abs(this.speed) > 0.1) {
            const reverseFactor = this.speed >= 0 ? 1 : -1;
            const driftBonus = 1.0 + this.drift * 0.9;
            this.rot -= this.steering * specs.turnSpeed * reverseFactor * driftBonus * (Math.abs(this.speed) / specs.maxSpeed) * dt;
        }

        const forwardVector = new THREE.Vector3(
            Math.sin(this.rot),
            0,
            Math.cos(this.rot)
        );

        const newX = this.x + forwardVector.x * this.speed * dt;
        const newZ = this.z + forwardVector.z * this.speed * dt;

        // Anti-Stuck Collision Resolution (Only apply when close to ground, not flying high in air)
        const canCollideWithGroundProps = (!this.inAir || this.y < 2.0);
        if (canCollideWithGroundProps && world && world.checkCollision(newX, newZ, 1.8)) {
            this.speed = -this.speed * 0.25;
            this.x -= forwardVector.x * (this.speed >= 0 ? 0.35 : -0.35);
            this.z -= forwardVector.z * (this.speed >= 0 ? 0.35 : -0.35);
            if (this.audio) this.audio.playPunch();
        } else {
            this.x = newX;
            this.z = newZ;
        }

        // Expanded World Boundaries (Extended Ocean Drive & Islands: Z: -490 to +490, X: -190 to 940)
        this.x = Math.max(-190, Math.min(940, this.x));
        this.z = Math.max(-490, Math.min(490, this.z));

        // Water Drowning & Height Physics (Post-movement)
        const curRampHeight = world ? world.checkRampHeight(this.x, this.z) : 0;
        const curInWaterZone = world ? world.isWater(this.x, this.z) : false;

        if (this.type === "helicopter") {
            // Hunter Attack Chopper Flight Controls
            this.isDrowned = false;
            if (!this.altitude) this.altitude = 1.0;

            if (input.jump) {
                this.altitude = Math.min(75, this.altitude + 16 * dt);
            } else if (input.handbrake || input.sprint) {
                this.altitude = Math.max(1.0, this.altitude - 14 * dt);
            }

            this.y = this.altitude;

            if (this.mainRotor) this.mainRotor.rotation.y += dt * 36;
            if (this.tailRotor) this.tailRotor.rotation.x += dt * 36;

            this.mesh.rotation.x = (input.forward ? 0.24 : (input.backward ? -0.16 : 0));
            this.mesh.rotation.z = -this.steering * 0.45;
        } else if (this.type === "boat") {
            // Speedboat: Only operates smoothly on ocean waves!
            if (!curInWaterZone) {
                // Boat is on dry land / roads: engine stalled and sits idle on the ground
                this.speed *= Math.max(0, 1.0 - dt * 5.0);
                this.y = 0.35 + (curRampHeight > 0 ? curRampHeight : 0);
                this.mesh.rotation.x = 0;
                this.mesh.rotation.z = 0;
            } else {
                this.isDrowned = false;
                const waveY = (world && world.waterTime) ? Math.sin(this.x * 0.05 + world.waterTime) * 0.35 : 0.2;
                this.y = 0.28 + waveY;
                this.mesh.rotation.x = (input.forward ? -0.12 : 0);
                this.mesh.rotation.z = -this.steering * 0.25;

                // Dynamic water wake & ocean spray when speeding in water
                if (Math.abs(this.speed) > 4 && Math.random() < 0.35) {
                    const wakePos = this.mesh.position.clone().add(new THREE.Vector3(
                        -Math.sin(this.rot) * 2.6,
                        0.05,
                        -Math.cos(this.rot) * 2.6
                    ));
                    this.spawnWaterSplash(wakePos);
                }
            }
        } else {
            // Cars, Bikes, Tanks: CANNOT WORK IN WATER!
            if (curInWaterZone && (!this.inAir || this.y < 0.2)) {
                this.isDrowned = true;
                this.speed *= Math.max(0, 1.0 - dt * 3.5); // engine stalls & stops
                this.y = -0.45; // sinks partially into the water
                this.inAir = false;
                this.vy = 0;

                if (Math.random() < 0.25) {
                    this.spawnWaterSplash(new THREE.Vector3(this.x, -0.1, this.z));
                }

                if (this.driverId && window.gameInstance && window.gameInstance.player && window.gameInstance.player.currentVehicle === this) {
                    HUD.showActionHint("⚠️ ENGINE DROWNED IN WATER! Cars and bikes cannot work in water — only boats operate!");
                }
            } else {
                this.isDrowned = false;
                const baseGroundOffset = (this.type === "tank" ? 0.6 : (this.type === "truck" || this.type === "bus" ? 0.55 : 0.4));
                let targetGroundY = (curRampHeight > 0 ? curRampHeight : 0) + baseGroundOffset;

                // Query stunt ramp information
                const rampInfo = world && world.getRampInfo ? world.getRampInfo(this.x, this.z) : null;

                if (!this.inAir) {
                    if (rampInfo && rampInfo.onRamp) {
                        // Vehicle is actively driving on a stunt ramp!
                        this.y = rampInfo.height + baseGroundOffset;

                        // Visual pitch climbing the ramp slope
                        this.mesh.rotation.x = -Math.sin(rampInfo.slopeAngle);

                        // Check if crossing the crest moving forward at speed (STUNT JUMP LAUNCH!)
                        if (rampInfo.isCrest && this.speed > 5.0) {
                            const launchSpeed = Math.abs(this.speed);
                            this.vy = launchSpeed * Math.sin(rampInfo.slopeAngle) * 1.5 + 5.5;
                            this.inAir = true;
                            this.airTime = 0;
                            this.jumpStartX = this.x;
                            this.jumpStartZ = this.z;
                            this.jumpStartY = this.y;

                            // Smoke burst on launch crest
                            for (let i = 0; i < 4; i++) {
                                this.spawnTireSmoke(this.mesh.position.clone().add(new THREE.Vector3(
                                    (Math.random() - 0.5) * 1.5,
                                    -0.2,
                                    (Math.random() - 0.5) * 1.5
                                )));
                            }
                            if (this.audio) this.audio.playPunch();
                        }
                    } else {
                        // If vehicle drives off an elevated cliff or bridge into open air
                        if (this.y > targetGroundY + 0.6 && this.speed > 4.0) {
                            this.inAir = true;
                            this.vy = 0.5;
                            this.airTime = 0;
                            this.jumpStartX = this.x;
                            this.jumpStartZ = this.z;
                            this.jumpStartY = this.y;
                        } else {
                            // Smoothly track ground elevation
                            this.y = targetGroundY;
                            this.mesh.rotation.x = 0;
                        }
                    }
                }

                // Ballistic Air Flight Physics
                if (this.inAir) {
                    const gravity = 17.5;
                    this.vy -= gravity * dt;
                    this.y += this.vy * dt;
                    this.airTime += dt;

                    // Aerodynamic flight pitch (tilts up initially, levels off, pitches down as descending)
                    const flightPitch = Math.atan2(this.vy, Math.abs(this.speed) + 4.5) * 0.45;
                    this.mesh.rotation.x = -flightPitch;

                    // In-air steering yaw control for mid-air stunt control (like GTA Vice City)
                    this.rot += this.steering * 1.1 * dt;

                    // Mid-air air resistance
                    this.speed *= (1.0 - 0.05 * dt);

                    // Landing Check
                    if (this.y <= targetGroundY) {
                        this.y = targetGroundY;
                        this.inAir = false;

                        // Landing suspension bounce & sound
                        if (this.vy < -4.5 && this.audio) {
                            this.audio.playPunch();
                        }

                        // Landing tire screech smoke burst
                        for (let i = 0; i < 6; i++) {
                            this.spawnTireSmoke(this.mesh.position.clone().add(new THREE.Vector3(
                                (Math.random() - 0.5) * 2.0,
                                -0.2,
                                (Math.random() - 0.5) * 2.0
                            )));
                        }

                        // Stunt Jump Reward & HUD Banner
                        if (this.airTime >= 0.55) {
                            const jumpDist = Math.hypot(this.x - (this.jumpStartX || this.x), this.z - (this.jumpStartZ || this.z));
                            const stuntBonus = Math.min(1000, Math.floor(250 + jumpDist * 16 + this.airTime * 200));

                            if (this.driverId && window.gameInstance && window.gameInstance.player && window.gameInstance.player.currentVehicle === this) {
                                window.gameInstance.player.money += stuntBonus;
                                if (window.HUD && window.HUD.showActionHint) {
                                    window.HUD.showActionHint(`⭐ INSANE STUNT JUMP! +$${stuntBonus} (Air: ${this.airTime.toFixed(1)}s, Dist: ${jumpDist.toFixed(1)}m)`);
                                }
                                if (window.gameInstance.renderer) {
                                    window.gameInstance.renderer.addScreenShake(0.4, 0.25);
                                }
                            }
                        }

                        this.vy = 0;
                        this.airTime = 0;
                    }
                }
            }

            const wheelRotSpeed = (this.speed / 0.38) * dt;
            this.frontWheels.forEach(w => {
                if (w.children && w.children.length > 0) w.children[0].rotation.x += wheelRotSpeed;
                else w.rotation.x += wheelRotSpeed;
            });
            this.rearWheels.forEach(w => {
                if (w.children && w.children.length > 0) w.children[0].rotation.x += wheelRotSpeed;
                else w.rotation.x += wheelRotSpeed;
            });

            if (this.type === "bike" || this.type === "sanchez") {
                this.mesh.rotation.z = -this.steering * (Math.abs(this.speed) / specs.maxSpeed) * 0.45;
            } else if (this.bodyMesh) {
                this.bodyMesh.rotation.z = this.steering * (this.speed / specs.maxSpeed) * 0.16;
                if (!this.inAir) {
                    this.bodyMesh.rotation.x = (input.forward ? 0.05 : (input.backward ? -0.05 : 0));
                }
            }
        }

        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.rotation.y = this.rot;

        if (this.audio && this.driverId && !this.isDrowned) {
            this.audio.updateEngineSound(Math.abs(this.speed) / specs.maxSpeed);
        }

        // Flashing Lightbar for Police
        if (this.isPolice && this.lightbar && !this.isDestroyed) {
            this.lightbar.timer += dt * 10;
            const flash = Math.sin(this.lightbar.timer) > 0;
            this.lightbar.blueMesh.material.color.setHex(flash ? 0x00f0ff : 0x001144);
            this.lightbar.redMesh.material.color.setHex(!flash ? 0xff0044 : 0x440011);
        }

        // Update Smoke Particles
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= dt;
            p.scale += dt * 3.5;
            p.mesh.scale.set(p.scale, p.scale, p.scale);
            p.mesh.position.y += dt * 1.2;
            p.mesh.material.opacity = Math.max(0, p.life * 1.2);
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.smokeParticles.splice(i, 1);
            }
        }
    }

    setNetworkState(data) {
        if (!data) return;
        this.x = data.x ?? this.x;
        this.y = data.y ?? this.y;
        this.z = data.z ?? this.z;
        this.rot = data.rot ?? this.rot;
        this.speed = data.speed ?? this.speed;
        this.steering = data.steering ?? this.steering;

        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.rotation.y = this.rot;

        this.frontWheels.forEach(w => {
            w.rotation.y = this.steering * 0.8;
        });
    }

    toggleSiren() {
        if (!this.isPolice) return;
        this.sirenActive = !this.sirenActive;
        if (this.audio) {
            this.audio.toggleSiren(this.sirenActive);
        }
    }

    fireCannon() {
        if (this.type !== "tank" || !this.cannon) return;
        const now = performance.now();
        if (this.lastCannonFire && (now - this.lastCannonFire) < 1400) return;
        this.lastCannonFire = now;

        if (this.audio) {
            this.audio.playTankCannon();
            this.audio.playBlast();
        }

        const muzzle = new THREE.Vector3();
        this.cannon.getWorldPosition(muzzle);
        const fwd = new THREE.Vector3(Math.sin(this.rot), 0, Math.cos(this.rot));
        muzzle.add(fwd.clone().multiplyScalar(4.2));
        muzzle.y += 0.2;

        if (window.gameInstance && window.gameInstance.weaponSystem) {
            window.gameInstance.weaponSystem.spawnMuzzleFlash(muzzle);
            window.gameInstance.weaponSystem.spawnRocket(muzzle, fwd, (hit) => {
                window.gameInstance.weaponSystem.createExplosion(hit.pos);
            });
        }
    }
}

window.Vehicle = Vehicle;
