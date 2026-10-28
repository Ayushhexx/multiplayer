class SaveManager {
    static SAVE_KEY = "vice_city_save_v2";
    static SETTINGS_KEY = "vice_city_settings_v2";

    static defaultSettings = {
        mouseSensitivity: 0.0022,
        invertY: false,
        fov: 72,
        masterVolume: 0.8,
        sfxVolume: 0.8,
        musicVolume: 0.7,
        graphicsQuality: "high"
    };

    static hasSaveData() {
        return !!localStorage.getItem(this.SAVE_KEY);
    }

    static saveGame(player, missionSystem) {
        if (!player) return;

        const data = {
            timestamp: Date.now(),
            player: {
                cash: player.cash || 5000,
                level: player.level || 1,
                xp: player.xp || 0,
                health: Math.max(20, player.health || 100),
                armor: player.armor || 50,
                shirtType: player.shirtType || "hawaiian_cyan",
                weaponKey: player.weaponSystem ? player.weaponSystem.currentWeaponKey : "pistol"
            },
            missions: {
                currentIndex: missionSystem ? missionSystem.currentMissionIndex : 0,
                completedIds: missionSystem ? missionSystem.missions.filter(m => m.completed).map(m => m.id) : []
            }
        };

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            console.log("[SaveManager] Game state saved successfully.");
            HUD.showActionHint("💾 GAME PROGRESS SAVED");
            return true;
        } catch (e) {
            console.error("[SaveManager] Failed to save game:", e);
            return false;
        }
    }

    static loadGame(player, missionSystem) {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);

            if (player && data.player) {
                player.cash = Number.isFinite(data.player.cash) ? data.player.cash : 5000;
                player.level = data.player.level || 1;
                player.xp = data.player.xp || 0;
                player.health = data.player.health || 100;
                player.armor = data.player.armor || 50;
                if (data.player.shirtType) player.setOutfit(data.player.shirtType);
                if (data.player.weaponKey) player.switchWeapon(data.player.weaponKey);

                HUD.updateCash(player.cash);
                HUD.updateVitals(player.health, player.armor);
                if (HUD.updateLevel) HUD.updateLevel(player.level, player.xp, player.xpToNextLevel);
            }

            if (missionSystem && data.missions) {
                if (Number.isInteger(data.missions.currentIndex)) {
                    missionSystem.currentMissionIndex = Math.min(data.missions.currentIndex, missionSystem.missions.length - 1);
                }
                if (Array.isArray(data.missions.completedIds)) {
                    missionSystem.missions.forEach(m => {
                        if (data.missions.completedIds.includes(m.id)) {
                            m.completed = true;
                            m.rewardClaimed = true;
                        }
                    });
                }
                missionSystem.updateHUD();
                missionSystem.applyMissionAtmosphere();
            }

            console.log("[SaveManager] Game state loaded successfully.");
            HUD.showActionHint("📂 SAVED PROGRESS RESTORED");
            return true;
        } catch (e) {
            console.error("[SaveManager] Failed to load game:", e);
            return false;
        }
    }

    static resetGame() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log("[SaveManager] Save data cleared.");
    }

    static loadSettings() {
        try {
            const raw = localStorage.getItem(this.SETTINGS_KEY);
            if (!raw) return { ...this.defaultSettings };
            return { ...this.defaultSettings, ...JSON.parse(raw) };
        } catch (e) {
            return { ...this.defaultSettings };
        }
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("[SaveManager] Failed to save settings:", e);
        }
    }
}

window.SaveManager = SaveManager;
