// ── ZONE TEMPLATES ───────────────────────────────────────────────

const ZONE_TEMPLATES = [
    {
        name: "Town",
        hostileArea: false,
        ambiance: "The sounds of daily life fill the air. People go about their business.",
        // "Town Hall" is the zone's boss-room type (see ZONE_BOSS_ROOMS in
        // cyoaftw-engine-CORE.js) - it's a normal, flat-odds entry in this
        // list like any other room type, not specially weighted. "Cellar
        // Shrine" is this zone's guaranteed shrine room (ZONE_SHRINE_ROOMS)
        // in the same style - odd for a Town, tucked away below a tavern.
        roomTypes: ["Tavern", "Taproom", "Inn", "Kitchen", "Cellar", "Smithy", "Street", "Alleyway", "Square", "Avenue", "Gate", "Town Hall", "Cellar Shrine"],
        allowedSpecies: ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn"],
        lightLevel: "bright",
        defaultDanger: "safe"
    },
    {
        name: "Dungeon",
        hostileArea: true,
        ambiance: "The air is cold and stale. Distant sounds echo from unseen passages.",
        // "Buried Shrine" is this zone's guaranteed shrine room
        // (ZONE_SHRINE_ROOMS) - sealed behind a cave-in, easy to miss.
        roomTypes: ["Chamber", "Corridor", "Passage", "Vault", "Trap", "Tunnel", "Armory", "Collapsed Gallery", "Throne Room", "Buried Shrine"],
        allowedSpecies: ["Goblin", "Orc", "Skeleton", "Rat", "Kobold", "Lizardfolk"],
        lightLevel: "dark",
        defaultDanger: "hostile"
    },
    {
        name: "Ruins",
        hostileArea: true,
        ambiance: "Crumbling stone and silence. Whatever once thrived here is long gone.",
        // "Shrine" doubles as this zone's guaranteed shrine room
        // (ZONE_SHRINE_ROOMS) - "Altar" is a second, bonus prayer-capable
        // room type that can also turn up here at ordinary flat odds.
        roomTypes: ["Hallway", "Ruins Passage", "Altar", "Library", "Tower", "Shrine", "Inner Sanctum"],
        allowedSpecies: ["Skeleton", "Ghost", "Goblin", "Lizardfolk"],
        lightLevel: "dim",
        defaultDanger: "hostile"
    },
    {
        name: "Underground City",
        hostileArea: false,
        ambiance: "Torchlight flickers across ancient stone. A civilization lives below the world.",
        // "Deep Well Shrine" is this zone's guaranteed shrine room
        // (ZONE_SHRINE_ROOMS) - built around a dried-up well shaft, tucked
        // between otherwise mundane tunnels.
        roomTypes: ["Cavern", "Mine Shaft", "Vault", "Deep Forge", "Underground Hallway", "Underground Gate", "Chieftain's Hall", "Deep Well Shrine"],
        allowedSpecies: ["Dwarf", "Goblin", "Human", "Kobold", "Dragonborn"],
        lightLevel: "dim",
        defaultDanger: "tense"
    },
    {
        name: "Swamp",
        hostileArea: true,
        ambiance: "Thick mist clings to the water. The ground squelches underfoot, and something large moves in the reeds.",
        // "Sunken Chapel" is this zone's guaranteed shrine room
        // (ZONE_SHRINE_ROOMS) - half-submerged, easy to mistake for just
        // another ruin until you're standing in it.
        roomTypes: ["Marsh", "Broken Ground", "Swamp Camp", "Submerged Ruin", "Witch's Lair", "Sunken Chapel"],
        allowedSpecies: ["Lizardfolk", "Rat", "Kobold"],
        lightLevel: "dim",
        defaultDanger: "hostile"
    }
];

// ── SPECIES TEMPLATES ───────────────────────────────────────────

