import asyncio
import json
import logging
import os
import sys
from typing import Dict, Any

import uvicorn
from starlette.applications import Starlette
from starlette.endpoints import WebSocketEndpoint
from starlette.routing import Route, WebSocketRoute, Mount
from starlette.staticfiles import StaticFiles
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.websockets import WebSocket, WebSocketDisconnect

class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if any(request.url.path.endswith(ext) for ext in [".js", ".css", ".html", "/"]):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ViceCityServer")

# Game State Store
players: Dict[str, Dict[str, Any]] = {}
vehicles: Dict[str, Dict[str, Any]] = {}
active_connections: Dict[str, WebSocket] = {}

# Initial Vehicles to spawn in the city (Fleet of 22 cars & bikes!)
INITIAL_VEHICLES = [
    # Ocean Drive South Strip
    {"id": "veh_infernus_1", "type": "infernus", "x": 12, "y": 0.4, "z": 20, "rot": 0, "color": "#ff0055", "health": 100},
    {"id": "veh_cheetah_1", "type": "cheetah", "x": -12, "y": 0.4, "z": 45, "rot": 3.14, "color": "#00f0ff", "health": 100},
    {"id": "veh_cruiser_1", "type": "cruiser", "x": 12, "y": 0.4, "z": -40, "rot": 0, "color": "#ffb703", "health": 100},
    {"id": "veh_infernus_2", "type": "infernus", "x": -12, "y": 0.4, "z": -80, "rot": 3.14, "color": "#f72585", "health": 100},
    {"id": "veh_cheetah_2", "type": "cheetah", "x": 12, "y": 0.4, "z": 100, "rot": 0, "color": "#7209b7", "health": 100},
    
    # Ocean View Hotel Front & Valet
    {"id": "veh_infernus_3", "type": "infernus", "x": -26, "y": 0.4, "z": -40, "rot": 1.57, "color": "#ffffff", "health": 100},
    {"id": "veh_cruiser_2", "type": "cruiser", "x": -26, "y": 0.4, "z": -50, "rot": 1.57, "color": "#ff007f", "health": 100},
    
    # The Malibu Club Parking
    {"id": "veh_cheetah_3", "type": "cheetah", "x": -26, "y": 0.4, "z": 25, "rot": 1.57, "color": "#4cc9f0", "health": 100},
    {"id": "veh_bike_1", "type": "bike", "x": -26, "y": 0.4, "z": 15, "rot": 1.57, "color": "#ffaa00", "health": 80},
    
    # Vice Casino Parking Bay
    {"id": "veh_cruiser_3", "type": "cruiser", "x": -26, "y": 0.4, "z": 95, "rot": 1.57, "color": "#ffd166", "health": 100},
    {"id": "veh_infernus_4", "type": "infernus", "x": -26, "y": 0.4, "z": 110, "rot": 1.57, "color": "#06d6a0", "health": 100},
    
    # VCPD Police Squad Cars
    {"id": "veh_police_1", "type": "police", "x": -12, "y": 0.4, "z": -120, "rot": -1.57, "color": "#ffffff", "health": 120, "isPolice": True},
    {"id": "veh_police_2", "type": "police", "x": 12, "y": 0.4, "z": 160, "rot": 1.57, "color": "#ffffff", "health": 120, "isPolice": True},
    {"id": "veh_police_3", "type": "police", "x": -26, "y": 0.4, "z": -140, "rot": 1.57, "color": "#ffffff", "health": 120, "isPolice": True},
    
    # Beachside Strip & Boardwalk
    {"id": "veh_bike_2", "type": "bike", "x": 26, "y": 0.4, "z": -15, "rot": 0, "color": "#ff0055", "health": 80},
    {"id": "veh_cruiser_4", "type": "cruiser", "x": 26, "y": 0.4, "z": 60, "rot": 0, "color": "#3a86ff", "health": 100},
    {"id": "veh_bike_3", "type": "bike", "x": 26, "y": 0.4, "z": 130, "rot": 0, "color": "#00f0ff", "health": 80},
    
    # Stunt Ramp Launch Pads
    {"id": "veh_infernus_5", "type": "infernus", "x": -6, "y": 0.4, "z": 40, "rot": 0, "color": "#ffbe0b", "health": 100},
    {"id": "veh_bike_4", "type": "bike", "x": 8, "y": 0.4, "z": -90, "rot": 3.14, "color": "#8338ec", "health": 80},
    {"id": "veh_cheetah_4", "type": "cheetah", "x": 20, "y": 0.4, "z": -5, "rot": 1.57, "color": "#fb5607", "health": 100},
    
    # North Avenue
    {"id": "veh_cruiser_5", "type": "cruiser", "x": -12, "y": 0.4, "z": -210, "rot": 3.14, "color": "#e0aaff", "health": 100},
    {"id": "veh_infernus_6", "type": "infernus", "x": 12, "y": 0.4, "z": 220, "rot": 0, "color": "#ff006e", "health": 100},
    
    # Heavy Military Hardware (Rhino Tanks & Hunter Attack Choppers)
    {"id": "veh_tank_1", "type": "tank", "x": 20, "y": 0.6, "z": 12, "rot": 1.57, "color": "#475338", "health": 600},
    {"id": "veh_tank_2", "type": "tank", "x": 250, "y": 0.8, "z": 25, "rot": -1.57, "color": "#475338", "health": 600},
    {"id": "veh_heli_1", "type": "helicopter", "x": -65, "y": 1.0, "z": -40, "rot": 0, "color": "#303a2b", "health": 400},
    {"id": "veh_heli_2", "type": "helicopter", "x": 250, "y": 1.0, "z": -60, "rot": 1.57, "color": "#303a2b", "health": 400},
    
    # Beach Marina Speedboats (Docked in the water!)
    {"id": "veh_boat_1", "type": "boat", "x": 170, "y": 0.2, "z": 125, "rot": 1.57, "color": "#ffffff", "health": 300},
    {"id": "veh_boat_2", "type": "boat", "x": 185, "y": 0.2, "z": 50, "rot": 0, "color": "#00f0ff", "health": 300},
    {"id": "veh_boat_3", "type": "boat", "x": 170, "y": 0.2, "z": -80, "rot": 1.57, "color": "#ffd166", "health": 300},

    # High-Performance Supercars (Banshee GTS & Turismo V12)
    {"id": "veh_banshee_1", "type": "banshee", "x": -26, "y": 0.4, "z": -15, "rot": 1.57, "color": "#0077b6", "health": 130},
    {"id": "veh_banshee_2", "type": "banshee", "x": 12, "y": 0.4, "z": -150, "rot": 0, "color": "#ff6b35", "health": 130},
    {"id": "veh_turismo_1", "type": "turismo", "x": -26, "y": 0.4, "z": 65, "rot": 1.57, "color": "#06d6a0", "health": 140},
    {"id": "veh_turismo_2", "type": "turismo", "x": 12, "y": 0.4, "z": 80, "rot": 3.14, "color": "#d90429", "health": 140},
    {"id": "veh_turismo_3", "type": "turismo", "x": 235, "y": 0.8, "z": -10, "rot": 1.57, "color": "#7209b7", "health": 140},

    # Vice Mountain Stunt & Drift Plaza Fleet
    {"id": "veh_turismo_mountain", "type": "turismo", "x": 580, "y": 0.65, "z": -140, "rot": 0, "color": "#f72585", "health": 150},
    {"id": "veh_banshee_mountain", "type": "banshee", "x": 600, "y": 0.65, "z": -120, "rot": 1.57, "color": "#4cc9f0", "health": 150},
    {"id": "veh_infernus_mountain", "type": "infernus", "x": 560, "y": 0.65, "z": -160, "rot": -1.57, "color": "#ffd166", "health": 130},
    {"id": "veh_bike_mountain", "type": "bike", "x": 615, "y": 0.65, "z": -150, "rot": 3.14, "color": "#06d6a0", "health": 100},

    # Motocross Enduro Sanchez Dirt Bikes (Image 5)
    {"id": "veh_sanchez_1", "type": "sanchez", "x": 32, "y": 0.4, "z": 10, "rot": 0, "color": "#38b000", "health": 90},
    {"id": "veh_sanchez_2", "type": "sanchez", "x": 630, "y": 0.65, "z": -130, "rot": 1.57, "color": "#ff9f1c", "health": 90},
    {"id": "veh_sanchez_3", "type": "sanchez", "x": -26, "y": 0.4, "z": -70, "rot": 1.57, "color": "#00f0ff", "health": 90},

    # Commercial Delivery Box Trucks (Image 5)
    {"id": "veh_truck_1", "type": "truck", "x": -12, "y": 0.55, "z": -170, "rot": 3.14, "color": "#f8f9fa", "health": 250},
    {"id": "veh_truck_2", "type": "truck", "x": -26, "y": 0.55, "z": -180, "rot": 1.57, "color": "#e9ecef", "health": 250},
    {"id": "veh_truck_mountain", "type": "truck", "x": 550, "y": 0.65, "z": -120, "rot": 0, "color": "#ffffff", "health": 250},

    # Vice City Transit Coach Buses (Image 5)
    {"id": "veh_bus_1", "type": "bus", "x": 12, "y": 0.55, "z": -10, "rot": 0, "color": "#0077b6", "health": 350},
    {"id": "veh_bus_2", "type": "bus", "x": -12, "y": 0.55, "z": 180, "rot": 3.14, "color": "#00b4d8", "health": 350},
    {"id": "veh_bus_mountain", "type": "bus", "x": 570, "y": 0.65, "z": -80, "rot": 1.57, "color": "#03045e", "health": 350}
]

