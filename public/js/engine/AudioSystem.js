class AudioSystem {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.initialized = false;

        // Volumes
        this.masterVolume = 1.0;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.85;

        // Master and bus gains
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        // Radio station tracks (Vehicles)
        this.stations = [
            { name: "Wave 103 (Synthwave FM)", bpm: 118, scale: [220, 261.6, 293.7, 329.6, 392], type: "synthwave" },
            { name: "Flash FM (Miami Hits)", bpm: 128, scale: [261.6, 293.7, 329.6, 349.2, 392, 440], type: "pop" },
            { name: "V-Rock (Heavy 80s)", bpm: 138, scale: [146.8, 174.6, 196.0, 220.0, 261.6], type: "rock" },
            { name: "Radio OFF", bpm: 0, scale: [], type: "off" }
        ];
        this.currentStationIndex = 0;
        this.radioInterval = null;
        this.radioStep = 0;

        // Vehicle engine sound
        this.engineOsc = null;
        this.engineGain = null;
        this.isEngineRunning = false;

        // Siren oscillator
        this.sirenOsc = null;
        this.sirenGain = null;
        this.isSirenRunning = false;
        this.sirenTimer = null;

        // Dynamic Thriller Background Music Engine
        this.currentMood = "exploration"; // exploration, mystery, hard_mission, boss, pursuit, dino_encounter
        this.bgMusicTimer = null;
        this.bgMusicStep = 0;
        this.bgDroneOsc1 = null;
        this.bgDroneOsc2 = null;
        this.bgDroneGain = null;
        this.musicActive = true;
        this.lastDispatchTime = 0;
    }

    init() {
        if (this.initialized) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        // Setup master busses
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.initialized = true;

        // Start default ambient exploration music
        this.startBackgroundMusic("exploration");
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.initialized) {
            this.init();
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        }
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        }
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        }
    }

    // --- Dynamic Thriller Background Music & Contextual States ---
    setMood(newMood) {
        if (this.currentMood === newMood) return;
        console.log(`[AudioSystem] Changing audio mood: ${this.currentMood} -> ${newMood}`);
        this.currentMood = newMood;

        if (!this.ctx || !this.musicActive) return;

        // Smooth crossfade: ramp down current music gain briefly, switch pattern, ramp back up
        const now = this.ctx.currentTime;
        if (this.musicGain) {
            this.musicGain.gain.cancelScheduledValues(now);
            this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
            this.musicGain.gain.linearRampToValueAtTime(0.05, now + 0.4);
            this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, now + 1.2);
        }

        setTimeout(() => {
            this.startBackgroundMusic(newMood);
        }, 400);
    }

    startBackgroundMusic(mood) {
        if (this.bgMusicTimer) {
            clearInterval(this.bgMusicTimer);
            this.bgMusicTimer = null;
        }
        this.stopDrone();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Choose tempo and sound design by mood
        let bpm = 120;
        let stepMs = 125; // 16th note timing

        if (mood === "exploration") {
            bpm = 115;
            stepMs = (60 / bpm / 2) * 1000;
        } else if (mood === "mystery") {
            bpm = 85;
            stepMs = (60 / bpm / 2) * 1000;
            this.startDrone(55, 65.4); // Dark low mystery drone
        } else if (mood === "hard_mission") {
            bpm = 128;
            stepMs = (60 / bpm / 4) * 1000; // 16ths
            this.startDrone(43.6, 65.4);
        } else if (mood === "boss") {
            bpm = 140;
            stepMs = (60 / bpm / 4) * 1000;
            this.startDrone(36.7, 55.0);
        } else if (mood === "pursuit") {
            bpm = 136;
            stepMs = (60 / bpm / 4) * 1000;
        } else if (mood === "dino_encounter") {
            bpm = 95;
            stepMs = (60 / bpm / 2) * 1000;
            this.startDrone(48.9, 73.4);
        }

        this.bgMusicStep = 0;
        this.bgMusicTimer = setInterval(() => {
            if (this.isMuted || !this.ctx || !this.musicActive) return;
            // Only play background music if vehicle radio is OFF or player is on foot
            if (this.currentStationIndex !== 3 && this.radioInterval) return;

            this.stepBackgroundMusic(mood);
            this.bgMusicStep++;
        }, stepMs);
    }

    startDrone(f1, f2) {
        if (!this.ctx) return;
        this.stopDrone();
        const now = this.ctx.currentTime;

        this.bgDroneOsc1 = this.ctx.createOscillator();
        this.bgDroneOsc2 = this.ctx.createOscillator();
        this.bgDroneGain = this.ctx.createGain();

        this.bgDroneOsc1.type = 'sawtooth';
        this.bgDroneOsc2.type = 'triangle';
        this.bgDroneOsc1.frequency.setValueAtTime(f1, now);
        this.bgDroneOsc2.frequency.setValueAtTime(f2, now);

        // Low-pass filter to keep it dark and warm
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);

        this.bgDroneGain.gain.setValueAtTime(0.001, now);
        this.bgDroneGain.gain.linearRampToValueAtTime(0.08, now + 1.5);

        this.bgDroneOsc1.connect(filter);
        this.bgDroneOsc2.connect(filter);
        filter.connect(this.bgDroneGain);
        this.bgDroneGain.connect(this.musicGain || this.ctx.destination);

        this.bgDroneOsc1.start(now);
        this.bgDroneOsc2.start(now);
    }

    stopDrone() {
        if (this.bgDroneOsc1) {
            try {
                this.bgDroneOsc1.stop();
                this.bgDroneOsc1.disconnect();
                this.bgDroneOsc2.stop();
                this.bgDroneOsc2.disconnect();
            } catch(e) {}
            this.bgDroneOsc1 = null;
            this.bgDroneOsc2 = null;
            this.bgDroneGain = null;
        }
    }

    stepBackgroundMusic(mood) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const step = this.bgMusicStep % 32;

        if (mood === "exploration") {
            // Retro synthwave ambient bass & chords
            if (step % 4 === 0) {
                const bassNotes = [110, 110, 130.8, 98];
                const freq = bassNotes[Math.floor(step / 8) % bassNotes.length];
                this.playTone(freq, 0.28, 'triangle', 0.06, this.musicGain);
            }
            if (step % 8 === 2 || step % 8 === 6) {
                const leadNotes = [329.6, 392, 440, 523.2];
                this.playTone(leadNotes[step % leadNotes.length], 0.35, 'sine', 0.03, this.musicGain);
            }
        } else if (mood === "mystery") {
            // Suspenseful eerie metallic pulses & soft sub clicks
            if (step % 8 === 0) {
                this.playTone(73.4, 0.6, 'sine', 0.08, this.musicGain);
            }
            if (step === 6 || step === 22) {
                // High eerie bell resonance
                this.playTone(880, 0.45, 'triangle', 0.02, this.musicGain);
            }
            if (step % 4 === 2) {
                this.playSubtleStatic(now, 0.08);
            }
        } else if (mood === "hard_mission") {
            // Cinematic 16th arpeggiated tension bass
            const minorScale = [110, 123.47, 130.81, 146.83, 164.81];
            const note = minorScale[step % minorScale.length];
            this.playTone(note, 0.1, 'sawtooth', 0.05, this.musicGain);

            // Snare / rimshot on beats
            if (step % 8 === 4) {
                this.playNoiseSnare(now, 0.04);
            }
            if (step % 16 === 0) {
                this.playTone(55, 0.4, 'sine', 0.12, this.musicGain); // Deep impact kick
            }
        } else if (mood === "boss") {
            // Intense battle percussion & driving aggressive groove
            if (step % 4 === 0) {
                this.playTone(45, 0.2, 'sawtooth', 0.18, this.musicGain); // Heavy 808 stomp
            }
            if (step % 8 === 4) {
                this.playNoiseSnare(now, 0.09); // Heavy industrial snare
            }
            if (step % 2 === 1) {
                const bossNotes = [174.6, 164.8, 146.8, 130.8];
                this.playTone(bossNotes[(step * 3) % bossNotes.length], 0.08, 'square', 0.04, this.musicGain);
            }
        } else if (mood === "pursuit") {
            // 5-Star police chase high-octane bass pulse
            const pursuitBass = [130.8, 146.8, 164.8, 174.6];
            const f = pursuitBass[Math.floor(step / 4) % pursuitBass.length];
            this.playTone(f, 0.12, 'sawtooth', 0.08, this.musicGain);

            if (step % 4 === 2) {
                this.playNoiseSnare(now, 0.06);
            }
            // Occasional police dispatch squelch
            if (step === 0 && Math.random() < 0.25) {
                this.playPoliceRadioDispatch();
            }
        } else if (mood === "dino_encounter") {
            // Primal suspense, deep bone-rattling pulse
            if (step % 8 === 0) {
                this.playTone(38, 0.45, 'triangle', 0.16, this.musicGain);
            }
            if (step % 8 === 4) {
                this.playTone(58, 0.25, 'sawtooth', 0.06, this.musicGain);
            }
        }
    }

    playTone(freq, dur, type = 'sine', vol = 0.05, destination = null) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(destination || this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
    }

    playSubtleStatic(time, dur = 0.08) {
        if (!this.ctx) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.4;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.02, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain || this.ctx.destination);

        noise.start(time);
    }

    // --- Victory Fanfare & Mission Failure Cues ---
    playVictoryCue() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        console.log("[AudioSystem] Playing Mission Victory Fanfare!");

        // Ascending major synth brass fanfare: C4, E4, G4, C5!
        const notes = [261.6, 329.6, 392.0, 523.25, 659.25];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.14);

            const startTime = now + idx * 0.14;
            const dur = (idx === notes.length - 1) ? 1.4 : 0.25;

            gain.gain.setValueAtTime(0.18, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

            osc.connect(gain);
            gain.connect(this.sfxGain || this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + dur + 0.05);
        });

        // Sub bass boom underneath
        this.playTone(65.4, 1.2, 'sine', 0.25, this.sfxGain);

        // Resume background mood after 4 seconds
        setTimeout(() => {
            this.setMood("exploration");
        }, 4000);
    }

    playFailureCue() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        console.log("[AudioSystem] Playing Mission Failure Cue!");

        // Low minor tape-stop decay: Eb3 -> D3 -> C3
        const notes = [155.56, 146.83, 130.81];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';

            const startTime = now + idx * 0.28;
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startTime + 0.5);

            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

            osc.connect(gain);
            gain.connect(this.sfxGain || this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
    }

    // --- Police Radio Dispatch Chatter ---
    playPoliceRadioDispatch() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (now - this.lastDispatchTime < 4.0) return; // Prevent spamming
        this.lastDispatchTime = now;

        // 1. Radio Click / Squelch Burst
        this.playSubtleStatic(now, 0.07);

        // 2. High 10-4 Tone Beep (850 Hz -> 1100 Hz)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now + 0.05);
        osc.frequency.setValueAtTime(1200, now + 0.12);

        gain.gain.setValueAtTime(0.08, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now + 0.05);
        osc.stop(now + 0.25);

        // 3. Modulated Dispatch Chatter (Bandpass voice-like noise burst)
        setTimeout(() => {
            if (!this.ctx) return;
            const chatterNow = this.ctx.currentTime;
            this.playSubtleStatic(chatterNow, 0.35);
        }, 220);
    }

    // --- Dinosaur Footsteps & Growls ---
    playDinoFootstep(isBoss = false) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // T-Rex is deep sub-bass 38Hz earthquake thump; raptor is punchy 75Hz gravel thud
        osc.type = isBoss ? 'sine' : 'triangle';
        const startFreq = isBoss ? 65 : 110;
        const endFreq = isBoss ? 24 : 45;

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + (isBoss ? 0.35 : 0.18));

        const vol = isBoss ? 0.45 : 0.15;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isBoss ? 0.38 : 0.2));

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + (isBoss ? 0.4 : 0.22));

        // Sub-bass rumble for boss
        if (isBoss) {
            this.playNoiseSnare(now, 0.1);
        }
    }

    playDinoRoar() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.linearRampToValueAtTime(145, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(32, now + 1.4);

        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

        // Low-pass filter for throat depth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
    }

    playDinoGrowl() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.4);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.48);
    }

    playDinoAttack() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Swift sharp bite snap
        this.playTone(280, 0.15, 'sawtooth', 0.22, this.sfxGain);
        this.playNoiseSnare(now, 0.08);
    }

    playCopGunshot() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
        this.playNoiseSnare(now, 0.05);
    }

    // --- 80s Synthesizer Radio ---
    setRadioStation(index) {
        this.currentStationIndex = index % this.stations.length;
        if (this.radioInterval) {
            clearInterval(this.radioInterval);
            this.radioInterval = null;
        }

        const station = this.stations[this.currentStationIndex];
        if (station.bpm === 0 || !this.ctx) {
            // Radio is OFF, resume background dynamic thriller music
            this.startBackgroundMusic(this.currentMood);
            return station.name;
        }

        const stepTime = (60 / station.bpm / 2) * 1000;
        this.radioStep = 0;

        this.radioInterval = setInterval(() => {
            if (this.isMuted || !this.ctx) return;
            this.playRadioStep(station);
            this.radioStep++;
        }, stepTime);

        return station.name;
    }

    nextRadioStation() {
        return this.setRadioStation(this.currentStationIndex + 1);
    }

    playRadioStep(station) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const step = this.radioStep % 16;

        // Bassline on 8ths
        if (step % 2 === 0) {
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'sawtooth';

            const root = station.scale[0] / 2;
            const bassFreq = (step % 8 === 0) ? root : root * ((step % 4 === 0) ? 1.25 : 1.5);
            bassOsc.frequency.setValueAtTime(bassFreq, now);

            bassGain.gain.setValueAtTime(0.08, now);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            bassOsc.connect(bassGain);
            bassGain.connect(this.musicGain || this.ctx.destination);
            bassOsc.start(now);
            bassOsc.stop(now + 0.22);
        }

        // Synth Arp / Melody
        if (step % 2 === 1 || step % 3 === 0) {
            const note = station.scale[step % station.scale.length];
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            leadOsc.type = 'triangle';
            leadOsc.frequency.setValueAtTime(note, now);

            leadGain.gain.setValueAtTime(0.05, now);
            leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

            leadOsc.connect(leadGain);
            leadGain.connect(this.musicGain || this.ctx.destination);
            leadOsc.start(now);
            leadOsc.stop(now + 0.36);
        }

        // Retro Snare / Clap on beats 4 & 12
        if (step === 4 || step === 12) {
            this.playNoiseSnare(now);
        }
    }

    playNoiseSnare(time, vol = 0.06) {
        if (!this.ctx) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);

        noise.start(time);
    }

    // --- Vehicle Engine Sound ---
    startEngineSound() {
        if (this.isEngineRunning || !this.ctx) return;
        this.isEngineRunning = true;

        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();

        this.engineOsc.type = 'triangle';
        this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain || this.ctx.destination);
        this.engineOsc.start();
    }

    updateEngineSound(speedRatio) {
        if (!this.engineOsc || !this.isEngineRunning || !this.ctx) return;
        const now = this.ctx.currentTime;
        const freq = 55 + Math.min(speedRatio * 220, 225);
        this.engineOsc.frequency.linearRampToValueAtTime(freq, now + 0.05);
    }

    stopEngineSound() {
        if (!this.isEngineRunning) return;
        this.isEngineRunning = false;
        try {
            if (this.engineGain && this.ctx) {
                this.engineGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
            }
            setTimeout(() => {
                if (this.engineOsc) {
                    this.engineOsc.stop();
                    this.engineOsc.disconnect();
                    this.engineOsc = null;
                }
            }, 120);
        } catch (e) {}
    }

    // --- Police Siren ---
    toggleSiren(state) {
        if (state && !this.isSirenRunning) {
            this.startSiren();
        } else if (!state && this.isSirenRunning) {
            this.stopSiren();
        }
    }

    startSiren() {
        if (this.isSirenRunning || !this.ctx) return;
        this.isSirenRunning = true;

        this.sirenOsc = this.ctx.createOscillator();
        this.sirenGain = this.ctx.createGain();
        this.sirenOsc.type = 'sine';

        this.sirenGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
        this.sirenOsc.connect(this.sirenGain);
        this.sirenGain.connect(this.sfxGain || this.ctx.destination);
        this.sirenOsc.start();

        let highTone = false;
        this.sirenTimer = setInterval(() => {
            if (!this.sirenOsc || !this.ctx) return;
            const targetFreq = highTone ? 920 : 650;
            this.sirenOsc.frequency.linearRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.35);
            highTone = !highTone;
        }, 400);
    }

    stopSiren() {
        if (!this.isSirenRunning) return;
        this.isSirenRunning = false;
        if (this.sirenTimer) clearInterval(this.sirenTimer);
        try {
            if (this.sirenGain && this.ctx) {
                this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
            }
            setTimeout(() => {
                if (this.sirenOsc) {
                    this.sirenOsc.stop();
                    this.sirenOsc.disconnect();
                    this.sirenOsc = null;
                }
            }, 120);
        } catch (e) {}
    }

    // --- SFX: Weapons & Explosions ---
    playPistol() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        this.playNoiseSnare(now);
    }

    playAssaultRifle() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.11);

        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
        this.playNoiseSnare(now, 0.08);
    }

    playReload() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Mechanical magazine release & insert
        [0, 0.28, 0.65].forEach((dt, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600 + idx * 180, now + dt);
            osc.frequency.exponentialRampToValueAtTime(150, now + dt + 0.08);

            gain.gain.setValueAtTime(0.12, now + dt);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dt + 0.09);

            osc.connect(gain);
            gain.connect(this.sfxGain || this.ctx.destination);
            osc.start(now + dt);
            osc.stop(now + dt + 0.1);
        });
    }

    playEmptyClick() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    playPickup() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const t = now + idx * 0.06;
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

            osc.connect(gain);
            gain.connect(this.sfxGain || this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.16);
        });
    }

    playLevelUp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [440, 554.37, 659.25, 880, 1108.73].forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            const t = now + idx * 0.1;
            osc.frequency.setValueAtTime(f, t);

            gain.gain.setValueAtTime(0.16, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.sfxGain || this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.4);
        });
    }

    playPayNSpray() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Hydraulic lift + spray whoosh
        this.playSubtleStatic(now, 1.2);
        this.playTone(180, 0.8, 'sawtooth', 0.12, this.sfxGain);
    }

    playUzi() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playShotgun() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        this.playNoiseSnare(now);
    }

    playRPGLaunch() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.3);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
    }

    playExplosion() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.85);

        this.playNoiseSnare(now);
    }

    playPunch() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    playHorn() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [440, 554].forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.32);
        });
    }

    playTireScreech() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
    }

    playBlast() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(15, now + 0.85);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.95);

        this.playNoiseSnare(now);
        this.playNoiseSnare(now + 0.08);
    }

    playTankCannon() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.7);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.75);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
        this.playNoiseSnare(now);
    }

    playDogBark() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [0, 0.18].forEach(dt => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(420, now + dt);
            osc.frequency.exponentialRampToValueAtTime(180, now + dt + 0.12);

            gain.gain.setValueAtTime(0.12, now + dt);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dt + 0.13);

            osc.connect(gain);
            gain.connect(this.sfxGain || this.ctx.destination);
            osc.start(now + dt);
            osc.stop(now + dt + 0.14);
        });
    }

    playCashSound() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [987.77, 1318.51].forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            const t = now + idx * 0.09;
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.2);
        });
    }

    playThunder() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Low frequency rumble burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 2.5);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const env = Math.exp(-i / (this.ctx.sampleRate * 0.8));
            data[i] = (Math.random() * 2 - 1) * env;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain || this.ctx.destination);
        noise.start(now);
        // Initial sharp crack
        this.playTone(80, 0.15, 'sawtooth', 0.35, this.sfxGain);
    }

    playFootstep(surface = 'concrete') {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        // Throttle - max 8/sec
        if (this._lastFootstep && (now - this._lastFootstep) < 0.12) return;
        this._lastFootstep = now;

        const bufSize = Math.floor(this.ctx.sampleRate * 0.06);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        const filt = this.ctx.createBiquadFilter();
        if (surface === 'sand') {
            filt.type = 'highpass'; filt.frequency.value = 2000;
        } else if (surface === 'grass') {
            filt.type = 'lowpass'; filt.frequency.value = 400;
        } else {
            filt.type = 'bandpass'; filt.frequency.value = 900;
        }

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        src.connect(filt);
        filt.connect(g);
        g.connect(this.sfxGain || this.ctx.destination);
        src.start(now);
    }

    playPickupSound() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.playTone(880, 0.08, 'sine', 0.12, this.sfxGain);
        this.playTone(1108, 0.12, 'sine', 0.10, this.sfxGain);
        setTimeout(() => this.playTone(1320, 0.18, 'sine', 0.12, this.sfxGain), 80);
    }

    playLevelUpSound() {
        if (!this.ctx) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.25, 'sine', 0.14, this.sfxGain), i * 100);
        });
    }
}

window.AudioSystem = AudioSystem;