const SPECIES_TEMPLATES = [
    {
        species: "Human",
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "common",
        lore: "Humans are adaptable people whose customs change quickly from town to frontier. They tend to judge strangers by conduct before bloodline.",
        anatomyProfile: {
            surfaceType: "skin",
            skinTones: ["pale", "fair", "tan", "olive", "brown", "dark brown"],
            hairColors: ["black", "brown", "auburn", "blond", "gray"],
            hairStyles: ["cropped", "loose", "tied back", "braided", "messy"],
            eyeColors: ["brown", "hazel", "green", "blue", "gray"],
            builds: ["lean", "sturdy", "soft-featured", "weathered", "athletic"],
            features: ["calloused hands", "travel-worn boots", "expressive brows", "a tired but alert face"],
            movements: ["moves with practical economy", "keeps an easy human stride", "shifts weight like someone used to long roads"],
            voices: ["plain-spoken", "warm", "dry", "streetwise", "measured"]
        },
        culture: {
            values: ["practical bargains", "local reputation", "family or guild ties"],
            topics: ["recent trouble", "work", "weather", "rumors"],
            taboos: ["being treated as disposable"]
        }
    },
    {
        species: "Elf",
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "formal",
        lore: "Elves carry long memory in their manners. Even a casual remark may be weighed against old promises, beauty, and restraint.",
        anatomyProfile: {
            surfaceType: "skin",
            skinTones: ["pale", "warm ivory", "olive", "copper", "moonlit brown"],
            hairColors: ["silver", "black", "gold", "chestnut", "white"],
            hairStyles: ["long", "braided", "tied with cord", "flowing", "neatly pinned"],
            eyeColors: ["green", "violet", "silver", "amber", "blue"],
            builds: ["willowy", "graceful", "lithe", "narrow-shouldered", "elegant"],
            features: ["tapered ears", "fine cheekbones", "an ageless gaze", "delicate hands"],
            movements: ["moves with quiet precision", "steps as if listening to the floor", "turns with deliberate grace"],
            voices: ["soft", "musical", "formal", "distant", "carefully chosen"]
        },
        culture: {
            values: ["oaths", "old places", "craftsmanship", "patience"],
            topics: ["history", "music", "omens", "old grudges"],
            taboos: ["mockery of tradition", "careless promises"]
        }
    },
    {
        species: "Dwarf",
        isHumanoid: true,
        size: "small",
        isCivilized: true,
        speechStyle: "gruff",
        lore: "Dwarves are shaped by clan, craft, and memory. They notice workmanship quickly and remember debts even faster.",
        anatomyProfile: {
            surfaceType: "skin",
            skinTones: ["ruddy", "tan", "deep brown", "umber", "stone-pale"],
            hairColors: ["black", "brown", "red", "iron-gray", "white"],
            hairStyles: ["braided", "thick", "bound with rings", "cropped", "wild"],
            eyeColors: ["brown", "amber", "gray", "green", "black"],
            builds: ["compact", "broad", "stout", "powerful", "thickset"],
            features: ["square hands", "a strong jaw", "work-scarred knuckles", "ornamental beard-braids"],
            movements: ["plants each step firmly", "moves like a walking wall", "keeps a low steady stance"],
            voices: ["gravelly", "blunt", "resonant", "clipped", "hearty"]
        },
        culture: {
            values: ["craft", "clan honor", "contracts", "endurance"],
            topics: ["stonework", "tools", "lineage", "trade"],
            taboos: ["broken bargains", "insults to craft"]
        }
    },
    {
        species: "Halfling",
        isHumanoid: true,
        size: "small",
        isCivilized: true,
        speechStyle: "folksy",
        lore: "Halflings survive by community, caution, and cheerful misdirection. They often know more local news than they admit.",
        anatomyProfile: {
            surfaceType: "skin",
            skinTones: ["fair", "sun-browned", "warm tan", "olive", "brown"],
            hairColors: ["brown", "black", "sandy", "auburn", "gray"],
            hairStyles: ["curly", "loose", "short", "tousled", "neatly brushed"],
            eyeColors: ["brown", "hazel", "green", "blue"],
            builds: ["compact", "round-faced", "nimble", "soft", "sturdy"],
            features: ["quick fingers", "bright eyes", "barefoot confidence", "a ready half-smile"],
            movements: ["moves with small quick steps", "keeps near cover without seeming to", "rocks lightly on their heels"],
            voices: ["bright", "conspiratorial", "gentle", "quick", "homey"]
        },
        culture: {
            values: ["hospitality", "personal favors", "safe roads", "good food"],
            topics: ["meals", "families", "gossip", "hidden shortcuts"],
            taboos: ["threats to home", "wasted food"]
        }
    },
    {
        species: "Goblin",
        isHumanoid: true,
        isCivilized: false,
        size: "small",
        speechStyle: "clipped",
        lore: "Goblin bands prize cunning, salvage, and status earned by surviving bad odds. They often test strangers before trusting them.",
        articulation: "Small sharp teeth give hard consonants a slight click. Subtle, not exaggerated.",
        anatomyProfile: {
            surfaceType: "skin",
            skinTones: ["moss green", "yellow-green", "ash gray", "mud brown", "sallow ochre"],
            hairColors: ["black", "mud-brown", "rust", "patchy gray", "none"],
            hairStyles: ["patchy", "spiky", "stringy", "cropped", "tufted"],
            eyeColors: ["amber", "red-brown", "black", "yellow", "pale green"],
            builds: ["wiry", "knobby", "scrappy", "thin-limbed", "sinewy"],
            features: ["large ears", "sharp little teeth", "long fingers", "a scarred nose", "ragged nails"],
            movements: ["crouches when watched", "moves in quick nervous bursts", "tilts their head before answering"],
            voices: ["nasal", "raspy", "quick", "sly", "chittering"]
        },
        culture: {
            values: ["useful scraps", "rank", "clever tricks", "survival"],
            topics: ["loot", "routes", "threats", "who is in charge"],
            taboos: ["being cornered", "being laughed at by stronger folk"]
        }
    },
    {
        species: "Orc",
        isHumanoid: true,
        isCivilized: false,
        size: "large",
        speechStyle: "direct",
        lore: "Orcs respect strength, directness, and loyalty proven under pressure. Insults are remembered, but so is courage.",
        articulation: "Tusks blunt and thicken hard consonants slightly. Otherwise speaks clearly.",
        anatomyProfile: {
            surfaceType: "skin",
            skinTones: ["deep green", "gray-green", "ash gray", "dark umber", "olive"],
            hairColors: ["black", "dark brown", "iron-gray", "rust", "shaved"],
            hairStyles: ["shaved at the sides", "braided", "topknotted", "loose", "cropped"],
            eyeColors: ["amber", "brown", "red-brown", "gray", "black"],
            builds: ["powerful", "broad-shouldered", "scarred", "heavy", "muscular"],
            features: ["short tusks", "thick neck", "scarred forearms", "heavy brow", "corded hands"],
            movements: ["moves with blunt confidence", "keeps a fighter's stance", "rolls their shoulders before speaking"],
            voices: ["deep", "rough", "commanding", "low", "blunt"]
        },
        culture: {
            values: ["strength", "honor", "kinship", "spoils fairly won"],
            topics: ["battles", "leadership", "weapons", "worthy enemies"],
            taboos: ["cowardice", "veiled insults"]
        }
    },
    {
        species: "Skeleton",
        isHumanoid: false,
        isCivilized: false,
        size: "medium",
        speechStyle: "broken",
        lore: "Animated skeletons retain fragments of purpose rather than full lives. They respond to command, trespass, and ritual disturbance.",
        articulation: "No lungs or vocal cords - speech is a dry, hollow approximation animated by will, not breath. No breath sounds or wet consonants; words land a beat flatter than a living voice.",
        anatomyProfile: {
            surfaceType: "bone",
            skinTones: ["ivory", "yellowed", "ash-white", "smoke-stained", "old brown"],
            eyeColors: ["blue witchlight", "green witchlight", "empty shadow", "red pinpricks"],
            builds: ["bare-boned", "rattling", "ancient", "jagged", "ritually marked"],
            features: ["cracked ribs", "missing teeth", "rusted bindings", "old blade marks", "dust in every joint"],
            movements: ["rattles with each step", "turns with puppet-like precision", "moves without breath or hesitation"],
            voices: ["dry", "hollow", "wordless", "scraping", "echoing"]
        },
        culture: {
            values: ["orders", "thresholds", "burial rites"],
            topics: ["the command that binds it", "the grave it left", "the trespass it senses"],
            taboos: ["holy symbols", "grave desecration"]
        }
    },
    {
        species: "Rat",
        isHumanoid: false,
        isCivilized: false,
        size: "tiny",
        speechStyle: "broken",
        lore: "Rats follow food, warmth, and danger-scent. A lone rat is usually a sign that a larger hidden ecology is nearby.",
        articulation: "A tiny mouth built for gnawing, not speech - words come out as a thin, urgent squeak-and-chitter blend, half-formed but understandable in context.",
        anatomyProfile: {
            surfaceType: "fur",
            skinTones: ["brown", "black", "gray", "mottled", "pale"],
            eyeColors: ["black", "red", "dark brown"],
            builds: ["small", "lean", "ragged", "sleek", "bony"],
            features: ["long whiskers", "a naked tail", "tiny clawed feet", "twitching ears", "sharp incisors"],
            movements: ["sniffs rapidly", "darts from shadow to shadow", "freezes at the smallest sound"],
            voices: ["squeaking", "silent", "chittering"]
        },
        culture: {
            values: ["food", "escape routes", "warm nests"],
            topics: ["scent trails", "crumbs", "nearby danger"],
            taboos: ["fire", "sudden movement"]
        }
    },
    {
        species: "Ghost",
        isHumanoid: false,
        isCivilized: false,
        // Immune to regular physical damage (weapons with no elemental
        // damage bounce off harmlessly) and only elemental-imbued weapons
        // can actually hurt them - see getSpeciesIsIncorporeal in
        // cyoaftw-engine-CORE.js and its call sites in the combat damage
        // functions. Their own attacks likewise skip the player's HP and
        // drain stamina instead - a ghost's touch is a chill, not a wound.
        incorporeal: true,
        size: "medium",
        speechStyle: "whisper",
        lore: "Ghosts are memory given shape. They notice names, unfinished business, and places where the living have repeated old mistakes.",
        articulation: "No physical vocal apparatus - sound seems to arrive from just behind the listener, thin and half-formed, more impression of speech than actual speech.",
        anatomyProfile: {
            surfaceType: "translucent form",
            skinTones: ["pale blue", "silver-white", "faint green", "smoky gray", "candlelit gold"],
            eyeColors: ["white", "blue", "hollow black", "silver", "faint green"],
            builds: ["faint", "flickering", "mist-thin", "half-remembered", "tattered"],
            features: ["blurred edges", "old-fashioned clothing", "light passing through them", "a face shaped by grief", "drifting hair"],
            movements: ["drifts without touching the floor", "fades at the edges when still", "turns as if hearing distant music"],
            voices: ["echoing", "faint", "mournful", "distant", "whispered"]
        },
        culture: {
            values: ["names", "unfinished promises", "places of death"],
            topics: ["lost memories", "betrayal", "buried truths", "the moment of death"],
            taboos: ["mocking the dead", "breaking memorials"]
        }
    },
    {
        species: "Dragonborn",
        isHumanoid: true,
        size: "large",
        isCivilized: true,
        speechStyle: "direct",
        anatomyType: "mixed",
        hasTail: true,
        cloaca: true,
        lore: "Dragonborn carry the blood of ancient dragons in their scales and breath. They value honor above all — a promise given is a debt that outlasts death. Their clans trace lineage to specific dragon ancestors, and they judge others by the weight of their word.",
        articulation: "A rigid snout with no lips - consonants form further back in the throat, with no lip-rounding for sounds like a soft b or w. Comes through as clipped and slightly breathy rather than mumbled or slurred.",
        anatomyProfile: {
            surfaceType: "scales",
            skinTones: ["deep green", "bronze", "crimson", "deep blue", "black", "gold"],
            hairColors: ["none"],
            hairStyles: ["none"],
            eyeColors: ["gold", "amber", "red", "green", "bronze"],
            builds: ["powerful", "broad-shouldered", "tall", "muscular", "imposing"],
            features: ["draconic snout", "swept-back horns", "thick scaly hide", "a thick tail", "clawed hands", "a breath weapon's heat shimmer"],
            movements: ["moves with heavy purpose", "carries themselves like a soldier", "steps with the weight of their heritage"],
            voices: ["deep and resonant", "rumbling", "commanding", "draconic growl", "booming"]
        },
        culture: {
            values: ["honor", "clan duty", "oaths", "ancestral pride"],
            topics: ["clan history", "dragon ancestors", "oaths sworn and broken", "battles won"],
            taboos: ["broken oaths", "dishonor", "cowardice in the face of duty"]
        }
    },
    {
        species: "Lizardfolk",
        isHumanoid: true,
        size: "medium",
        isCivilized: false,
        speechStyle: "broken",
        anatomyType: "reptilian",
        hasTail: true,
        cloaca: true,
        lore: "Lizardfolk are reptilian survivors shaped by swamp and jungle. They think in terms of predator and prey, not good and evil. Their tribes value practical cunning over sentiment, and they eat what they kill. Trust is earned through shared danger, not words.",
        articulation: "A long snout and forked tongue soften sibilants into a faint hiss and flatten vowels - the mouth doesn't round the way a human's does.",
        anatomyProfile: {
            surfaceType: "scales",
            skinTones: ["moss green", "swamp brown", "olive", "dark green", "gray-green"],
            hairColors: ["none"],
            hairStyles: ["none"],
            eyeColors: ["amber", "yellow", "red", "black"],
            builds: ["wiry", "lean", "sinewy", "compact", "reptilian"],
            features: ["a snout full of sharp teeth", "a thick muscular tail", "clawed webbed hands", "a frilled crest", "slit-pupil eyes", "a forked tongue"],
            movements: ["moves with liquid stillness", "lowers into a crouch when watching", "flicks their tongue to taste the air"],
            voices: ["hissing", "guttural", "sibilant", "low rumble", "chittering"]
        },
        culture: {
            values: ["survival", "tribal strength", "hunting prowess", "territory"],
            topics: ["prey", "water sources", "dangerous predators", "tribal boundaries"],
            taboos: ["wasting meat", "showing weakness before the tribe", "trespass on sacred ground"]
        }
    },
    {
        species: "Kobold",
        isHumanoid: true,
        size: "tiny",
        isCivilized: false,
        speechStyle: "clipped",
        anatomyType: "reptilian",
        hasTail: true,
        cloaca: true,
        lore: "Kobolds are small dragon-kin who survive through cleverness, traps, and sheer numbers. They revere dragons as gods and model their tunnels after dragon lairs. A lone kobold is a scout or a trap-setter — where there is one, there are always more.",
        articulation: "A small toothy snout gives words a slightly yipping, clipped quality, with sharp sibilants.",
        anatomyProfile: {
            surfaceType: "scales",
            skinTones: ["rust red", "dark brown", "deep orange", "mottled brown", "dusty red"],
            hairColors: ["none"],
            hairStyles: ["none"],
            eyeColors: ["amber", "red", "yellow", "pale orange"],
            builds: ["tiny", "wiry", "scrawny", "quick", "fragile-looking"],
            features: ["small horns", "a thin whip-like tail", "tiny clawed hands", "sharp little teeth", "reptilian eyes", "a snout"],
            movements: ["darts between shadows", "moves in quick skittering bursts", "freezes stock-still when spotted"],
            voices: ["yipping", "chittering", "high-pitched", "rapid", "squeaky"]
        },
        culture: {
            values: ["traps", "numbers", "dragon worship", "cleverness"],
            topics: ["tunnel routes", "trap designs", "the dragon they serve", "intruders in the warren"],
            taboos: ["damaging traps carelessly", "mentioning the dragon's wrath", "stealing from the hoard"]
        }
    }
];

