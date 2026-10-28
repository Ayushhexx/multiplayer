class TextureGenerator {
    static createAsphaltTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Dark asphalt base
        ctx.fillStyle = '#1c1f24';
        ctx.fillRect(0, 0, 1024, 1024);

        // Noise / Grains
        const imgData = ctx.getImageData(0, 0, 1024, 1024);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const noise = (Math.random() - 0.5) * 35;
            d[i] = Math.max(0, Math.min(255, d[i] + noise));
            d[i+1] = Math.max(0, Math.min(255, d[i+1] + noise));
            d[i+2] = Math.max(0, Math.min(255, d[i+2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        // Asphalt subtle cracks & oil patches
        ctx.fillStyle = 'rgba(10, 12, 15, 0.45)';
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 1024, Math.random() * 1024, Math.random() * 40 + 15, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createSidewalkTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Art Deco Pastel Sidewalk Base
        ctx.fillStyle = '#d8c2c8';
        ctx.fillRect(0, 0, 512, 512);

        // Tile Grid Lines
        ctx.strokeStyle = '#a8949a';
        ctx.lineWidth = 4;
        const tileSize = 64;

        for (let x = 0; x <= 512; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }
        for (let y = 0; y <= 512; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }

        // Alternating subtle tile tint (Vice City pink & mint accents)
        for (let x = 0; x < 512; x += tileSize) {
            for (let y = 0; y < 512; y += tileSize) {
                if ((x / tileSize + y / tileSize) % 2 === 0) {
                    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
                    ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
                } else {
                    ctx.fillStyle = 'rgba(255, 42, 133, 0.06)';
                    ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createSandTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Warm golden sand
        ctx.fillStyle = '#e8c99b';
        ctx.fillRect(0, 0, 512, 512);

        // Wind ripples in sand
        ctx.fillStyle = 'rgba(212, 175, 125, 0.5)';
        for (let y = 0; y < 512; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(170, y + 8, 340, y - 8, 512, y);
            ctx.lineTo(512, y + 6);
            ctx.bezierCurveTo(340, y - 2, 170, y + 14, 0, y + 6);
            ctx.closePath();
            ctx.fill();
        }

        // Grain noise
        const imgData = ctx.getImageData(0, 0, 512, 512);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const noise = (Math.random() - 0.5) * 20;
            d[i] = Math.max(0, Math.min(255, d[i] + noise));
            d[i+1] = Math.max(0, Math.min(255, d[i+1] + noise));
            d[i+2] = Math.max(0, Math.min(255, d[i+2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createHawaiianShirtTexture(baseColor = '#00f0ff', accentColor = '#ff2a85') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Shirt background
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);

        // Palm leaves & hibiscus flowers pattern
        const drawFlower = (cx, cy, scale) => {
            ctx.fillStyle = accentColor;
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const px = cx + Math.cos(angle) * 16 * scale;
                const py = cy + Math.sin(angle) * 16 * scale;
                ctx.beginPath();
                ctx.arc(px, py, 11 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
            // Flower center
            ctx.fillStyle = '#ffea00';
            ctx.beginPath();
            ctx.arc(cx, cy, 7 * scale, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawPalmLeaf = (cx, cy, angle, scale) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.fillStyle = '#1b4965';
            ctx.beginPath();
            if (ctx.ellipse) {
                ctx.ellipse(0, 0, 8 * scale, 30 * scale, 0, 0, Math.PI * 2);
            } else {
                ctx.rect(-4 * scale, -15 * scale, 8 * scale, 30 * scale);
            }
            ctx.fill();
            ctx.restore();
        };

        // Scatter flowers and leaves
        for (let x = 40; x < 512; x += 100) {
            for (let y = 40; y < 512; y += 100) {
                drawFlower(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, 1.0);
                drawPalmLeaf(x + 35, y + 25, 0.6, 1.0);
                drawPalmLeaf(x - 30, y - 20, -0.7, 0.8);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createPalmBarkTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#4a3525';
        ctx.fillRect(0, 0, 256, 512);

        // Palm trunk horizontal rings
        for (let y = 0; y < 512; y += 18) {
            ctx.fillStyle = '#2d1e12';
            ctx.fillRect(0, y, 256, 4);
            ctx.fillStyle = '#6b4d36';
            ctx.fillRect(0, y + 4, 256, 3);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createWindowsTexture(neonColor = '#ffea00') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Building wall facade
        ctx.fillStyle = '#1e1b2e';
        ctx.fillRect(0, 0, 512, 512);

        // Windows with neon glows & blinds
        const cols = 8;
        const rows = 12;
        const wWidth = 38;
        const wHeight = 24;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = 20 + c * 60;
                const y = 20 + r * 40;

                const isLit = Math.random() > 0.35;
                if (isLit) {
                    const tint = Math.random();
                    if (tint > 0.6) ctx.fillStyle = '#ffb703'; // Warm gold
                    else if (tint > 0.3) ctx.fillStyle = '#00f0ff'; // Neon Cyan
                    else ctx.fillStyle = '#ff2a85'; // Neon Pink

                    ctx.fillRect(x, y, wWidth, wHeight);

                    // Venetian blinds effect
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    for (let b = y + 4; b < y + wHeight; b += 5) {
                        ctx.fillRect(x, b, wWidth, 2);
                    }
                } else {
                    ctx.fillStyle = '#0a0914';
                    ctx.fillRect(x, y, wWidth, wHeight);
                }

                // Window frame border
                ctx.strokeStyle = '#3a3454';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, wWidth, wHeight);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createEnvironmentMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Sky Sunset Gradient (Zenith to Horizon)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 256);
        skyGrad.addColorStop(0.0, '#10002b'); // Night Zenith
        skyGrad.addColorStop(0.3, '#3c096c'); // Twilight Violet
        skyGrad.addColorStop(0.6, '#7209b7'); // Neon Magenta
        skyGrad.addColorStop(0.85, '#f72585'); // Miami Pink
        skyGrad.addColorStop(1.0, '#ff9e00'); // Sunset Gold Horizon
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 1024, 256);

        // Giant Golden Sun on Horizon
        const sunGrad = ctx.createRadialGradient(256, 230, 10, 256, 230, 90);
        sunGrad.addColorStop(0, '#ffffff');
        sunGrad.addColorStop(0.3, '#ffea00');
        sunGrad.addColorStop(0.7, '#ff0055');
        sunGrad.addColorStop(1, 'rgba(255, 0, 85, 0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(150, 130, 220, 200);

        // Ground / Ocean Horizon (Reflective dark floor with neon streaks)
        const groundGrad = ctx.createLinearGradient(0, 256, 0, 512);
        groundGrad.addColorStop(0.0, '#ff9e00'); // Horizon glow
        groundGrad.addColorStop(0.08, '#0077b6'); // Turquoise ocean reflection
        groundGrad.addColorStop(0.3, '#10002b'); // Deep ocean
        groundGrad.addColorStop(1.0, '#050014'); // Nadir
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 256, 1024, 256);

        // Neon City Skyline Streaks on horizon reflection
        ctx.fillStyle = '#00f0ff';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(Math.random() * 1024, 252, Math.random() * 30 + 10, 8);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        return texture;
    }
}

window.TextureGenerator = TextureGenerator;
