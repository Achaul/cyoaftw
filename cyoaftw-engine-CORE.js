// ── GAME STATE ───────────────────────────────────────────────────

window.G = {
    player: {
        name: "Adventurer",
        class: "Fighter",
        hp: 20,
        hpMax: 20,
        armor: 10,
        attackBonus: 1,
        weapon: "Short sword",
        coins: 10,
        inventory: [],
        equipped: {},
        coords: "0,0"
    },
    roomMap: {},
    activeRoom: null,
    activeNPC: null,
    prefetchCache: {},
    prefetchQueue: [],
    isPrefetching: false
};

// ── SETUP STATE (window scope for onclick access) ─────────────────

window.setupStats = {
    physicalProwess: 3,
    flexibility: 3,
    willpower: 3,
    endurance: 3,
    charisma: 3,
    pointsLeft: 6
};

window.playerTraits = {};

// ── HELPERS ──────────────────────────────────────────────────────

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getRoom(coords) { return G.roomMap[coords] || null; }
function setRoom(coords, room) { G.roomMap[coords] = room; }

// ── SETUP FLOW ───────────────────────────────────────────────────

function setupGoTo(page) {
    document.querySelectorAll(".setup-page").forEach(p => p.classList.remove("active"));
    document.getElementById(`setupPage${page}`).classList.add("active");
}

function randomizeName() {
    const names = [
        "Aldric","Mira","Cael","Soren","Lyra","Thane",
        "Vessa","Edric","Nori","Brynn","Gareth","Isolde"
    ];
    document.getElementById("charNameEl").value = names[Math.floor(Math.random() * names.length)];
}

function changeStat(stat, delta) {
    const next = window.setupStats[stat] + delta;
    if (next < 1 || next > 7) return;
    if (delta > 0 && window.setupStats.pointsLeft <= 0) return;
    window.setupStats[stat] = next;
    window.setupStats.pointsLeft -= delta;
    document.getElementById(`sv-${stat}`).textContent = next;
    document.getElementById("statPointsLeftEl").textContent = window.setupStats.pointsLeft;
}

function selectPersonality(btn) {
    const question = btn.closest(".personality-question");
    question.querySelectorAll(".personality-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    const trait = btn.dataset.trait;
    window.playerTraits[trait] = (window.playerTraits[trait] || 0) + 1;
}

function beginAdventure() {
    const name   = document.getElementById("charNameEl").value.trim() || "Adventurer";
    const cls    = document.getElementById("charClassEl").value;
    const gender = document.getElementById("charGenderEl").value;
    const zone   = document.getElementById("worldSelectEl").value;
    const room   = document.getElementById("startRoomSelectEl").value;

    const hpByClass  = { Fighter: 20, Rogue: 16, Cleric: 18, Wizard: 14 };
    const atkByClass = { Fighter: 3,  Rogue: 2,  Cleric: 1,  Wizard: 1  };

    G.player = {
        name, class: cls, gender,
        hp:          hpByClass[cls]  || 16,
        hpMax:       hpByClass[cls]  || 16,
        armor:       10,
        attackBonus: atkByClass[cls] || 1,
        weapon:      cls === "Fighter" ? "Short sword"
                   : cls === "Rogue"   ? "Dagger"
                   : cls === "Wizard"  ? "Staff"
                   : "Mace",
        coins:     10,
        inventory: [],
        equipped:  {},
        coords:    "0,0",
        traits:    window.playerTraits,
        stats:     { ...window.setupStats }
    };

    document.getElementById("setupWrapper").style.display = "none";
    document.getElementById("gameWrapper").classList.add("active");

    showSpinner("Preparing your adventure...");
    G.activeRoom = getOrCreateRoom("0,0", zone, room);
    hideSpinner();

    renderRoom();
    renderStats();
    schedulePrefetch();

    addChatMessage("left", "narrator",
        `You find yourself in ${G.activeRoom.displayName}. ${G.activeRoom.baseDescription}`
    );
}

// 

// ── SAVE / LOAD HELPERS ──────────────────────────────────────────

function hasSavedGame() {
    try {
        const raw = localStorage.getItem("cyoaftwSave");
        if (!raw) return false;

        const save = JSON.parse(raw);

        return !!(
            save &&
            save.version === 1 &&
            save.player &&
            save.roomMap &&
            save.player.coords &&
            save.roomMap[save.player.coords]
        );
    } catch (err) {
        console.warn("Saved game check failed:", err);
        return false;
    }
}

function saveGameState() {
    try {
        const saveData = {
            version: 1,

            player: G.player,

            roomMap: G.roomMap,

            meta: {
                savedAt: Date.now()
            }
        };

        localStorage.setItem(
            "cyoaftwSave",
            JSON.stringify(saveData)
        );

        console.log("Game saved.");
        return true;

    } catch (err) {
        console.error("Save failed:", err);
        return false;
    }
}




// ── ROOM GENERATION ──────────────────────────────────────────────

function getOrCreateRoom(coords, zoneName, roomType) {
    if (G.roomMap[coords]) return G.roomMap[coords];

    const room = buildRoomInstance(roomType, zoneName);
    if (!room) return null;

    room.coords  = coords;
    room.exits   = generateExits(coords, zoneName);
    room.creatures = spawnNPCsForRoom(room, zoneName);

    setRoom(coords, room);
    return room;
}

function generateExits(coords, zoneName) {
    const [x, y] = coords.split(",").map(Number);
    const directions = ["N","S","E","W","NE","NW","SE","SW"];
    const exits = {};
    const count = randInt(1, 3);
    const shuffled = directions.sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
        const dir = shuffled[i];
        const off = dirToOffset(dir);
        exits[dir] = `${x + off.x},${y + off.y}`;
    }
    return exits;
}