// ── ROOM TEMPLATES ───────────────────────────────────────────────
const ROOM_TEMPLATES = [
    {
        type: "Guest Room",
        zone: "Town",
        role: "interior",
        displayName: "Guest Room",
        baseDescription: "A modest guest room with simple furnishings. A narrow bed sits against the wall, and a small window overlooks the street below.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: false,
        structural: [
            { id: "bed",        name: "bed",         tags: ["rest"] },
            { id: "chest",      name: "chest",       tags: ["storage"] },
            { id: "wash-basin", name: "wash basin",  tags: ["hygiene"] }
        ],
        imageKey: "Guest Room"
    },
    {
        type: "Gate",
        zone: "Town",
        role: "landmark",
        displayName: "Town Gate",
        baseDescription: "A massive gate set into thick stone walls. Its heavy wooden doors are bound with iron, and guards watch all who pass.",
        allowedZones: ["town", "ruins"],
        parentCluster: ["wall", "fortress"],
        isConnector: false,
        structural: [
            { id: "gate-doors",   name: "iron-bound doors", tags: ["barrier", "landmark"] },
            { id: "guard-post",   name: "guard post",       tags: ["formal", "danger"] },
            { id: "portcullis",   name: "portcullis",       tags: ["barrier"] }
        ],
        imageKey: "Gate"
    },
    {
        type: "Street",
        zone: "Town",
        role: "spine",
        displayName: "Cobblestone Street",
        baseDescription: "A worn cobblestone path. The road is uneven, marked by age and the footsteps of countless travelers.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: true,
        structural: [
            { id: "lamppost",     name: "lamppost",         tags: ["light"] },
            { id: "cart",         name: "merchant cart",    tags: ["commerce"] }
        ],
        imageKey: "Street"
    },
    {
        type: "Avenue",
        zone: "Town",
        role: "spine",
        displayName: "Market Avenue",
        baseDescription: "A broad street with cobbled stones, frequented by merchants and townsfolk alike. Stalls line the edges.",
        allowedZones: ["town"],
        parentCluster: ["square", "market"],
        isConnector: true,
        structural: [
            { id: "market-stall", name: "market stall",     tags: ["commerce"] },
            { id: "lamppost",     name: "lamppost",         tags: ["light"] },
            { id: "bench",        name: "bench",            tags: ["rest"] }
        ],
        imageKey: "Avenue"
    },
    {
        type: "Smithy",
        zone: "Town",
        role: "interior",
        displayName: "Town Smithy",
        baseDescription: "Heat rolls out of an open-fronted workshop. A forge glows orange against the back wall, and the ring of hammer on iron carries out into the street.",
        allowedZones: ["town"],
        parentCluster: ["market", "square"],
        isConnector: false,
        structural: [
            { id: "forge-fire",    name: "forge fire",    tags: ["heat", "light", "forge"] },
            { id: "anvil",         name: "anvil",         tags: ["work", "forge"] },
            { id: "grindstone",    name: "grindstone",    tags: ["work", "forge"] },
            { id: "quench-trough", name: "quench trough", tags: ["work", "forge"] },
            { id: "ore-bin",       name: "ore bin",       tags: ["storage", "loot"] },
            { id: "commission-board", name: "commission board", tags: ["information", "commerce"] }
        ],
        imageKey: "Smithy"
    },
    {
        type: "Alleyway",
        zone: "Town",
        role: "spine",
        displayName: "Dark Alleyway",
        baseDescription: "A narrow shadow-filled alley tucked between town buildings. The smell of refuse and something less pleasant.",
        allowedZones: ["town"],
        parentCluster: ["tavern", "market", "inn", "guild", "square"],
        isConnector: true,
        structural: [
            { id: "crates",       name: "stack of crates",  tags: ["cover", "storage"] },
            { id: "barrel",       name: "barrel",           tags: ["storage"] }
        ],
        imageKey: "Alleyway"
    },
    {
        type: "Square",
        zone: "Town",
        role: "landmark",
        displayName: "Town Square",
        baseDescription: "An open public space at the heart of town, used for gatherings and trade. A fountain stands at the center.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "fountain",     name: "fountain",         tags: ["landmark", "water"] },
            { id: "benches",      name: "benches",          tags: ["rest", "social"] },
            { id: "notice-post",  name: "notice post",      tags: ["information"] }
        ],
        imageKey: "Square"
    },
    {
        type: "Tavern",
        zone: "Town",
        role: "landmark",
        displayName: "Smoky Tavern",
        baseDescription: "Warm light spills from wall-mounted lanterns. The smell of ale and woodsmoke hangs in the air. Voices compete with the crackle of the fire.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        structural: [
            { id: "bar-counter",  name: "bar counter",      tags: ["surface", "social"] },
            { id: "fireplace",    name: "fireplace",        tags: ["heat", "light"] },
            { id: "notice-board", name: "notice board",     tags: ["information"] }
        ],
        imageKey: "Tavern"
    },
    {
        type: "Taproom",
        zone: "Town",
        role: "interior",
        displayName: "Taproom",
        baseDescription: "Wooden tables crowd the space, sticky with spilled ale. Patrons hunch over drinks and speak in low voices.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        structural: [
            { id: "tables",       name: "tables",           tags: ["social", "surface"] },
            { id: "bar",          name: "bar",              tags: ["social", "surface"] },
            { id: "hearth",       name: "hearth",           tags: ["heat", "light"] }
        ],
        imageKey: "Taproom"
    },
    {
        type: "Kitchen",
        zone: "Town",
        role: "interior",
        displayName: "Tavern Kitchen",
        baseDescription: "The air is thick with the scent of stew and smoke. Pots clatter and someone shouts an order from the taproom.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        structural: [
            { id: "cooking-fire", name: "cooking fire",     tags: ["heat", "work"] },
            { id: "prep-table",   name: "preparation table",tags: ["surface", "work"] },
            { id: "pot-rack",     name: "pot rack",         tags: ["storage"] }
        ],
        imageKey: "Kitchen"
    },
    {
        type: "Cellar",
        zone: "Town",
        role: "interior",
        displayName: "Tavern Cellar",
        baseDescription: "Stone steps descend into a cool cellar stacked with barrels of ale and crates of provisions.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        structural: [
            { id: "ale-barrels",  name: "ale barrels",      tags: ["storage", "commerce"] },
            { id: "shelving",     name: "shelving",         tags: ["storage"] },
            { id: "trapdoor",     name: "trapdoor",         tags: ["passage"] }
        ],
        imageKey: "Cellar"
    },
    {
        type: "Cellar Shrine",
        zone: "Town",
        role: "landmark",
        displayName: "Hidden Cellar Shrine",
        baseDescription: "Behind a false wall of stacked crates, a small hollow has been carved out and quietly kept up - a chipped icon, a few burned-down candle stubs, and a shallow bowl for offerings. Whoever tends it never seems to be around.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom in cyoaftw-engine-CORE.js) -
        // Town's designated guaranteed shrine room (ZONE_SHRINE_ROOMS),
        // deliberately an odd/hidden spot for one rather than a formal
        // temple.
        isShrine: true,
        structural: [
            { id: "chipped-icon", name: "chipped icon",     tags: ["ritual", "landmark"] },
            { id: "candle-stubs", name: "candle stubs",     tags: ["light", "ritual"] },
            { id: "offering-bowl",name: "offering bowl",    tags: ["ritual"] }
        ],
        imageKey: "Cellar"
    },
    {
        type: "Passage",
        zone: "Dungeon",
        role: "spine",
        displayName: "Stone Passage",
        baseDescription: "A narrow dusty passage carved through ancient stone. The air is cold and still.",
        allowedZones: ["dungeon", "ruins", "underground city"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "torch-sconce", name: "torch sconce",     tags: ["light"] },
            { id: "cracked-wall", name: "cracked wall",     tags: ["hazard"] }
        ],
        imageKey: "Passage"
    },
    {
        type: "Corridor",
        zone: "Dungeon",
        role: "spine",
        displayName: "Dungeon Corridor",
        baseDescription: "A narrow corridor with stone walls and sparse lighting. Moisture seeps through the cracks.",
        allowedZones: ["dungeon"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "torch-sconce", name: "torch sconce",     tags: ["light"] },
            { id: "iron-door",    name: "iron door",        tags: ["barrier"] }
        ],
        imageKey: "Corridor"
    },
    {
        type: "Tunnel",
        zone: "Dungeon",
        role: "spine",
        displayName: "Dark Tunnel",
        baseDescription: "A long dimly lit tunnel with damp stone walls. The sound of dripping water echoes in the dark.",
        allowedZones: ["dungeon", "underground city"],
        parentCluster: ["tunnel"],
        isConnector: true,
        structural: [
            { id: "support-beam", name: "support beam",     tags: ["structural"] },
            { id: "puddle",       name: "puddle",           tags: ["hazard"] }
        ],
        imageKey: "Tunnel"
    },
    {
        type: "Chamber",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Dungeon Chamber",
        baseDescription: "A grand chamber within the dungeon. Vaulted stone ceilings disappear into shadow above.",
        allowedZones: ["dungeon", "castle"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "stone-pillar", name: "stone pillar",     tags: ["structural", "cover"] },
            { id: "iron-gate",    name: "iron gate",        tags: ["barrier"] },
            { id: "chest",        name: "chest",            tags: ["storage", "loot"] },
            { id: "wall-tallies", name: "scratched tallies", tags: ["information"] }
        ],
        imageKey: "Chamber"
    },
    {
        type: "Trap",
        zone: "Dungeon",
        role: "interior",
        displayName: "Trap Room",
        baseDescription: "The floor is suspiciously clean. Something about this room feels wrong.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "pressure-plate", name: "pressure plate", tags: ["hazard", "trap"] },
            { id: "dart-holes",     name: "dart holes",     tags: ["hazard", "trap"] }
        ],
        imageKey: "Trap"
    },
    // ── Inn ──
    {
        type: "Inn",
        zone: "Town",
        role: "landmark",
        displayName: "Traveller's Inn",
        baseDescription: "A welcoming inn with a warm common room. The smell of fresh bread drifts from the kitchen.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: false,
        structural: [
            { id: "reception-desk", name: "reception desk", tags: ["social", "commerce"] },
            { id: "common-hearth",  name: "hearth",         tags: ["heat", "light"] },
            { id: "staircase",      name: "staircase",      tags: ["passage"] }
        ],
        imageKey: "Inn"
    },
    {
        type: "Inn Common",
        zone: "Town",
        role: "interior",
        displayName: "Inn Common Room",
        baseDescription: "A shared common room with long tables and benches. Travellers eat, drink and exchange stories.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: false,
        structural: [
            { id: "long-tables",  name: "long tables",  tags: ["social", "surface"] },
            { id: "notice-board", name: "notice board", tags: ["information"] },
            { id: "hearth",       name: "hearth",       tags: ["heat", "light"] }
        ],
        imageKey: "Inn Common"
    },

    // ── Dungeon Landmarks ──
    {
        type: "Shrine",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Forgotten Shrine",
        baseDescription: "A small shrine carved into the rock. Offerings long since rotted sit at the base of a worn stone idol.",
        allowedZones: ["dungeon", "ruins"],
        parentCluster: ["chamber"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom in cyoaftw-engine-CORE.js) - this
        // is Ruins' designated guaranteed shrine room (ZONE_SHRINE_ROOMS).
        isShrine: true,
        structural: [
            { id: "stone-idol",   name: "stone idol",   tags: ["ritual", "landmark"] },
            { id: "offering-bowl",name: "offering bowl",tags: ["ritual"] },
            { id: "candles",      name: "candles",      tags: ["light", "ritual"] }
        ],
        imageKey: "Shrine"
    },
    {
        type: "Armory",
        zone: "Dungeon",
        role: "interior",
        displayName: "Abandoned Armory",
        baseDescription: "Rusted weapons hang from the walls. Broken shields and empty scabbards litter the floor.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "weapon-rack",  name: "weapon rack",  tags: ["storage", "loot"] },
            { id: "armor-stand",  name: "armor stand",  tags: ["storage", "loot"] },
            { id: "workbench",    name: "workbench",    tags: ["surface", "work"] }
        ],
        imageKey: "Armory"
    },
    {
        type: "Collapsed Gallery",
        zone: "Dungeon",
        role: "interior",
        displayName: "Collapsed Gallery",
        baseDescription: "An old mine gallery that fell in on itself. Splintered timbers jut from heaps of broken rock, and a bright seam of ore still glints where the roof gave way.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "cave-in-rubble", name: "cave-in rubble",    tags: ["hazard", "cover"] },
            { id: "ore-vein",       name: "exposed ore vein",  tags: ["resource", "landmark"] },
            { id: "ore-cart",       name: "overturned ore cart", tags: ["storage", "loot"] }
        ],
        imageKey: "Collapsed Gallery"
    },
    {
        type: "Buried Shrine",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Buried Shrine",
        baseDescription: "A cave-in sealed this chamber off long ago, but a narrow gap in the rubble still lets someone squeeze through. Inside, a shrine sits untouched by time, dust thick on every surface except where a devotee has clearly still been kneeling.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom) - Dungeon's designated
        // guaranteed shrine room (ZONE_SHRINE_ROOMS), odd for being
        // sealed off rather than out in the open.
        isShrine: true,
        structural: [
            { id: "cave-in-rubble", name: "cave-in rubble", tags: ["hazard", "cover"] },
            { id: "dust-shrine",    name: "dust-caked shrine", tags: ["ritual", "landmark"] },
            { id: "kneeling-mark",  name: "worn kneeling mark", tags: ["ritual"] }
        ],
        imageKey: "Shrine"
    },

    // ── Ruins ──
    {
        type: "Hallway",
        zone: "Ruins",
        role: "spine",
        displayName: "Ruined Hallway",
        baseDescription: "A once grand hallway now choked with rubble. Faded murals cling to crumbling walls.",
        allowedZones: ["ruins"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "rubble",       name: "rubble",       tags: ["hazard", "cover"] },
            { id: "faded-mural",  name: "faded mural",  tags: ["information", "landmark"] }
        ],
        imageKey: "Hallway"
    },
    {
        type: "Altar",
        zone: "Ruins",
        role: "landmark",
        displayName: "Ancient Altar",
        baseDescription: "A massive stone altar dominates the room. Dark stains mark its surface. The air feels heavy here.",
        allowedZones: ["ruins"],
        parentCluster: ["chamber"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom) - a bonus prayer room alongside
        // Ruins' designated "Shrine" (ZONE_SHRINE_ROOMS), not itself the
        // guaranteed one, but it counts if it happens to turn up first.
        isShrine: true,
        structural: [
            { id: "stone-altar",  name: "stone altar",  tags: ["ritual", "landmark"] },
            { id: "ritual-basin", name: "ritual basin", tags: ["ritual"] },
            { id: "inscriptions", name: "inscriptions", tags: ["information"] }
        ],
        imageKey: "Altar"
    },
    {
        type: "Library",
        zone: "Ruins",
        role: "interior",
        displayName: "Ruined Library",
        baseDescription: "Shelves of rotting books line the walls. Most are unreadable but a few tomes remain intact.",
        allowedZones: ["ruins"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "bookshelves",  name: "bookshelves",  tags: ["storage", "information"] },
            { id: "reading-desk", name: "reading desk", tags: ["surface", "work"] },
            { id: "intact-tome",  name: "intact tome",  tags: ["information", "loot"] }
        ],
        imageKey: "Library"
    },
    {
        type: "Tower",
        zone: "Ruins",
        role: "landmark",
        displayName: "Crumbling Tower",
        baseDescription: "A tall tower with a collapsed upper section. Wind howls through gaps in the stonework.",
        allowedZones: ["ruins"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "spiral-stair", name: "spiral staircase", tags: ["passage"] },
            { id: "broken-floor", name: "broken floor",     tags: ["hazard"] },
            { id: "arrow-slit",   name: "arrow slit",       tags: ["cover"] }
        ],
        imageKey: "Tower"
    },
    {
        type: "Ruins Passage",
        zone: "Ruins",
        role: "spine",
        displayName: "Ruins Passage",
        baseDescription: "A passage threading through collapsed masonry. Every step dislodges small cascades of dust and stone.",
        allowedZones: ["ruins"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "fallen-column",name: "fallen column", tags: ["cover", "hazard"] },
            { id: "rubble",       name: "rubble",        tags: ["hazard"] }
        ],
        imageKey: "Ruins Passage"
    },

    // ── Underground City ──
    {
        type: "Cavern",
        zone: "Underground City",
        role: "landmark",
        displayName: "Great Cavern",
        baseDescription: "A vast natural cavern. Glowing fungi cling to the walls and strange sounds drift from the depths.",
        allowedZones: ["underground city", "dungeon"],
        parentCluster: ["cavern"],
        isConnector: false,
        structural: [
            { id: "stalagmites",  name: "stalagmites",  tags: ["cover", "hazard"] },
            { id: "glowing-fungi",name: "glowing fungi",tags: ["light", "landmark"] },
            { id: "underground-pool", name: "underground pool", tags: ["water"] }
        ],
        imageKey: "Cavern"
    },
    {
        type: "Mine Shaft",
        zone: "Underground City",
        role: "landmark",
        displayName: "Mine Shaft",
        baseDescription: "A braced shaft where the city's miners work the living rock. Lantern light shows glittering seams in the walls, and the steady ring of picks carries down the tunnel.",
        allowedZones: ["underground city"],
        parentCluster: ["cavern"],
        isConnector: false,
        structural: [
            { id: "ore-vein",     name: "rich ore vein", tags: ["resource", "landmark"] },
            { id: "ore-cart",     name: "ore cart",      tags: ["storage", "loot"] },
            { id: "support-beam", name: "support beam",  tags: ["structural"] }
        ],
        imageKey: "Mine Shaft"
    },
    {
        type: "Deep Forge",
        zone: "Underground City",
        role: "interior",
        displayName: "Deep Forge",
        baseDescription: "A smithy hewn straight into the rock, its forge fed by a channel of glowing heat from far below. The anvils here have rung for generations.",
        allowedZones: ["underground city"],
        parentCluster: ["cavern"],
        isConnector: false,
        structural: [
            { id: "forge-fire",    name: "deep-fed forge", tags: ["heat", "light", "forge"] },
            { id: "anvil",         name: "anvil",          tags: ["work", "forge"] },
            { id: "grindstone",    name: "grindstone",     tags: ["work", "forge"] },
            { id: "quench-trough", name: "quench trough",  tags: ["work", "forge"] },
            { id: "ore-bin",       name: "ore bin",        tags: ["storage", "loot"] },
            { id: "commission-board", name: "commission board", tags: ["information", "commerce"] }
        ],
        imageKey: "Deep Forge"
    },
    {
        type: "Vault",
        zone: "Underground City",
        role: "interior",
        displayName: "Stone Vault",
        baseDescription: "A sealed chamber with thick stone walls. Whatever was stored here was meant to stay hidden.",
        allowedZones: ["underground city", "dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "iron-door",    name: "iron door",    tags: ["barrier"] },
            { id: "stone-chest",  name: "stone chest",  tags: ["storage", "loot"] },
            { id: "wall-chains",  name: "wall chains",  tags: ["hazard"] }
        ],
        imageKey: "Vault"
    },
    {
        type: "Underground Hallway",
        zone: "Underground City",
        role: "spine",
        displayName: "Underground Hallway",
        baseDescription: "A wide hallway carved with deliberate precision. Signs of habitation are everywhere — old fire pits, worn flagstones.",
        allowedZones: ["underground city"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "carved-pillars",name: "carved pillars", tags: ["structural", "landmark"] },
            { id: "fire-pit",      name: "fire pit",       tags: ["heat", "light"] }
        ],
        imageKey: "Underground Hallway"
    },
    {
        type: "Underground Gate",
        zone: "Underground City",
        role: "landmark",
        displayName: "Underground Gate",
        baseDescription: "A fortified gate controlling passage deeper into the underground city. Guards eye all who approach.",
        allowedZones: ["underground city"],
        parentCluster: ["gate"],
        isConnector: false,
        structural: [
            { id: "stone-gate",   name: "stone gate",   tags: ["barrier", "landmark"] },
            { id: "guard-post",   name: "guard post",   tags: ["formal", "danger"] },
            { id: "torch-stands", name: "torch stands", tags: ["light"] }
        ],
        imageKey: "Underground Gate"
    },
    {
        type: "Deep Well Shrine",
        zone: "Underground City",
        role: "landmark",
        displayName: "Deep Well Shrine",
        baseDescription: "Tucked between two unremarkable tunnels, an old dried-up well shaft has been built up into a shrine, offerings left along its rim where water used to be. No one seems to remember which god it was dug for.",
        allowedZones: ["underground city"],
        parentCluster: ["passage"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom) - Underground City's
        // designated guaranteed shrine room (ZONE_SHRINE_ROOMS), odd for
        // being built around a dead well rather than a proper temple.
        isShrine: true,
        structural: [
            { id: "dry-well-shaft", name: "dry well shaft", tags: ["ritual", "landmark"] },
            { id: "rim-offerings",  name: "offerings along the rim", tags: ["ritual"] },
            { id: "worn-carvings",  name: "worn carvings",  tags: ["information"] }
        ],
        imageKey: "Shrine"
    },

    // ── Swamp ──
    {
        type: "Marsh",
        zone: "Swamp",
        role: "spine",
        displayName: "Sunken Marsh",
        baseDescription: "Black water pools between twisted roots. Every step sinks ankle-deep into the mud, and the reeds hiss faintly in a wind that never seems to reach the ground.",
        allowedZones: ["swamp"],
        parentCluster: ["marsh"],
        isConnector: true,
        structural: [
            { id: "twisted-roots", name: "twisted roots", tags: ["hazard", "cover"] },
            { id: "reed-bed",      name: "reed bed",      tags: ["cover"] }
        ],
        imageKey: "Marsh"
    },
    {
        type: "Broken Ground",
        zone: "Swamp",
        role: "landmark",
        displayName: "Broken Ground",
        baseDescription: "The earth has buckled and split here, thick roots and slabs of peat heaved up at odd angles. Stagnant water fills the gaps between them.",
        allowedZones: ["swamp"],
        parentCluster: ["marsh"],
        isConnector: false,
        structural: [
            { id: "heaved-slabs",  name: "heaved slabs of peat", tags: ["hazard", "cover"] },
            { id: "stagnant-pool", name: "stagnant pool",        tags: ["water", "hazard"] }
        ],
        imageKey: "Broken Ground"
    },
    {
        type: "Swamp Camp",
        zone: "Swamp",
        role: "landmark",
        displayName: "Swamp Camp",
        baseDescription: "A cluster of lean-tos and raised platforms built above the waterline. A smoky fire struggles against the damp, and belongings hang from lines strung between the posts.",
        allowedZones: ["swamp"],
        parentCluster: ["camp"],
        isConnector: false,
        structural: [
            { id: "smoky-fire",      name: "smoky fire pit",  tags: ["heat", "light", "social"] },
            { id: "raised-platform", name: "raised platform", tags: ["rest", "storage"] },
            { id: "drying-lines",    name: "drying lines",    tags: ["storage"] },
            { id: "waymarker-post",  name: "weathered waymarker post", tags: ["information"] }
        ],
        imageKey: "Swamp Camp"
    },
    {
        type: "Submerged Ruin",
        zone: "Swamp",
        role: "landmark",
        displayName: "Submerged Ruin",
        baseDescription: "The tops of old stone walls break the surface of the water, half-swallowed by the swamp. Whatever this place once was, the marsh has nearly finished reclaiming it.",
        allowedZones: ["swamp"],
        parentCluster: ["ruin"],
        isConnector: false,
        structural: [
            { id: "sunken-walls",      name: "sunken stone walls", tags: ["cover", "landmark"] },
            { id: "silted-doorway",    name: "silted doorway",     tags: ["passage", "hazard"] },
            { id: "waterlogged-chest", name: "waterlogged chest",  tags: ["storage", "loot"] }
        ],
        imageKey: "Submerged Ruin"
    },
    {
        type: "Sunken Chapel",
        zone: "Swamp",
        role: "landmark",
        displayName: "Sunken Chapel",
        baseDescription: "Half-swallowed by black water, a small chapel still stands just enough to be entered. Its floor is a shallow, mirror-still pool, and whatever idol once stood at its center is now visible only as a shape beneath the surface.",
        allowedZones: ["swamp"],
        parentCluster: ["marsh", "ruin"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom) - Swamp's designated
        // guaranteed shrine room (ZONE_SHRINE_ROOMS), odd for being
        // half-submerged rather than dry ground.
        isShrine: true,
        structural: [
            { id: "mirror-pool",   name: "mirror-still pool", tags: ["ritual", "water", "landmark"] },
            { id: "submerged-idol",name: "submerged idol",    tags: ["ritual"] },
            { id: "rotted-pews",   name: "rotted pews",       tags: ["cover"] }
        ],
        imageKey: "Altar"
    },

    // ── ZONE-TRANSITION CORRIDOR TYPES ────────────────────────────
    // Zone-agnostic connector rooms used only by the zone-transition
    // corridor system in cyoaftw-engine-CORE.js (see
    // ZONE_TRANSITION_CORRIDOR_TYPES / chooseRoomTypeForTransition).
    // Deliberately absent from every ZONE_TEMPLATES.roomTypes list, so
    // normal weighted room selection never picks them - they only ever
    // appear via chooseRoomTypeForTransition while a corridor is active.
    // allowedZones spans all five real zones so they're border-capable
    // from anywhere, matching a Gate's guaranteed 2-4 exit floor.
    {
        type: "Borderlands",
        zone: "Town",
        role: "spine",
        displayName: "Borderlands",
        baseDescription: "The land here belongs to no single place. Familiar terrain frays at the edges, and the way ahead could lead almost anywhere.",
        allowedZones: ["town", "dungeon", "ruins", "underground city", "swamp"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "waymarker",     name: "weathered waymarker", tags: ["landmark"] },
            { id: "worn-trail",    name: "worn trail",          tags: ["passage"] }
        ]
    },
    {
        type: "Fringe Path",
        zone: "Town",
        role: "spine",
        displayName: "Fringe Path",
        baseDescription: "A faint path winds along the fringe between regions, half-swallowed by whatever landscape presses in from either side.",
        allowedZones: ["town", "dungeon", "ruins", "underground city", "swamp"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "boundary-stones", name: "boundary stones", tags: ["landmark"] },
            { id: "overgrown-trail", name: "overgrown trail", tags: ["passage"] }
        ]
    },
    {
        type: "Old Road",
        zone: "Town",
        role: "spine",
        displayName: "Old Road",
        baseDescription: "A once-paved road, now cracked flagstones and leaning milestones. Weeds push up between the stones, but the way is still plain.",
        allowedZones: ["town", "ruins"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "milestone", name: "leaning milestone", tags: ["landmark"] },
            { id: "rutted-road", name: "rutted road", tags: ["passage"] }
        ]
    },
    {
        type: "Causeway",
        zone: "Swamp",
        role: "spine",
        displayName: "Causeway",
        baseDescription: "A raised causeway of old stone and rotting planks threads between black water and reeds. Every step sounds loud over the quiet of the swamp.",
        allowedZones: ["ruins", "swamp"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "causeway-posts", name: "mossy causeway posts", tags: ["landmark"] },
            { id: "reed-beds", name: "reed beds", tags: ["cover"] }
        ]
    },
    {
        type: "Stairwell",
        zone: "Dungeon",
        role: "spine",
        displayName: "Stairwell",
        baseDescription: "Worn stone steps wind through the rock. Each tread is hollowed by feet that stopped coming long ago, and a stale draught moves up the shaft.",
        allowedZones: ["town", "dungeon"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "stone-steps", name: "worn stone steps", tags: ["passage"] },
            { id: "lamp-niche", name: "lamp niche", tags: ["light"] }
        ]
    },
    {
        type: "Old Mine Tunnel",
        zone: "Dungeon",
        role: "spine",
        displayName: "Old Mine Tunnel",
        baseDescription: "A timber-braced tunnel cut for ore carts. Rusted rails run along the floor, and the old props groan when the air shifts.",
        allowedZones: ["dungeon", "underground city"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "rusted-rails", name: "rusted rails", tags: ["passage"] },
            { id: "mine-props", name: "timber props", tags: ["structural"] }
        ]
    },
    {
        type: "Lift Shaft",
        zone: "Underground City",
        role: "spine",
        displayName: "Lift Shaft",
        baseDescription: "A wide shaft bored through the rock, with an oak-and-iron cargo lift on counterweighted chains. Dwarven runes along the rim mark the load limit.",
        allowedZones: ["town", "underground city"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "cargo-lift", name: "cargo lift", tags: ["passage", "landmark"] },
            { id: "lift-chains", name: "winch chains", tags: ["structural"] }
        ]
    },

    // ── ZONE BOSS ROOMS ────────────────────────────────────────────
    // One per zone, added as a normal flat-odds entry in that zone's
    // ZONE_TEMPLATES.roomTypes list. cyoaftw-engine-CORE.js's ZONE_BOSS_ROOMS
    // map ties each of these back to its zone, and spawnNPCsForRoom checks
    // for a room of this type to guarantee-place that zone's rare boss NPC
    // (see the "ZONE BOSS" section there for the full mechanic, including
    // the room-count safety net that forces this type if the flat odds
    // haven't naturally produced it after a while).
    {
        type: "Town Hall",
        zone: "Town",
        role: "landmark",
        displayName: "Town Hall",
        baseDescription: "A stately hall of dressed stone, its doors flanked by carved pillars. This is where the town's business - and its leadership - is conducted.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "council-table", name: "long council table", tags: ["surface", "formal"] },
            { id: "banners",       name: "hanging banners",     tags: ["landmark"] },
            { id: "raised-dais",   name: "raised dais",         tags: ["formal", "landmark"] }
        ],
        imageKey: "Town Hall"
    },
    {
        type: "Throne Room",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Throne Room",
        baseDescription: "A cavernous chamber dominated by a crude but imposing throne. Whoever rules this place holds court here.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "throne",        name: "crude throne",        tags: ["landmark", "formal"] },
            { id: "trophy-rack",   name: "trophy rack",         tags: ["danger", "landmark"] },
            { id: "brazier",       name: "iron brazier",        tags: ["light", "heat"] }
        ],
        imageKey: "Throne Room"
    },
    {
        type: "Inner Sanctum",
        zone: "Ruins",
        role: "landmark",
        displayName: "Inner Sanctum",
        baseDescription: "The deepest, best-preserved chamber in the ruins, sealed away from the collapse outside. Something has clearly been guarding it.",
        allowedZones: ["ruins"],
        parentCluster: ["altar", "shrine"],
        isConnector: false,
        structural: [
            { id: "sealed-altar",  name: "sealed altar",        tags: ["landmark", "formal"] },
            { id: "old-wards",     name: "faded warding marks", tags: ["danger", "landmark"] }
        ],
        imageKey: "Inner Sanctum"
    },
    {
        type: "Chieftain's Hall",
        zone: "Underground City",
        role: "landmark",
        displayName: "Chieftain's Hall",
        baseDescription: "The largest hall in the underground settlement, lit by rows of torches. This is where the chieftain holds audience.",
        allowedZones: ["underground city"],
        parentCluster: ["cavern", "vault"],
        isConnector: false,
        structural: [
            { id: "chieftain-seat", name: "chieftain's seat",   tags: ["landmark", "formal"] },
            { id: "war-trophies",   name: "war trophies",       tags: ["danger", "landmark"] }
        ],
        imageKey: "Chieftain's Hall"
    },
    {
        type: "Witch's Lair",
        zone: "Swamp",
        role: "landmark",
        displayName: "Witch's Lair",
        baseDescription: "A hut raised on stilts above the mire, hung with charms and bundled herbs. Something old and dangerous lives here.",
        allowedZones: ["swamp"],
        parentCluster: ["swamp camp"],
        isConnector: false,
        structural: [
            { id: "hanging-charms", name: "hanging charms",     tags: ["danger", "landmark"] },
            { id: "cauldron",       name: "bubbling cauldron",  tags: ["danger", "work"] }
        ],
        imageKey: "Witch's Lair"
    }
];

