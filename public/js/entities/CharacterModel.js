class CharacterModel {
    static create(shirtType = "hawaiian_cyan") {
        const root = new THREE.Group();

        let shirtTex = null;
        let shirtColor = 0x00f0ff;
        let pantsColor = 0x1d3557;
        let skinColor = 0xefd3b5;
        let hairColor = 0x2b1e16;
        let hasCap = false;
        let capType = null;
        let hasSunglasses = true;
        let isRoller = false;

        // Realistic Persona Definitions
        if (shirtType === "hawaiian_pink") {
            shirtTex = TextureGenerator.createHawaiianShirtTexture('#ff2a85', '#00f0ff');
            pantsColor = 0x111d4a;
        } else if (shirtType === "white_suit") {
            shirtColor = 0xf8f9fa;
            pantsColor = 0xf8f9fa;
        } else if (shirtType === "black_suit") {
            shirtColor = 0x181a1b;
            pantsColor = 0x181a1b;
        } else if (shirtType === "cop") {
            shirtColor = 0xa3704c; // Tan police shirt
            pantsColor = 0x1d2d44; // Navy pants
            hasCap = true;
            capType = "police";
            hasSunglasses = true;
        } else if (shirtType === "beach_roller") {
            shirtColor = 0xff007f; // Neon Pink crop top
            pantsColor = 0x00f0ff; // Neon Cyan shorts
            skinColor = 0xdfb08c;
            hairColor = 0xd4a373;
            isRoller = true;
        } else if (shirtType === "tourist") {
            shirtTex = TextureGenerator.createHawaiianShirtTexture('#ffd166', '#06d6a0');
            pantsColor = 0xe9d8a6;
            hasCap = true;
            capType = "straw_hat";
        } else if (shirtType === "mobster_pink") {
            shirtColor = 0xff70a6;
            pantsColor = 0xff70a6;
            hairColor = 0x111111;
        } else {
            // Tommy Cyan Hawaiian default
            shirtTex = TextureGenerator.createHawaiianShirtTexture('#00f0ff', '#ff2a85');
            pantsColor = 0x1d3557;
        }

        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.75 });
        const shirtMat = shirtTex 
            ? new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.6 })
            : new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.7 });
        const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });

        // Pelvis / Hips
        const hips = new THREE.Group();
        hips.position.y = 0.95;
        root.add(hips);

        const hipsGeo = new THREE.BoxGeometry(0.44, 0.22, 0.26);
        const hipsMesh = new THREE.Mesh(hipsGeo, pantsMat);
        hips.add(hipsMesh);

        // Torso (Anatomical taper)
        const torso = new THREE.Group();
        torso.position.y = 0.11;
        hips.add(torso);

        const torsoGeo = new THREE.BoxGeometry(0.48, 0.55, 0.28);
        const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
        torsoMesh.position.y = 0.275;
        torsoMesh.castShadow = true;
        torsoMesh.receiveShadow = true;
        torso.add(torsoMesh);

        // VCPD Badge or Gold Chain
        if (capType === "police") {
            const badge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), new THREE.MeshStandardMaterial({ color: 0xffea00, metalness: 0.95 }));
            badge.position.set(-0.14, 0.42, 0.145);
            torso.add(badge);
        } else if (shirtType.startsWith("hawaiian")) {
            const chestGeo = new THREE.PlaneGeometry(0.18, 0.24);
            const chestMesh = new THREE.Mesh(chestGeo, skinMat);
            chestMesh.position.set(0, 0.38, 0.142);
            torso.add(chestMesh);

            const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16);
            const chainMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.95, roughness: 0.1 });
            const chain = new THREE.Mesh(chainGeo, chainMat);
            chain.rotation.z = Math.PI / 4;
            chain.position.set(0, 0.32, 0.146);
            torso.add(chain);
        }

        // Head & Neck
        const neck = new THREE.Group();
        neck.position.y = 0.55;
        torso.add(neck);

        const headGeo = new THREE.BoxGeometry(0.28, 0.3, 0.28);
        const headMesh = new THREE.Mesh(headGeo, skinMat);
        headMesh.position.y = 0.15;
        headMesh.castShadow = true;
        neck.add(headMesh);

        // Hairstyle
        const hairGeo = new THREE.BoxGeometry(0.3, 0.14, 0.32);
        const hairMesh = new THREE.Mesh(hairGeo, hairMat);
        hairMesh.position.set(0, 0.25, -0.02);
        neck.add(hairMesh);

        // Police Peaked Cap / Straw Hat
        if (capType === "police") {
            const capBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0x1d2d44 }));
            capBase.position.set(0, 0.32, 0);
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.14), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            visor.position.set(0, 0.28, 0.16);
            visor.rotation.x = 0.15;
            capBase.add(visor);
            neck.add(capBase);
        } else if (capType === "straw_hat") {
            const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0xd4a373 }));
            hatBrim.position.set(0, 0.31, 0);
            const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xd4a373 }));
            hatCrown.position.set(0, 0.38, 0);
            neck.add(hatBrim);
            neck.add(hatCrown);
        }

        // 80s Aviator Sunglasses
        if (hasSunglasses) {
            const glassesGroup = new THREE.Group();
            const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.9, roughness: 0.2 });
            const lensMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1, metalness: 0.9 });

            [-0.065, 0.065].forEach(gx => {
                const lens = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.02), lensMat);
                lens.position.set(gx, 0.16, 0.15);
                glassesGroup.add(lens);
            });
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), goldFrameMat);
            bridge.position.set(0, 0.17, 0.15);
            glassesGroup.add(bridge);
            neck.add(glassesGroup);
        }

        // Left Leg
        const leftLeg = new THREE.Group();
        leftLeg.position.set(-0.14, -0.1, 0);
        hips.add(leftLeg);

        const legGeo = new THREE.BoxGeometry(0.18, 0.85, 0.2);
        const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
        leftLegMesh.position.y = -0.425;
        leftLegMesh.castShadow = true;
        leftLeg.add(leftLegMesh);

        const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.26), shoeMat);
        leftShoe.position.set(0, -0.85, 0.03);
        leftShoe.castShadow = true;
        leftLeg.add(leftShoe);

        // Right Leg
        const rightLeg = new THREE.Group();
        rightLeg.position.set(0.14, -0.1, 0);
        hips.add(rightLeg);

        const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
        rightLegMesh.position.y = -0.425;
        rightLegMesh.castShadow = true;
        rightLeg.add(rightLegMesh);

        const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.26), shoeMat);
        rightShoe.position.set(0, -0.85, 0.03);
        rightShoe.castShadow = true;
        rightLeg.add(rightShoe);

        // Left Arm & Watch
        const leftArm = new THREE.Group();
        leftArm.position.set(-0.32, 0.48, 0);
        torso.add(leftArm);

        const sleeveGeo = new THREE.BoxGeometry(0.16, 0.25, 0.18);
        const leftSleeve = new THREE.Mesh(sleeveGeo, shirtMat);
        leftSleeve.position.y = -0.125;
        leftArm.add(leftSleeve);

        const armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.15);
        const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
        leftArmMesh.position.y = -0.45;
        leftArmMesh.castShadow = true;
        leftArm.add(leftArmMesh);

        // Gold watch on wrist
        const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.9 }));
        watch.position.set(0, -0.62, 0);
        leftArm.add(watch);

        // Right Arm & Weapon Slot
        const rightArm = new THREE.Group();
        rightArm.position.set(0.32, 0.48, 0);
        torso.add(rightArm);

        const rightSleeve = new THREE.Mesh(sleeveGeo, shirtMat);
        rightSleeve.position.y = -0.125;
        rightArm.add(rightSleeve);

        const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
        rightArmMesh.position.y = -0.45;
        rightArmMesh.castShadow = true;
        rightArm.add(rightArmMesh);

        const weaponSlot = new THREE.Group();
        weaponSlot.position.set(0, -0.7, 0.1);
        rightArm.add(weaponSlot);

        return {
            root,
            hips,
            torso,
            neck,
            leftLeg,
            rightLeg,
            leftArm,
            rightArm,
            weaponSlot,
            shirtType
        };
    }

    static updateAnimation(char, anim, speed, time, isAiming = false, pitch = 0) {
        if (!char) return;

        // 1. FULL RESET of internal bone transforms every frame to prevent stuck poses, crooked limbs, or angle bleeding
        char.root.rotation.x = 0;
        char.root.rotation.z = 0;
        char.hips.position.set(0, 0.95, 0);
        char.hips.rotation.set(0, 0, 0);

        char.torso.position.set(0, 0.11, 0);
        char.torso.rotation.set(0, 0, 0);

        char.leftLeg.position.set(-0.14, -0.1, 0);
        char.leftLeg.rotation.set(0, 0, 0);

        char.rightLeg.position.set(0.14, -0.1, 0);
        char.rightLeg.rotation.set(0, 0, 0);

        char.leftArm.position.set(-0.32, 0.48, 0);
        char.leftArm.rotation.set(0, 0, 0);

        char.rightArm.position.set(0.32, 0.48, 0);
        char.rightArm.rotation.set(0, 0, 0);

        if (anim === "driving") {
            char.hips.position.y = 0.45;
            char.leftLeg.rotation.x = -Math.PI / 2.2;
            char.rightLeg.rotation.x = -Math.PI / 2.2;
            char.leftLeg.rotation.z = 0.1;
            char.rightLeg.rotation.z = -0.1;
            char.leftArm.rotation.x = -Math.PI / 2.6;
            char.rightArm.rotation.x = -Math.PI / 2.6;
            char.leftArm.rotation.z = 0.2;
            char.rightArm.rotation.z = -0.2;
            return;
        }

        if (anim === "biking") {
            char.hips.position.y = 0.65;
            char.leftLeg.rotation.x = -Math.PI / 3;
            char.rightLeg.rotation.x = -Math.PI / 3;
            char.leftLeg.rotation.z = -0.15;
            char.rightLeg.rotation.z = 0.15;
            char.leftArm.rotation.x = -Math.PI / 2.3;
            char.rightArm.rotation.x = -Math.PI / 2.3;
            char.leftArm.rotation.y = 0.15;
            char.rightArm.rotation.y = -0.15;
            char.torso.rotation.x = 0.35;
            return;
        }

        if (anim === "dead") {
            char.root.rotation.x = -Math.PI / 2;
            char.hips.position.y = 0.2;
            return;
        }

        const isCrouching = (anim === "crouch" || anim === "crouch_walk");
        if (isCrouching) {
            char.hips.position.y = 0.62;
            char.leftLeg.rotation.x = -Math.PI / 3.2;
            char.rightLeg.rotation.x = -Math.PI / 4.0;
            char.torso.rotation.x = 0.32;
        }

        if (isAiming) {
            char.rightArm.rotation.x = -Math.PI / 2 + pitch;
            char.rightArm.rotation.y = -0.15;
            char.rightArm.rotation.z = 0;

            char.leftArm.rotation.x = -Math.PI / 2.2 + pitch;
            char.leftArm.rotation.y = 0.35;
            char.leftArm.rotation.z = 0;

            char.torso.rotation.x = pitch * 0.35;
        }

        if (anim === "sprint" || anim === "run") {
            const freq = 12 * speed;
            const swing = Math.sin(time * freq) * 0.75;
            char.leftLeg.rotation.x = swing;
            char.rightLeg.rotation.x = -swing;

            if (!isAiming) {
                char.leftArm.rotation.x = -swing * 0.8;
                char.rightArm.rotation.x = swing * 0.8;
                char.leftArm.rotation.z = 0.1;
                char.rightArm.rotation.z = -0.1;
                char.torso.rotation.x = 0.18;
            } else {
                char.torso.rotation.x = pitch * 0.35 + 0.1;
            }

            char.hips.position.y = 0.95 + Math.abs(Math.sin(time * freq)) * 0.08;
        } else if (anim === "crouch_walk") {
            const freq = 6 * speed;
            const swing = Math.sin(time * freq) * 0.35;
            char.leftLeg.rotation.x = -Math.PI / 3.2 + swing;
            char.rightLeg.rotation.x = -Math.PI / 4.0 - swing;
            char.hips.position.y = 0.62 + Math.abs(Math.sin(time * freq)) * 0.03;
            if (!isAiming) {
                char.leftArm.rotation.x = -swing * 0.4;
                char.rightArm.rotation.x = swing * 0.4;
                char.leftArm.rotation.z = 0.1;
                char.rightArm.rotation.z = -0.1;
            }
        } else if (anim === "crouch") {
            char.hips.position.y = 0.62;
            char.leftLeg.rotation.x = -Math.PI / 3.2;
            char.rightLeg.rotation.x = -Math.PI / 4.0;
            if (!isAiming) {
                char.leftArm.rotation.x = 0.2;
                char.rightArm.rotation.x = 0.2;
                char.leftArm.rotation.z = 0.1;
                char.rightArm.rotation.z = -0.1;
            }
        } else if (anim === "walk") {
            const freq = 7 * speed;
            const swing = Math.sin(time * freq) * 0.5;
            char.leftLeg.rotation.x = swing;
            char.rightLeg.rotation.x = -swing;

            if (!isAiming) {
                char.leftArm.rotation.x = -swing * 0.6;
                char.rightArm.rotation.x = swing * 0.6;
                char.leftArm.rotation.z = 0.06;
                char.rightArm.rotation.z = -0.06;
            }

            char.hips.position.y = 0.95 + Math.abs(Math.sin(time * freq)) * 0.04;
        } else if (anim === "punch") {
            const pTime = (time * 15) % Math.PI;
            char.rightArm.rotation.x = -Math.PI / 2 + Math.sin(pTime) * 0.4;
            char.rightArm.rotation.z = -0.2;
            char.torso.rotation.y = Math.sin(pTime) * 0.3;
        } else {
            // Natural athletic Vice City idle stance: straight, firm, level legs & relaxed arms
            const breath = Math.sin(time * 2) * 0.02;
            char.torso.position.y = 0.11 + breath;
            char.leftLeg.rotation.set(0, 0, 0);
            char.rightLeg.rotation.set(0, 0, 0);
            if (!isAiming) {
                char.leftArm.rotation.x = breath * 0.3;
                char.rightArm.rotation.x = breath * 0.3;
                char.leftArm.rotation.z = 0.08;
                char.rightArm.rotation.z = -0.08;
                char.leftArm.rotation.y = 0;
                char.rightArm.rotation.y = 0;
            }
        }
    }
}

window.CharacterModel = CharacterModel;