function dirToOffset(dir) {
    const map = {
        N:  { x:  0, y:  1 }, S:  { x:  0, y: -1 },
        E:  { x:  1, y:  0 }, W:  { x: -1, y:  0 },
        NE: { x:  1, y:  1 }, NW: { x: -1, y:  1 },
        SE: { x:  1, y: -1 }, SW: { x: -1, y: -1 }
    };
    return map[dir] || { x: 0, y: 0 };
}

// ── NPC SPAWNING ─────────────────────────────────────────────────

function spawnNPCsForRoom(room, zoneName) {
    const npcs = [];
    if (room.role === "spine") return npcs;

    const zone = getZoneTemplate(zoneName);
    if (!zone) return npcs;

    const count = room.role === "landmark" ? randInt(1, 3) : randInt(0, 2);
    for (let i = 0; i < count; i++) {
        const species = rand(zone.allowedSpecies);
        const npc = createNPC(species, room, zone);
        if (npc) npcs.push(npc);
    }
    return npcs;
}

function createNPC(species, room, zoneTemplate) {
    const profile     = getRandomPersonalityProfile({});
    const ageCategory = getAgeCategoryForRole("Wanderer", profile.archetype);
    const age         = getRandomAge(ageCategory);
    const gender      = Math.random() < 0.5 ? "male" : "female";
    const temperament = profile.temperament;

    const npc = {
        id:               `${species.toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`,
        name:             `${gender === "male" ? "a male" : "a female"} ${species}`,
        species,
        gender,
        role:             "Wanderer",
        temperament,
        hostility:        temperament === "hostile" ? randInt(60, 90) : randInt(0, 40),
        age,
        ageCategory,
        personalityProfile: profile,
        personalityTraits:  profile.traits,
        speechStyle:        profile.speechStyle,
        hp: 10, hpMax: 10,
        inventory: [],
        equipped:  {},
        memory: {
            metPlayer:       false,
            favorability:    temperament === "hostile" ? -40 : 0,
            lastMood:        "neutral",
            playerActions:   [],
            aggressionCount: 0
        }
    };

    npc.action   = generatePostureOrAction(temperament);
    npc.behavior = generateNPCBehavior(npc);
    return npc;
}

// ── MOVEMENT ─────────────────────────────────────────────────────

function movePlayer(direction) {
    const room = G.activeRoom;
    if (!room || !room.exits[direction]) return;

    const newCoords    = room.exits[direction];
    const zone         = G.activeRoom.zone || "Town";
    const zoneTemplate = getZoneTemplate(zone);
    const roomType     = zoneTemplate ? rand(zoneTemplate.roomTypes) : "Street";

    G.player.coords = newCoords;
    const newRoom = getOrCreateRoom(newCoords, zone, roomType);
    if (!newRoom) { console.warn("Room creation failed for", newCoords); return; } // ← guard
    G.activeRoom = newRoom;
    G.activeNPC  = null;

    renderRoom();
    schedulePrefetch();

    addChatMessage("left", "narrator",
        `You move ${direction} into ${G.activeRoom.displayName}. ${G.activeRoom.baseDescription}`
    );
}