// ── ROOM IMAGE MAP ───────────────────────────────────────────────


const ROOM_IMAGE_MAP = {

    // ───────── Town Spine ─────────
    "Street": "https://iili.io/qFWPsNR.jpg",
    "Avenue": "https://iili.io/qFW4bzN.jpg",
    "Alleyway": "https://iili.io/qFX9SiG.jpg",

    // ───────── Town Landmarks ─────────
    "Square": "https://iili.io/qFW4FoP.jpg",
    "Gate": "https://iili.io/qFWrByl.jpg",

    // ───────── Tavern ─────────
    "Tavern": "https://iili.io/qFWVXYg.jpg",
    "Taproom": "https://iili.io/qFWVXYg.jpg",
    "Kitchen": "https://iili.io/qFXJeGs.jpg",
    "Cellar": "https://iili.io/qFWMgmx.jpg",
    "Guest Room": "https://iili.io/qFW2Aw7.jpg",
    "Room": "https://iili.io/qFW2Aw7.jpg",

    // ───────── Inn ─────────
    "Inn": "https://iili.io/qFW3cxt.jpg",
    "Inn Common": "https://iili.io/qFW3cxt.jpg",
    "Brothel": "https://iili.io/qUJX3j1.jpg",

    // ───────── Dungeon Spine ─────────
    "Passage": "https://iili.io/qFVVGi7.jpg",
    "Corridor": "https://iili.io/qFVMLP9.jpg",
    "Tunnel": "https://iili.io/qFW2jMg.jpg",

    // ───────── Dungeon Landmarks ─────────
    "Chamber": "https://iili.io/qFVGWL7.jpg",
    "Trap": "https://iili.io/qFWdC7V.jpg",
    "Shrine": "https://iili.io/qFXdHt1.jpg",
    "Armory": "https://iili.io/qFX3ScJ.jpg",

    // ───────── Ruins ─────────
    "Hallway": "https://iili.io/qFWJLss.jpg",
    "Altar": "https://iili.io/qFVik8J.jpg",
    "Library": "https://iili.io/qFXfr9j.jpg",
    "Tower": "https://iili.io/qFXqX0F.jpg",
    "Ruins Passage": "https://iili.io/qFXBghQ.jpg",

    // ───────── Underground City ─────────
    "Cavern": "https://iili.io/qFXn4g1.jpg",
    "Vault": "https://iili.io/qFXoaEB.jpg",
    "Underground Hallway": "https://iili.io/qFXxz6N.jpg",
    "Underground Gate": "https://iili.io/qFXzdxf.jpg",

    // Stand-in art: approximate re-use of the closest existing image until
    // dedicated art exists. Swap a URL here when real art is made.
    "Smithy": "https://iili.io/qFX3ScJ.jpg",
    "Deep Forge": "https://iili.io/qFX3ScJ.jpg",
    "Mine Shaft": "https://iili.io/qFXn4g1.jpg",
    "Collapsed Gallery": "https://iili.io/qFW2jMg.jpg",
    "Old Mine Tunnel": "https://iili.io/qFW2jMg.jpg",
    "Stairwell": "https://iili.io/qFVVGi7.jpg",
    "Lift Shaft": "https://iili.io/qFXxz6N.jpg",
    "Old Road": "https://iili.io/qFWPsNR.jpg",
    "Causeway": "https://iili.io/qFXBghQ.jpg",
    "Borderlands": "https://iili.io/qFXBghQ.jpg",
    "Fringe Path": "https://iili.io/qFXBghQ.jpg",
    "Town Hall": "https://iili.io/qFVGWL7.jpg",
    "Throne Room": "https://iili.io/qFVGWL7.jpg",
    "Chieftain's Hall": "https://iili.io/qFVGWL7.jpg",
    "Inner Sanctum": "https://iili.io/qFVik8J.jpg",
    "Witch's Lair": "https://iili.io/qFXdHt1.jpg",
    "Marsh": "https://iili.io/qFXBghQ.jpg",
    "Broken Ground": "https://iili.io/qFWJLss.jpg",
    "Swamp Camp": "https://iili.io/qFXBghQ.jpg",
    "Submerged Ruin": "https://iili.io/qFWJLss.jpg"

    // Swamp room types (Marsh, Broken Ground, Swamp Camp, Submerged Ruin) have
    // no art yet - getRoomImage() falls back to null for them, which the
    // renderer already treats as "no background image" rather than an error.
};

