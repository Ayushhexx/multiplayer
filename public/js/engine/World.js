class World {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.waterMesh = null;
        this.waterGeo = null;
        this.waterTime = 0;
        this.props = [];
        this.ramps = [];
        this.palmFronds = []; // For wind sway animation

        // Build entire enhanced city
        this.buildMap();
    }

    buildMap() {
        this.buildRoadsAndGround();
        this.buildBeachAndOcean();
        this.buildPalmTrees();
        this.buildArtDecoHotels();
        this.buildDowntownSkyscrapers();
        this.buildStreetProps();
        this.buildStuntRamps();
        this.buildViceBayBridge();
        this.buildDinosaurIsland();
        this.buildMountainDrivingComplex();
        this.buildMountainHighway();
        this.buildBeachMarina();
        this.buildSkySystem();
    }

    buildRoadsAndGround() {
        const asphaltTex = TextureGenerator.createAsphaltTexture();
        asphaltTex.repeat.set(4, 45);

        // Main Ocean Drive Boulevard (Extended Map: Length 1100, Z from -550 to +550)
        const roadGeo = new THREE.PlaneGeometry(36, 1100, 8, 48);
        const roadMat = new THREE.MeshStandardMaterial({
            map: asphaltTex,
            roughness: 0.6,
            metalness: 0.25
        });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0.02, 0);
        road.receiveShadow = true;
        this.scene.add(road);

        // Painted Yellow Center Dashed Lines along expanded map
        for (let z = -530; z <= 530; z += 10) {
            const lineGeo = new THREE.PlaneGeometry(0.45, 5.5);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.035, z);
            this.scene.add(line);
        }

        // White Lane Edge Dividers
        [-17, 17].forEach(edgeX => {
            const edgeGeo = new THREE.PlaneGeometry(0.35, 1100);
            const edgeMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
            const edge = new THREE.Mesh(edgeGeo, edgeMat);
            edge.rotation.x = -Math.PI / 2;
            edge.position.set(edgeX, 0.035, 0);
            this.scene.add(edge);
        });

        // Expanded Cross Streets (East-West Avenues across the extended city)
        [-420, -280, -140, 0, 140, 280, 420].forEach(crossZ => {
            const crossTex = TextureGenerator.createAsphaltTexture();
            crossTex.repeat.set(10, 2);
            const crossGeo = new THREE.PlaneGeometry(240, 22);
            const crossMat = new THREE.MeshStandardMaterial({ map: crossTex, roughness: 0.65 });
            const crossRoad = new THREE.Mesh(crossGeo, crossMat);
            crossRoad.rotation.x = -Math.PI / 2;
            crossRoad.position.set(-80, 0.022, crossZ);
            crossRoad.receiveShadow = true;
            this.scene.add(crossRoad);

            // Crosswalk zebra stripes
            [-10, 10].forEach(sideX => {
                for (let k = -9; k <= 9; k += 2.4) {
                    const zebraGeo = new THREE.PlaneGeometry(1.6, 0.9);
                    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                    const zebra = new THREE.Mesh(zebraGeo, zebraMat);
                    zebra.rotation.x = -Math.PI / 2;
                    zebra.position.set(sideX, 0.04, crossZ + k);
                    this.scene.add(zebra);
                }
            });
        });

        // Textured Sidewalks (Art Deco pastel tile texture)
        const sidewalkTex = TextureGenerator.createSidewalkTexture();
        sidewalkTex.repeat.set(1, 65);

        const createSidewalk = (x, width, length) => {
            const curbGeo = new THREE.BoxGeometry(width, 0.3, length);
            const curbMat = new THREE.MeshStandardMaterial({
                map: sidewalkTex,
                roughness: 0.55
            });
            const curb = new THREE.Mesh(curbGeo, curbMat);
            curb.position.set(x, 0.15, 0);
            curb.receiveShadow = true;
            curb.castShadow = true;
            this.scene.add(curb);
        };
        createSidewalk(-21.5, 7, 1100); // West sidewalk (Hotels)
        createSidewalk(21.5, 7, 1100);  // East sidewalk (Beachside)
    }

    buildBeachAndOcean() {
        // High-Res Sandy Beach (X from 25 to 135, Length 1100)
        const sandTex = TextureGenerator.createSandTexture();
        sandTex.repeat.set(8, 45);

        const sandGeo = new THREE.PlaneGeometry(125, 1100, 16, 48);
        const sandMat = new THREE.MeshStandardMaterial({
            map: sandTex,
            roughness: 0.85,
            metalness: 0.05
        });
        const sand = new THREE.Mesh(sandGeo, sandMat);
        sand.rotation.x = -Math.PI / 2;
        sand.position.set(87.5, 0.015, 0);
        sand.receiveShadow = true;
        this.scene.add(sand);

        // Wet Shoreline Strip (Reflective glistening sand)
        const wetGeo = new THREE.PlaneGeometry(18, 1100);
        const wetMat = new THREE.MeshStandardMaterial({
            color: 0x9c7a52,
            roughness: 0.15,
            metalness: 0.5
        });
        const wet = new THREE.Mesh(wetGeo, wetMat);
        wet.rotation.x = -Math.PI / 2;
        wet.position.set(144, 0.018, 0);
        this.scene.add(wet);

        // Realistic Tropical Turquoise Caribbean Ocean (Matching Image 4 reference)
        this.waterGeo = new THREE.PlaneGeometry(1600, 1800, 72, 72);
        const oceanMat = new THREE.MeshStandardMaterial({
            color: 0x00b4d8, // Luminous tropical Caribbean cyan (matching Image 4)
            emissive: 0x002b49, // Deep translucent azure glow
            roughness: 0.10,
            metalness: 0.55,
            transparent: true,
            opacity: 0.85
        });
        this.waterMesh = new THREE.Mesh(this.waterGeo, oceanMat);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.set(480, -0.15, 0);
        this.scene.add(this.waterMesh);

        // Underwater Seabed Terrain & Coastal Rock Shelves (Visible through clear translucent water like Image 4!)
        const seabedMat = new THREE.MeshStandardMaterial({ color: 0x143448, roughness: 0.88 });
        const seabedGeo = new THREE.PlaneGeometry(1600, 1800, 16, 16);
        const seabed = new THREE.Mesh(seabedGeo, seabedMat);
        seabed.rotation.x = -Math.PI / 2;
        seabed.position.set(480, -5.6, 0);
        seabed.receiveShadow = true;
        this.scene.add(seabed);

        // Subsurface coral rocks & underwater geological shelf formations along the water channel
        const rockShelfMat = new THREE.MeshStandardMaterial({ color: 0x19455c, roughness: 0.92 });
        for (let rx = 50; rx <= 190; rx += 35) {
            [-120, -50, 40, 120, 220].forEach(rz => {
                const shelf = new THREE.Mesh(new THREE.DodecahedronGeometry(6.5 + Math.random() * 4, 1), rockShelfMat);
                shelf.position.set(rx + (Math.random() - 0.5) * 12, -4.0, rz + (Math.random() - 0.5) * 12);
                shelf.scale.set(1.4, 0.65, 1.4);
                this.scene.add(shelf);
            });
        }

        // Lifeguard Towers with Art Deco styling
        [-350, -210, -90, 30, 150, 270, 390].forEach(z => {
            const tower = new THREE.Group();

            // White wooden stilts
            for (let dx of [-1.6, 1.6]) {
                for (let dz of [-1.6, 1.6]) {
                    const stiltGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5);
                    const stiltMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
                    const stilt = new THREE.Mesh(stiltGeo, stiltMat);
                    stilt.position.set(dx, 1.75, dz);
                    stilt.castShadow = true;
                    tower.add(stilt);
                }
            }

            // Cabin (Cyan Vice City body)
            const cabinGeo = new THREE.BoxGeometry(3.6, 2.6, 3.6);
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.4 });
            const cabin = new THREE.Mesh(cabinGeo, cabinMat);
            cabin.position.set(0, 4.4, 0);
            cabin.castShadow = true;
            tower.add(cabin);

            // Windows
            const winMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
            const win = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.0, 3.7), winMat);
            win.position.set(0, 4.5, 0);
            tower.add(win);

            // Hot Pink Pyramid Roof
            const roofGeo = new THREE.ConeGeometry(3.2, 1.4, 4);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0xff2a85, roughness: 0.5 });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(0, 6.3, 0);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            tower.add(roof);

            tower.position.set(115, 0, z);
            this.scene.add(tower);

            this.colliders.push({
                minX: 115 - 2, maxX: 115 + 2,
                minZ: z - 2, maxZ: z + 2
            });
        });
    }

    buildPalmTrees() {
        const barkTex = TextureGenerator.createPalmBarkTexture();

        const createPalm = (x, z) => {
            const palm = new THREE.Group();

            // Segmented trunk
            const trunkGeo = new THREE.CylinderGeometry(0.28, 0.46, 10, 8);
            const trunkMat = new THREE.MeshStandardMaterial({
                map: barkTex,
                roughness: 0.8
            });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 5.0;
            trunk.rotation.z = (Math.random() - 0.5) * 0.16;
            trunk.castShadow = true;
            palm.add(trunk);

            // Palm Fronds / Leaves with wind sway
            const leafMat = new THREE.MeshStandardMaterial({
                color: 0x2d6a4f,
                roughness: 0.5,
                side: THREE.DoubleSide
            });

            const fronds = [];
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const leafGeo = new THREE.ConeGeometry(1.6, 6.5, 4);
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.set(
                    Math.cos(angle) * 2.2,
                    9.8,
                    Math.sin(angle) * 2.2
                );
                leaf.rotation.x = Math.PI / 2.2;
                leaf.rotation.z = angle;
                palm.add(leaf);
                fronds.push(leaf);
            }

            this.palmFronds.push({ fronds, phase: Math.random() * Math.PI * 2 });

            palm.position.set(x, 0, z);
            this.scene.add(palm);

            this.colliders.push({
                minX: x - 0.6, maxX: x + 0.6,
                minZ: z - 0.6, maxZ: z + 0.6
            });
        };

        // Palm row along beachfront
        for (let z = -270; z <= 270; z += 18) {
            createPalm(23.5, z);
        }
        // Palm row along hotel sidewalks
        for (let z = -260; z <= 260; z += 30) {
            createPalm(-23.5, z);
        }
    }

    buildArtDecoHotels() {
        const winTex = TextureGenerator.createWindowsTexture();

        const hotels = [
            { name: "THE OCEAN VIEW", color: 0xffccd5, neon: 0xff007f, z: -40, height: 28, width: 30 },
            { name: "THE MALIBU CLUB", color: 0xb5e2fa, neon: 0x00f0ff, z: 25, height: 34, width: 34 },
            { name: "VICE CASINO", color: 0xfdf0d5, neon: 0xffb703, z: 95, height: 44, width: 36 },
            { name: "SUNSET PALMS", color: 0xedc4b3, neon: 0x7209b7, z: -105, height: 24, width: 32 },
            { name: "NEON MOTEL", color: 0xffb3c1, neon: 0xff0055, z: -170, height: 20, width: 28 },
            { name: "TROPICANA RESORT", color: 0xcbf3f0, neon: 0x00f5d4, z: 165, height: 38, width: 34 }
        ];

        hotels.forEach(h => {
            const hotelGroup = new THREE.Group();
            const posX = -43;

            // Main Building Mass
            const bldgGeo = new THREE.BoxGeometry(26, h.height, h.width);
            const bldgMat = new THREE.MeshStandardMaterial({
                color: h.color,
                roughness: 0.6,
                metalness: 0.15
            });
            const bldg = new THREE.Mesh(bldgGeo, bldgMat);
            bldg.position.set(0, h.height / 2, 0);
            bldg.castShadow = true;
            bldg.receiveShadow = true;
            hotelGroup.add(bldg);

            // Windows Facade with Texture
            const facadeGeo = new THREE.PlaneGeometry(h.width * 0.9, h.height * 0.85);
            const facadeMat = new THREE.MeshBasicMaterial({ map: winTex });
            const facade = new THREE.Mesh(facadeGeo, facadeMat);
            facade.rotation.y = Math.PI / 2;
            facade.position.set(13.05, h.height * 0.48, 0);
            hotelGroup.add(facade);

            // Art Deco Striped Entrance Awning
            const awningGeo = new THREE.BoxGeometry(4, 0.4, 12);
            const awningMat = new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.4 });
            const awning = new THREE.Mesh(awningGeo, awningMat);
            awning.position.set(14.8, 3.8, 0);
            awning.castShadow = true;
            hotelGroup.add(awning);

            // Glowing 3D Neon Marquee Billboard (Glows with Unreal Bloom!)
            const signGeo = new THREE.BoxGeometry(1.2, 4.0, h.width * 0.75);
            const signMat = new THREE.MeshBasicMaterial({
                color: h.neon
            });
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(13.7, h.height - 2.8, 0);
            hotelGroup.add(sign);

            // Rooftop HVAC Air Conditioner Units
            [-4, 4].forEach(dz => {
                const acGeo = new THREE.BoxGeometry(3.5, 2.2, 3.0);
                const acMat = new THREE.MeshStandardMaterial({ color: 0x4a4e69, metalness: 0.8 });
                const ac = new THREE.Mesh(acGeo, acMat);
                ac.position.set(-2, h.height + 1.1, dz);
                ac.castShadow = true;
                hotelGroup.add(ac);
            });

            // Rooftop Communications Antenna Mast
            const mastGeo = new THREE.CylinderGeometry(0.12, 0.25, 12);
            const mastMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
            const mast = new THREE.Mesh(mastGeo, mastMat);
            mast.position.set(5, h.height + 6, 0);
            hotelGroup.add(mast);

            // Red Aviation Flashing Warning Beacon
            const beaconGeo = new THREE.SphereGeometry(0.5, 8, 8);
            const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const beacon = new THREE.Mesh(beaconGeo, beaconMat);
            beacon.position.set(5, h.height + 12, 0);
            hotelGroup.add(beacon);

            hotelGroup.position.set(posX, 0, h.z);
            this.scene.add(hotelGroup);

            this.colliders.push({
                minX: posX - 14, maxX: posX + 14,
                minZ: h.z - h.width / 2 - 1, maxZ: h.z + h.width / 2 + 1
            });
        });
    }

    buildDowntownSkyscrapers() {
        const winTex = TextureGenerator.createWindowsTexture('#00f0ff');

        for (let z = -260; z <= 260; z += 48) {
            const height = 75 + Math.random() * 85;
            const width = 34 + Math.random() * 18;
            const depth = 32 + Math.random() * 18;

            const towerGeo = new THREE.BoxGeometry(depth, height, width);
            const towerMat = new THREE.MeshStandardMaterial({
                color: 0x121124,
                roughness: 0.4,
                metalness: 0.7
            });
            const tower = new THREE.Mesh(towerGeo, towerMat);
            const posX = -115 - Math.random() * 35;
            tower.position.set(posX, height / 2, z);
            tower.castShadow = true;
            this.scene.add(tower);

            // Window facade on towers
            const towerWin = new THREE.Mesh(
                new THREE.PlaneGeometry(width * 0.9, height * 0.8),
                new THREE.MeshBasicMaterial({ map: winTex })
            );
            towerWin.rotation.y = Math.PI / 2;
            towerWin.position.set(posX + depth / 2 + 0.1, height * 0.45, z);
            this.scene.add(towerWin);

            this.colliders.push({
                minX: posX - depth / 2, maxX: posX + depth / 2,
                minZ: z - width / 2, maxZ: z + width / 2
            });
        }
    }

    buildStreetProps() {
        // Glowing Streetlights along Ocean Drive
        for (let z = -270; z <= 270; z += 28) {
            [-18, 18].forEach(x => {
                const pole = new THREE.Group();

                // Sleek chrome/dark lamppost
                const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 8.5);
                const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85 });
                const poleMesh = new THREE.Mesh(poleGeo, poleMat);
                poleMesh.position.y = 4.25;
                poleMesh.castShadow = true;
                pole.add(poleMesh);

                // Curved Arm
                const armGeo = new THREE.BoxGeometry(x < 0 ? 3.0 : -3.0, 0.18, 0.18);
                const armMesh = new THREE.Mesh(armGeo, poleMat);
                armMesh.position.set(x < 0 ? 1.5 : -1.5, 8.4, 0);
                pole.add(armMesh);

                // Glowing Neon Bulb (Blooms with UnrealBloomPass!)
                const bulbColor = (z % 56 === 0) ? 0x00f0ff : 0xff2a85;
                const bulbGeo = new THREE.SphereGeometry(0.55, 12, 12);
                const bulbMat = new THREE.MeshBasicMaterial({ color: bulbColor });
                const bulb = new THREE.Mesh(bulbGeo, bulbMat);
                bulb.position.set(x < 0 ? 2.9 : -2.9, 8.2, 0);
                pole.add(bulb);

                pole.position.set(x, 0, z);
                this.scene.add(pole);

                this.props.push({ type: "pole", mesh: pole, x, z });
            });
        }

        // Fire Hydrants
        [-70, -10, 60, 130].forEach(z => {
            const hydrant = new THREE.Group();
            const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.1, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0033, roughness: 0.3 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.55;
            hydrant.add(body);

            const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bodyMat);
            cap.position.y = 1.1;
            hydrant.add(cap);

            hydrant.position.set(19.5, 0, z);
            this.scene.add(hydrant);
            this.props.push({ type: "hydrant", mesh: hydrant, x: 19.5, z, burst: false });
        });
    }

    createStuntRamp(spec) {
        // spec: { id, x, z, baseY, rotY, length, width, height, color }
        const rGroup = new THREE.Group();

        const L = spec.length;
        const W = spec.width;
        const H = spec.height;
        const halfL = L / 2;
        const halfW = W / 2;

        const rampGeo = new THREE.BufferGeometry();
        const positions = [];
        const uvs = [];
        const normals = [];

        const addTri = (p1, p2, p3, n) => {
            positions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], p3[0], p3[1], p3[2]);
            normals.push(n[0], n[1], n[2], n[0], n[1], n[2], n[0], n[1], n[2]);
            uvs.push(0, 0, 1, 0, 1, 1);
        };

        const addQuad = (p1, p2, p3, p4, n) => {
            addTri(p1, p2, p3, n);
            addTri(p1, p3, p4, n);
        };

        const slopeAngle = Math.atan2(H, L);
        const topN = [0, Math.cos(slopeAngle), -Math.sin(slopeAngle)];

        // 1. Top sloped driving surface (local -Z entrance to +Z crest)
        const vTopBL = [-halfW, 0, -halfL];
        const vTopBR = [halfW, 0, -halfL];
        const vTopTR = [halfW, H, halfL];
        const vTopTL = [-halfW, H, halfL];
        addQuad(vTopBL, vTopBR, vTopTR, vTopTL, topN);

        // 2. Smooth lead-in apron at entrance (-halfL - 2.5m to -halfL)
        const vApronBL = [-halfW, -0.05, -halfL - 2.5];
        const vApronBR = [halfW, -0.05, -halfL - 2.5];
        addQuad(vApronBL, vApronBR, vTopBR, vTopBL, [0, 1, 0]);

        // 3. Vertical back drop wall at crest (z = halfL)
        const vBackBL = [-halfW, 0, halfL];
        const vBackBR = [halfW, 0, halfL];
        addQuad(vBackBL, vTopTL, vTopTR, vBackBR, [0, 0, 1]);

        // 4. Left side triangular wall (x = -halfW)
        addTri(vTopBL, vTopTL, vBackBL, [-1, 0, 0]);

        // 5. Right side triangular wall (x = +halfW)
        addTri(vTopBR, vBackBR, vTopTR, [1, 0, 0]);

        // 6. Bottom base (y = 0)
        addQuad(vTopBL, vBackBL, vBackBR, vTopBR, [0, -1, 0]);

        rampGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        rampGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        rampGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        const rampMat = new THREE.MeshStandardMaterial({
            color: spec.color || 0xff0055,
            metalness: 0.4,
            roughness: 0.35
        });

        const rampMesh = new THREE.Mesh(rampGeo, rampMat);
        rampMesh.castShadow = true;
        rampMesh.receiveShadow = true;
        rGroup.add(rampMesh);

        // Glowing Neon Chevrons along the sloped deck pointing UP in the launch direction (+Z)
        const chevronMat = new THREE.MeshBasicMaterial({ color: 0xffea00, side: THREE.DoubleSide });
        const numChevrons = Math.max(3, Math.floor(L / 3.5));
        for (let c = 0; c < numChevrons; c++) {
            const frac = (c + 0.6) / (numChevrons + 0.5);
            const cz = -halfL + frac * L;
            const cy = frac * H + 0.05;

            // Chevron left wing
            const chL = new THREE.Mesh(new THREE.BoxGeometry(halfW * 0.45, 0.05, 0.45), chevronMat);
            chL.position.set(-halfW * 0.22, cy, cz);
            chL.rotation.x = -slopeAngle;
            chL.rotation.y = 0.35;
            rGroup.add(chL);

            // Chevron right wing
            const chR = new THREE.Mesh(new THREE.BoxGeometry(halfW * 0.45, 0.05, 0.45), chevronMat);
            chR.position.set(halfW * 0.22, cy, cz);
            chR.rotation.x = -slopeAngle;
            chR.rotation.y = -0.35;
            rGroup.add(chR);
        }

        // Side hazard guardrails
        [-halfW, halfW].forEach(gx => {
            const railGeo = new THREE.CylinderGeometry(0.2, 0.2, L * 1.02, 6);
            const railMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 });
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.rotation.x = Math.PI / 2 - slopeAngle;
            rail.position.set(gx, H / 2 + 0.35, 0);
            rGroup.add(rail);

            // Strobe beacon at the crest
            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffea00 }));
            beacon.position.set(gx, H + 0.4, halfL);
            rGroup.add(beacon);
        });

        rGroup.position.set(spec.x, spec.baseY, spec.z);
        rGroup.rotation.y = spec.rotY;
        this.scene.add(rGroup);

        const rampEntry = {
            id: spec.id || ("ramp_" + this.ramps.length),
            x: spec.x,
            z: spec.z,
            baseY: spec.baseY,
            rotY: spec.rotY,
            length: L,
            width: W,
            height: H,
            slopeAngle: slopeAngle
        };
        this.ramps.push(rampEntry);
        return rampEntry;
    }

    buildStuntRamps() {
        // Mainland & Beach Ramps with verified smooth entrance approach & launch headings
        this.createStuntRamp({
            id: "ramp_mainland_north",
            x: -6, z: 70, baseY: 0,
            rotY: 0, // Launches South towards Ocean Drive beach (+Z)
            length: 15, width: 8, height: 4.5,
            color: 0xff0055
        });

        this.createStuntRamp({
            id: "ramp_mainland_south",
            x: 8, z: -130, baseY: 0,
            rotY: Math.PI, // Launches North towards Downtown (-Z)
            length: 15, width: 8, height: 4.5,
            color: 0xff0055
        });

        this.createStuntRamp({
            id: "ramp_beach_jump",
            x: 36, z: -50, baseY: 0.6,
            rotY: Math.PI / 2, // Launches East towards the ocean bay (+X)
            length: 18, width: 10, height: 5.2,
            color: 0x00f0ff
        });
    }

    buildViceBayBridge() {
        const asphaltTex = TextureGenerator.createAsphaltTexture();
        asphaltTex.repeat.set(12, 2);

        const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x24242e, roughness: 0.65, metalness: 0.4 });
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x5a5f66, roughness: 0.8, metalness: 0.2 });
        const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.6 });
        const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x485563, roughness: 0.6, metalness: 0.5 });
        const cableMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8 });

        // =========================================================================
        // 1. MAIN VICE BAY BRIDGE (Spans water at z = 0, Width = 24m)
        // =========================================================================

        // Main Bridge Deck (Spans from x = 55 to x = 195 at z = 0, width = 24, surface y = 3.8)
        const deckGeo = new THREE.BoxGeometry(140, 1.2, 24);
        const deck = new THREE.Mesh(deckGeo, roadMat);
        deck.position.set(125, 3.2, 0);
        deck.receiveShadow = true;
        this.scene.add(deck);

        // --- WEST APPROACH & SOLID MAINLAND ABUTMENT (x = 20 to 55) ---
        // Road surface climbs smoothly from mainland beach y = 0.6 up to bridge deck y = 3.8
        const westAngle = Math.atan2(3.2, 35);
        const westRamp = new THREE.Mesh(new THREE.BoxGeometry(35.5, 1.0, 24), roadMat);
        westRamp.position.set(37.5, 2.0, 0);
        westRamp.rotation.z = westAngle;
        westRamp.receiveShadow = true;
        this.scene.add(westRamp);

        // Solid concrete foundation embankment underneath West Ramp (Fills space from y = -5 up to ramp)
        const westAbutment = new THREE.Mesh(new THREE.BoxGeometry(36, 7.0, 25), concreteMat);
        westAbutment.position.set(37.5, -1.0, 0);
        westAbutment.receiveShadow = true;
        this.scene.add(westAbutment);

        // Concrete retaining side wing walls (North z = 12.5, South z = -12.5)
        [-12.5, 12.5].forEach(wz => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(36, 4.0, 1.2), concreteMat);
            wing.position.set(37.5, 1.5, wz);
            this.scene.add(wing);
        });

        // --- EAST APPROACH & SOLID ISLAND ABUTMENT (x = 195 to 225) ---
        // Road surface descends smoothly from deck y = 3.8 down to Isla Nublar arrival concourse y = 0.62
        const eastAngle = Math.atan2(3.18, 30);
        const eastRamp = new THREE.Mesh(new THREE.BoxGeometry(30.5, 1.0, 24), roadMat);
        eastRamp.position.set(210, 2.0, 0);
        eastRamp.rotation.z = -eastAngle;
        eastRamp.receiveShadow = true;
        this.scene.add(eastRamp);

        // Solid concrete foundation embankment underneath East Ramp (Completely closes any void or gap!)
        const eastAbutment = new THREE.Mesh(new THREE.BoxGeometry(32, 7.0, 25), concreteMat);
        eastAbutment.position.set(210, -1.0, 0);
        eastAbutment.receiveShadow = true;
        this.scene.add(eastAbutment);

        // Concrete retaining side wing walls
        [-12.5, 12.5].forEach(wz => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(32, 4.0, 1.2), concreteMat);
            wing.position.set(210, 1.5, wz);
            this.scene.add(wing);
        });

        // Smooth transition apron at East Bridge Ramp landing (x = 223 to 229) to eliminate any step or lip!
        const eastApron = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.35, 24.2), roadMat);
        eastApron.position.set(226, 0.69, 0);
        eastApron.rotation.z = -Math.atan2(0.18, 6.5);
        eastApron.receiveShadow = true;
        this.scene.add(eastApron);

        // Smooth transition apron at West Bridge Ramp landing (x = 17 to 23)
        const westApron = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.35, 24.2), roadMat);
        westApron.position.set(20, 0.69, 0);
        westApron.rotation.z = Math.atan2(0.18, 6.5);
        westApron.receiveShadow = true;
        this.scene.add(westApron);

        // --- HEAVY ARCHITECTURAL MARINE PIERS & CUTWATERS IN WATER (x = 65, 95, 125, 155, 185) ---
        const stoneArchMat = new THREE.MeshStandardMaterial({ color: 0x333842, roughness: 0.7, metalness: 0.35 });
        const lampGlobeMat = new THREE.MeshBasicMaterial({ color: 0xfff5d6 });
        const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.8, metalness: 0.6 });

        [65, 95, 125, 155, 185].forEach(px => {
            // Submerged marine foundation column deep into seabed
            const pierCol = new THREE.Mesh(new THREE.BoxGeometry(4.6, 10.0, 24), concreteMat);
            pierCol.position.set(px, -1.8, 0);
            this.scene.add(pierCol);

            // Pier cross-cap supporting deck beams
            const pierCap = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.4, 25.8), concreteMat);
            pierCap.position.set(px, 2.5, 0);
            this.scene.add(pierCap);

            // Architectural triangular cutwater breakwaters on North and South sides (Image 1 & 2)
            [-12.2, 12.2].forEach(cz => {
                const cutwaterGeo = new THREE.ConeGeometry(2.4, 5.5, 3);
                const cutwater = new THREE.Mesh(cutwaterGeo, concreteMat);
                cutwater.rotation.y = (cz > 0 ? 0 : Math.PI);
                cutwater.position.set(px, 0.4, cz);
                this.scene.add(cutwater);
            });
        });

        // --- STRUCTURAL ARCH RIBS & SPANDREL POSTS UNDER BRIDGE DECK (Matching Images 1, 2, 3) ---
        // Creates realistic arched masonry & steel truss ribs curving between the piers beneath the road deck
        const archSpans = [
            { x1: 55, x2: 95 },
            { x1: 95, x2: 125 },
            { x1: 125, x2: 155 },
            { x1: 155, x2: 195 }
        ];

        archSpans.forEach(span => {
            const midX = (span.x1 + span.x2) / 2;
            const spanLen = span.x2 - span.x1;
            const archSteps = 12;

            [-10.8, 10.8].forEach(az => {
                // Curved arch rib composed of connected structural segments
                for (let s = 0; s < archSteps; s++) {
                    const t1 = s / archSteps;
                    const t2 = (s + 1) / archSteps;
                    const ax1 = span.x1 + t1 * spanLen;
                    const ax2 = span.x1 + t2 * spanLen;

                    // Parabolic arch rise formula: y = baseY + 4 * rise * t * (1 - t)
                    const ay1 = 0.8 + 4 * 2.2 * t1 * (1 - t1);
                    const ay2 = 0.8 + 4 * 2.2 * t2 * (1 - t2);

                    const segLen = Math.hypot(ax2 - ax1, ay2 - ay1);
                    const segAngle = Math.atan2(ay2 - ay1, ax2 - ax1);

                    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.15, 0.6, 0.7), stoneArchMat);
                    archBeam.position.set((ax1 + ax2) / 2, (ay1 + ay2) / 2, az);
                    archBeam.rotation.z = segAngle;
                    archBeam.receiveShadow = true;
                    this.scene.add(archBeam);

                    // Vertical spandrel strut post connecting arch to road deck bottom (y = 3.2)
                    if (s > 0 && s < archSteps) {
                        const strutHeight = Math.max(0.2, 3.2 - ay1);
                        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.35, strutHeight, 0.45), stoneArchMat);
                        strut.position.set(ax1, ay1 + strutHeight / 2, az);
                        strut.receiveShadow = true;
                        this.scene.add(strut);
                    }
                }
            });

            // Under-deck lateral cross-brace steel beams
            for (let bx = span.x1 + 6; bx < span.x2; bx += 8) {
                const crossTie = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 21.6), stoneArchMat);
                const tRel = (bx - span.x1) / spanLen;
                const archY = 0.8 + 4 * 2.2 * tRel * (1 - tRel);
                crossTie.position.set(bx, archY + 0.3, 0);
                this.scene.add(crossTie);
            }
        });

        // --- STEPPED QUAYSIDE STONE EMBANKMENTS AT ABUTMENTS (Matching Image 2) ---
        // Terraced masonry revetments descending into the water at West (x=38 to 55) and East (x=195 to 212)
        [
            { startX: 42, dir: 1, baseZ: 0 },
            { startX: 208, dir: -1, baseZ: 0 }
        ].forEach(quay => {
            for (let step = 0; step < 4; step++) {
                const qx = quay.startX + quay.dir * (step * 3.2);
                const qy = 1.4 - step * 0.45;
                const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 26.5), concreteMat);
                stepMesh.position.set(qx, qy, quay.baseZ);
                stepMesh.receiveShadow = true;
                this.scene.add(stepMesh);
            }
        });

        // --- CLASSICAL PROMENADE STREET LAMPPOSTS WITH GLOWING GLOBES (Matching Image 2 bottom-right) ---
        for (let lx = 24; lx <= 222; lx += 16) {
            [-12.3, 12.3].forEach(lz => {
                const lampGroup = new THREE.Group();
                lampGroup.position.set(lx, 0, lz);

                let groundY = 3.8;
                if (lx < 55) groundY = 0.6 + ((lx - 18) / 37) * 3.2;
                else if (lx > 195) groundY = 0.62 + ((228 - lx) / 33) * 3.18;

                // Cast-iron lamp post standard
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 2.4, 8), lampPostMat);
                post.position.set(0, groundY + 1.2, 0);
                post.castShadow = true;
                lampGroup.add(post);

                // Ornate pedestal base
                const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.34), lampPostMat);
                base.position.set(0, groundY + 0.2, 0);
                lampGroup.add(base);

                // Classical glowing frosted glass spherical globe lantern (Image 2 bottom-right)
                const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), lampGlobeMat);
                globe.position.set(0, groundY + 2.55, 0);
                lampGroup.add(globe);

                // Lamp crown finial
                const finial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), lampPostMat);
                finial.position.set(0, groundY + 2.92, 0);
                lampGroup.add(finial);

                this.scene.add(lampGroup);
            });
        }

        // Center Yellow Highway Dashes on Main Bridge (Seamless continuous line)
        for (let bx = 22; bx <= 224; bx += 8) {
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.45), yellowMat);
            dash.rotation.x = -Math.PI / 2;
            let dy = 3.82;
            if (bx < 55) {
                dy = 0.62 + ((bx - 20) / 35) * 3.2 + 0.02;
                dash.rotation.z = westAngle;
            } else if (bx > 195) {
                dy = 0.64 + ((225 - bx) / 30) * 3.18 + 0.02;
                dash.rotation.z = -eastAngle;
            }
            dash.position.set(bx, dy, 0);
            this.scene.add(dash);
        }

        // Bridge Safety Guardrails (North z = 12.0, South z = -12.0)
        [-12.0, 12.0].forEach(gz => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(206, 1.4, 0.4), bridgeMat);
            rail.position.set(122.5, 4.3, gz);
            rail.castShadow = true;
            this.scene.add(rail);

            this.colliders.push({
                minX: 20, maxX: 226,
                minZ: gz - 0.6, maxZ: gz + 0.6
            });
        });

        // Twin Suspension Towers (Tower 1 at x = 85, Tower 2 at x = 165)
        [85, 165].forEach(tx => {
            [-12.5, 12.5].forEach(tz => {
                // Tower Pylons
                const pylon = new THREE.Mesh(new THREE.BoxGeometry(3.6, 42, 3.6), towerMat);
                pylon.position.set(tx, 18, tz);
                pylon.castShadow = true;
                this.scene.add(pylon);

                // Glowing Cyan Neon Crest
                const crest = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.2, 3.8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
                crest.position.set(tx, 39, tz);
                this.scene.add(crest);

                this.colliders.push({
                    minX: tx - 2.0, maxX: tx + 2.0,
                    minZ: tz - 2.0, maxZ: tz + 2.0
                });
            });

            // Crossbeam Arch connecting the two pylons
            const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.2, 28), towerMat);
            crossbeam.position.set(tx, 34, 0);
            this.scene.add(crossbeam);

            // Suspension Cables hanging down to the deck
            [-11.5, 11.5].forEach(cz => {
                const points = [
                    new THREE.Vector3(tx - 45, 3.8, cz),
                    new THREE.Vector3(tx, 38, cz),
                    new THREE.Vector3(tx + 45, 3.8, cz)
                ];
                const cableGeo = new THREE.BufferGeometry().setFromPoints(points);
                const cable = new THREE.Line(cableGeo, cableMat);
                this.scene.add(cable);
            });
        });

        // =========================================================================
        // 2. SOUTH BAY OCEAN CAUSEWAY (Crossing water at z = 180, Width = 24m)
        // =========================================================================

        const southDeck = new THREE.Mesh(deckGeo.clone(), roadMat);
        southDeck.position.set(125, 3.2, 180);
        southDeck.receiveShadow = true;
        this.scene.add(southDeck);

        const southWestRamp = new THREE.Mesh(new THREE.BoxGeometry(35.5, 1.0, 24), roadMat);
        southWestRamp.position.set(37.5, 2.0, 180);
        southWestRamp.rotation.z = westAngle;
        southWestRamp.receiveShadow = true;
        this.scene.add(southWestRamp);

        const southWestAbutment = new THREE.Mesh(new THREE.BoxGeometry(36, 7.0, 25), concreteMat);
        southWestAbutment.position.set(37.5, -1.0, 180);
        this.scene.add(southWestAbutment);

        const southEastRamp = new THREE.Mesh(new THREE.BoxGeometry(30.5, 1.0, 24), roadMat);
        southEastRamp.position.set(210, 2.0, 180);
        southEastRamp.rotation.z = -eastAngle;
        southEastRamp.receiveShadow = true;
        this.scene.add(southEastRamp);

        const southEastAbutment = new THREE.Mesh(new THREE.BoxGeometry(32, 7.0, 25), concreteMat);
        southEastAbutment.position.set(210, -1.0, 180);
        this.scene.add(southEastAbutment);

        // Marine Piers on South Causeway
        [65, 95, 125, 155, 185].forEach(px => {
            const pierCol = new THREE.Mesh(new THREE.BoxGeometry(4.2, 10.0, 24), concreteMat);
            pierCol.position.set(px, -1.8, 180);
            this.scene.add(pierCol);

            const pierCap = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.2, 25.5), concreteMat);
            pierCap.position.set(px, 2.5, 180);
            this.scene.add(pierCap);
        });

        // Structural Under-Deck Arch Ribs & Promenade Lampposts on South Causeway (z = 180)
        archSpans.forEach(span => {
            const spanLen = span.x2 - span.x1;
            const archSteps = 10;
            [-10.8, 10.8].forEach(az => {
                for (let s = 0; s < archSteps; s++) {
                    const t1 = s / archSteps;
                    const t2 = (s + 1) / archSteps;
                    const ax1 = span.x1 + t1 * spanLen;
                    const ax2 = span.x1 + t2 * spanLen;
                    const ay1 = 0.8 + 4 * 2.2 * t1 * (1 - t1);
                    const ay2 = 0.8 + 4 * 2.2 * t2 * (1 - t2);
                    const segLen = Math.hypot(ax2 - ax1, ay2 - ay1);
                    const segAngle = Math.atan2(ay2 - ay1, ax2 - ax1);
                    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.15, 0.6, 0.7), stoneArchMat);
                    archBeam.position.set((ax1 + ax2) / 2, (ay1 + ay2) / 2, 180 + az);
                    archBeam.rotation.z = segAngle;
                    this.scene.add(archBeam);
                }
            });
        });

        for (let lx = 24; lx <= 222; lx += 18) {
            [-12.3, 12.3].forEach(lz => {
                let groundY = 3.8;
                if (lx < 55) groundY = 0.6 + ((lx - 18) / 37) * 3.2;
                else if (lx > 195) groundY = 0.62 + ((228 - lx) / 33) * 3.18;
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 2.4, 8), lampPostMat);
                post.position.set(lx, groundY + 1.2, 180 + lz);
                this.scene.add(post);
                const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), lampGlobeMat);
                globe.position.set(lx, groundY + 2.55, 180 + lz);
                this.scene.add(globe);
            });
        }

        // Center Yellow Dashes on South Bridge
        for (let bx = 22; bx <= 224; bx += 8) {
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.45), yellowMat);
            dash.rotation.x = -Math.PI / 2;
            let dy = 3.82;
            if (bx < 55) {
                dy = 0.62 + ((bx - 20) / 35) * 3.2 + 0.02;
                dash.rotation.z = westAngle;
            } else if (bx > 195) {
                dy = 0.64 + ((225 - bx) / 30) * 3.18 + 0.02;
                dash.rotation.z = -eastAngle;
            }
            dash.position.set(bx, dy, 180);
            this.scene.add(dash);
        }

        // Guardrails on South Bridge
        [-12.0, 12.0].forEach(gz => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(206, 1.4, 0.4), bridgeMat);
            rail.position.set(122.5, 4.3, 180 + gz);
            rail.castShadow = true;
            this.scene.add(rail);

            this.colliders.push({
                minX: 20, maxX: 226,
                minZ: 180 + gz - 0.6, maxZ: 180 + gz + 0.6
            });
        });

        // Glowing Light Pylons on South Causeway
        [60, 100, 140, 180].forEach(px => {
            [-12.5, 12.5].forEach(pz => {
                const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8), towerMat);
                pylon.position.set(px, 7.0, 180 + pz);
                this.scene.add(pylon);
                const lightCap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
                lightCap.position.set(px, 11.0, 180 + pz);
                this.scene.add(lightCap);
            });
        });
    }

    buildDinosaurIsland() {
        // =========================================================================
        // 1. MASSIVE EXPANDED ISLAND GROUND (X: 190 to 950, Z: -480 to +480)
        // Over 4.3x larger drivable landmass with room to drift, race and explore!
        // =========================================================================
        const islandGeo = new THREE.PlaneGeometry(760, 960, 32, 32);
        const jungleMat = new THREE.MeshStandardMaterial({
            color: 0x1b3b1e, // Deep emerald prehistoric tropical jungle
            roughness: 0.88,
            metalness: 0.05
        });
        const island = new THREE.Mesh(islandGeo, jungleMat);
        island.rotation.x = -Math.PI / 2;
        island.position.set(570, 0.58, 0);
        island.receiveShadow = true;
        this.scene.add(island);

        // Prehistoric Sand Shore Ring framing the massive continent
        const shoreGeo = new THREE.RingGeometry(360, 520, 32);
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.85 });
        const shore = new THREE.Mesh(shoreGeo, sandMat);
        shore.rotation.x = -Math.PI / 2;
        shore.position.set(570, 0.52, 0);
        this.scene.add(shore);

        // =========================================================================
        // 2. GRAND ISLA NUBLAR ARRIVAL CONCOURSE (x = 215 to 275, z = -17 to +17)
        // Seamlessly bridges the water ramp directly to island asphalt grounds!
        // =========================================================================
        const asphaltTex = TextureGenerator.createAsphaltTexture();
        asphaltTex.repeat.set(6, 2);
        const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.6 });

        const concourseGeo = new THREE.BoxGeometry(60, 0.8, 34);
        const concourse = new THREE.Mesh(concourseGeo, roadMat);
        concourse.position.set(245, 0.22, 0);
        concourse.receiveShadow = true;
        this.scene.add(concourse);

        // Stone Curbs flanking the Grand Concourse
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x495057, roughness: 0.7 });
        [-17.2, 17.2].forEach(cz => {
            const curb = new THREE.Mesh(new THREE.BoxGeometry(60, 0.4, 0.6), stoneMat);
            curb.position.set(245, 0.66, cz);
            this.scene.add(curb);
        });

        // Yellow directional arrows on concourse
        const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        for (let ax = 228; ax <= 268; ax += 10) {
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 0.45), yellowMat);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(ax, 0.63, 0);
            this.scene.add(dash);
        }

        // =========================================================================
        // 3. ICONIC JURASSIC CONTAINMENT GATE AT BRIDGE EXIT (x = 228)
        // Mounted on solid stone pedestal foundations resting flush on the ground!
        // =========================================================================
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.85 });

        [-13.5, 13.5].forEach(pz => {
            // Solid stone foundation pedestal
            const pedestal = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.8, 4.8), stoneMat);
            pedestal.position.set(228, 1.4, pz);
            pedestal.castShadow = true;
            this.scene.add(pedestal);

            // Carved wooden gate pylon rising from the pedestal
            const pylon = new THREE.Mesh(new THREE.BoxGeometry(3.4, 15, 3.4), woodMat);
            pylon.position.set(228, 9.5, pz);
            pylon.castShadow = true;
            this.scene.add(pylon);

            // Flaming Brazier Torch on top of the pylon
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 6), new THREE.MeshBasicMaterial({ color: 0xff5500 }));
            flame.position.set(228, 17.5, pz);
            this.scene.add(flame);

            this.colliders.push({
                minX: 225.5, maxX: 230.5,
                minZ: pz - 2.4, maxZ: pz + 2.4
            });
        });

        // Massive Overhead Timber Arch Sign
        const arch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 30.5), woodMat);
        arch.position.set(228, 15.5, 0);
        this.scene.add(arch);

        // Glowing Neon Jurassic Sign
        const signMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 24), signMat);
        sign.position.set(226.3, 15.5, 0);
        this.scene.add(sign);

        // Prehistoric T-Rex Fossil Bone Arches along concourse avenue
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d5, roughness: 0.8 });
        [285, 335, 385, 435].forEach(bx => {
            const arch = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.75, 8, 16, Math.PI), boneMat);
            arch.rotation.y = Math.PI / 2;
            arch.position.set(bx, 0.58, 0);
            arch.castShadow = true;
            this.scene.add(arch);
        });

        // =========================================================================
        // 4. STEAMING VOLCANIC PEAK (At x = 430, z = -140)
        // =========================================================================
        const volcanoGeo = new THREE.ConeGeometry(46, 38, 16);
        const volcanoMat = new THREE.MeshStandardMaterial({ color: 0x241d19, roughness: 0.95 });
        const volcano = new THREE.Mesh(volcanoGeo, volcanoMat);
        volcano.position.set(430, 18, -140);
        volcano.castShadow = true;
        this.scene.add(volcano);

        // Molten Lava Glow in Crater
        const lava = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1, 8), new THREE.MeshBasicMaterial({ color: 0xff3300 }));
        lava.position.set(430, 36.5, -140);
        this.scene.add(lava);

        // Collider for rocky volcano cone
        this.colliders.push({
            minX: 450, maxX: 475,
            minZ: -160, maxZ: -120
        });

        // Prehistoric Dinosaur Nests with Giant Eggs
        const eggMat = new THREE.MeshStandardMaterial({ color: 0x06d6a0, roughness: 0.4 });
        const nestLocations = [
            { x: 310, z: 70 },
            { x: 390, z: -50 },
            { x: 440, z: 90 },
            { x: 580, z: 40 },
            { x: 670, z: -40 }
        ];

        nestLocations.forEach(n => {
            const nest = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.6, 6, 12), woodMat);
            nest.rotation.x = -Math.PI / 2;
            nest.position.set(n.x, 0.7, n.z);
            this.scene.add(nest);

            [-0.8, 0, 0.8].forEach((ex, idx) => {
                const egg = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), eggMat);
                egg.scale.set(1.0, 1.45, 1.0);
                egg.position.set(n.x + ex, 1.2, n.z + (idx === 1 ? 0.6 : -0.3));
                egg.castShadow = true;
                this.scene.add(egg);
            });
        });

        // Prehistoric Jungle Flora across the expanded continent
        const junglePalmGeo = new THREE.CylinderGeometry(0.4, 0.65, 14, 6);
        const palmWoodMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0c, roughness: 0.8 });
        const fernMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.6 });

        for (let i = 0; i < 50; i++) {
            const jx = 260 + Math.random() * 450;
            const jz = -350 + Math.random() * 700;
            // Leave main roads, plaza and mountain summit clear!
            if (Math.abs(jz) < 22) continue;
            if (Math.hypot(jx - 430, jz - (-140)) < 95) continue;
            if (jx > 510 && jx < 690 && jz > -220 && jz < -60) continue;

            const trunk = new THREE.Mesh(junglePalmGeo, palmWoodMat);
            trunk.position.set(jx, 7, jz);
            trunk.castShadow = true;
            this.scene.add(trunk);

            for (let f = 0; f < 6; f++) {
                const frond = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 6.0), fernMat);
                frond.rotation.x = Math.PI / 2.3;
                frond.rotation.z = (f / 6) * Math.PI * 2;
                frond.position.set(jx, 13.5, jz);
                this.scene.add(frond);
            }
        }
    }

    // =========================================================================
    // GRAND MOUNTAIN DRIVING COMPLEX (Around Mountain at x = 430, z = -140)
    // - 4-Lane Mountain Perimeter Ring Road (R = 80m loop)
    // - Massive Stunt & Drift Arena (160m x 140m skidpad with dual mega ramps)
    // - Foothill Rally Dirt Circuit
    // - Interconnecting Arterial Highways
    // =========================================================================
    buildMountainDrivingComplex() {
        const asphaltTex = TextureGenerator.createAsphaltTexture();
        asphaltTex.repeat.set(4, 2);
        const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.6 });
        const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x495057, metalness: 0.6, roughness: 0.4 });
        const postMat = new THREE.MeshStandardMaterial({ color: 0x212529, roughness: 0.8 });
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });

        const mCenter = { x: 430, z: -140 };
        const ringRadius = 80;
        const ringSegments = 16;
        const ringWidth = 22;

        // 1. FOUR-LANE PERIMETER RING ROAD CIRCLING THE MOUNTAIN
        for (let i = 0; i < ringSegments; i++) {
            const a1 = (i / ringSegments) * Math.PI * 2;
            const a2 = ((i + 1) / ringSegments) * Math.PI * 2;
            const aMid = (a1 + a2) / 2;

            const x1 = mCenter.x + Math.cos(a1) * ringRadius;
            const z1 = mCenter.z + Math.sin(a1) * ringRadius;
            const x2 = mCenter.x + Math.cos(a2) * ringRadius;
            const z2 = mCenter.z + Math.sin(a2) * ringRadius;

            const segLen = Math.hypot(x2 - x1, z2 - z1);
            const midX = (x1 + x2) / 2;
            const midZ = (z1 + z2) / 2;
            const angleY = Math.atan2(x2 - x1, z2 - z1);

            // Asphalt Road Deck
            const segGeo = new THREE.BoxGeometry(ringWidth, 0.4, segLen + 1.0);
            const seg = new THREE.Mesh(segGeo, roadMat);
            seg.position.set(midX, 0.65, midZ);
            seg.rotation.y = angleY;
            seg.receiveShadow = true;
            this.scene.add(seg);

            // Yellow Center Double Line
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.4, segLen * 0.8), yellowMat);
            dash.rotation.x = -Math.PI / 2;
            dash.rotation.z = -angleY;
            dash.position.set(midX, 0.86, midZ);
            this.scene.add(dash);

            // Outer Curve Guardrail (At Outer Rim)
            const railX = mCenter.x + Math.cos(aMid) * (ringRadius + ringWidth / 2 + 0.8);
            const railZ = mCenter.z + Math.sin(aMid) * (ringRadius + ringWidth / 2 + 0.8);
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, segLen + 1.0), railMat);
            rail.position.set(railX, 1.2, railZ);
            rail.rotation.y = angleY;
            rail.castShadow = true;
            this.scene.add(rail);

            // Street Light Pole every other segment
            if (i % 2 === 0) {
                const poleX = mCenter.x + Math.cos(aMid) * (ringRadius + ringWidth / 2 + 3.0);
                const poleZ = mCenter.z + Math.sin(aMid) * (ringRadius + ringWidth / 2 + 3.0);
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 7.5, 8), postMat);
                pole.position.set(poleX, 4.4, poleZ);
                this.scene.add(pole);

                const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.7), lampMat);
                lamp.position.set(poleX, 8.2, poleZ);
                this.scene.add(lamp);
            }
        }

        // 2. GRAND VICE MOUNTAIN STUNT & DRIFT ARENA (x = 520 to 680, z = -210 to -70)
        // Huge 160m x 140m smooth asphalt skidpad for high-speed drifting and monster stunt jumps!
        const padGeo = new THREE.BoxGeometry(160, 0.5, 140);
        const pad = new THREE.Mesh(padGeo, roadMat);
        pad.position.set(600, 0.63, -140);
        pad.receiveShadow = true;
        this.scene.add(pad);

        // Circular Painted Drift Donut Skidpads
        const donutMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
        const pinkDonutMat = new THREE.MeshBasicMaterial({ color: 0xff007f, side: THREE.DoubleSide });
        [
            { x: 560, z: -175, mat: donutMat },
            { x: 640, z: -175, mat: pinkDonutMat },
            { x: 560, z: -105, mat: pinkDonutMat },
            { x: 640, z: -105, mat: donutMat }
        ].forEach(d => {
            const donut = new THREE.Mesh(new THREE.RingGeometry(10, 14, 24), d.mat);
            donut.rotation.x = -Math.PI / 2;
            donut.position.set(d.x, 0.89, d.z);
            this.scene.add(donut);

            // Center donut pin
            const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.4, 8), postMat);
            pin.position.set(d.x, 1.8, d.z);
            this.scene.add(pin);
        });

        // Triple Mega Stunt Jump Ramps in Arena with smooth approaches & calibrated launch vectors
        // Mega Ramp 1: Eastbound High Jump (Entering through Archway at x = 520, launch East across the arena)
        this.createStuntRamp({
            id: "arena_ramp_east",
            x: 555, z: -140, baseY: 0.65,
            rotY: Math.PI / 2, // Launches East towards the arena center (+X)
            length: 22, width: 14, height: 6.5,
            color: 0xff0055
        });

        // Mega Ramp 2: Westbound Super Jump (Facing back towards entrance, launch West across the arena)
        this.createStuntRamp({
            id: "arena_ramp_west",
            x: 645, z: -140, baseY: 0.65,
            rotY: -Math.PI / 2, // Launches West towards the entrance (-X)
            length: 22, width: 14, height: 7.2,
            color: 0x00f0ff
        });

        // Mega Ramp 3: Northbound Mountain Super Flight (Launch North towards mountain foothills)
        this.createStuntRamp({
            id: "arena_ramp_north",
            x: 600, z: -105, baseY: 0.65,
            rotY: Math.PI, // Launches North towards mountain foothills (-Z)
            length: 26, width: 14, height: 8.5,
            color: 0xffaa00
        });

        // Grand Neon Arena Entrance Archway (At x = 520, z = -140)
        const archMat = new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: 0.7 });
        [-16, 16].forEach(az => {
            const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.8, 12, 2.8), archMat);
            pylon.position.set(520, 6.6, -140 + az);
            pylon.castShadow = true;
            this.scene.add(pylon);
        });

        const arenaArch = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 34.8), archMat);
        arenaArch.position.set(520, 12.0, -140);
        this.scene.add(arenaArch);

        const arenaSign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 28), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
        arenaSign.position.set(518.5, 12.0, -140);
        this.scene.add(arenaSign);

        // 3. FOOTHILL RALLY DIRT CIRCUIT (Circling outer slopes at R ~ 125m)
        const dirtMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.95 });
        for (let i = 0; i < 12; i++) {
            const a1 = (i / 12) * Math.PI * 2;
            const a2 = ((i + 1) / 12) * Math.PI * 2;
            const r1 = 125 + Math.sin(a1 * 3) * 15;
            const r2 = 125 + Math.sin(a2 * 3) * 15;

            const x1 = mCenter.x + Math.cos(a1) * r1;
            const z1 = mCenter.z + Math.sin(a1) * r1;
            const x2 = mCenter.x + Math.cos(a2) * r2;
            const z2 = mCenter.z + Math.sin(a2) * r2;

            const dLen = Math.hypot(x2 - x1, z2 - z1);
            const midX = (x1 + x2) / 2;
            const midZ = (z1 + z2) / 2;
            const rotY = Math.atan2(x2 - x1, z2 - z1);

            const dirtTrack = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, dLen + 2.0), dirtMat);
            dirtTrack.position.set(midX, 0.64, midZ);
            dirtTrack.rotation.y = rotY;
            dirtTrack.receiveShadow = true;
            this.scene.add(dirtTrack);
        }

        // 4. INTERCONNECTING ARTERIAL HIGHWAYS
        // West-East Coastal Parkway: Connecting Arrival Concourse (x=245, z=0) to Mountain Ring Road (x=350, z=0) & Stunt Plaza (x=520, z=-140)
        const arterial1 = new THREE.Mesh(new THREE.BoxGeometry(130, 0.4, 20), roadMat);
        arterial1.position.set(310, 0.65, 0);
        arterial1.receiveShadow = true;
        this.scene.add(arterial1);

        const arterial2 = new THREE.Mesh(new THREE.BoxGeometry(120, 0.4, 20), roadMat);
        arterial2.position.set(430, 0.65, -70);
        arterial2.rotation.y = Math.PI / 2;
        arterial2.receiveShadow = true;
        this.scene.add(arterial2);

        // South Island Coastal Parkway: Connecting South Causeway (x=228, z=180) North to Concourse (z=0) and South along coast (z=180 to 380)
        const southParkwayNorth = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 200), roadMat);
        southParkwayNorth.position.set(245, 0.65, 90);
        southParkwayNorth.receiveShadow = true;
        this.scene.add(southParkwayNorth);

        const southParkwaySouth = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 200), roadMat);
        southParkwaySouth.position.set(245, 0.65, 280);
        southParkwaySouth.receiveShadow = true;
        this.scene.add(southParkwaySouth);
    }

    buildMountainHighway() {
        const asphaltTex = TextureGenerator.createAsphaltTexture();
        asphaltTex.repeat.set(8, 2);
        const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.65 });
        const revetmentMat = new THREE.MeshStandardMaterial({ color: 0x32353b, roughness: 0.9, metalness: 0.1 });
        const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x495057, metalness: 0.6, roughness: 0.4 });
        const postMat = new THREE.MeshStandardMaterial({ color: 0x212529, roughness: 0.8 });
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });

        // Highway Waypoints: Branches cleanly off Grand Concourse at x = 280, z = -25, y = 0.65
        const waypoints = [
            { x: 280, z: -25, y: 0.65 },
            { x: 315, z: -50, y: 3.5 },
            { x: 355, z: -85, y: 7.5 },
            { x: 400, z: -120, y: 11.8 },
            { x: 430, z: -140, y: 14.5 }
        ];

        // Smooth junction fan connecting Concourse (x=215-300, z=-25 to 25) to the Highway entrance
        const junctionApron = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 22), roadMat);
        junctionApron.position.set(275, 0.64, -20);
        junctionApron.receiveShadow = true;
        this.scene.add(junctionApron);

        for (let i = 0; i < waypoints.length - 1; i++) {
            const p1 = waypoints[i];
            const p2 = waypoints[i + 1];

            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const dy = p2.y - p1.y;
            const length = Math.hypot(dx, dz);
            const midX = (p1.x + p2.x) / 2;
            const midZ = (p1.z + p2.z) / 2;
            const midY = (p1.y + p2.y) / 2;
            const angleY = Math.atan2(dx, dz);
            const slopeX = Math.atan2(dy, length);

            // Elevated Paved Road Deck (Width = 16)
            const segGeo = new THREE.BoxGeometry(16, 0.8, length + 2);
            const seg = new THREE.Mesh(segGeo, roadMat);
            seg.position.set(midX, midY, midZ);
            seg.rotation.y = angleY;
            seg.rotation.x = -slopeX;
            seg.receiveShadow = true;
            this.scene.add(seg);

            // Solid stone revetment embankment (Fills space from road deck down to ground level y = 0.62)
            // Completely eliminates any hovering or floating slab!
            const revHeight = Math.max(0.6, midY - 0.2);
            const revGeo = new THREE.BoxGeometry(18.5, revHeight, length + 2);
            const revMesh = new THREE.Mesh(revGeo, revetmentMat);
            revMesh.position.set(midX, revHeight / 2 + 0.1, midZ);
            revMesh.rotation.y = angleY;
            revMesh.rotation.x = -slopeX;
            revMesh.receiveShadow = true;
            this.scene.add(revMesh);

            // Concrete side wing embankments with angled slope to ground
            [-10.2, 10.2].forEach(sideOffset => {
                const wingGeo = new THREE.BoxGeometry(2.4, revHeight, length + 2);
                const wing = new THREE.Mesh(wingGeo, revetmentMat);
                const sideAngle = angleY + Math.PI / 2;
                wing.position.set(
                    midX + Math.sin(sideAngle) * sideOffset,
                    revHeight / 2 + 0.05,
                    midZ + Math.cos(sideAngle) * sideOffset
                );
                wing.rotation.y = angleY;
                wing.rotation.x = -slopeX;
                wing.receiveShadow = true;
                this.scene.add(wing);
            });

            // Double Yellow Center Dashes
            const dashCount = Math.floor(length / 7);
            for (let d = 0; d < dashCount; d++) {
                const t = (d + 0.5) / dashCount;
                const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 4.2), yellowMat);
                dash.rotation.x = -Math.PI / 2 - slopeX;
                dash.rotation.z = -angleY;
                dash.position.set(
                    p1.x + dx * t,
                    p1.y + dy * t + 0.44,
                    p1.z + dz * t
                );
                this.scene.add(dash);
            }

            // Protective Safety Guardrails along both outer edges
            [-8.2, 8.2].forEach(offsetSide => {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, length + 2), railMat);
                const sideAngle = angleY + Math.PI / 2;
                rail.position.set(
                    midX + Math.sin(sideAngle) * offsetSide,
                    midY + 0.65,
                    midZ + Math.cos(sideAngle) * offsetSide
                );
                rail.rotation.y = angleY;
                rail.rotation.x = -slopeX;
                rail.castShadow = true;
                this.scene.add(rail);
            });

            // Street Light Poles along the mountain highway
            const lightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 8), postMat);
            lightPost.position.set(midX + Math.sin(angleY + Math.PI / 2) * 9.5, midY + 3.0, midZ + Math.cos(angleY + Math.PI / 2) * 9.5);
            this.scene.add(lightPost);

            const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), lampMat);
            lantern.position.set(lightPost.position.x, midY + 6.2, lightPost.position.z);
            this.scene.add(lantern);
        }

        // Mountain Summit Observatory Plateau (Turnaround / Overlook)
        const plateauGeo = new THREE.BoxGeometry(36, 1.2, 34);
        const plateau = new THREE.Mesh(plateauGeo, roadMat);
        plateau.position.set(430, 14.2, -140);
        plateau.receiveShadow = true;
        this.scene.add(plateau);

        // Protective Stone Wall around Observatory Edge
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x343a40, roughness: 0.8 });
        const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(36, 1.4, 0.8), wallMat);
        wallNorth.position.set(430, 15.3, -157);
        this.scene.add(wallNorth);

        const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(36, 1.4, 0.8), wallMat);
        wallSouth.position.set(430, 15.3, -123);
        this.scene.add(wallSouth);

        const wallEast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 34), wallMat);
        wallEast.position.set(448, 15.3, -140);
        this.scene.add(wallEast);

        // Observatory Gazebo Pavilion
        const pavilionMat = new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.3, metalness: 0.6 });
        const domeGeo = new THREE.SphereGeometry(4.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, pavilionMat);
        dome.position.set(435, 18.5, -140);
        this.scene.add(dome);

        // Neon Sign
        const signMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 16), signMat);
        sign.position.set(412, 16.5, -140);
        this.scene.add(sign);
    }

    buildBeachMarina() {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.8 });

        // Boardwalk Pier extending into the bay
        const pier = new THREE.Mesh(new THREE.BoxGeometry(45, 0.8, 16), woodMat);
        pier.position.set(100, 1.1, 110);
        pier.receiveShadow = true;
        this.scene.add(pier);

        // Wooden Pilings
        for (let px = 80; px <= 120; px += 10) {
            [-6, 6].forEach(pz => {
                const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.5, 8), woodMat);
                piling.position.set(px, 0, 110 + pz);
                this.scene.add(piling);
            });
        }

        // Classic Maritime Lighthouse at Pier End
        const lhMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.4 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 });

        const lighthouse = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.8, 22, 16), lhMat);
        lighthouse.position.set(122, 11.5, 110);
        lighthouse.castShadow = true;
        this.scene.add(lighthouse);

        // Red stripes
        [7, 14].forEach(sy => {
            const stripe = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.1, 3.5, 16), stripeMat);
            stripe.position.set(122, sy, 110);
            this.scene.add(stripe);
        });

        // Lantern Room & Beacon Light
        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 2.8, 12), new THREE.MeshBasicMaterial({ color: 0xffea00 }));
        lantern.position.set(122, 23.5, 110);
        this.scene.add(lantern);

        this.colliders.push({
            minX: 118, maxX: 126,
            minZ: 106, maxZ: 114
        });
    }

    buildSkySystem() {
        // Fog for atmosphere
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0012);
        this.fogColor = new THREE.Color(0x87ceeb);

        // Day/night time tracking
        this.dayTime = 0.35; // Start at mid-afternoon (0=midnight, 0.5=noon, 1=midnight)
        this.daySpeed = 0.0006; // Full day cycle in ~28 minutes real time

        // Rain system
        this.isRaining = false;
        this.rainParticles = null;
        this.rainTimer = 0;
        this.nextRainIn = 60 + Math.random() * 120; // First rain in 1-3 minutes
        this.rainDuration = 0;

        // Lightning
        this.lightningFlash = null;
        this.lightningTimer = 0;
    }

    startRain() {
        this.isRaining = true;
        this.rainTimer = 0;
        this.rainDuration = 25 + Math.random() * 35; // 25-60 seconds
        this.nextRainIn = 90 + Math.random() * 180; // Next rain in 1.5-4.5 minutes

        const overlay = document.getElementById('rain-overlay');
        if (overlay) overlay.classList.add('active');
        const indicator = document.getElementById('weather-indicator');
        if (indicator) {
            indicator.textContent = "🌧️ RAIN";
            indicator.classList.add('visible');
        }

        // Create rain particle system
        const count = 2500;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 220;
            positions[i * 3 + 1] = Math.random() * 75;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xaaddff,
            size: 0.22,
            transparent: true,
            opacity: 0.65,
            sizeAttenuation: true
        });
        this.rainParticles = new THREE.Points(geo, mat);
        if (window.gameInstance && window.gameInstance.player) {
            this.rainParticles.position.x = window.gameInstance.player.position.x;
            this.rainParticles.position.z = window.gameInstance.player.position.z;
        }
        this.scene.add(this.rainParticles);

        if (window.HUD) HUD.showToast('🌧️ Sudden Miami Rainstorm incoming...', 'info', 3000);
    }

    stopRain() {
        this.isRaining = false;
        const overlay = document.getElementById('rain-overlay');
        if (overlay) overlay.classList.remove('active');
        const indicator = document.getElementById('weather-indicator');
        if (indicator) indicator.classList.remove('visible');

        if (this.rainParticles) {
            this.scene.remove(this.rainParticles);
            this.rainParticles.geometry.dispose();
            this.rainParticles = null;
        }
        if (window.HUD) HUD.showToast('☀️ Skies clearing up across Vice City.', 'success', 2500);
    }

    triggerLightning() {
        this.lightningFlashDuration = 0.14;
        setTimeout(() => {
            if (window.gameInstance && window.gameInstance.audio && window.gameInstance.audio.playThunder) {
                window.gameInstance.audio.playThunder();
            }
        }, 400 + Math.random() * 1200);
    }

    checkCollision(x, z, radius = 0.6) {
        for (let col of this.colliders) {
            if (x + radius >= col.minX && x - radius <= col.maxX &&
                z + radius >= col.minZ && z - radius <= col.maxZ) {
                return true;
            }
        }
        return false;
    }

    isWater(x, z) {
        // 1. Bridges over the ocean water channel (Vice Bay Bridge and South Causeway)
        if ((Math.abs(z) <= 13 || Math.abs(z - 180) <= 13) && x >= 18 && x <= 228) {
            return false; // On bridge road deck, not in water
        }
        // 2. Marina Pier
        if (x >= 75 && x <= 125 && z >= 95 && z <= 125) {
            return false; // On pier boardwalk
        }
        // 3. Mainland Vice City (West of ocean shoreline at x = 144)
        if (x <= 144 && x >= -200 && z >= -580 && z <= 580) {
            return false; // Dry mainland city / beach
        }
        // 4. Isla Nublar Island Continent & Mountain Grounds
        if (x >= 215 && x <= 950 && z >= -480 && z <= 480) {
            return false; // Dry island continent, roads, stunt plaza & mountain grounds
        }
        // Everywhere else is ocean water!
        return true;
    }

    getRampInfo(x, z) {
        for (let r of this.ramps) {
            const dx = x - r.x;
            const dz = z - r.z;
            const localZ = dx * Math.sin(r.rotY) + dz * Math.cos(r.rotY);
            const localX = dx * Math.cos(r.rotY) - dz * Math.sin(r.rotY);

            const halfW = r.width / 2;
            const halfL = r.length / 2;

            if (Math.abs(localX) <= halfW && localZ >= -halfL - 2.5 && localZ <= halfL + 1.2) {
                const clampedZ = Math.max(-halfL, Math.min(halfL, localZ));
                const progress = (clampedZ + halfL) / r.length;
                const surfaceY = r.baseY + progress * r.height;
                const isCrest = (localZ >= halfL - 1.2);
                return {
                    onRamp: true,
                    height: surfaceY,
                    slopeAngle: r.slopeAngle,
                    isCrest: isCrest,
                    rotY: r.rotY,
                    ramp: r
                };
            }
        }
        return null;
    }

    checkRampHeight(x, z) {
        // 1. Stunt Ramps
        const rampInfo = this.getRampInfo(x, z);
        if (rampInfo) {
            return rampInfo.height;
        }

        // 2. Water Crossing Bridges (Bridge 1 at z = 0, Bridge 2 South Causeway at z = 180)
        for (let bridgeZ of [0, 180]) {
            if (Math.abs(z - bridgeZ) <= 12.5) {
                if (x >= 18 && x <= 55) {
                    // West Approach Ramp climbing smoothly from mainland shore (0.6 to 3.8)
                    return 0.6 + ((x - 18) / 37) * 3.2;
                } else if (x > 55 && x < 195) {
                    // Elevated Main Bridge Deck crossing over the ocean water
                    return 3.8;
                } else if (x >= 195 && x <= 228) {
                    // East Approach Ramp descending smoothly to island concourse (3.8 down to 0.62)
                    return 0.62 + ((228 - x) / 33) * 3.18;
                }
            }
        }

        // 3. Mountain Summit Observatory Plateau
        if (x >= 412 && x <= 448 && z >= -157 && z <= -123) {
            return 14.5;
        }

        // 4. Mountain Summit Climbing Highway
        const mountainWaypoints = [
            { x: 280, z: -25, y: 0.65 },
            { x: 315, z: -50, y: 3.5 },
            { x: 355, z: -85, y: 7.5 },
            { x: 400, z: -120, y: 11.8 },
            { x: 430, z: -140, y: 14.5 }
        ];

        for (let i = 0; i < mountainWaypoints.length - 1; i++) {
            const p1 = mountainWaypoints[i];
            const p2 = mountainWaypoints[i + 1];
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const lenSq = dx * dx + dz * dz;
            if (lenSq === 0) continue;

            const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq));
            const projX = p1.x + t * dx;
            const projZ = p1.z + t * dz;
            const dist = Math.hypot(x - projX, z - projZ);

            if (dist <= 10.0) {
                return p1.y + t * (p2.y - p1.y);
            }
        }

        // 5. Isla Nublar Continent Ground & Driving Space (Massive 760m x 960m landmass)
        if (x >= 215 && x <= 950 && Math.abs(z) <= 480) {
            return 0.62;
        }

        return 0;
    }

    getGroundHeight(x, z) {
        return this.checkRampHeight(x, z);
    }

    update(dt) {
        this.waterTime += dt * 1.8;

        // --- Day/Night Cycle ---
        if (this.dayTime !== undefined) {
            this.dayTime = (this.dayTime + dt * this.daySpeed) % 1.0;
            const t = this.dayTime;

            // Sun angle: t=0 midnight, t=0.25 sunrise, t=0.5 noon, t=0.75 sunset
            const sunAngle = (t - 0.25) * Math.PI * 2;
            const sunElevation = Math.sin(sunAngle);
            const isDaytime = sunElevation > -0.1;

            // Sky color interpolation - Tuned for deep dark clear contrast (matching Image 4 reference)
            let skyR, skyG, skyB;
            if (t < 0.2 || t > 0.8) {
                // Night: deep midnight obsidian
                skyR = 0.01; skyG = 0.02; skyB = 0.05;
            } else if (t < 0.32 || t > 0.68) {
                // Dawn/Dusk: warm rich golden-amber horizon with deep dark sky (Image 4)
                const dawnT = t < 0.5 ? (t - 0.2) / 0.12 : (0.8 - t) / 0.12;
                const clamped = Math.max(0, Math.min(1, dawnT));
                skyR = 0.03 + clamped * 0.42;
                skyG = 0.05 + clamped * 0.16;
                skyB = 0.10 + clamped * 0.18;
            } else {
                // Daytime: Deep rich cobalt-sapphire sky (crisp, clear, rich contrast - no washed-out faint glare! Image 4)
                skyR = 0.07; skyG = 0.20; skyB = 0.38;
            }

            // Apply rain-darkening
            const rainDarken = this.isRaining ? 0.5 : 1.0;
            if (this.lightningFlashDuration && this.lightningFlashDuration > 0) {
                this.lightningFlashDuration -= dt;
                this.scene.background = new THREE.Color(0.85, 0.92, 1.0);
                if (this.scene.fog) {
                    this.scene.fog.color.setRGB(0.85, 0.92, 1.0);
                    this.scene.fog.density = 0.0006;
                }
            } else {
                this.scene.background = new THREE.Color(skyR * rainDarken, skyG * rainDarken, skyB * rainDarken);
                if (this.scene.fog) {
                    this.scene.fog.color.setRGB(skyR * rainDarken, skyG * rainDarken, skyB * rainDarken);
                    this.scene.fog.density = this.isRaining ? 0.0035 : 0.0006;
                }
            }

            // Update ambient & sunlight intensity for deep shadows & high contrast
            if (window.gameInstance && window.gameInstance.renderer) {
                const r = window.gameInstance.renderer;
                if (r.ambientLight) {
                    const ambInt = (this.lightningFlashDuration > 0) ? 1.5 : (this.isRaining ? 0.20 : (isDaytime ? 0.38 : 0.24));
                    r.ambientLight.intensity = ambInt;
                }
                const sun = r.sunLight || r.sunlight;
                if (sun) {
                    sun.intensity = isDaytime ? Math.max(0.4, sunElevation * 1.5) : 0.08;
                    sun.position.set(Math.cos(sunAngle) * 350, Math.max(20, sunElevation * 400), Math.sin(sunAngle) * 200);
                }
            }

            // --- Weather system ---
            this.rainTimer += dt;
            if (!this.isRaining) {
                if (this.rainTimer >= this.nextRainIn) {
                    this.startRain();
                }
            } else {
                if (this.rainTimer >= this.rainDuration) {
                    this.stopRain();
                } else {
                    // Lightning during rain
                    this.lightningTimer -= dt;
                    if (this.lightningTimer <= 0) {
                        this.triggerLightning();
                        this.lightningTimer = 4 + Math.random() * 8;
                    }
                    // Animate rain particles centered around player
                    if (this.rainParticles) {
                        if (window.gameInstance && window.gameInstance.player) {
                            this.rainParticles.position.x = window.gameInstance.player.position.x;
                            this.rainParticles.position.z = window.gameInstance.player.position.z;
                        }
                        const pos = this.rainParticles.geometry.attributes.position;
                        for (let i = 0; i < pos.count; i++) {
                            let y = pos.getY(i) - dt * 60;
                            if (y < -5) y += 80;
                            pos.setY(i, y);
                            pos.setX(i, pos.getX(i) - dt * 5);
                        }
                        pos.needsUpdate = true;
                    }
                }
            }
        }

        // Dynamic 3D Ocean Waves Vertex Displacement
        if (this.waterGeo) {
            const pos = this.waterGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const u = pos.getX(i);
                const v = pos.getY(i);
                const zWave = Math.sin(u * 0.04 + this.waterTime) * 0.45 +
                              Math.cos(v * 0.05 + this.waterTime * 1.2) * 0.35;
                pos.setZ(i, zWave);
            }
            pos.needsUpdate = true;
            this.waterGeo.computeVertexNormals();
        }

        // Gentle Wind Sway on Palm Fronds
        for (let pf of this.palmFronds) {
            const sway = Math.sin(this.waterTime * 1.5 + pf.phase) * 0.05;
            for (let f of pf.fronds) {
                f.rotation.y = sway;
            }
        }
    }
}

window.World = World;
