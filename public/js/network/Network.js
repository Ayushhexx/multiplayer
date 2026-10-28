class NetworkClient {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.reconnectTimer = null;
        this.lastSendTime = 0;
        this.sendRate = 1 / 30; // 30Hz network tick rate
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        console.log(`[Network] Connecting to ${wsUrl}...`);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("[Network] Connected to Vice City server!");
            this.connected = true;
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            HUD.addChatMessage("system", "Connected to Vice City Multiplayer server!");
        };

        this.socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this.handleMessage(msg);
            } catch (e) {
                console.error("[Network] Error parsing message:", e);
            }
        };

        this.socket.onclose = () => {
            console.warn("[Network] Disconnected from server. Reconnecting in 3s...");
            this.connected = false;
            HUD.addChatMessage("system", "Disconnected from server. Retrying...");
            this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        };

        this.socket.onerror = (err) => {
            console.error("[Network] WebSocket error:", err);
        };
    }

    send(data) {
        if (this.connected && this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    handleMessage(msg) {
        const mtype = msg.type;

        if (mtype === "init") {
            this.game.onServerInit(msg);
        } else if (mtype === "player_join") {
            this.game.onPlayerJoin(msg.player);
        } else if (mtype === "player_leave") {
            this.game.onPlayerLeave(msg.id);
        } else if (mtype === "player_moved") {
            this.game.onPlayerMoved(msg);
        } else if (mtype === "vehicle_moved") {
            this.game.onVehicleMoved(msg.id, msg.data);
        } else if (mtype === "vehicle_entered") {
            this.game.onVehicleEntered(msg);
        } else if (mtype === "vehicle_exited") {
            this.game.onVehicleExited(msg);
        } else if (mtype === "weapon_fired") {
            this.game.onRemoteWeaponFired(msg);
        } else if (mtype === "damage_dealt") {
            this.game.onDamageDealt(msg);
        } else if (mtype === "player_respawned") {
            this.game.onPlayerRespawned(msg);
        } else if (mtype === "chat") {
            HUD.addChatMessage(msg.name, msg.text);
        }
    }

    sendPlayerUpdate(data) {
        const now = performance.now() / 1000;
        if (now - this.lastSendTime < this.sendRate) return;
        this.lastSendTime = now;

        this.send({
            type: "player_update",
            ...data
        });
    }

    sendVehicleUpdate(data) {
        this.send({
            type: "vehicle_update",
            ...data
        });
    }

    sendVehicleEnter(vehicleId) {
        this.send({
            type: "vehicle_enter",
            vehicleId: vehicleId
        });
    }

    sendVehicleExit(vehicleId, pos) {
        this.send({
            type: "vehicle_exit",
            vehicleId: vehicleId,
            x: pos.x,
            y: pos.y,
            z: pos.z
        });
    }

    sendWeaponFire(data) {
        this.send({
            type: "weapon_fire",
            ...data
        });
    }

    sendPlayerHit(targetId, damage, weapon) {
        this.send({
            type: "player_hit",
            targetId,
            damage,
            weapon
        });
    }

    sendRespawn() {
        this.send({
            type: "player_respawn"
        });
    }

    sendChat(text) {
        this.send({
            type: "chat_message",
            text
        });
    }

    setName(name) {
        this.send({
            type: "set_name",
            name
        });
    }
}

window.NetworkClient = NetworkClient;