for v in INITIAL_VEHICLES:
    vehicles[v["id"]] = {
        **v,
        "driverId": None,
        "passengers": [],
        "vx": 0, "vy": 0, "vz": 0,
        "steering": 0,
        "siren": False,
        "headlights": True
    }


async def broadcast(message: dict, exclude_id: str = None):
    """Broadcast JSON message to all connected clients."""
    payload = json.dumps(message)
    dead_ids = []
    for pid, ws in active_connections.items():
        if pid == exclude_id:
            continue
        try:
            await ws.send_text(payload)
        except Exception:
            dead_ids.append(pid)
    
    for pid in dead_ids:
        if pid in active_connections:
            del active_connections[pid]


class GameWebSocket(WebSocketEndpoint):
    encoding = "text"

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        player_id = f"player_{id(websocket)}"
        self.player_id = player_id
        active_connections[player_id] = websocket

        # Assign random spawn position along Ocean Drive
        import random
        spawn_x = random.uniform(-10, 10)
        spawn_z = random.uniform(-20, 20)

        # Default player data
        player_data = {
            "id": player_id,
            "name": f"Tommy_{player_id[-4:]}",
            "x": spawn_x,
            "y": 1.0,
            "z": spawn_z,
            "rotY": 0,
            "pitch": 0,
            "health": 100,
            "armor": 50,
            "cash": 5000,
            "weapon": "pistol",
            "ammo": 45,
            "inVehicle": None,
            "anim": "idle",
            "skinColor": "#3a86ff",
            "shirt": random.choice(["hawaiian_cyan", "hawaiian_pink", "black_suit", "white_suit"]),
            "wantedLevel": 0
        }
        players[player_id] = player_data

        logger.info(f"Player {player_id} connected. Total players: {len(active_connections)}")

        # Send welcome payload with full initial world state
        welcome_msg = {
            "type": "init",
            "yourId": player_id,
            "player": player_data,
            "players": list(players.values()),
            "vehicles": list(vehicles.values())
        }
        await websocket.send_text(json.dumps(welcome_msg))

        # Notify other players
        await broadcast({
            "type": "player_join",
            "player": player_data
        }, exclude_id=player_id)

    async def on_receive(self, websocket: WebSocket, data: str) -> None:
        try:
            msg = json.loads(data)
            mtype = msg.get("type")
            pid = self.player_id

            if mtype == "player_update":
                if pid in players:
                    # Update local player state
                    p = players[pid]
                    for key in ("x", "y", "z", "rotY", "pitch", "anim", "weapon", "ammo", "health", "armor", "wantedLevel"):
                        if key in msg:
                            p[key] = msg[key]
                    
                    # Relay to other players
                    await broadcast({
                        "type": "player_moved",
                        "id": pid,
                        "x": p["x"],
                        "y": p["y"],
                        "z": p["z"],
                        "rotY": p["rotY"],
                        "pitch": p["pitch"],
                        "anim": p["anim"],
                        "weapon": p.get("weapon"),
                        "health": p.get("health"),
                        "armor": p.get("armor"),
                        "wantedLevel": p.get("wantedLevel", 0)
                    }, exclude_id=pid)

            elif mtype == "vehicle_update":
                vid = msg.get("id")
                if vid in vehicles:
                    v = vehicles[vid]
                    for key in ("x", "y", "z", "rot", "vx", "vy", "vz", "steering", "siren", "headlights", "health"):
                        if key in msg:
                            v[key] = msg[key]
                    
                    await broadcast({
                        "type": "vehicle_moved",
                        "id": vid,
                        "data": msg
                    }, exclude_id=pid)

            elif mtype == "vehicle_enter":
                vid = msg.get("vehicleId")
                seat = msg.get("seat", "driver")
                if vid in vehicles and pid in players:
                    v = vehicles[vid]
                    if seat == "driver":
                        v["driverId"] = pid
                    players[pid]["inVehicle"] = vid

                    await broadcast({
                        "type": "vehicle_entered",
                        "vehicleId": vid,
                        "playerId": pid,
                        "seat": seat
                    })

            elif mtype == "vehicle_exit":
                vid = msg.get("vehicleId")
                if vid in vehicles and pid in players:
                    v = vehicles[vid]
                    if v.get("driverId") == pid:
                        v["driverId"] = None
                    players[pid]["inVehicle"] = None

                    await broadcast({
                        "type": "vehicle_exited",
                        "vehicleId": vid,
                        "playerId": pid,
                        "x": msg.get("x", v["x"] + 2),
                        "y": msg.get("y", 1.0),
                        "z": msg.get("z", v["z"])
                    })

            elif mtype == "weapon_fire":
                # Broadcast shot / projectile
                await broadcast({
                    "type": "weapon_fired",
                    "shooterId": pid,
                    "weapon": msg.get("weapon", "pistol"),
                    "origin": msg.get("origin"),
                    "direction": msg.get("direction"),
                    "hit": msg.get("hit")
                }, exclude_id=pid)

            elif mtype == "player_hit":
                target_id = msg.get("targetId")
                damage = msg.get("damage", 25)
                weapon = msg.get("weapon", "pistol")
                
                if target_id in players:
                    target = players[target_id]
                    # Armor absorbs damage first
                    current_armor = target.get("armor", 0)
                    current_health = target.get("health", 100)

                    if current_armor > 0:
                        absorbed = min(current_armor, damage)
                        target["armor"] -= absorbed
                        remaining_damage = damage - absorbed
                    else:
                        remaining_damage = damage

                    target["health"] = max(0, current_health - remaining_damage)
                    is_dead = target["health"] <= 0

                    await broadcast({
                        "type": "damage_dealt",
                        "targetId": target_id,
                        "attackerId": pid,
                        "health": target["health"],
                        "armor": target["armor"],
                        "damage": damage,
                        "isDead": is_dead,
                        "weapon": weapon
                    })

                    if is_dead:
                        # Award cash to killer
                        if pid in players:
                            players[pid]["cash"] = players[pid].get("cash", 0) + 1000

            elif mtype == "player_respawn":
                if pid in players:
                    p = players[pid]
                    import random
                    p["x"] = random.uniform(-10, 10)
                    p["y"] = 1.0
                    p["z"] = random.uniform(-20, 20)
                    p["health"] = 100
                    p["armor"] = 50
                    p["inVehicle"] = None
                    p["wantedLevel"] = 0

                    await broadcast({
                        "type": "player_respawned",
                        "playerId": pid,
                        "player": p
                    })

            elif mtype == "chat_message":
                text = msg.get("text", "").strip()[:100]
                if text and pid in players:
                    name = players[pid].get("name", "Player")
                    await broadcast({
                        "type": "chat",
                        "senderId": pid,
                        "name": name,
                        "text": text
                    })

            elif mtype == "set_name":
                new_name = str(msg.get("name", "")).strip()[:18]
                if new_name and pid in players:
                    players[pid]["name"] = new_name
                    await broadcast({
                        "type": "name_changed",
                        "playerId": pid,
                        "name": new_name
                    })

        except Exception as e:
            logger.error(f"Error handling message from {self.player_id}: {e}")

    async def on_disconnect(self, websocket: WebSocket, close_code: int) -> None:
        pid = self.player_id
        if pid in active_connections:
            del active_connections[pid]
        
        # Free any vehicle driven by this player
        for vid, v in vehicles.items():
            if v.get("driverId") == pid:
                v["driverId"] = None
                await broadcast({
                    "type": "vehicle_exited",
                    "vehicleId": vid,
                    "playerId": pid,
                    "x": v["x"],
                    "y": v["y"],
                    "z": v["z"]
                })

        if pid in players:
            del players[pid]

        logger.info(f"Player {pid} left. Remaining players: {len(active_connections)}")
        await broadcast({
            "type": "player_leave",
            "id": pid
        })