const ZONE_IMAGE_MAP = {
    "Town": "https://iili.io/town-default-placeholder.jpg",
    "Dungeon": "https://iili.io/dungeon-default-placeholder.jpg",
    "Ruins": "https://iili.io/ruins-default-placeholder.jpg",
    "Underground City": "https://iili.io/underground-default-placeholder.jpg",
    "Castle": "https://iili.io/castle-default-placeholder.jpg"
};



// ── HELPER: GET ZONE TEMPLATE ────────────────────────────────────

function getZoneTemplate(zoneName) {
    return ZONE_TEMPLATES.find(
        z => z.name.toLowerCase() === String(zoneName || "").toLowerCase()
    ) || null;
}

// ── HELPER: GET ROOM TEMPLATE ────────────────────────────────────

function getRoomTemplate(roomType) {
    return ROOM_TEMPLATES.find(
        r => r.type.toLowerCase() === String(roomType || "").toLowerCase()
    ) || null;
}

// ── HELPER: GET SPECIES TEMPLATE ────────────────────────────────

function getSpeciesTemplate(species) {
    return SPECIES_TEMPLATES.find(
        s => s.species.toLowerCase() === String(species || "").toLowerCase()
    ) || null;
}

function isHumanoidSpecies(species) {
    const template = getSpeciesTemplate(species);
    return !!(template && template.isHumanoid);
}

