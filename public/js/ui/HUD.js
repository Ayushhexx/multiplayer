class HUD {
    static init() {
        this.radarCanvas = document.getElementById('radar-canvas');
        this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;
        this.reloadingEl = document.getElementById('reloading-indicator');
        this.bossPanel = document.getElementById('boss-health-panel');
        this.vignetteEl = document.getElementById('damage-vignette');
        this.locationTag = document.getElementById('hud-location-tag');

        // Full Interactive World Map Elements
        this.worldMapModal = document.getElementById('world-map-modal');
        this.worldMapCanvas = document.getElementById('world-map-canvas');
        this.worldMapCtx = this.worldMapCanvas ? this.worldMapCanvas.getContext('2d') : null;
        this.isWorldMapOpen = false;
        this.mapZoom = 1.0;
        this.mapPan = { x: 380, z: 0 };
        this.playerTrail = [];
        this.lastDistrict = "";
        this.radarPingRadius = 0;

        this.setupMapControls();
    }

    static setupMapControls() {
        const closeBtn = document.getElementById('btn-close-map');
        if (closeBtn) closeBtn.onclick = () => this.toggleWorldMap();

        const hudMapBtn = document.getElementById('btn-map-hud');
        if (hudMapBtn) hudMapBtn.onclick = () => this.toggleWorldMap();

        const touchMapBtn = document.getElementById('tbtn-map');
        if (touchMapBtn) touchMapBtn.onclick = () => this.toggleWorldMap();

        const centerBtn = document.getElementById('btn-map-center');
        if (centerBtn) centerBtn.onclick = () => {
            if (window.gameInstance && window.gameInstance.player) {
                this.mapPan.x = window.gameInstance.player.position.x;
                this.mapPan.z = window.gameInstance.player.position.z;
            }
        };

        const zoomInBtn = document.getElementById('btn-map-zoom-in');
        if (zoomInBtn) zoomInBtn.onclick = () => {
            this.mapZoom = Math.min(2.5, this.mapZoom + 0.25);
        };

        const zoomOutBtn = document.getElementById('btn-map-zoom-out');
        if (zoomOutBtn) zoomOutBtn.onclick = () => {
            this.mapZoom = Math.max(0.6, this.mapZoom - 0.25);
        };
    }

    static updateVitals(health, armor) {
        const hVal = document.getElementById('health-value');
        const hFill = document.getElementById('health-fill');
        const aVal = document.getElementById('armor-value');
        const aFill = document.getElementById('armor-fill');

        if (hVal) hVal.textContent = Math.max(0, Math.round(health));
        if (hFill) hFill.style.width = `${Math.max(0, Math.min(100, health))}%`;
        if (aVal) aVal.textContent = Math.max(0, Math.round(armor));
        if (aFill) aFill.style.width = `${Math.max(0, Math.min(100, armor))}%`;
    }

    static updateStamina(current, max) {
        const sFill = document.getElementById('stamina-fill');
        const sVal = document.getElementById('stamina-value');
        const pct = Math.max(0, Math.min(100, (current / max) * 100));

        if (sFill) {
            sFill.style.width = `${pct}%`;
            if (current <= 15) {
                sFill.style.background = "#ff0055";
            } else if (current <= 40) {
                sFill.style.background = "#ffb703";
            } else {
                sFill.style.background = "#06d6a0";
            }
        }
        if (sVal) sVal.textContent = Math.round(current);
    }

    static updateLevel(level, xp, nextXp) {
        const lvlEl = document.getElementById('player-level-badge');
        const xpFill = document.getElementById('xp-fill');
        const xpText = document.getElementById('xp-text');

        if (lvlEl) lvlEl.textContent = `LVL ${level}`;
        if (xpFill && nextXp) {
            const pct = Math.max(0, Math.min(100, (xp / nextXp) * 100));
            xpFill.style.width = `${pct}%`;
        }
        if (xpText && nextXp) {
            xpText.textContent = `${xp} / ${nextXp} XP`;
        }
    }

    static showReloading(duration = 1.8) {
        let el = document.getElementById('reloading-indicator');
        if (!el) {
            el = document.createElement('div');
            el.id = 'reloading-indicator';
            el.textContent = "RELOADING...";
            document.body.appendChild(el);
        }
        el.style.display = 'block';
        clearTimeout(this.reloadTimeout);
        this.reloadTimeout = setTimeout(() => {
            el.style.display = 'none';
        }, duration * 1000);
    }

    static showBossHealth(name, health, maxHealth) {
        let panel = document.getElementById('boss-health-panel');
        if (!panel) return;
        const nameEl = document.getElementById('boss-name');
        const fillEl = document.getElementById('boss-fill');
        if (nameEl) nameEl.textContent = name;
        if (fillEl) fillEl.style.width = '100%';
        panel.style.display = 'block';
    }

    static updateBossHealth(health, maxHealth) {
        const fillEl = document.getElementById('boss-fill');
        if (fillEl && maxHealth > 0) {
            const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
            fillEl.style.width = `${pct}%`;
        }
    }

    static hideBossHealth() {
        const panel = document.getElementById('boss-health-panel');
        if (panel) panel.style.display = 'none';
    }

    static triggerDamageVignette() {
        let el = document.getElementById('damage-vignette');
        if (!el) return;
        el.classList.add('active');
        clearTimeout(this.vignetteTimeout);
        this.vignetteTimeout = setTimeout(() => {
            el.classList.remove('active');
        }, 250);
    }

    static updateCash(amount) {
        const el = document.getElementById('money-counter');
        if (el) {
            const formatted = String(Math.max(0, amount)).padStart(8, '0');
            el.textContent = `$${formatted}`;
        }
    }

    static updateWeapon(weapon) {
        if (!weapon) return;
        const icon = document.getElementById('weapon-icon');
        const ammo = document.getElementById('ammo-counter');
        const nameEl = document.getElementById('weapon-name');
        const rBtn = document.getElementById('btn-reload-hud');

        if (icon && weapon.icon) icon.textContent = weapon.icon;
        if (nameEl && weapon.name) nameEl.textContent = weapon.name.toUpperCase();
        if (ammo) {
            const mag = (weapon.magAmmo !== undefined) ? weapon.magAmmo : weapon.ammo;
            if (mag === Infinity || weapon.type === "melee") {
                ammo.textContent = "∞";
                if (rBtn) rBtn.style.display = 'none';
            } else {
                ammo.textContent = `${mag} / ∞`;
                if (rBtn) {
                    rBtn.style.display = 'inline-block';
                    if (mag <= 3) {
                        rBtn.classList.add('urgent');
                    } else {
                        rBtn.classList.remove('urgent');
                    }
                }
            }
        }
    }

    static updateWantedStars(level) {
        const starsContainer = document.getElementById('wanted-stars');
        if (starsContainer) {
            if (level === 5) starsContainer.classList.add('five-stars');
            else starsContainer.classList.remove('five-stars');
        }

        for (let i = 1; i <= 5; i++) {
            const star = document.getElementById(`star-${i}`);
            if (star) {
                if (i <= level) star.classList.add('active');
                else star.classList.remove('active');
            }
        }
    }

    static showSpeedometer() {
        const sp = document.getElementById('speedometer-panel');
        if (sp) sp.style.display = 'flex';
    }

    static hideSpeedometer() {
        const sp = document.getElementById('speedometer-panel');
        if (sp) sp.style.display = 'none';
    }

    static updateSpeed(mph) {
        const el = document.getElementById('speed-number');
        if (el) el.textContent = mph;
    }

    static showRadioBanner(name) {
        const banner = document.getElementById('radio-banner');
        const nameEl = document.getElementById('radio-name');
        if (banner && nameEl) {
            nameEl.textContent = name;
            banner.style.display = 'flex';
            clearTimeout(this.radioTimeout);
            this.radioTimeout = setTimeout(() => {
                banner.style.display = 'none';
            }, 3000);
        }
    }

    static showActionHint(text) {
        const el = document.getElementById('action-hint');
        if (el) {
            el.textContent = text;
            el.style.display = 'block';
        }
    }

    static hideActionHint() {
        const el = document.getElementById('action-hint');
        if (el) el.style.display = 'none';
    }

    static addChatMessage(sender, text) {
        const box = document.getElementById('chat-messages');
        if (!box) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = (sender === "system") ? "chat-msg system" : "chat-msg";

        if (sender !== "system") {
            const nameSpan = document.createElement('span');
            nameSpan.className = 'name';
            nameSpan.textContent = `${sender}: `;
            msgDiv.appendChild(nameSpan);
        }

        const textNode = document.createTextNode(text);
        msgDiv.appendChild(textNode);

        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;

        // Auto remove after 12s
        setTimeout(() => {
            if (msgDiv.parentNode) msgDiv.parentNode.removeChild(msgDiv);
        }, 12000);
    }

    static addKillfeed(text) {
        const kf = document.getElementById('killfeed');
        if (!kf) return;
        const entry = document.createElement('div');
        entry.className = 'kill-entry';
        entry.textContent = text;
        kf.appendChild(entry);
        setTimeout(() => {
            if (entry.parentNode) entry.parentNode.removeChild(entry);
        }, 5000);
    }

    static showWasted() {
        const ws = document.getElementById('wasted-screen');
        if (ws) ws.style.display = 'flex';
    }

    static hideWasted() {
        const ws = document.getElementById('wasted-screen');
        if (ws) ws.style.display = 'none';
    }

    static toggleHelp() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
            if (modal.style.display === 'block') document.exitPointerLock();
            else document.body.requestPointerLock();
        }
    }

    static showHitMarker() {
        const ch = document.getElementById('crosshair');
        if (ch) {
            ch.classList.add('hit');
            clearTimeout(this.hitTimeout);
            this.hitTimeout = setTimeout(() => {
                ch.classList.remove('hit');
            }, 120);
        }
    }

    // --- Toast Notification System ---
    static showToast(message, type = 'info', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `game-toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('toast-show'), 10);
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 400);
        }, duration);
    }

    // --- Game Clock Display ---
    static updateGameClock(dayTime) {
        let el = document.getElementById('game-clock');
        if (!el) return;
        // dayTime: 0=midnight, 0.25=6am, 0.5=noon, 0.75=6pm
        const totalMinutes = Math.floor(dayTime * 1440);
        const hour = Math.floor(totalMinutes / 60) % 24;
        const minute = totalMinutes % 60;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const displayHour = ((hour + 11) % 12) + 1;
        const displayMin = String(minute).padStart(2, '0');
        el.textContent = `${displayHour}:${displayMin} ${ampm}`;
        if (hour >= 6 && hour < 18) {
            el.style.color = '#ffb703';
        } else if ((hour >= 18 && hour < 21) || (hour >= 4 && hour < 6)) {
            el.style.color = '#ff7c43';
        } else {
            el.style.color = '#a0b4ff';
        }
    }

    // --- Compass Direction ---
    static updateCompass(rotY) {
        const el = document.getElementById('compass-arrow');
        if (!el) return;
        const deg = ((rotY * 180 / Math.PI) % 360 + 360) % 360;
        el.style.transform = `rotate(${deg}deg)`;
        const dirEl = document.getElementById('compass-dir');
        if (dirEl) {
            const dirs = ['N','NE','E','SE','S','SW','W','NW'];
            const idx = Math.round(deg / 45) % 8;
            dirEl.textContent = dirs[idx];
        }
    }

    // --- District Location Detection ---
    static getLocationName(x, z) {
        if (x >= 412 && x <= 448 && z >= -157 && z <= -123) {
            return "📍 MOUNT APEX SUMMIT OBSERVATORY";
        }
        if (x >= 520 && x <= 680 && z >= -210 && z <= -70) {
            return "📍 VICE MOUNTAIN DRIFT & STUNT ARENA";
        }
        const distMountain = Math.hypot(x - 430, z - (-140));
        if (distMountain <= 105) {
            return "📍 VICE MOUNTAIN PERIMETER RING";
        }
        if (x >= 215 && x <= 275 && z >= -25 && z <= 25) {
            return "📍 ISLA NUBLAR ARRIVAL CONCOURSE";
        }
        if (x >= 215 && x <= 400 && z >= 150 && z <= 350) {
            return "📍 SOUTH ISLAND TROPICAL PRESERVE";
        }
        if (x >= 215 && x <= 950 && z >= -480 && z <= 480) {
            return "📍 ISLA NUBLAR PREHISTORIC ISLAND";
        }
        if (x >= 20 && x <= 225 && Math.abs(z) <= 13) {
            return "📍 VICE BAY SUSPENSION BRIDGE";
        }
        if (x >= 20 && x <= 225 && Math.abs(z - 180) <= 13) {
            return "📍 SOUTH BAY OCEAN CAUSEWAY";
        }
        if (x >= 75 && x <= 125 && z >= 95 && z <= 125) {
            return "📍 OCEAN BEACH MARINA & PIER";
        }
        if (x > 144 && x < 215) {
            return "🌊 VICE CITY OCEAN BAY";
        }
        if (x >= 24 && x <= 144) {
            return "🏖️ OCEAN BEACH SANDS";
        }
        if (x >= -20 && x <= 24) {
            return "🌴 OCEAN DRIVE BOULEVARD";
        }
        if (x < -20 && x >= -70) {
            return "🏨 ART DECO HOTEL ROW";
        }
        if (x < -70) {
            return "🏙️ DOWNTOWN VICE CITY";
        }
        return "🌴 VICE CITY METRO";
    }

    // --- Toggle Full Interactive World Map ---
    static toggleWorldMap(player) {
        if (!this.worldMapModal) this.worldMapModal = document.getElementById('world-map-modal');
        if (!this.worldMapModal) return;

        this.isWorldMapOpen = !this.isWorldMapOpen;
        if (this.isWorldMapOpen) {
            this.worldMapModal.style.display = 'flex';
            if (document.exitPointerLock) document.exitPointerLock();
            const p = player || (window.gameInstance && window.gameInstance.player);
            if (p) {
                this.mapPan.x = p.position.x;
                this.mapPan.z = p.position.z;
                this.renderWorldMap(p, window.gameInstance?.remotePlayers, window.gameInstance?.vehicles);
            }
        } else {
            this.worldMapModal.style.display = 'none';
            if (document.body.requestPointerLock && !window.gameInstance?.isPaused) {
                document.body.requestPointerLock();
            }
        }
    }

    // --- Radar Minimap Render Loop ---
    static renderRadar(player, remotePlayers, vehicles) {
        if (!this.radarCtx) return;
        const ctx = this.radarCtx;
        const w = this.radarCanvas.width;
        const h = this.radarCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = 0.75; // world units to canvas pixels

        // Live Location Tag updates & District transition alerts
        const locationName = this.getLocationName(player.position.x, player.position.z);
        if (this.locationTag) {
            this.locationTag.textContent = locationName;
        }
        if (this.lastDistrict && this.lastDistrict !== locationName) {
            this.showToast(locationName, 'info', 1800);
        }
        this.lastDistrict = locationName;

        ctx.clearRect(0, 0, w, h);

        // Circular clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
        ctx.clip();

        // Background ocean/land
        ctx.fillStyle = '#10002b';
        ctx.fillRect(0, 0, w, h);

        ctx.translate(cx, cy);
        // Rotate world so player forward is always UP
        ctx.rotate(player.rotY);
        ctx.translate(-player.position.x * scale, -player.position.z * scale);

        // Draw Ocean Water Channel (between mainland and island)
        ctx.fillStyle = '#005b96';
        ctx.fillRect(144 * scale, -600 * scale, 900 * scale, 1200 * scale);

        // Draw Sand Beach
        ctx.fillStyle = '#ecd0a1';
        ctx.fillRect(24 * scale, -600 * scale, 120 * scale, 1200 * scale);

        // Draw Ocean Drive Road
        ctx.fillStyle = '#343a40';
        ctx.fillRect(-18 * scale, -600 * scale, 36 * scale, 1200 * scale);

        // Draw Cross streets across expanded map
        [-420, -280, -140, 0, 140, 280, 420].forEach(z => {
            ctx.fillStyle = '#343a40';
            ctx.fillRect(-140 * scale, (z - 11) * scale, 160 * scale, 22 * scale);
        });

        // Draw Hotel Building Blocks along boulevard
        ctx.fillStyle = '#ff2a85';
        [-380, -310, -230, -160, -100, -40, 25, 90, 160, 230, 310, 380].forEach(z => {
            ctx.fillRect(-55 * scale, (z - 15) * scale, 26 * scale, 30 * scale);
        });

        // Draw Water-Crossing Bridges on Radar (Solid Gray Deck)
        ctx.fillStyle = '#495057';
        // Main Vice Bay Bridge at z = 0
        ctx.fillRect(20 * scale, -12 * scale, 206 * scale, 24 * scale);
        // South Causeway Bridge at z = 180
        ctx.fillRect(20 * scale, (180 - 12) * scale, 206 * scale, 24 * scale);

        // Bridge Twin Pylons (Cyan dots on bridges)
        ctx.fillStyle = '#00f0ff';
        [85, 165].forEach(tx => {
            ctx.fillRect((tx - 3) * scale, -13 * scale, 6 * scale, 26 * scale);
            ctx.fillRect((tx - 3) * scale, (180 - 13) * scale, 6 * scale, 26 * scale);
        });

        // Draw Island Continent on Radar (Emerald Green)
        ctx.fillStyle = '#1b3b1e';
        ctx.fillRect(215 * scale, -480 * scale, 740 * scale, 960 * scale);

        // Island Shoreline ring
        ctx.strokeStyle = '#d4a373';
        ctx.lineWidth = 4 * scale;
        ctx.strokeRect(215 * scale, -480 * scale, 740 * scale, 960 * scale);

        // Grand Arrival Concourse at z = 0
        ctx.fillStyle = '#343a40';
        ctx.fillRect(215 * scale, -17 * scale, 60 * scale, 34 * scale);

        // Island Connecting Highways on Radar
        ctx.fillStyle = '#343a40';
        ctx.fillRect(275 * scale, -10 * scale, 150 * scale, 20 * scale);
        ctx.fillRect(235 * scale, 0, 20 * scale, 380 * scale);

        // Mountain 4-Lane Perimeter Ring Road on Radar
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 14 * scale;
        ctx.beginPath();
        ctx.arc(430 * scale, -140 * scale, 80 * scale, 0, Math.PI * 2);
        ctx.stroke();

        // Mountain Peak & Molten Crater
        ctx.fillStyle = '#241d19';
        ctx.beginPath();
        ctx.arc(430 * scale, -140 * scale, 30 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(430 * scale, -140 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Stunt & Drift Arena on Radar
        ctx.fillStyle = '#22223b';
        ctx.fillRect(520 * scale, -210 * scale, 160 * scale, 140 * scale);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(520 * scale, -210 * scale, 160 * scale, 140 * scale);

        // Pay 'n' Spray Garage Blip (Cyan Square with Border at -55, 25)
        ctx.fillStyle = '#00f0ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.fillRect((-55 - 4) * scale, (25 - 4) * scale, 8 * scale, 8 * scale);
        ctx.strokeRect((-55 - 4) * scale, (25 - 4) * scale, 8 * scale, 8 * scale);

        // Draw Vehicles Blips (Yellow / Police Red / Supercars Pink)
        if (vehicles) {
            for (let [vid, v] of Object.entries(vehicles)) {
                if (v === player.currentVehicle) continue;
                if (v.isPolice) ctx.fillStyle = '#ff0033';
                else if (v.type === "turismo" || v.type === "banshee") ctx.fillStyle = '#f72585';
                else if (v.type === "boat") ctx.fillStyle = '#00f0ff';
                else ctx.fillStyle = '#ffb703';
                ctx.fillRect((v.x - 2.5) * scale, (v.z - 2.5) * scale, 5 * scale, 5 * scale);
            }
        }

        // Draw Remote Player Blips (Cyan)
        if (remotePlayers) {
            for (let [pid, rp] of Object.entries(remotePlayers)) {
                ctx.fillStyle = '#00f0ff';
                ctx.beginPath();
                ctx.arc(rp.mesh.position.x * scale, rp.mesh.position.z * scale, 3.5 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw World Pickups
        if (window.gameInstance && window.gameInstance.pickups && window.gameInstance.pickups.pickups) {
            for (let pk of window.gameInstance.pickups.pickups) {
                if (pk.collected) continue;
                ctx.fillStyle = pk.type === "health" ? '#06d6a0' : (pk.type === "armor" ? '#00f0ff' : '#ffbe0b');
                ctx.beginPath();
                ctx.arc(pk.x * scale, pk.z * scale, 2.5 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Active Mission Waypoint (Pulsing Diamond)
        if (window.gameInstance && window.gameInstance.missions) {
            const wp = window.gameInstance.missions.getCurrentWaypoint();
            if (wp) {
                ctx.save();
                ctx.translate(wp.x * scale, wp.z * scale);
                ctx.fillStyle = '#ffbe0b';
                ctx.strokeStyle = '#ff0055';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, -7);
                ctx.lineTo(7, 0);
                ctx.lineTo(0, 7);
                ctx.lineTo(-7, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // Draw Police Officers (Red Blips)
        if (window.gameInstance && window.gameInstance.police && window.gameInstance.police.activeOfficers) {
            ctx.fillStyle = '#ff0055';
            for (let cop of window.gameInstance.police.activeOfficers) {
                if (cop.state === "dead") continue;
                ctx.fillRect((cop.x - 2) * scale, (cop.z - 2) * scale, 3.5 * scale, 3.5 * scale);
            }
        }

        ctx.restore();

        // Draw Local Player Triangle at Center (Always pointing UP)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = '#ff2a85';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // =========================================================================
    // FULL INTERACTIVE WORLD MAP & CHARACTER MOVEMENT TRACKING
    // =========================================================================
    static renderWorldMap(player, remotePlayers, vehicles) {
        if (!this.worldMapCtx || !this.worldMapCanvas) return;
        const ctx = this.worldMapCtx;
        const cw = this.worldMapCanvas.width;
        const ch = this.worldMapCanvas.height;
        const cx = cw / 2;
        const cy = ch / 2;

        const mapScale = 0.58 * (this.mapZoom || 1.0);
        const mapOriginX = (this.mapPan && this.mapPan.x !== undefined) ? this.mapPan.x : player.position.x;
        const mapOriginZ = (this.mapPan && this.mapPan.z !== undefined) ? this.mapPan.z : player.position.z;

        const w2mX = (wx) => cx + (wx - mapOriginX) * mapScale;
        const w2mZ = (wz) => cy + (wz - mapOriginZ) * mapScale;

        // --- Track Tommy's Movement Breadcrumbs ---
        if (!this.playerTrail) this.playerTrail = [];
        const lastPt = this.playerTrail[this.playerTrail.length - 1];
        if (!lastPt || Math.hypot(player.position.x - lastPt.x, player.position.z - lastPt.z) > 1.5) {
            this.playerTrail.push({ x: player.position.x, z: player.position.z, time: Date.now() });
            if (this.playerTrail.length > 40) this.playerTrail.shift();
        }

        // --- Update Map Header UI Texts ---
        const locTitleEl = document.getElementById('map-location-title');
        const coordsEl = document.getElementById('map-coords-display');
        const headingEl = document.getElementById('map-heading-display');

        const currentLoc = this.getLocationName(player.position.x, player.position.z);
        if (locTitleEl) locTitleEl.textContent = currentLoc;

        if (coordsEl) {
            const vSpeed = player.currentVehicle ? Math.round(Math.abs(player.currentVehicle.speed * 2.237)) : (player.isSprinting ? 16 : 8);
            coordsEl.textContent = `GPS: X: ${Math.round(player.position.x)} | Z: ${Math.round(player.position.z)} | ALT: ${player.position.y.toFixed(1)}m | SPD: ${vSpeed} MPH`;
        }

        if (headingEl) {
            const deg = Math.round(((player.rotY * 180 / Math.PI) % 360 + 360) % 360);
            const dirs = ['N','NE','E','SE','S','SW','W','NW'];
            const card = dirs[Math.round(deg / 45) % 8];
            headingEl.textContent = `${String(deg).padStart(3, '0')}° ${card}`;
        }

        // --- 1. OCEAN WATER BACKGROUND WITH TACTICAL GRID ---
        const oceanGrad = ctx.createLinearGradient(0, 0, cw, ch);
        oceanGrad.addColorStop(0, '#001428');
        oceanGrad.addColorStop(1, '#002855');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, cw, ch);

        // Tactical Map Coordinate Grid (50m intervals)
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        const gridStep = 50 * mapScale;
        const startX = cx % gridStep;
        const startZ = cy % gridStep;
        for (let x = startX; x < cw; x += gridStep) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
        }
        for (let z = startZ; z < ch; z += gridStep) {
            ctx.beginPath(); ctx.moveTo(0, z); ctx.lineTo(cw, z); ctx.stroke();
        }

        // --- 2. VICE CITY MAINLAND (West) ---
        // City Landmass Base
        const mainX = w2mX(-180);
        const mainW = (144 - (-180)) * mapScale;
        const mainZ = w2mZ(-550);
        const mainH = 1100 * mapScale;

        ctx.fillStyle = '#10002b';
        ctx.fillRect(mainX, mainZ, mainW, mainH);

        // Sandy Beach Promenade
        const sandX = w2mX(24);
        const sandW = 120 * mapScale;
        ctx.fillStyle = '#ecd0a1';
        ctx.fillRect(sandX, mainZ, sandW, mainH);

        // Shoreline water foam line
        ctx.strokeStyle = '#a2d2ff';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(w2mX(144), mainZ);
        ctx.lineTo(w2mX(144), mainZ + mainH);
        ctx.stroke();

        // Main Ocean Drive Asphalt Boulevard
        ctx.fillStyle = '#343a40';
        ctx.fillRect(w2mX(-18), mainZ, 36 * mapScale, mainH);

        // Yellow Center Line on Ocean Drive
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(w2mX(0), mainZ);
        ctx.lineTo(w2mX(0), mainZ + mainH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cross Streets across Vice City
        ctx.fillStyle = '#2b2d42';
        [-420, -280, -140, 0, 140, 280, 420].forEach(z => {
            ctx.fillRect(w2mX(-160), w2mZ(z - 11), 184 * mapScale, 22 * mapScale);
        });

        // Art Deco Hotel Row Blocks
        ctx.fillStyle = '#ff2a85';
        [-380, -310, -230, -160, -100, -40, 25, 90, 160, 230, 310, 380].forEach(z => {
            ctx.fillRect(w2mX(-55), w2mZ(z - 15), 26 * mapScale, 30 * mapScale);
        });

        // Pay 'n' Spray Garage (Cyan Badge)
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(w2mX(-55 - 4), w2mZ(25 - 4), 8 * mapScale, 8 * mapScale);

        // --- 3. WATER-CROSSING BRIDGES (Solid Gray Deck spanning water) ---
        ctx.fillStyle = '#495057';
        // Main Vice Bay Bridge (z = 0)
        ctx.fillRect(w2mX(20), w2mZ(-12), 206 * mapScale, 24 * mapScale);
        // South Ocean Causeway (z = 180)
        ctx.fillRect(w2mX(20), w2mZ(180 - 12), 206 * mapScale, 24 * mapScale);

        // Bridge Twin Suspension Pylons & Cyan Cables
        ctx.fillStyle = '#00f0ff';
        [85, 165].forEach(tx => {
            ctx.fillRect(w2mX(tx - 3), w2mZ(-13), 6 * mapScale, 26 * mapScale);
            ctx.fillRect(w2mX(tx - 3), w2mZ(180 - 13), 6 * mapScale, 26 * mapScale);
        });

        // --- 4. ISLA NUBLAR PREHISTORIC CONTINENT (East Landmass) ---
        const islX = w2mX(215);
        const islW = (950 - 215) * mapScale;
        const islZ = w2mZ(-480);
        const islH = 960 * mapScale;

        // Deep emerald tropical terrain
        ctx.fillStyle = '#1b3b1e';
        ctx.fillRect(islX, islZ, islW, islH);

        // Prehistoric Sand Shoreline Ring
        ctx.strokeStyle = '#d4a373';
        ctx.lineWidth = 5 * mapScale;
        ctx.strokeRect(islX, islZ, islW, islH);

        // Grand Isla Nublar Arrival Concourse (x = 215 to 275, z = -17 to +17)
        ctx.fillStyle = '#343a40';
        ctx.fillRect(w2mX(215), w2mZ(-17), 60 * mapScale, 34 * mapScale);

        // Jurassic Gate Marker (Flaming pillars at x = 228)
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(w2mX(226), w2mZ(-14), 4 * mapScale, 5 * mapScale);
        ctx.fillRect(w2mX(226), w2mZ(9), 4 * mapScale, 5 * mapScale);

        // Coastal Arterial Highway: Concourse East to Mountain & Stunt Arena
        ctx.fillStyle = '#343a40';
        ctx.fillRect(w2mX(275), w2mZ(-10), 160 * mapScale, 20 * mapScale);

        // South Island Coastal Parkway: Connecting Causeway (z=180) North & South
        ctx.fillRect(w2mX(235), w2mZ(0), 20 * mapScale, 380 * mapScale);

        // Foothill Rally Dirt Circuit (Earthy Brown Track)
        ctx.strokeStyle = '#5c4033';
        ctx.lineWidth = 16 * mapScale;
        ctx.beginPath();
        for (let i = 0; i <= 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            const r = 125 + Math.sin(a * 3) * 15;
            const rx = 430 + Math.cos(a) * r;
            const rz = -140 + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(w2mX(rx), w2mZ(rz));
            else ctx.lineTo(w2mX(rx), w2mZ(rz));
        }
        ctx.stroke();

        // 4-Lane Mountain Perimeter Ring Road (Yellow Dashed Ring at R = 80m)
        ctx.strokeStyle = '#343a40';
        ctx.lineWidth = 22 * mapScale;
        ctx.beginPath();
        ctx.arc(w2mX(430), w2mZ(-140), 80 * mapScale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(w2mX(430), w2mZ(-140), 80 * mapScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Steaming Volcano & Mount Apex Summit (at x = 430, z = -140)
        ctx.fillStyle = '#241d19';
        ctx.beginPath();
        ctx.arc(w2mX(430), w2mZ(-140), 46 * mapScale, 0, Math.PI * 2);
        ctx.fill();

        // Summit Observatory Plateau
        ctx.fillStyle = '#495057';
        ctx.fillRect(w2mX(430 - 18), w2mZ(-140 - 17), 36 * mapScale, 34 * mapScale);

        // Molten Lava Glow in Crater
        const pulse = 1.0 + Math.sin(Date.now() * 0.005) * 0.25;
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(w2mX(430), w2mZ(-140), 10 * mapScale * pulse, 0, Math.PI * 2);
        ctx.fill();

        // --- 5. GRAND VICE MOUNTAIN STUNT & DRIFT ARENA (x = 520 to 680, z = -210 to -70) ---
        const arenaX = w2mX(520);
        const arenaZ = w2mZ(-210);
        const arenaW = 160 * mapScale;
        const arenaH = 140 * mapScale;

        ctx.fillStyle = '#22223b';
        ctx.fillRect(arenaX, arenaZ, arenaW, arenaH);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(arenaX, arenaZ, arenaW, arenaH);

        // 4 Painted Drift Donut Circles on the skidpad
        [
            { x: 560, z: -175, col: '#00f0ff' },
            { x: 640, z: -175, col: '#ff007f' },
            { x: 560, z: -105, col: '#ff007f' },
            { x: 640, z: -105, col: '#00f0ff' }
        ].forEach(d => {
            ctx.strokeStyle = d.col;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(w2mX(d.x), w2mZ(d.z), 12 * mapScale, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Mega Stunt Jump Ramps in Arena (Orange Rectangles)
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(w2mX(553 - 12), w2mZ(-140 - 7), 24 * mapScale, 14 * mapScale);
        ctx.fillRect(w2mX(645 - 7), w2mZ(-140 - 14), 14 * mapScale, 28 * mapScale);

        // --- 6. DISTRICT TEXT LABELS ---
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;

        ctx.fillText("🌴 OCEAN DRIVE BOULEVARD", w2mX(0), w2mZ(-240));
        ctx.fillText("🏖️ OCEAN BEACH", w2mX(85), w2mZ(30));
        ctx.fillText("🌉 VICE BAY SUSPENSION BRIDGE", w2mX(125), w2mZ(-16));
        ctx.fillText("🌉 SOUTH BAY CAUSEWAY", w2mX(125), w2mZ(164));
        ctx.fillText("🦖 ISLA NUBLAR CONCOURSE", w2mX(245), w2mZ(24));
        ctx.fillText("🌋 MT. APEX SUMMIT (14.5m)", w2mX(430), w2mZ(-95));
        ctx.fillText("🏎️ VICE MOUNTAIN RING ROAD", w2mX(430), w2mZ(-230));
        ctx.fillText("🔥 DRIFT & STUNT ARENA", w2mX(600), w2mZ(-75));
        ctx.fillText("🏝️ SOUTH ISLAND PRESERVE", w2mX(320), w2mZ(260));

        // --- 7. STUNT RAMPS & ICONS ---
        if (window.gameInstance && window.gameInstance.world && window.gameInstance.world.ramps) {
            ctx.fillStyle = '#ff5500';
            for (let r of window.gameInstance.world.ramps) {
                const rx = w2mX(r.x);
                const rz = w2mZ(r.z);
                ctx.beginPath();
                ctx.arc(rx, rz, 4 * mapScale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // --- 8. VEHICLES BLIPS ---
        if (vehicles) {
            for (let [vid, v] of Object.entries(vehicles)) {
                if (v === player.currentVehicle) continue;
                const vx = w2mX(v.x);
                const vz = w2mZ(v.z);
                if (vx < 0 || vx > cw || vz < 0 || vz > ch) continue;

                if (v.isPolice) {
                    ctx.fillStyle = (Date.now() % 400 < 200) ? '#ff0033' : '#00f0ff';
                } else if (v.type === "turismo" || v.type === "banshee") {
                    ctx.fillStyle = '#f72585';
                } else if (v.type === "boat") {
                    ctx.fillStyle = '#00f0ff';
                } else if (v.type === "helicopter") {
                    ctx.fillStyle = '#06d6a0';
                } else {
                    ctx.fillStyle = '#ffb703';
                }
                ctx.fillRect(vx - 3, vz - 3, 6, 6);
            }
        }

        // --- 9. REMOTE PLAYERS ---
        if (remotePlayers) {
            ctx.font = '11px "VT323", monospace';
            for (let [pid, rp] of Object.entries(remotePlayers)) {
                const rpx = w2mX(rp.mesh.position.x);
                const rpz = w2mZ(rp.mesh.position.z);
                if (rpx < 0 || rpx > cw || rpz < 0 || rpz > ch) continue;

                ctx.fillStyle = '#00f0ff';
                ctx.beginPath();
                ctx.arc(rpx, rpz, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText(rp.username || 'Player', rpx, rpz - 8);
            }
        }

        // --- 10. MISSION WAYPOINTS ---
        if (window.gameInstance && window.gameInstance.missions) {
            const wp = window.gameInstance.missions.getCurrentWaypoint();
            if (wp) {
                const wpx = w2mX(wp.x);
                const wpz = w2mZ(wp.z);
                ctx.save();
                ctx.translate(wpx, wpz);
                ctx.fillStyle = '#ffd166';
                ctx.strokeStyle = '#ff0055';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(0, -9);
                ctx.lineTo(9, 0);
                ctx.lineTo(0, 9);
                ctx.lineTo(-9, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // --- 11. TOMMY'S CHARACTER MOVEMENT TRACKING ---
        const px = w2mX(player.position.x);
        const pz = w2mZ(player.position.z);

        // Draw Player Movement Trail (Breadcrumb tail fading away)
        if (this.playerTrail.length > 1) {
            ctx.lineWidth = 3.0;
            for (let i = 0; i < this.playerTrail.length - 1; i++) {
                const pt1 = this.playerTrail[i];
                const pt2 = this.playerTrail[i + 1];
                const alpha = (i + 1) / this.playerTrail.length * 0.75;
                ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(w2mX(pt1.x), w2mZ(pt1.z));
                ctx.lineTo(w2mX(pt2.x), w2mZ(pt2.z));
                ctx.stroke();
            }
        }

        // Expanding Animated Radar Ping Ripple around Tommy
        this.radarPingRadius = ((this.radarPingRadius || 0) + 0.35) % 24;
        const pingAlpha = Math.max(0, 1.0 - this.radarPingRadius / 24);
        ctx.strokeStyle = `rgba(0, 240, 255, ${pingAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, pz, this.radarPingRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Tommy's Direction Arrow (Points in Tommy's Heading `rotY`)
        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(-player.rotY + Math.PI); // Coordinate system alignment
        ctx.fillStyle = '#ff007f';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;

        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(8, 9);
        ctx.lineTo(0, 5);
        ctx.lineTo(-8, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Player Tag with Vehicle Name
        ctx.font = 'bold 12px "VT323", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        let vTag = player.currentVehicle ? `[${player.currentVehicle.type.toUpperCase()}]` : '[ON FOOT]';
        ctx.fillText(`TOMMY ${vTag}`, px, pz - 16);
    }
}

window.HUD = HUD;