def get_lan_ip():
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


async def healthcheck(request):
    return JSONResponse({
        "status": "online",
        "game": "Vice City Multiplayer 3D",
        "players_online": len(active_connections)
    })


async def lan_info_endpoint(request):
    lan_ip = get_lan_ip()
    port = int(os.environ.get("PORT", 8000))
    return JSONResponse({
        "status": "online",
        "ip": lan_ip,
        "port": port,
        "url": f"http://{lan_ip}:{port}",
        "players_online": len(active_connections)
    })


STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

# Routes setup
routes = [
    Route("/health", healthcheck),
    Route("/api/lan-info", lan_info_endpoint),
    WebSocketRoute("/ws", GameWebSocket),
    Mount("/", app=StaticFiles(directory=STATIC_DIR, html=True), name="public")
]

app = Starlette(debug=True, routes=routes, middleware=[Middleware(NoCacheMiddleware)])

if __name__ == "__main__":
    host = "0.0.0.0"
    port = int(os.environ.get("PORT", 8000))
    lan_ip = get_lan_ip()
    print("=" * 60)
    print("🌴 GTA VICE CITY MULTIPLAYER SERVER 🌴")
    print(f"🚀 Running at: http://localhost:{port}")
    print(f"🌐 Play with mobile & PC together: http://{lan_ip}:{port}")
    print("=" * 60)
    uvicorn.run(app, host=host, port=port, log_level="info")