// ── HELPER: GET IMAGE FOR ROOM ───────────────────────────────────

function getRoomImage(roomType) {
    return ROOM_IMAGE_MAP[roomType] || null;
}

// ── HELPER: BUILD ROOM INSTANCE ──────────────────────────────────

function buildRoomInstance(roomType, zoneName) {
    const template = getRoomTemplate(roomType);
    const zone = getZoneTemplate(zoneName);

    if (!template) return null;

    return {
        type: template.type,
        zone: zoneName || template.zone,
        role: template.role,
        name: template.displayName || template.type,
        displayName: template.displayName || template.type,
        baseDescription: template.baseDescription || "",
        description: null,
        allowedZones: template.allowedZones || [],
        parentCluster: template.parentCluster || [],
        isConnector: template.isConnector || false,
        structural: (template.structural || []).map(s => ({ ...s })),
        creatures: [],
        items: [],
        image: getRoomImage(template.imageKey || template.type),
        exits: {}
    };
}

// ── WORLD LORE ("world bible") ───────────────────────────────────
// One shared history the NPCs draw on, so rumors, topics and replies point
// at the same real people, places and events instead of being improvised.
//
// BACKBONE (fixed): the Long War between the Crown of Aldermere and the Free
// Banners. The capital, Aldermere, is the Ruins. Town is what survives. The
// Dungeon and the Underground City are where people went to be out of it; the
// Swamp is just habitat that swallowed some of the war's wreckage. Both sides
// have faded into remnants: the Ashen Court (Crown loyalists) and the
// Tattered Banners (unpaid sellswords). Neither is a hero faction, and the
// player can drift toward either (see getWorldStanding / shiftWorldStanding).
//
// SEEDED DETAILS (varied per new game, stored in G.worldLore.seed): a few
// "who really did it" questions are answered once, and fact text reads the
// answers, so the history is concrete but not identical every run.
//
// FACT SHAPE (WORLD_LORE_FACTS):
//   id        unique key
//   tiers     who can know it: common | local | trade | military | faith |
//             scholar | deep | swamp | secret  (see getNPCLoreTiers in
//             cyoaftw-npc-data.js; NPCs know the tiers their role/species allow)
//   zones     zones the fact is about (distance from the NPC's zone lowers
//             how likely they are to know it; "common" ignores distance)
//   topic     short phrase for the menu: "Ask about <topic>"
//   text      what is true (string or function(seed))
//   distorted optional garbled version told by hearsay-only NPCs
//   know      0-100 base chance an eligible NPC actually knows it
//   rumor     true = also offered by "Ask for a rumor"