// ── PREFETCH ─────────────────────────────────────────────────────

function schedulePrefetch() {
    const room = G.activeRoom;
    if (!room) return;

    Object.entries(room.exits).forEach(([dir, coords]) => {
        const key = `desc:${coords}`;
        if (G.prefetchCache[key]) return;
        if (G.prefetchQueue.find(t => t.key === key)) return;

        G.prefetchQueue.push({
            key,
            build: () => {
                const z  = room.zone || "Town";
                const zt = getZoneTemplate(z);
                const rt = zt ? rand(zt.roomTypes) : "Street";
                const pr = buildRoomInstance(rt, z);
                return buildPrompt(pr, null,
                    "Write 1 sentence of atmospheric description for this location. Be vivid and brief."
                );
            }
        });
    });

    runPrefetchQueue();
}

async function runPrefetchQueue() {
    if (G.isPrefetching || G.prefetchQueue.length === 0) return;
    G.isPrefetching = true;

    const task = G.prefetchQueue.shift();
    try {
        const prompt = task.build();
        const result = await ai({ instruction: prompt, endButtons: "none" });
        G.prefetchCache[task.key] = result.text || result;
    } catch(e) {
        console.warn("Prefetch failed:", task.key, e);
    }

    G.isPrefetching = false;
    if (G.prefetchQueue.length > 0) setTimeout(runPrefetchQueue, 800);
}

// ── NPC INTERACTION ──────────────────────────────────────────────

async function npcRespond(npc, playerInput) {
    const room = G.activeRoom;

    const instruction = `
You are ${npc.name}, a ${npc.species} in this location.
The player says: "${playerInput}"
Respond in character. Stay brief — 2 to 4 sentences.
Do not break character. Do not refer to yourself as an AI.
Speak only as ${npc.name} would speak.
    `.trim();

    const prompt = buildPrompt(room, npc, instruction);

    addTypingIndicator();

    const result = await ai({ instruction: prompt, endButtons: "none" });

    removeTypingIndicator();

    const responseText = typeof result === "string" ? result : result.text || "";
    addChatMessage("left", npc.name, responseText);

    npc.memory.metPlayer = true;
    npc.memory.lastMood  = "neutral";
    npc.memory.playerActions.push(playerInput.slice(0, 60));
}

// ── CHAT UI ──────────────────────────────────────────────────────

function addChatMessage(side, speaker, text) {
    const log = document.getElementById("chatLogEl");
    if (!log) return;

    const msg    = document.createElement("div");
    msg.className = `chat-message ${side === "player" ? "right" : "left"}`;

    const avatar      = document.createElement("div");
    avatar.className  = "chat-avatar";
    avatar.textContent = speaker;

    const bubble      = document.createElement("div");
    bubble.className  = "chat-bubble";
    bubble.textContent = text;

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    log.appendChild(msg);

    requestAnimationFrame(() => bubble.classList.add("show"));
    log.scrollTop = log.scrollHeight;
}

function addTypingIndicator() {
    const log = document.getElementById("chatLogEl");
    const el  = document.createElement("div");
    el.className = "chat-message left";
    el.id        = "typingMsg";
    el.innerHTML = `
        <div class="chat-avatar">...</div>
        <div class="chat-bubble show">
            <span class="typing-indicator">
                <span class="dot dot1"></span>
                <span class="dot dot2"></span>
                <span class="dot dot3"></span>
            </span>
        </div>`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById("typingMsg");
    if (el) el.remove();
}

function sendChat() {
    const input = document.getElementById("chatInputEl");
    const text  = input.value.trim();
    if (!text || !G.activeNPC) return;
    input.value = "";
    addChatMessage("player", G.player.name, text);
    npcRespond(G.activeNPC, text);
}

// ── RENDER ───────────────────────────────────────────────────────

