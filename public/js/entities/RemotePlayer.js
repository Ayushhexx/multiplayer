class RemotePlayer {
    constructor(data, scene) {
        this.id = data.id;
        this.name = data.name || "Player";
        this.scene = scene;
        this.shirtType = data.shirt || "hawaiian_cyan";

        // State & Interpolation targets
        this.currentPos = new THREE.Vector3(data.x || 0, data.y || 1, data.z || 0);
        this.targetPos = this.currentPos.clone();
        this.currentRotY = data.rotY || 0;
        this.targetRotY = data.rotY || 0;
        this.anim = data.anim || "idle";
        this.weapon = data.weapon || "pistol";
        this.health = data.health || 100;
        this.armor = data.armor || 50;
        this.inVehicle = data.inVehicle || null;

        // Build 3D Character
        this.char = CharacterModel.create(this.shirtType);
        this.mesh = this.char.root;
        this.mesh.position.copy(this.currentPos);
        this.scene.add(this.mesh);

        // Weapon visual
        this.updateWeaponModel(this.weapon);

        // Name tag & health billboard
        this.nameTagSprite = this.createNameTagSprite(this.name, this.health);
        this.nameTagSprite.position.set(0, 2.3, 0);
        this.mesh.add(this.nameTagSprite);
    }

    createNameTagSprite(name, health) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Draw background
        ctx.fillStyle = 'rgba(13, 2, 33, 0.75)';
        ctx.roundRect(10, 10, 236, 44, 8);
        ctx.fill();

        // Draw name
        ctx.font = 'bold 20px Montserrat, sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText(name, 128, 32);

        // Health bar
        ctx.fillStyle = '#333333';
        ctx.fillRect(30, 40, 196, 8);

        const healthRatio = Math.max(0, Math.min(1, health / 100));
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(30, 40, 196 * healthRatio, 8);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(2.2, 0.55, 1);
        sprite.canvas = canvas;
        sprite.ctx = ctx;
        return sprite;
    }

    updateNameTag(health) {
        if (!this.nameTagSprite || !this.nameTagSprite.ctx) return;
        const ctx = this.nameTagSprite.ctx;
        ctx.clearRect(0, 0, 256, 64);

        ctx.fillStyle = 'rgba(13, 2, 33, 0.75)';
        ctx.roundRect(10, 10, 236, 44, 8);
        ctx.fill();

        ctx.font = 'bold 20px Montserrat, sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 128, 32);

        ctx.fillStyle = '#333333';
        ctx.fillRect(30, 40, 196, 8);

        const healthRatio = Math.max(0, Math.min(1, health / 100));
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(30, 40, 196 * healthRatio, 8);

        this.nameTagSprite.material.map.needsUpdate = true;
    }

    updateWeaponModel(weaponKey) {
        this.weapon = weaponKey;
        const slot = this.char.weaponSlot;
        while (slot.children.length > 0) slot.remove(slot.children[0]);

        const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
        if (weaponKey === "pistol") {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.22), gunMat);
            body.position.set(0, 0, 0.08);
            slot.add(body);
        } else if (weaponKey === "uzi") {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.28), gunMat);
            body.position.set(0, 0, 0.1);
            slot.add(body);
        } else if (weaponKey === "shotgun") {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65), gunMat);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0, 0.25);
            slot.add(barrel);
        } else if (weaponKey === "rpg") {
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9), gunMat);
            tube.rotation.x = Math.PI / 2;
            tube.position.set(0, 0.1, 0.2);
            slot.add(tube);
        }
    }

    setTargetState(data) {
        if (data.x !== undefined && data.z !== undefined) {
            this.targetPos.set(data.x, data.y ?? this.targetPos.y, data.z);
        }
        if (data.rotY !== undefined) {
            this.targetRotY = data.rotY;
        }
        if (data.anim) this.anim = data.anim;
        if (data.weapon && data.weapon !== this.weapon) {
            this.updateWeaponModel(data.weapon);
        }
        if (data.health !== undefined && data.health !== this.health) {
            this.health = data.health;
            this.updateNameTag(this.health);
        }
    }

    update(dt, time) {
        // LERP position and SLERP rotation for buttery 60fps smoothing
        this.currentPos.lerp(this.targetPos, Math.min(1, dt * 15));
        this.mesh.position.copy(this.currentPos);

        // Rotation interpolation
        let diffRot = this.targetRotY - this.currentRotY;
        while (diffRot < -Math.PI) diffRot += Math.PI * 2;
        while (diffRot > Math.PI) diffRot -= Math.PI * 2;
        this.currentRotY += diffRot * Math.min(1, dt * 15);
        this.mesh.rotation.x = 0;
        this.mesh.rotation.y = this.currentRotY;
        this.mesh.rotation.z = 0;

        // Animate limbs
        const speed = (this.anim === "sprint") ? 1.5 : (this.anim === "run" ? 1.2 : 0.8);
        CharacterModel.updateAnimation(this.char, this.anim, speed, time, this.anim === "aim");
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

window.RemotePlayer = RemotePlayer;