const WORLD_LORE_SEED_OPTIONS = {
    burner: ["crown", "banners", "unknown"],       // who burned Aldermere
    damBreaker: ["crown", "banners"],              // who broke the Greywater dam
    ending: ["plague", "ruin", "truce"],           // why the war stopped
    regentFate: ["entombed", "fled", "fell"],      // what became of the Regent
    townOrigin: ["crown", "banners"]               // what the town grew from
};

const WORLD_LORE_SIDES = {
    crown: { name: "the Crown", full: "the Crown of Aldermere", short: "Crown" },
    banners: { name: "the Free Banners", full: "the Free Banners", short: "Banners" }
};

function _wlSide(seed, key) {
    return WORLD_LORE_SIDES[seed[key]] || null;
}
function _wlOther(side) {
    return side === "crown" ? "banners" : "crown";
}

const WORLD_LORE_FACTS = [
    // ── common: what everyone has heard ──────────────────────────
    {
        id: "war-basics", tiers: ["common"], zones: ["Town", "Ruins"], know: 95, rumor: false,
        topic: "the Long War",
        text: "Eleven winters ago the Crown of Aldermere and the Free Banners went to war over the Crown's grain levy. It ruined both sides, and most of the land with them.",
        distorted: "The Long War was over some king's grain tax, and it went on for as long as anyone can remember."
    },
    {
        id: "aldermere-fell", tiers: ["common"], zones: ["Ruins"], know: 90, rumor: true,
        topic: "what happened to Aldermere",
        text: function (s) {
            if (s.burner === "crown") return "Aldermere, the old capital, burned in the last winter of the war. The Crown set the fires itself rather than hand the city to the Free Banners.";
            if (s.burner === "banners") return "Aldermere, the old capital, was sacked and burned by the Free Banners in the last winter of the war.";
            return "Aldermere, the old capital, burned in the last winter of the war. Each side blames the other, and nobody living can say who lit it.";
        },
        distorted: "Aldermere burned, and folk say its ghosts still walk the streets."
    },
    {
        id: "town-survives", tiers: ["common", "local"], zones: ["Town"], know: 85, rumor: false,
        topic: "how the town survived",
        text: function (s) {
            return s.townOrigin === "crown"
                ? "The town began as a Crown grain depot. It outlived the war by feeding both armies when it suited it, and by looking too poor to be worth burning."
                : "The town began as a Free Banner muster camp. It outlived the war by feeding both armies when it suited it, and by looking too poor to be worth burning.";
        }
    },
    {
        id: "ruins-haunted", tiers: ["common"], zones: ["Ruins"], know: 80, rumor: true,
        topic: "the old capital",
        text: "Folk avoid the ruins of Aldermere after dark. Soldiers who never left their posts are said to still keep them, and scavengers who go in do not always come back.",
        distorted: "Something in the old capital eats anyone who goes in after dark."
    },
    {
        id: "ashen-court", tiers: ["common", "military"], zones: ["Dungeon", "Ruins"], know: 60, rumor: true,
        topic: "the Ashen Court",
        text: "The Ashen Court is what is left of the Crown: loyalists who swear the war was never lost and keep a pretender's court somewhere below the town. Few have seen it, and fewer laugh at it.",
        distorted: "A dead king holds court under the town, and his courtiers take the living."
    },
    {
        id: "tattered-banners", tiers: ["common", "military", "trade"], zones: ["Dungeon", "Underground City"], know: 65, rumor: true,
        topic: "the Tattered Banners",
        text: "The Tattered Banners are Free Banner sellswords the new peace never paid. They now sell their swords to anyone, charge tolls on the lower roads, and are loyal to nobody.",
        distorted: "Bandits wearing old rebel colors hold the lower roads and rob anyone who passes."
    },
    {
        id: "plague-winter", tiers: ["common"], zones: ["Town"], know: 70, rumor: false,
        topic: "how the war ended",
        text: function (s) {
            if (s.ending === "plague") return "The war ended because a plague winter killed more soldiers than any battle. Both armies simply stopped marching, and nobody signed a peace.";
            if (s.ending === "ruin") return "The war ended because both treasuries ran dry. After the fight at the Greywater Ford neither side could pay for another season.";
            return "The war ended in a truce at the Greywater Ford. Both sides swore to it and neither honored it. They just ran out of strength to break it.";
        },
        distorted: "The war ended when the gods grew tired of it and sent a winter to end it."
    },
    {
        id: "closed-gates", tiers: ["common", "deep"], zones: ["Underground City"], know: 70, rumor: true,
        topic: "the Closed Gates",
        text: "Dwarves and others who wanted no part of the war went below and shut the gates behind them. The Underground City still lets in anyone who leaves their sworn side at the gate and swears no banner while inside.",
        distorted: "The dwarves below sealed the gates and will not open them for anyone, not even for gold."
    },
    // ── local: Town gossip ────────────────────────────────────────
    {
        id: "town-watch", tiers: ["local", "military"], zones: ["Town"], know: 65, rumor: true,
        topic: "the town watch",
        text: "The town watch answers to the Town Hall, not to either old side. They are paid in grain and goodwill, and they are told to keep the road to the ruins quiet.",
        distorted: "The watch is bought, and by whoever pays more than the Town Hall."
    },
    {
        id: "ruins-scavengers", tiers: ["local", "trade"], zones: ["Town", "Ruins"], know: 75, rumor: true,
        topic: "scavengers in the ruins",
        text: "Scavengers sell what they find in Aldermere to the town's merchants: coins, old arms, and the odd Crown seal. The smart ones stay out of the Throne District.",
        distorted: "A scavenger found a hoard of Crown gold in the ruins and was never seen again."
    },
    {
        id: "tavern-talk", tiers: ["local", "trade"], zones: ["Town"], know: 70, rumor: true,
        topic: "who drinks here",
        text: "Old soldiers from both sides drink in the same taverns now. They keep to separate corners and the fights are mostly polite, but nobody has yet agreed on whose war it was."
    },
    {
        id: "grain-road", tiers: ["trade", "local"], zones: ["Town", "Swamp"], know: 60, rumor: true,
        topic: "the grain road",
        text: "The old grain road through the Swamp is the town's cheapest trade route, and the one the Tattered Banners prey on most. Merchants pay for guards or take the long way."
    },
    // ── trade: prices, supply, who pays ───────────────────────────
    {
        id: "war-surplus", tiers: ["trade", "military"], zones: ["Town", "Dungeon"], know: 65, rumor: false,
        topic: "war surplus",
        text: "Swords, shields and mail from the war still turn up in the market. A good share comes from caches in the lower works that nobody has ever fully counted."
    },
    {
        id: "ore-prices", tiers: ["trade", "deep"], zones: ["Underground City", "Town"], know: 60, rumor: false,
        topic: "ore and iron prices",
        text: "Iron has been dear ever since the dwarves stopped selling openly. The Underground City sells through go-betweens now, and the Tattered Banners tax every cart that comes up."
    },
    // ── military: soldiers, guards, sellswords ────────────────────
    {
        id: "greywater-ford", tiers: ["military", "swamp"], zones: ["Swamp"], know: 60, rumor: true,
        topic: "the Greywater Ford",
        text: function (s) {
            const who = s.damBreaker === "crown" ? "the Crown" : "the Free Banners";
            const target = s.damBreaker === "crown" ? "the Free Banner column" : "the Crown relief column";
            return "The Greywater Ford was where the war broke. " + who + " broke the dam upstream to drown " + target + ", and the flood buried the ford, the dead and half the old road under what is now the swamp.";
        },
        distorted: "A whole army drowned in the swamp when the river flooded, and you can still hear the drums."
    },
    {
        id: "oathbound-dead", tiers: ["military", "faith"], zones: ["Ruins"], know: 45, rumor: false,
        topic: "the oathbound dead",
        text: "The skeletons in Aldermere are Crownguard who swore to hold the palace and were never released from the oath. They do not hunt the living. They hold their posts and strike whoever comes near.",
        distorted: "The dead of Aldermere hunt anyone who enters the city."
    },
    {
        id: "dungeon-assize", tiers: ["military", "scholar", "local"], zones: ["Dungeon", "Town"], know: 40, rumor: false,
        topic: "the cellars below the town",
        text: "The dungeon under the town was the Crown's assize cellar and prison. After the war deserters, debtors and every sort of person who did not wish to be found moved into it. The goblins, kobolds and rats came later."
    },
    {
        id: "sellsword-debt", tiers: ["military"], zones: ["Dungeon", "Underground City"], know: 45, rumor: false,
        topic: "unpaid soldiers",
        text: "The Free Banners promised their sellswords a share of the Aldermere treasury. It was burned, or looted, or never existed, and eleven winters on they are still waiting for the pay.",
        distorted: "The rebels hid the Aldermere treasury and will kill anyone who looks for it."
    },
    // ── deep: miners, dwarves, smiths ─────────────────────────────
    {
        id: "mine-works", tiers: ["deep"], zones: ["Underground City", "Dungeon"], know: 70, rumor: true,
        topic: "the old mine works",
        text: "The mines under the town were the Crown's, worked to make arms for the war. The galleries still hold good ore and old collapses, and the lift down to the deep forge is older than the Underground City itself."
    },
    {
        id: "deep-forge", tiers: ["deep", "trade"], zones: ["Underground City"], know: 50, rumor: false,
        topic: "the deep forge",
        text: "The deep forge made the Crown's best blades. The Underground City's smiths keep it lit and decline commissions from either old side, which is why a Crown-forged blade fetches such a price."
    },
    {
        id: "gate-oath", tiers: ["deep", "scholar"], zones: ["Underground City"], know: 55, rumor: false,
        topic: "the gate oath",
        text: "Whoever enters the Closed Gates must set down their banner, their rank and their quarrel at the threshold. Several Free Banner captains and Crown officers live there under plain names, and everyone below pretends not to notice."
    },
    // ── swamp ─────────────────────────────────────────────────────
    {
        id: "swamp-wreck", tiers: ["swamp", "local"], zones: ["Swamp"], know: 65, rumor: true,
        topic: "what the swamp swallowed",
        text: "The swamp is mostly the flooded valley of the Greywater. Wagons, banners, bones and armor are still being found in the mud, and the swamp folk claim whatever the water gives up."
    },
    {
        id: "swamp-neutral", tiers: ["swamp"], zones: ["Swamp"], know: 60, rumor: false,
        topic: "the swamp folk and the war",
        text: "The swamp folk want no side. The flood did not ask them either, and they take payment from whichever side comes first with something worth having, and remember who kept their word."
    },
    // ── faith ─────────────────────────────────────────────────────
    {
        id: "shrines-both-sides", tiers: ["faith", "scholar"], zones: ["Town", "Ruins", "Dungeon"], know: 55, rumor: false,
        topic: "the old shrines",
        text: "Both sides kept the same shrines and prayed to the same old gods for victory. The shrines that survived are neutral ground by custom, and nobody has drawn a weapon in one since the war."
    },
    {
        id: "dead-gods-silent", tiers: ["faith"], zones: ["Ruins", "Town"], know: 40, rumor: false,
        topic: "the silence of the gods",
        text: "Priests on both sides prayed for victory and neither received an answer. Some call that the real reason the war ended, and prefer not to say so in front of the faithful."
    },
    // ── scholar ───────────────────────────────────────────────────
    {
        id: "grain-levy", tiers: ["scholar"], zones: ["Ruins", "Town"], know: 50, rumor: false,
        topic: "why the war began",
        text: "The war started over the grain levy, but the records in Aldermere show the Crown had been emptying the granaries to pay its debts for years. The Free Banners were not wrong about the cause. They were wrong about the cure."
    },
    {
        id: "ruins-archive", tiers: ["scholar"], zones: ["Ruins"], know: 40, rumor: false,
        topic: "the lost archive",
        text: "Aldermere's archive was only half burned. What survived the fire lies in the deeper rooms of the ruins, and both sides would pay well for the ledgers that show who ordered what."
    },
    // ── secret ────────────────────────────────────────────────────
    {
        id: "regent-fate", tiers: ["secret", "military", "scholar"], zones: ["Dungeon", "Underground City", "Ruins"], know: 35, rumor: false,
        topic: "what became of the Regent",
        text: function (s) {
            if (s.regentFate === "entombed") return "The Regent never left the war. The Ashen Court sealed the body in the throne hall beneath the town and still guards it, and the Court's authority rests on the claim that the Regent is only sleeping.";
            if (s.regentFate === "fled") return "The Regent escaped Aldermere and lives in the Underground City under a plain name. The Ashen Court does not know, and some who do would sooner it stayed so.";
            return "The Regent died at the Greywater Ford and the body was never recovered. The Ashen Court's loyalty rests on a missing corpse, and everyone who knows that keeps quiet.";
        },
        distorted: "The Regent is alive, and the Crown will rise again."
    },
    {
        id: "treasury-truth", tiers: ["secret", "military"], zones: ["Ruins", "Dungeon"], know: 30, rumor: false,
        topic: "the Aldermere treasury",
        text: function (s) {
            return s.burner === "banners"
                ? "The treasury was real, and the Free Banners looted it before they burned the city. The captains kept it. The rank and file got nothing, which is why the Tattered Banners still hold a grudge against their own officers."
                : "There was little left of the treasury. The Crown had spent it on the war long before the fires, and the sellswords' pay was gone before the last winter.";
        },
        distorted: "A fortune in Crown gold is buried under Aldermere, and the ghosts guard it."
    }
];