function renderRoom() {
    const room = G.activeRoom;
    if (!room) return;

    const wrapEl = document.getElementById("roomImageWrapEl");
    if (wrapEl) {
        if (room.image) {
            console.log("Setting bg image:", room.image);
            wrapEl.style.backgroundImage = `url('${room.image}')`;
        } else {
            wrapEl.style.backgroundImage = "";
        }
    }

    const nameEl = document.getElementById("roomNameEl");
    if (nameEl) nameEl.textContent = room.displayName || room.name;

    const descEl = document.getElementById("roomDescEl");
    if (descEl) descEl.textContent = room.baseDescription || "";

    renderNPCs(room.creatures || []);
    renderExits(room.exits    || {});
    renderStats();
}

function renderNPCs(npcs) {
    const el = document.getElementById("npcListEl");
    if (!el) return;
    el.innerHTML = "";
    npcs.forEach(npc => {
        const btn     = document.createElement("button");
        btn.className = "npc-btn";
        btn.textContent = npc.name;
        btn.onclick   = () => selectNPC(npc);
        el.appendChild(btn);
    });
}

function renderExits(exits) {
    ["NW","N","NE","W","E","SW","S","SE"].forEach(dir => {
        const el = document.getElementById(`exit-${dir}`);
        if (!el) return;
        if (exits[dir]) {
            el.textContent = dir;
            el.disabled    = false;
            el.onclick     = () => movePlayer(dir);
        } else {
            el.textContent = "";
            el.disabled    = true;
            el.onclick     = null;
        }
    });
}

function renderStats() {
    const p = G.player;
    document.getElementById("playerNameEl").textContent = p.name;
    document.getElementById("statClassEl").textContent  = p.class;
    document.getElementById("statHpEl").textContent     = `${p.hp} / ${p.hpMax}`;
    document.getElementById("statArmorEl").textContent  = p.armor;
    document.getElementById("statAtkEl").textContent    = `+${p.attackBonus}`;
    document.getElementById("statWeaponEl").textContent = p.weapon;
    document.getElementById("statCoinsEl").textContent  = `${p.coins}g`;

    const pct = Math.max(0, Math.min(100, (p.hp / p.hpMax) * 100));
    document.getElementById("hpBarFillEl").style.width      = pct + "%";
    document.getElementById("hpBarFillEl").style.background =
        pct > 50 ? "#4a9a4a" : pct > 25 ? "#9a8a2a" : "#9a3a3a";

    const room = G.activeRoom;
    if (room) {
        document.getElementById("locationLabelEl").textContent =
            `${room.zone || ""} — ${room.displayName || room.name}`;
    }
}

// ── NPC PANEL ────────────────────────────────────────────────────

function selectNPC(npc) {
    G.activeNPC = npc;

    document.getElementById("npcPlaceholderEl").style.display = "none";
    document.getElementById("npcDetailEl").classList.add("active");
    document.getElementById("npcDetailNameEl").textContent     = npc.name;
    document.getElementById("npcDetailBehaviorEl").textContent = npc.behavior || "";
    document.getElementById("npcMoodEl").textContent           = npc.memory?.lastMood || "neutral";
    document.getElementById("npcRoleEl").textContent           = npc.role || "unknown";

    const favor = npc.memory?.favorability ?? 0;
    document.getElementById("npcFavorEl").textContent =
        favor >= 60 ? "Friendly" : favor >= 20 ? "Neutral" : favor >= -20 ? "Wary" : "Hostile";

    document.getElementById("chatLogEl").innerHTML = "";
    addChatMessage("left", "narrator", `${npc.name} ${npc.action || "is standing nearby"}.`);
    document.getElementById("chatInputEl").placeholder = `Say something to ${npc.name}...`;
}

// ── EQUIPMENT ────────────────────────────────────────────────────

function toggleEquipment() {
    document.getElementById("equipmentManager").classList.toggle("active");
    renderEquipment();
}

function renderEquipment() {
    const eq    = G.player.equipped;
    const slots = ["head","weapon","upper","hands","lower","feet","belt","coinPouch"];
    slots.forEach(slot => {
        const el   = document.getElementById(`eq-${slot}`);
        if (!el) return;
        const item = eq[slot];
        el.textContent  = item ? item.name : "(empty)";
        el.style.color  = item ? "#ccc" : "#555";
    });
}

// ── SPINNER ──────────────────────────────────────────────────────

function showSpinner(msg) {
    document.getElementById("loadingLog").textContent = msg || "Loading...";
    document.getElementById("loadingSpinner").classList.add("active");
}

function hideSpinner() {
    document.getElementById("loadingSpinner").classList.remove("active");
}
