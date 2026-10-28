class EngineRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Scene setup with deep dark contrast & crystal-clear atmosphere
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0c1424);
        this.scene.fog = new THREE.FogExp2(0x0c1424, 0.0010);

        // Perspective Camera
        this.camera = new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.1,
            1500
        );
        this.camera.position.set(0, 5, 10);

        // WebGL Renderer with crisp ACES Filmic Tone Mapping & High-Definition Color Space
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            stencil: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.04;
        if (THREE.SRGBColorSpace) {
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        this.container.appendChild(this.renderer.domElement);

        // Unreal Bloom Post-Processing (Tuned with high threshold for deep contrast - no washed-out faint glare!)
        this.useBloom = false;
        try {
            if (typeof THREE.EffectComposer !== 'undefined' && typeof THREE.RenderPass !== 'undefined' && typeof THREE.UnrealBloomPass !== 'undefined') {
                this.composer = new THREE.EffectComposer(this.renderer);
                this.renderPass = new THREE.RenderPass(this.scene, this.camera);
                this.composer.addPass(this.renderPass);

                // High threshold (0.86) keeps roads, buildings and sky dark & punchy, blooming only intense neons, sun & headlights
                this.bloomPass = new THREE.UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    0.58, // Strength
                    0.35, // Radius
                    0.86  // Threshold
                );
                this.composer.addPass(this.bloomPass);
                this.useBloom = true;
            }
        } catch (e) {
            console.warn('[Renderer] EffectComposer bloom pass initialization fallback:', e);
            this.useBloom = false;
        }

        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;

        // Cinematic Camera System
        this.isCinematic = false;
        this.cinematicTimer = 0;
        this.cinematicDuration = 0;
        this.cinematicStartPos = new THREE.Vector3();
        this.cinematicTargetPos = new THREE.Vector3();
        this.cinematicStartLook = new THREE.Vector3();
        this.cinematicTargetLook = new THREE.Vector3();
        this.cinematicCallback = null;

        // Atmosphere states
        this.currentAtmosphere = "sunset";
        this.targetAtmosphere = "sunset";
        this.atmosphereLerp = 1.0;

        // Setup Sky & Lights
        this.setupSkyAndLights();

        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupSkyAndLights() {
        // Deep Dark Ambient Light (Prevents washed-out faint shadows, provides rich contrast)
        this.ambientLight = new THREE.AmbientLight(0x222a38, 0.28);
        this.scene.add(this.ambientLight);

        // Warm Golden Sun Directional Light (Creates dramatic cinematic shadows)
        this.sunLight = new THREE.DirectionalLight(0xffa200, 1.25);
        this.sunLight.position.set(-180, 85, -110);
        this.sunLight.castShadow = true;
        const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth <= 1024);
        const shadowRes = isMobile ? 2048 : 4096;
        this.sunLight.shadow.mapSize.width = shadowRes;
        this.sunLight.shadow.mapSize.height = shadowRes;
        this.sunLight.shadow.radius = 2.0;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 460;
        const d = 140;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0003;
        this.scene.add(this.sunLight);

        // Vibrant Cyan Rim Light (Sharp edge silhouettes matching Image 4)
        this.cyanRim = new THREE.DirectionalLight(0x00d2ff, 0.40);
        this.cyanRim.position.set(150, 50, 110);
        this.scene.add(this.cyanRim);

        // Deep Hemisphere Light
        this.hemiLight = new THREE.HemisphereLight(0x162035, 0x05070f, 0.25);
        this.scene.add(this.hemiLight);

        // 80s Striped Synthwave Sun
        this.buildStripedSun();

        // Starfield
        this.buildStarfield();
    }

    buildStripedSun() {
        this.sunGroup = new THREE.Group();
        const numStripes = 8;
        const sunRadius = 55;

        for (let i = 0; i < numStripes; i++) {
            const h = (i / numStripes);
            const stripeHeight = sunRadius * 0.17 * (1.0 - h * 0.35);
            const yPos = -sunRadius * 0.55 + i * (sunRadius * 1.4 / numStripes);
            const widthAtY = Math.sqrt(Math.max(0, sunRadius * sunRadius - yPos * yPos)) * 1.9;

            const stripeGeo = new THREE.PlaneGeometry(widthAtY, stripeHeight);
            const col = new THREE.Color().setHSL(0.96 - h * 0.17, 1.0, 0.55);
            const stripeMat = new THREE.MeshBasicMaterial({
                color: col,
                side: THREE.DoubleSide
            });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.y = yPos;
            this.sunGroup.add(stripe);
        }

        const haloGeo = new THREE.RingGeometry(sunRadius * 0.98, sunRadius * 1.35, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0xff0055,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        this.sunGroup.add(halo);

        this.sunGroup.position.set(-390, 65, -290);
        this.sunGroup.lookAt(0, 65, 0);
        this.scene.add(this.sunGroup);
    }

    buildStarfield() {
        const starCount = 350;
        const starGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * 1200;
            const y = Math.random() * 350 + 120;
            const z = (Math.random() - 0.5) * 1200;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const isPink = Math.random() > 0.5;
            colors[i * 3] = isPink ? 1.0 : 0.0;
            colors[i * 3 + 1] = isPink ? 0.35 : 0.9;
            colors[i * 3 + 2] = 1.0;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 2.0,
            vertexColors: true,
            transparent: true,
            opacity: 0.75
        });

        this.starField = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starField);
    }

    // --- Atmospheric Presets ---
    setAtmosphere(mode) {
        if (this.currentAtmosphere === mode) return;
        console.log(`[Renderer] Switching atmosphere: ${this.currentAtmosphere} -> ${mode}`);
        this.targetAtmosphere = mode;
        this.atmosphereLerp = 0.0;
    }

    applyAtmosphereTarget(target, progress) {
        const p = Math.min(1.0, progress);

        if (target === "blood_moon") {
            // Blood Moon: Dark eerie crimson atmosphere for night Dino Island & Final Experiment
            this.scene.background.lerp(new THREE.Color(0x1a0206), p);
            this.scene.fog.color.lerp(new THREE.Color(0x280309), p);
            this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, 0.0075, p);
            this.ambientLight.color.lerp(new THREE.Color(0x550a12), p);
            this.sunLight.color.lerp(new THREE.Color(0xff1e38), p);
            this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, 0.9, p);
            this.cyanRim.color.lerp(new THREE.Color(0xaa0033), p);
            if (this.sunGroup) this.sunGroup.visible = true;
        } else if (target === "night") {
            // Dark Miami Midnight
            this.scene.background.lerp(new THREE.Color(0x04030a), p);
            this.scene.fog.color.lerp(new THREE.Color(0x070614), p);
            this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, 0.004, p);
            this.ambientLight.color.lerp(new THREE.Color(0x1a1a3a), p);
            this.sunLight.color.lerp(new THREE.Color(0x406085), p);
            this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, 0.45, p);
            this.cyanRim.color.lerp(new THREE.Color(0x00f0ff), p);
            if (this.sunGroup) this.sunGroup.visible = false;
        } else if (target === "foggy_mystery") {
            // Dense mysterious coastal fog
            this.scene.background.lerp(new THREE.Color(0x0b1219), p);
            this.scene.fog.color.lerp(new THREE.Color(0x121b24), p);
            this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, 0.0095, p);
            this.ambientLight.color.lerp(new THREE.Color(0x203040), p);
            this.sunLight.color.lerp(new THREE.Color(0x708595), p);
            this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, 0.55, p);
            this.cyanRim.color.lerp(new THREE.Color(0x0088aa), p);
            if (this.sunGroup) this.sunGroup.visible = false;
        } else {
            // Default "sunset" Miami golden hour with deep dark contrast (Image 4 aesthetic)
            this.scene.background.lerp(new THREE.Color(0x0c1424), p);
            this.scene.fog.color.lerp(new THREE.Color(0x0c1424), p);
            this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, 0.0010, p);
            this.ambientLight.color.lerp(new THREE.Color(0x222a38), p);
            this.ambientLight.intensity = THREE.MathUtils.lerp(this.ambientLight.intensity, 0.28, p);
            this.sunLight.color.lerp(new THREE.Color(0xffa200), p);
            this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, 1.25, p);
            this.cyanRim.color.lerp(new THREE.Color(0x00d2ff), p);
            if (this.sunGroup) this.sunGroup.visible = true;
        }
    }

    addScreenShake(intensity = 0.5, duration = 0.3) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    // --- Cinematic Camera Transitions ---
    startCinematic(targetPos, lookAtPos, duration = 3.5, onComplete = null) {
        this.isCinematic = true;
        this.cinematicTimer = 0;
        this.cinematicDuration = duration;
        this.cinematicStartPos.copy(this.camera.position);
        this.cinematicTargetPos.copy(targetPos);
        this.cinematicStartLook.copy(this.camera.position).add(this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10));
        this.cinematicTargetLook.copy(lookAtPos);
        this.cinematicCallback = onComplete;
    }

    stopCinematic() {
        this.isCinematic = false;
        if (this.cinematicCallback) {
            const cb = this.cinematicCallback;
            this.cinematicCallback = null;
            cb();
        }
    }

    update(dt) {
        // Atmosphere transition
        if (this.atmosphereLerp < 1.0) {
            this.atmosphereLerp += dt * 0.8;
            this.applyAtmosphereTarget(this.targetAtmosphere, this.atmosphereLerp);
            if (this.atmosphereLerp >= 1.0) {
                this.currentAtmosphere = this.targetAtmosphere;
            }
        }

        // Cinematic camera handling
        if (this.isCinematic) {
            this.cinematicTimer += dt;
            const t = Math.min(1.0, this.cinematicTimer / this.cinematicDuration);
            // Smooth ease in/out
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            this.camera.position.lerpVectors(this.cinematicStartPos, this.cinematicTargetPos, ease);
            const currentLook = new THREE.Vector3().lerpVectors(this.cinematicStartLook, this.cinematicTargetLook, ease);
            this.camera.lookAt(currentLook);

            if (this.cinematicTimer >= this.cinematicDuration) {
                this.stopCinematic();
            }
            return;
        }

        // Screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const rx = (Math.random() - 0.5) * this.shakeIntensity;
            const ry = (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.x += rx;
            this.camera.position.y += ry;
            this.camera.rotation.z = (Math.random() - 0.5) * this.shakeIntensity * 0.04;
            if (this.shakeDuration <= 0) {
                this.shakeIntensity = 0;
                this.camera.rotation.z = 0;
            }
        }

        // Dynamically track sunlight shadow focus near the active camera target
        if (this.sunLight && this.camera) {
            this.sunLight.target.position.set(this.camera.position.x, 0, this.camera.position.z);
            this.sunLight.target.updateMatrixWorld();
        }
    }

    render() {
        if (this.useBloom && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}

window.EngineRenderer = EngineRenderer;