// ── SEEDED STATE (G.worldLore) ───────────────────────────────────
// { seed: {...}, heard: { factId: true }, standing: { crown: 0, banners: 0 } }
// Created lazily on first use and saved with the game; reset when a new
// adventure starts (updateStoryOnAdventureStart in the engine).
function _wlPick(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function createWorldLoreState() {
    const seed = {};
    Object.keys(WORLD_LORE_SEED_OPTIONS).forEach(function (key) {
        seed[key] = _wlPick(WORLD_LORE_SEED_OPTIONS[key]);
    });
    return { seed: seed, heard: {}, standing: { crown: 0, banners: 0 } };
}

function ensureWorldLore() {
    if (typeof G !== "object" || !G) return createWorldLoreState();
    if (!G.worldLore || typeof G.worldLore !== "object" || !G.worldLore.seed) {
        G.worldLore = createWorldLoreState();
    }
    const lore = G.worldLore;
    if (!lore.heard || typeof lore.heard !== "object") lore.heard = {};
    if (!lore.standing || typeof lore.standing !== "object") lore.standing = { crown: 0, banners: 0 };
    Object.keys(WORLD_LORE_SEED_OPTIONS).forEach(function (key) {
        if (WORLD_LORE_SEED_OPTIONS[key].indexOf(lore.seed[key]) < 0) {
            lore.seed[key] = _wlPick(WORLD_LORE_SEED_OPTIONS[key]);
        }
    });
    return lore;
}

function getWorldLoreFactText(fact, seed, distorted) {
    if (!fact) return "";
    const src = distorted && fact.distorted ? fact.distorted : fact.text;
    return typeof src === "function" ? String(src(seed || {})) : String(src || "");
}

// How the player has sided in the war so far. Positive = favors that side.
function getWorldStanding() {
    const lore = ensureWorldLore();
    return { crown: lore.standing.crown || 0, banners: lore.standing.banners || 0 };
}
function shiftWorldStanding(side, amount) {
    if (side !== "crown" && side !== "banners") return;
    const lore = ensureWorldLore();
    const next = (lore.standing[side] || 0) + (typeof amount === "number" ? amount : 1);
    lore.standing[side] = Math.max(-10, Math.min(10, next));
}

if (typeof window !== "undefined") {
    window.WORLD_LORE_FACTS = WORLD_LORE_FACTS;
    window.ensureWorldLore = ensureWorldLore;
    window.getWorldLoreFactText = getWorldLoreFactText;
    window.getWorldStanding = getWorldStanding;
    window.shiftWorldStanding = shiftWorldStanding;
}
