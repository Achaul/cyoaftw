// ── ZONE TEMPLATES ───────────────────────────────────────────────

const ZONE_TEMPLATES = [
    {
        name: "Town",
        hostileArea: false,
        ambiance: "The sounds of daily life fill the air. People go about their business.",
        // (The boss-room type is now the "Council Chamber" behind the Town
        // Hall's front hall - see BUILDING_BLUEPRINTS.) "Town Hall" was the
        // old boss-room type (see ZONE_BOSS_ROOMS in
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
            { id: "portcullis",   name: "portcullis",       tags: ["barrier"] },
            { id: "practice-dummies", name: "battered practice dummies", tags: ["work", "training"] }
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
            { id: "reading-desk", name: "reading desk", tags: ["surface", "work", "lab"] },
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

    // ── BUILDING CONNECTORS ────────────────────────────────────────
    // Hallways, stairs and doorways that tie a building's rooms together
    // (see BUILDING_BLUEPRINTS). They are never part of a zone's random
    // roomTypes roll - only blueprints place them. role "spine" means no
    // NPCs spawn in them.
    {
        type: "Cellar Stairs",
        zone: "Town",
        role: "spine",
        displayName: "Cellar Stairs",
        baseDescription: "A narrow landing behind the taproom. A steep wooden stair drops into the cool dark of the cellar, and the smell of damp stone and spilled ale drifts up.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: true,
        structural: [
            { id: "steep-stair", name: "steep wooden stair", tags: ["passage"] },
            { id: "wall-hook",   name: "lantern hook",       tags: ["light"] }
        ]
    },
    {
        type: "Back Door",
        zone: "Town",
        role: "spine",
        displayName: "Back Door",
        baseDescription: "A cramped back passage by the kitchen, stacked with empty crates and slop buckets. A barred door leads out to the alley behind the building.",
        allowedZones: ["town"],
        parentCluster: ["tavern", "inn"],
        isConnector: true,
        structural: [
            { id: "door-bar",   name: "heavy door bar", tags: ["barrier"] },
            { id: "slop-buckets", name: "slop buckets", tags: ["refuse"] }
        ]
    },
    {
        type: "Stairs",
        zone: "Town",
        role: "spine",
        displayName: "Staircase",
        baseDescription: "A broad wooden staircase worn smooth by travellers' boots, rising from the common room to the guest floor above.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: true,
        structural: [
            { id: "banister", name: "polished banister", tags: ["passage"] },
            { id: "stair-runner", name: "threadbare runner", tags: ["passage"] }
        ]
    },
    {
        type: "Upstairs Hallway",
        zone: "Town",
        role: "spine",
        displayName: "Upstairs Hallway",
        baseDescription: "A narrow, creaking hallway lined with numbered doors. A single lamp burns at the end, and muffled snores seep through the walls.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: true,
        structural: [
            { id: "hall-lamp", name: "hall lamp", tags: ["light"] },
            { id: "room-doors", name: "numbered doors", tags: ["barrier"] }
        ]
    },

    // ── SMITHY & TOWN HALL INTERIORS ───────────────────────────────
    // Rooms behind the street-facing Smithy / Town Hall (see
    // BUILDING_BLUEPRINTS). Never rolled randomly.
    {
        type: "Smithy Storeroom",
        zone: "Town",
        role: "interior",
        displayName: "Smithy Storeroom",
        baseDescription: "A low, sooty storeroom behind the forge. Ingots and ore sacks are stacked to the rafters, and a dwarven cargo lift squats against the back wall on its thick chains. A heavy yard door leads out to the alley.",
        allowedZones: ["town"],
        parentCluster: ["market", "square"],
        isConnector: false,
        structural: [
            { id: "ore-bin",    name: "ore bin",         tags: ["storage", "loot"] },
            { id: "ingot-rack", name: "ingot rack",      tags: ["storage", "commerce"] },
            { id: "cargo-lift", name: "cargo lift",      tags: ["passage", "landmark"] }
        ],
        imageKey: "Smithy"
    },
    {
        type: "Smith's Quarters",
        zone: "Town",
        role: "interior",
        displayName: "Smith's Quarters",
        baseDescription: "A cramped living space above the din of the forge: a narrow bed, a table with a half-eaten loaf, and a shelf of tools too precious to leave downstairs.",
        allowedZones: ["town"],
        parentCluster: ["market", "square"],
        isConnector: false,
        structural: [
            { id: "bed",        name: "bed",         tags: ["rest"] },
            { id: "chest",      name: "chest",       tags: ["storage"] },
            { id: "wash-basin", name: "wash basin",  tags: ["hygiene"] }
        ],
        imageKey: "Guest Room"
    },
    {
        type: "Townhouse",
        zone: "Town",
        role: "interior",
        displayName: "Townhouse",
        baseDescription: "The front room of a narrow townhouse: a worn table, a few stools, and a hearth banked low. Someone's washing hangs drying by the fire, and a door at the back leads further in.",
        allowedZones: ["town"],
        parentCluster: ["house"],
        isConnector: false,
        structural: [
            { id: "table",  name: "worn table",  tags: ["surface", "social"] },
            { id: "hearth", name: "hearth",      tags: ["heat", "light"] }
        ],
        imageKey: "Room"
    },
    {
        type: "Bedroom",
        zone: "Town",
        role: "interior",
        displayName: "Bedroom",
        baseDescription: "A small, tidy bedroom: a narrow bed under a patched quilt, a clothes chest, and a shuttered window that looks out over the rooftops.",
        allowedZones: ["town"],
        parentCluster: ["house"],
        isConnector: false,
        structural: [
            { id: "bed",        name: "bed",         tags: ["rest"] },
            { id: "chest",      name: "chest",       tags: ["storage"] },
            { id: "wash-basin", name: "wash basin",  tags: ["hygiene"] }
        ],
        imageKey: "Guest Room"
    },
    {
        type: "Hall Corridor",
        zone: "Town",
        role: "spine",
        displayName: "Hall Corridor",
        baseDescription: "A cool stone corridor behind the great hall, hung with the portraits of long-dead magistrates. Clerks hurry past with armfuls of paper, and boots echo from the guardroom.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: true,
        structural: [
            { id: "portraits", name: "magistrates' portraits", tags: ["landmark"] },
            { id: "wall-sconces", name: "wall sconces", tags: ["light"] }
        ],
        imageKey: "Town Hall"
    },
    {
        type: "Council Chamber",
        zone: "Town",
        role: "landmark",
        displayName: "Council Chamber",
        baseDescription: "A high-ceilinged chamber of dressed stone. A long council table fills the floor beneath hanging banners, and a raised dais at the far end holds the chair of whoever truly runs this town.",
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
        type: "Records Office",
        zone: "Town",
        role: "interior",
        displayName: "Records Office",
        baseDescription: "A narrow, dusty office walled with pigeonholes of deeds, tax rolls and levy tallies. A clerk's desk faces the door, and the room smells of ink and old paper.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "clerk-desk",  name: "clerk's desk",   tags: ["surface", "work", "formal"] },
            { id: "pigeonholes", name: "pigeonholes of records", tags: ["storage", "information"] },
            { id: "writing-table", name: "writing table cluttered with ink and sand", tags: ["surface", "work", "lab"] }
        ],
        imageKey: "Library"
    },
    // The Town Portal: a waygate the council keeps behind the Hall Corridor.
    // Placed only by the Town Hall blueprint (never rolled). Its "portal"
    // tagged fixture opens the pay-and-step-through card (see TOWN PORTAL in
    // cyoaftw-engine-CORE.js).
    {
        type: "Portal Chamber",
        zone: "Town",
        role: "interior",
        displayName: "Portal Chamber",
        noNpcs: true,
        baseDescription: "A round, windowless chamber of old grey stone, its floor inlaid with rings of worn brass. A tall arch of fitted black stone stands against the far wall, and the air inside it shimmers like heat over a road.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "town-portal", name: "shimmering waygate", tags: ["landmark", "portal"],
              examineText: "A tall arch of black stone holds a pane of shimmering air. Through it you glimpse a street you do not know, under a different sky. Brass rings in the floor hum faintly whenever someone stands near, and a plaque beside the arch states the council's fee for passage." },
            { id: "brass-rings", name: "inlaid brass rings", tags: ["landmark"] }
        ],
        imageKey: "Town Hall"
    },

    // ── GUILDHALL & CHAPEL ─────────────────────────────────────────
    // Two more public buildings (see BUILDING_BLUEPRINTS). Never rolled
    // randomly. The Guildhall is where fighters and sellswords are trained
    // and hired (its yard carries "training" fixtures, which makes it a
    // synergy yard station); the Chapel is a real, prayer-capable temple,
    // unlike the hidden cellar shrine under the tavern.
    {
        type: "Guildhall",
        zone: "Town",
        role: "landmark",
        displayName: "Guildhall",
        baseDescription: "A broad, timber-framed hall with a painted shield over the door for every company that ever signed its rolls. A job board crowds the entrance, and the sound of steel on steel rings from somewhere behind.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "job-board",    name: "job board",         tags: ["information", "commerce"] },
            { id: "guild-shields", name: "painted guild shields", tags: ["landmark"] },
            { id: "muster-bench", name: "muster bench",      tags: ["social", "rest"] }
        ],
        imageKey: "Town Hall"
    },
    {
        type: "Training Yard",
        zone: "Town",
        role: "interior",
        displayName: "Training Yard",
        baseDescription: "A packed-earth yard walled in on all sides, scuffed by years of boots. Straw dummies stand against one wall, a weapon rack against another, and a pair of recruits trade slow, careful blows under a master's eye.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        minNpcs: 1,
        structural: [
            { id: "straw-dummies", name: "straw dummies",  tags: ["training", "combat"] },
            { id: "weapon-rack",   name: "weapon rack",    tags: ["storage", "combat"] },
            { id: "sparring-ring", name: "chalked sparring ring", tags: ["training", "formal"] }
        ],
        imageKey: "Town Hall"
    },
    {
        type: "Guildmaster's Office",
        zone: "Town",
        role: "interior",
        displayName: "Guildmaster's Office",
        baseDescription: "A cramped office stacked with contract scrolls and muster rolls. A scarred desk faces the door, and a map of the district is pinned to the wall, studded with coloured tacks.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "scarred-desk",  name: "scarred desk",     tags: ["surface", "work", "formal"] },
            { id: "contract-shelf", name: "shelf of contracts", tags: ["storage", "information"] },
            { id: "district-map",  name: "pinned district map", tags: ["information", "landmark"] }
        ],
        imageKey: "Library"
    },
    {
        type: "Chapel",
        zone: "Town",
        role: "landmark",
        displayName: "Chapel",
        baseDescription: "A small stone chapel with a narrow bell-cote and a worn step. Inside, light falls in coloured bars through a single window onto rows of plain benches and an altar kept clean by someone who clearly cares.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom in cyoaftw-engine-CORE.js), and
        // always tended: minNpcs keeps the priest at the altar even though
        // ordinary shrines are mostly empty.
        isShrine: true,
        minNpcs: 1,
        structural: [
            { id: "altar-stone",  name: "altar stone",     tags: ["ritual", "landmark"] },
            { id: "votive-rack",  name: "rack of votive candles", tags: ["light", "ritual"] },
            { id: "plain-benches", name: "plain benches",  tags: ["social", "rest"] }
        ],
        imageKey: "Cellar"
    },
    {
        type: "Vestry",
        zone: "Town",
        role: "interior",
        displayName: "Vestry",
        baseDescription: "A narrow room behind the altar where vestments hang on pegs and the poor-box is counted. A kettle sits by a small stove, and a shelf of worn prayer books leans against the wall.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "vestment-pegs", name: "pegs of vestments", tags: ["storage"] },
            { id: "prayer-shelf",  name: "shelf of prayer books", tags: ["storage", "information"] },
            { id: "poor-box",      name: "iron-banded poor-box", tags: ["storage", "commerce"] }
        ],
        imageKey: "Room"
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


// ── BUILDINGS & PLANNED ZONE LAYOUTS ─────────────────────────────
// A building is no longer a loose room dropped next to whatever the random
// generator rolled. It is a small blueprint: one ENTRANCE room that faces the
// street on the main map plane, and a set of interior rooms on their own map
// plane(s), joined by hallways, stairs and doors. The only ways in or out are
// the doors the blueprint names (`front`, optionally `back`).
//
// Blueprint fields:
//   entrance  room type of the street-facing room (main plane)
//   front     key of the interior room the front door opens into (null for a
//             single-room building)
//   back      optional key of the interior room whose rear door opens onto an
//             alley behind the building
//   rooms     [{ key, type, floor, at:[x,y], chance?, anchorFor?, verticalLinks? }]
//             floor 0 is the ground interior plane, 1 is upstairs, -1 is a
//             cellar. at is local to the building; +y is toward the BACK of the
//             building (away from the street).
//   links     [[keyA, keyB, doorKind?]] - rooms on the same floor must be
//             adjacent cells; rooms on different floors are joined by an
//             Up/Down stair. doorKind: "door" | "arch" | omitted (open).
//   anchorFor / verticalLinks: zone-link ids, see ZONE_LINKS in the engine.
//
// Interiors live far from the street grid (BUILDING_PLANE_X0 and up), each
// building in its own x block and each floor in its own y band, so they can
// never touch a neighbouring street room.
const BUILDING_PLANE_X0 = 10000;
const BUILDING_PLANE_X_STRIDE = 30;
const BUILDING_FLOOR_Y_STRIDE = 60;

const BUILDING_BLUEPRINTS = {
    "Tavern": {
        zone: "Town",
        entrance: "Tavern",
        front: "taproom",
        back: "backdoor",
        names: ["The Gilded Flagon", "The Hollow Oak", "The Crooked Lantern", "The Rusty Anchor", "The Sleeping Stag", "The Drowned Rat"],
        rooms: [
            { key: "taproom",      type: "Taproom",       floor: 0,  at: [0, 0] },
            { key: "kitchen",      type: "Kitchen",       floor: 0,  at: [1, 0], minNpcs: 1 },
            { key: "backdoor",     type: "Back Door",     floor: 0,  at: [1, 1] },
            { key: "cellarstairs", type: "Cellar Stairs", floor: 0,  at: [0, 1] },
            { key: "cellar",       type: "Cellar",        floor: -1, at: [0, 0],
              anchorFor: ["dungeon-to-town"], verticalLinks: ["town-to-dungeon"] },
            { key: "shrine",       type: "Cellar Shrine", floor: -1, at: [1, 0] }
        ],
        // The alley side of the back door is barred; it lifts freely from inside.
        // The cellar door is often kept locked (freely opened from the stair
        // side, so a way in from the dungeon never traps anyone).
        backLock: { chance: 1, level: [2, 3] },
        links: [
            ["taproom", "kitchen", "door"],
            ["kitchen", "backdoor", "door"],
            ["taproom", "cellarstairs", "door", { chance: 0.5, level: 2 }],
            ["cellarstairs", "cellar"],
            ["cellar", "shrine", "door"]
        ]
    },
    "Inn": {
        zone: "Town",
        entrance: "Inn",
        front: "common",
        back: null,
        names: ["The Wayfarer's Rest", "The Lantern & Loaf", "The Quiet Hearth", "The Traveller's Lamp", "The Weary Boot"],
        rooms: [
            { key: "common",  type: "Inn Common",       floor: 0, at: [0, 0] },
            { key: "stairs",  type: "Stairs",           floor: 0, at: [1, 0] },
            { key: "hall1",   type: "Upstairs Hallway", floor: 1, at: [1, 0] },
            { key: "hall2",   type: "Upstairs Hallway", floor: 1, at: [2, 0] },
            { key: "guest1",  type: "Guest Room",       floor: 1, at: [1, 1] },
            { key: "guest2",  type: "Guest Room",       floor: 1, at: [1, -1] },
            { key: "guest3",  type: "Guest Room",       floor: 1, at: [2, 1] },
            { key: "guest4",  type: "Guest Room",       floor: 1, at: [2, -1], chance: 0.7 },
            { key: "guest5",  type: "Guest Room",       floor: 1, at: [3, 0],  chance: 0.5 }
        ],
        links: [
            ["common", "stairs", "arch"],
            ["stairs", "hall1"],
            ["hall1", "hall2"],
            ["hall1", "guest1", "door", { chance: 1, level: 2, keyId: "room-token" }],
            ["hall1", "guest2", "door", { chance: 1, level: 2, keyId: "room-token" }],
            ["hall2", "guest3", "door", { chance: 1, level: 2, keyId: "room-token" }],
            ["hall2", "guest4", "door", { chance: 1, level: 2, keyId: "room-token" }],
            ["hall2", "guest5", "door", { chance: 1, level: 2, keyId: "room-token" }]
        ]
    },
    // The forge floor is open-fronted to the street (an archway, not a door).
    // Behind it: the storeroom (ore deliveries come in by the yard door to the
    // alley, and the cargo lift down to the Underground City is here) and the
    // smith's own quarters, which is a private room with its own door.
    "Smithy": {
        zone: "Town",
        entrance: "Smithy",
        streetDoor: "arch",
        front: "storeroom",
        frontDoor: "arch",
        back: "storeroom",
        names: ["The Cinder Anvil", "Ironhand Forge", "The Black Hammer", "Emberstone Smithy"],
        rooms: [
            { key: "storeroom", type: "Smithy Storeroom", floor: 0, at: [0, 0], minNpcs: 0,
              anchorFor: ["uc-to-town"], verticalLinks: ["town-to-uc"] },
            { key: "quarters",  type: "Smith's Quarters", floor: 0, at: [1, 0] }
        ],
        links: [
            ["storeroom", "quarters", "door", { chance: 0.6, level: 2 }]
        ],
        backLock: { chance: 1, level: 2 }
    },
    // An ordinary home: front room onto the street, a bedroom behind a door.
    // One door in or out. Fills out larger towns.
    "House": {
        zone: "Town",
        entrance: "Townhouse",
        front: "bedroom",
        frontDoor: "door",
        // Homes are often locked up; the bedroom door less so.
        streetLock: { chance: 0.45, level: [1, 2] },
        frontLock: { chance: 0.35, level: 2 },
        back: null,
        names: [],
        rooms: [
            { key: "bedroom", type: "Bedroom", floor: 0, at: [0, 0] }
        ],
        links: []
    },
    // Public hall at the front with the town guard; a corridor behind it leads
    // to the council chamber (the town's boss room) and the records office.
    // One door.
    "Town Hall": {
        zone: "Town",
        entrance: "Town Hall",
        front: "corridor",
        frontDoor: "door",
        back: null,
        names: [],
        rooms: [
            { key: "corridor", type: "Hall Corridor",   floor: 0, at: [0, 0] },
            { key: "chamber",  type: "Council Chamber", floor: 0, at: [0, 1] },
            { key: "records",  type: "Records Office",  floor: 0, at: [1, 0], minNpcs: 1 },
            // The Town Portal (always present; west of the corridor, open
            // archway, never locked).
            { key: "portal",   type: "Portal Chamber",  floor: 0, at: [-1, 0] }
        ],
        links: [
            ["corridor", "chamber", "door"],
            ["corridor", "records", "door", { chance: 0.7, level: 3 }],
            ["corridor", "portal", "arch"]
        ]
    },
    // The street-facing hall holds the Guildmaster and the job board; an
    // archway opens onto the training yard behind, and the Guildmaster's
    // office is a locked room off the yard. One way in.
    "Guildhall": {
        zone: "Town",
        entrance: "Guildhall",
        front: "yard",
        frontDoor: "arch",
        back: null,
        names: ["The Ironbound Guildhall", "The Company of the Open Road", "The Wayfarers' Guildhall", "The Brazen Banner Hall", "The Sellswords' Hall"],
        rooms: [
            { key: "yard",   type: "Training Yard",        floor: 0, at: [0, 0], minNpcs: 1 },
            { key: "office", type: "Guildmaster's Office", floor: 0, at: [1, 0] }
        ],
        links: [
            ["yard", "office", "door", { chance: 0.6, level: 2 }]
        ]
    },
    // A nave open to the street with a vestry behind. One door, never locked
    // (a chapel turns nobody away).
    "Chapel": {
        zone: "Town",
        entrance: "Chapel",
        front: "vestry",
        frontDoor: "door",
        back: null,
        names: ["The Chapel of the Lantern", "The Chapel of Ash and Dawn", "The Hearthward Chapel", "The Chapel of Quiet Lamps"],
        rooms: [
            { key: "vestry", type: "Vestry", floor: 0, at: [0, 0] }
        ],
        links: []
    }
};

const _DIR_DELTA = {
    N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0],
    NE: [1, 1], NW: [-1, 1], SE: [1, -1], SW: [-1, -1]
};
const _DIR_OPP = { N: "S", S: "N", E: "W", W: "E", NE: "SW", SW: "NE", NW: "SE", SE: "NW", U: "D", D: "U" };

function _dirFromDelta(dx, dy) {
    const keys = Object.keys(_DIR_DELTA);
    for (let i = 0; i < keys.length; i++) {
        if (_DIR_DELTA[keys[i]][0] === dx && _DIR_DELTA[keys[i]][1] === dy) return keys[i];
    }
    return null;
}

function _planShuffle(list, rng) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

// A plan is plain data: { rooms: {coords: desc}, buildings: [...] }. The
// engine turns each desc into a real room (see buildPlannedZone there).
// desc: { coords, type, zone, exits{dir:coords}, portals{dir:true},
//         doors{dir:kind}, buildingId, buildingType, buildingName, floor,
//         isBuildingRoom, anchorFor[], verticalLinks[], guaranteedLink }
function _planAddRoom(plan, coords, type, zone, extra) {
    const desc = Object.assign({
        coords: coords, type: type, zone: zone,
        exits: {}, portals: {}, doors: {}, locks: {}
    }, extra || {});
    plan.rooms[coords] = desc;
    return desc;
}

// Joins two planned rooms. A plain adjacent link is an ordinary exit. Pass
// portal=true for links between cells that are not neighbours on the grid
// (a street door into an interior plane, a back door into an alley). doorKind
// puts a visible door (or archway) on both sides of the link.
function _planLink(plan, aCoords, bCoords, dirFromA, doorKind, portal, lock) {
    const a = plan.rooms[aCoords];
    const b = plan.rooms[bCoords];
    const back = _DIR_OPP[dirFromA];
    a.exits[dirFromA] = bCoords;
    b.exits[back] = aCoords;
    if (portal) { a.portals[dirFromA] = true; b.portals[back] = true; }
    // A lock needs a door to sit in.
    if (lock && !doorKind) doorKind = "door";
    if (doorKind) { a.doors[dirFromA] = doorKind; b.doors[back] = doorKind; }
    if (lock) {
        // Both sides share one lock. freeFrom says which side can open it
        // without a roll (lift the bar, turn the latch): "A" is aCoords' side,
        // "B" the other. Doors are always openable from the private side, so
        // nobody can be locked inside a building (or out of the way they came
        // in by stairs or lift).
        a.locks[dirFromA] = { state: "locked", level: lock.level, keyId: lock.keyId || null, freeOpen: lock.freeFrom === "A" };
        b.locks[back]     = { state: "locked", level: lock.level, keyId: lock.keyId || null, freeOpen: lock.freeFrom !== "A" };
    }
}

// Rolls a blueprint lock spec: { chance?, level: n | [lo, hi], keyId?, freeFrom? }.
// Returns null when the chance roll says this door is simply unlocked.
function _planRollLock(spec, rng, defaultFreeFrom) {
    if (!spec) return null;
    if (typeof spec.chance === "number" && rng() >= spec.chance) return null;
    let level = spec.level || 1;
    if (Array.isArray(level)) level = level[0] + Math.floor(rng() * (level[1] - level[0] + 1));
    return { level: level, keyId: spec.keyId || null, freeFrom: spec.freeFrom || defaultFreeFrom || "B" };
}

function _planBuildingInterior(plan, bpKey, index, entranceDesc, side, rng, alleyCoords) {
    const bp = BUILDING_BLUEPRINTS[bpKey];
    const buildingId = bpKey.toLowerCase().replace(/[^a-z]+/g, "-") + "-" + index;
    const name = bp.names && bp.names.length ? bp.names[Math.floor(rng() * bp.names.length)] : null;

    entranceDesc.buildingId = buildingId;
    entranceDesc.buildingType = bpKey;
    entranceDesc.buildingName = name;
    entranceDesc.isBuildingRoom = true;
    entranceDesc.isEntrance = true;
    entranceDesc.floor = 0;
    if (bp.anchorFor) entranceDesc.anchorFor = bp.anchorFor.slice();
    if (bp.verticalLinks) entranceDesc.verticalLinks = bp.verticalLinks.slice();

    const byKey = {};
    const x0 = BUILDING_PLANE_X0 + index * BUILDING_PLANE_X_STRIDE;
    (bp.rooms || []).forEach(def => {
        if (typeof def.chance === "number" && rng() >= def.chance) return;
        const coords = (x0 + def.at[0]) + "," + (def.floor * BUILDING_FLOOR_Y_STRIDE + def.at[1] * side);
        const desc = _planAddRoom(plan, coords, def.type, bp.zone, {
            buildingId: buildingId, buildingType: bpKey, buildingName: name,
            isBuildingRoom: true, floor: def.floor
        });
        if (typeof def.minNpcs === "number") desc.minNpcs = def.minNpcs;
        if (def.anchorFor) desc.anchorFor = def.anchorFor.slice();
        if (def.verticalLinks) desc.verticalLinks = def.verticalLinks.slice();
        byKey[def.key] = desc;
    });

    (bp.links || []).forEach(link => {
        const a = byKey[link[0]];
        const b = byKey[link[1]];
        if (!a || !b) return; // an optional room that did not roll
        const kind = link[2] || null;
        const lock = _planRollLock(link[3], rng, "B");
        if (a.floor === b.floor) {
            const pa = a.coords.split(","), pb = b.coords.split(",");
            const dir = _dirFromDelta(Number(pb[0]) - Number(pa[0]), Number(pb[1]) - Number(pa[1]));
            if (!dir) throw new Error("Blueprint " + bpKey + ": " + link[0] + " and " + link[1] + " are not adjacent");
            _planLink(plan, a.coords, b.coords, dir, kind, false, lock);
        } else {
            const upDir = b.floor > a.floor ? "U" : "D";
            _planLink(plan, a.coords, b.coords, upDir, kind, false, lock);
        }
    });

    // The front door: street-facing entrance -> interior. "Inward" is toward
    // the back of the building: north for a building on the north side of the
    // street, south for one on the south side.
    const inward = side > 0 ? "N" : "S";
    if (bp.front && byKey[bp.front]) {
        _planLink(plan, entranceDesc.coords, byKey[bp.front].coords, inward, bp.frontDoor || "door", true, _planRollLock(bp.frontLock, rng, "B"));
    }
    // The back door, if the blueprint has one: interior -> alley.
    if (bp.back && byKey[bp.back] && alleyCoords) {
        // The back door is barred from inside: the inside (A) side opens freely.
        _planLink(plan, byKey[bp.back].coords, alleyCoords, inward, "door", true, _planRollLock(bp.backLock, rng, "A"));
    }
    return { buildingId: buildingId, name: name, type: bpKey };
}

// Town: a street running east-west with a Square in the middle and a Gate at
// the west end, buildings facing it from the north and south side, and a
// back alley behind any building with a rear door. Closed to the east - the
// Gate's outward exit is the only frontier (it always leads out to the
// Ruins, see ZONE_LINKS).
function planTownLayout(rngIn) {
    const rng = typeof rngIn === "function" ? rngIn : Math.random;
    const zone = "Town";
    const plan = { zone: zone, rooms: {}, buildings: [], startByType: {} };
    const randInt = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

    // Random size: the street runs `west` slots to the west of the Square and
    // `east` to the east, so a town has between 3 and 7 slots per side (6 to
    // 14 building plots in all, before empty ones are left as plain wall).
    const west = randInt(1, 3);
    const east = randInt(1, 3);
    const SPINE_MIN = -(2 * west + 2);
    const SPINE_MAX = 2 * east + 2;

    for (let x = SPINE_MIN; x <= SPINE_MAX; x++) {
        const type = x === SPINE_MIN ? "Gate" : x === 0 ? "Square" : Math.abs(x) === 1 ? "Avenue" : "Street";
        _planAddRoom(plan, x + ",0", type, zone, {});
    }
    for (let x = SPINE_MIN; x < SPINE_MAX; x++) {
        _planLink(plan, x + ",0", (x + 1) + ",0", "E", null, false);
    }
    // The Gate's outward (west) exit points at ground that does not exist
    // yet; walking out is what builds the road to the Ruins.
    const gate = plan.rooms[SPINE_MIN + ",0"];
    gate.exits.W = (SPINE_MIN - 1) + ",0";
    gate.guaranteedLink = "town-to-ruins";
    gate.anchorFor = ["ruins-to-town"];

    // Building slots: two columns apart so each has a free column beside it
    // for an alley. Town Hall takes a slot facing the Square.
    const slots = [];
    for (let x = -2 * west; x <= 2 * east; x += 2) {
        [1, -1].forEach(side => slots.push({ x: x, side: side }));
    }
    const squareSlots = slots.filter(s => s.x === 0);
    const hallSlot = squareSlots[Math.floor(rng() * squareSlots.length)];
    const rest = _planShuffle(slots.filter(s => s !== hallSlot), rng);

    const assignment = [{ type: "Town Hall", slot: hallSlot }];
    // Every town has these. The Guildhall and the Chapel are the guide's
    // lead destinations (see PLAYER_ARCHETYPES), so they are always placed.
    const MUST_HAVE = ["Tavern", "Inn", "Smithy", "Guildhall", "Chapel"];
    MUST_HAVE.forEach((type, i) => { assignment.push({ type: type, slot: rest[i] }); });
    // Every other plot is a house or stays empty. Bigger towns get a second
    // inn now and then. The Tavern (cellar shrine, way down to the dungeon),
    // the Smithy (cargo lift to the Underground City) and the Town Hall
    // (boss room) are always single, since each carries a one-per-zone
    // feature or zone link; the Guildhall and Chapel are single too.
    rest.slice(MUST_HAVE.length).forEach(slot => {
        const roll = rng();
        if (roll < 0.10) assignment.push({ type: "Inn", slot: slot });
        else if (roll < 0.70) assignment.push({ type: "House", slot: slot });
    });

    assignment.forEach((entry, idx) => {
        const slot = entry.slot;
        const bp = BUILDING_BLUEPRINTS[entry.type];
        const entranceCoords = slot.x + "," + slot.side;
        const entrance = _planAddRoom(plan, entranceCoords, bp.entrance, zone, {});
        _planLink(plan, slot.x + ",0", entranceCoords, slot.side > 0 ? "N" : "S", bp.streetDoor || "door", false, _planRollLock(bp.streetLock, rng, "B"));

        let alleyCoords = null;
        if (bp.back) {
            // Alley: street -> beside the building -> behind it.
            const a1 = (slot.x + 1) + "," + slot.side;
            const a2 = (slot.x + 1) + "," + (2 * slot.side);
            const a3 = slot.x + "," + (2 * slot.side);
            _planAddRoom(plan, a1, "Alleyway", zone, {});
            _planAddRoom(plan, a2, "Alleyway", zone, {});
            _planAddRoom(plan, a3, "Alleyway", zone, {});
            _planLink(plan, (slot.x + 1) + ",0", a1, slot.side > 0 ? "N" : "S", null, false);
            _planLink(plan, a1, a2, slot.side > 0 ? "N" : "S", null, false);
            _planLink(plan, a2, a3, "W", null, false);
            alleyCoords = a3;
        }
        const info = _planBuildingInterior(plan, entry.type, idx, entrance, slot.side, rng, alleyCoords);
        info.entranceCoords = entranceCoords;
        plan.buildings.push(info);
    });

    // Where a new game can start, by the room type the player picked.
    Object.keys(plan.rooms).forEach(coords => {
        const type = plan.rooms[coords].type;
        if (!plan.startByType[type]) plan.startByType[type] = coords;
    });
    return plan;
}

// Registry: which zones have a planner (others still grow room by room).
const ZONE_PLANNERS = {
    "Town": planTownLayout
};

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
    // ── doors, locks and trespass ─────────────────────────────────
    {
        id: "locked-doors", tiers: ["common", "local", "trade"], zones: ["Town"], know: 75, rumor: false,
        topic: "locked doors in town",
        text: "People here lock what is theirs. Guest rooms at the inn open to a room token from the innkeeper, a barred back door lifts from the inside only, and a house with its shutters closed is not an invitation. Anyone can knock. Picking a lock in front of witnesses ends badly, and walking into someone's room uninvited ends worse.",
        distorted: "Every door in town is locked at night, and the guards will take you in for even trying one."
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

// ── PLACE LORE (building names) ──────────────────────────────────
// Every named building of a planned town becomes a few lore facts NPCs can
// share: where it is, what it does, and, for those who know, what is hidden
// in it. Built fresh from the room map on each lookup (so it always matches
// the town that actually exists, and nothing needs saving).
// Fact shape is the same as WORLD_LORE_FACTS plus `buildingId`: an NPC
// standing in that building knows its facts firsthand (see
// getNPCKnownLoreFacts in cyoaftw-npc-data.js).
function _placeWhere(entrance) {
    const rooms = typeof G !== "undefined" && G && G.roomMap ? G.roomMap : {};
    const parts = String(entrance.coords || "0,0").split(",").map(Number);
    const x = parts[0], y = parts[1];
    let gateX = null;
    Object.keys(rooms).forEach(function (key) {
        const r = rooms[key];
        if (r && r.type === "Gate" && r.zone === "Town") gateX = Number(key.split(",")[0]);
    });
    const side = y > 0 ? "north" : "south";
    let where;
    if (x === 0) where = "facing the Square on the " + side + " side of the main street";
    else if (gateX !== null && Math.abs(x - gateX) <= 3) where = "on the " + side + " side of the street, near the Gate";
    else where = "on the " + side + " side of the main street, " + (x < 0 ? "west" : "east") + " of the Square";
    return where;
}

function getPlaceLoreFacts() {
    const out = [];
    const rooms = typeof G !== "undefined" && G && G.roomMap ? G.roomMap : null;
    if (!rooms) return out;
    Object.keys(rooms).forEach(function (key) {
        const r = rooms[key];
        if (!r || !r.isEntrance || !r.buildingId || r.zone !== "Town") return;
        const id = r.buildingId;
        const type = r.buildingType;
        const name = r.buildingName || (type === "Town Hall" ? "the Town Hall" : null);
        if (!name) return;
        const where = _placeWhere(r);
        const base = { buildingId: id, zones: ["Town"] };

        if (type === "Tavern") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "trade"], know: 85, rumor: true, topic: name,
                text: name + " is the town's tavern, " + where + ". The taproom is its busy heart, the kitchen runs behind it, and deliveries come in by a barred back door onto the alley. The cellar below is older than the rest of the building.",
                distorted: name + " is where the town drinks, and the cellar is said to go down further than any cellar should."
            }));
            out.push(Object.assign({}, base, {
                id: "place-" + id + "-secret", tiers: ["secret", "deep"], know: 60, rumor: false, topic: "what lies beneath " + name,
                text: "Past " + name + "'s cellar a hidden hollow holds a small shrine someone keeps tidy, and behind a loose panel in the cellar wall worn stone steps lead down into the old works under the town.",
                distorted: "Folk say there is a way down from " + name + "'s cellar, and that something answers if you knock on the right stone."
            }));
        } else if (type === "Inn") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "trade"], know: 85, rumor: true, topic: name,
                text: name + " is an inn, " + where + ". The common room is downstairs and the guest rooms are upstairs, each behind its own door. The innkeeper sells a room token that opens one for the night. A room with someone already in it stays shut.",
                distorted: name + " is where travellers sleep, if the innkeeper likes the look of you."
            }));
        } else if (type === "Smithy") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "trade", "deep"], know: 80, rumor: true, topic: name,
                text: name + " is the town's forge, " + where + ". The smith works the open front, ore and ingots are stored behind it, and the yard door onto the alley is where deliveries come in.",
                distorted: name + " is where the town's blades come from, and the smith asks no questions."
            }));
            out.push(Object.assign({}, base, {
                id: "place-" + id + "-lift", tiers: ["deep", "trade"], zones: ["Town", "Underground City"], know: 55, rumor: true, topic: "the lift behind " + name,
                text: "In the storeroom behind " + name + " stands a dwarven cargo lift on thick chains. It is how ore comes up from the Underground City and steel goes down, and the dwarves below know its schedule better than the smith does.",
                distorted: "There is a way under the town through the smithy, and only dwarves are let use it."
            }));
        } else if (type === "Town Hall") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "military"], know: 80, rumor: false, topic: "the Town Hall",
                text: function (seed) {
                    const origin = seed && seed.townOrigin === "crown"
                        ? "It began as the Crown grain depot's counting house."
                        : "It began as the Free Banners' muster hall.";
                    return "The Town Hall stands " + where + ". " + origin + " The guards keep the front hall, the council sits in the chamber at the back, and the records office off the corridor is kept locked when the clerk is out. West of the corridor the council keeps a waygate in its own chamber, and it will carry anyone who can pay the fee to another town far from here.";
                },
                distorted: "The Town Hall is where the council meets, and the council answers to whoever pays the guards."
            }));
        } else if (type === "Guildhall") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "military", "trade"], know: 80, rumor: true, topic: name,
                text: name + " is the town's guildhall, " + where + ". The guildmaster holds court in the front hall beside the job board, recruits train in the yard behind it, and the guildmaster's office is kept locked when its owner is out.",
                distorted: name + " is where sellswords are hired, and the guildmaster takes a cut of everything."
            }));
        } else if (type === "Chapel") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "faith"], know: 85, rumor: true, topic: name,
                text: name + " is the town's chapel, " + where + ". The priest keeps the altar and the vestry behind it, prays with anyone who asks, and has never been known to turn a traveller from the door.",
                distorted: name + " is where folk go to ask forgiveness, and the priest hears more than most."
            }));
        }
    });
    return out;
}

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
    window.getPlaceLoreFacts = getPlaceLoreFacts;
    window.ensureWorldLore = ensureWorldLore;
    window.getWorldLoreFactText = getWorldLoreFactText;
    window.getWorldStanding = getWorldStanding;
    window.shiftWorldStanding = shiftWorldStanding;
}

// ── STARTING PAST: ARCHETYPES, BACKSTORY AND THE GUIDE ───────────
// Character creation asks "what brought you here?" (an archetype), one
// class-specific question about how the player learned their craft, and two
// questions that fill in the details of the archetype. The answers become a
// backstory (G.player.backstory, built by the engine's beginAdventure from
// buildPlayerBackstory below) and decide who the GUIDE is: an NPC who joins
// the player shortly after the adventure begins, opens the first
// conversation and points at a first lead. The leads are real lore facts
// (getBackstoryLoreFacts) so asking around actually turns something up.
//
// Everything here is plain data plus small pure helpers. The engine owns
// the UI (setup pages), the guide's spawn and the story hooks; the
// conversation entries live in cyoaftw-npc-data.js (ids "guide-*").
//
// SLOTS: each answer sets one or more named slots (home, wrong, craft ...).
// Backstory templates, guide lines and lore facts read them through
// {placeholders}, so every answer changes the wording the player sees later.

// How many random "approach" questions the personality page asks.
const APPROACH_QUESTION_COUNT = 4;

// Story turns the player gets to look around before the guide arrives.
const GUIDE_ARRIVAL_TURN = 1;

function _spFill(text, map) {
    return String(text == null ? "" : text).replace(/\{(\w+)\}/g, function (m, key) {
        const v = map && map[key];
        return (v === undefined || v === null || v === "") ? m : String(v);
    });
}

// ── CLASS CRAFT QUESTION: how did you learn what you do? ─────────
const CLASS_CRAFT_QUESTIONS = {
    Fighter: {
        prompt: "Where did you learn to fight?",
        options: [
            { label: "Militia drills back home", slot: { craft: "learned to fight in the militia drills back home" }, trait: "boldness" },
            { label: "A mercenary company that fell apart", slot: { craft: "carried a spear for a mercenary company until it broke up" }, trait: "boldness" },
            { label: "Taverns and alley scraps", slot: { craft: "learned to fight the hard way, in taverns and alley scraps" }, trait: "curiosity" },
            { label: "A veteran who saw something in me", slot: { craft: "were trained by an old veteran who saw something in you" }, trait: "empathy" }
        ]
    },
    Rogue: {
        prompt: "Where did you pick up your light fingers?",
        options: [
            { label: "Running errands for a street crew", slot: { craft: "grew up running errands for a street crew" }, trait: "boldness" },
            { label: "Touring with a troupe of players", slot: { craft: "toured with a troupe of players and picked up more than lines" }, trait: "empathy" },
            { label: "A locksmith's workshop", slot: { craft: "apprenticed under a locksmith and learned what every lock is hiding" }, trait: "curiosity" },
            { label: "Working off a family debt", slot: { craft: "worked off a family debt with quick fingers and a quicker exit" }, trait: "boldness" }
        ]
    },
    Cleric: {
        prompt: "What first turned you toward your faith?",
        options: [
            { label: "A vow I made as a child", slot: { craft: "swore a vow of service as a child and never took it back" }, trait: "empathy" },
            { label: "A stranger's deathbed", slot: { craft: "sat at a dying stranger's bedside and heard something you could not explain" }, trait: "curiosity" },
            { label: "Years on the pilgrim roads", slot: { craft: "walked the pilgrim roads until the road itself became your faith" }, trait: "curiosity" },
            { label: "A temple that took in foundlings", slot: { craft: "were raised in a temple that took in those nobody else wanted" }, trait: "empathy" }
        ]
    },
    Wizard: {
        prompt: "How did you come by your magic?",
        options: [
            { label: "A stolen primer and stubbornness", slot: { craft: "taught yourself from a stolen primer and a great deal of stubbornness" }, trait: "curiosity" },
            { label: "A failed apprenticeship", slot: { craft: "washed out of a respectable apprenticeship and kept everything you learned" }, trait: "boldness" },
            { label: "A wandering hedge-mage", slot: { craft: "were taken in by a wandering hedge-mage who never stayed anywhere long" }, trait: "curiosity" },
            { label: "A dangerous inheritance", slot: { craft: "inherited a trunk of somebody else's dangerous notes" }, trait: "boldness" }
        ]
    }
};

// ── APPROACH QUESTION POOL (random subset each new game) ─────────
// Same three traits as before (curiosity / empathy / boldness) - the
// conversation catalogue and deity judgment already read them - but a
// different handful of scenarios each time. Options per question may be 2-3.
const APPROACH_QUESTION_POOL = [
    { id: "new-place", prompt: "You step into a place you've never seen before. What draws you first?", options: [
        { text: "The layout, exits, and anything unusual", trait: "curiosity" },
        { text: "The people, and whether anyone seems worth approaching", trait: "empathy" },
        { text: "Who looks dangerous, and where I'd stand if it went wrong", trait: "boldness" } ] },
    { id: "troubled", prompt: "You notice someone nearby who looks troubled. What do you do?", options: [
        { text: "Check on them and offer help", trait: "empathy" },
        { text: "Stay back and watch before getting involved", trait: "boldness" },
        { text: "Find out what's troubling them, so I understand the situation", trait: "curiosity" } ] },
    { id: "strange-sound", prompt: "A strange sound comes from deeper inside. Your instinct is to:", options: [
        { text: "Go find out what made it", trait: "curiosity" },
        { text: "Leave it alone unless it becomes my problem", trait: "boldness" } ] },
    { id: "blocked", prompt: "Someone blocks your way and tests you. How do you respond?", options: [
        { text: "Hold your ground and push back", trait: "boldness" },
        { text: "Talk them down and keep things under control", trait: "empathy" } ] },
    { id: "found-purse", prompt: "You find a purse on the road with a name stitched inside. You:", options: [
        { text: "Track down the owner, whatever it takes", trait: "empathy" },
        { text: "Look through it carefully for what it can tell you", trait: "curiosity" },
        { text: "Keep it. The road is not a lost-and-found", trait: "boldness" } ] },
    { id: "locked-door", prompt: "A door is locked and nobody is watching. What goes through your mind?", options: [
        { text: "What could be behind it?", trait: "curiosity" },
        { text: "That someone must have a reason for the lock", trait: "empathy" },
        { text: "That a lock is only a suggestion", trait: "boldness" } ] },
    { id: "argument", prompt: "Two strangers are arguing loudly in the street. You:", options: [
        { text: "Step between them before it turns ugly", trait: "boldness" },
        { text: "Listen in. Arguments tell you a lot about a town", trait: "curiosity" },
        { text: "Ask one of them if they're alright afterward", trait: "empathy" } ] },
    { id: "offer", prompt: "A stranger offers you well-paid work and won't say what it is. You:", options: [
        { text: "Take it. Details can wait", trait: "boldness" },
        { text: "Ask questions until the story stops changing", trait: "curiosity" },
        { text: "Ask who else will be hurt if it goes wrong", trait: "empathy" } ] },
    { id: "ruin", prompt: "You pass a collapsed house with something glinting in the rubble. You:", options: [
        { text: "Climb in. Something that shiny won't wait", trait: "boldness" },
        { text: "Look for another way in that doesn't bring the roof down", trait: "curiosity" },
        { text: "Call out in case anyone is still inside", trait: "empathy" } ] },
    { id: "rumor", prompt: "You overhear a rumor that may or may not be true. You:", options: [
        { text: "Chase it down to see for myself", trait: "curiosity" },
        { text: "Think about who it might hurt before repeating it", trait: "empathy" },
        { text: "Use it, if it gets me an edge", trait: "boldness" } ] },
    { id: "wounded", prompt: "You come across an injured stranger on the road. You:", options: [
        { text: "Stop and tend to them", trait: "empathy" },
        { text: "Check whether this is a trap before approaching", trait: "boldness" },
        { text: "Ask what happened to them, because it may happen to me", trait: "curiosity" } ] },
    { id: "night-camp", prompt: "You are alone at a camp after dark and hear something moving outside the light. You:", options: [
        { text: "Draw steel and call out", trait: "boldness" },
        { text: "Douse the fire and listen", trait: "curiosity" },
        { text: "Leave food at the edge of the light, in case it only needs that", trait: "empathy" } ] }
];

// ── ARCHETYPES ───────────────────────────────────────────────────
// id            key stored on G.player.backstory.archetype
// label/blurb   shown on the setup page
// classFit      classes the choice is labelled "suits your class" for
// questions     two detail questions; option.slot merges into the slots
// build         (slots, ctx) -> backstory text; ctx = { name, cls, craft }
// goal          (slots) -> one line for the character sheet and story thread
// guide         who joins the player (see buildGuideSpec / the engine's
//               spawnGuideNPC): species pool, role, age, relation, persona,
//               opening line variants and three canned replies
// lead          { building, ... }: where the first lead points, and the lore
//               fact asking around will turn up (see getBackstoryLoreFacts)
// Placeholders available in guide lines and leads: {player} {class}
// {leadPlace} {mentorHint} {guideName} plus every slot.
const PLAYER_ARCHETYPES = {
    "coming-of-age": {
        label: "Coming of Age",
        blurb: "You have left home to make something of yourself, and someone has promised to see you started.",
        classFit: ["Fighter", "Rogue", "Wizard"],
        questions: [
            { prompt: "What did you leave behind?", options: [
                { label: "A farming village", slot: { home: "a farming village" }, trait: "empathy" },
                { label: "A family trade", slot: { home: "your family's trade" }, trait: "boldness" },
                { label: "A quiet monastery school", slot: { home: "a quiet monastery school" }, trait: "curiosity" },
                { label: "A fishing hamlet", slot: { home: "a fishing hamlet" }, trait: "boldness" } ] },
            { prompt: "Why leave now?", options: [
                { label: "To see the world before settling down", slot: { reason: "you wanted to see the world before the world settled you" }, trait: "curiosity" },
                { label: "There was no place left for me at home", slot: { reason: "there was no place left for you at home" }, trait: "boldness" },
                { label: "To prove myself to someone who doubted me", slot: { reason: "someone back home never believed you would amount to anything" }, trait: "boldness" },
                { label: "My teacher said I had outgrown the place", slot: { reason: "your teacher told you that you had outgrown the place" }, trait: "empathy" } ] }
        ],
        build: function (s, c) {
            return "You grew up in " + s.home + ", and you " + c.craft + ". You left because " + s.reason + ". " +
                "Now you have come to this town with a few coins and a promise: an old friend of the family swore to see you properly started.";
        },
        goal: function () { return "Find a teacher or a guild willing to take you on."; },
        guide: {
            relation: "an old friend of your family who promised to see you started",
            species: ["Human", "Dwarf", "Elf", "Halfling"], role: "Townsfolk", age: "middle-aged",
            persona: "A weathered, patient old friend of the player's family who has seen plenty of green youngsters come to this town and wants this one to land on their feet. Dry humor, gentle teasing, genuinely proud of the player.",
            opening: [
                "\"{player}! There you are. So, what do you make of this town? Ready to start your apprenticeship, or do you want a day to find your feet first?\"",
                "\"Found you at last. Well? What do you make of the place? Home must feel a long way off by now. Time we found you someone worth learning from.\"",
                "\"There's the face I promised your family I'd look after. So, {player}, what do you think of the town? Ready to meet some people who can teach you something?\""
            ],
            replies: [
                { label: "Say you're ready", say: "I'm ready. Where do we start?", stance: "friendly" },
                { label: "Admit it's a lot to take in", say: "Give me a moment. It's a lot to take in.", stance: "guarded" },
                { label: "Bristle at being looked after", say: "I don't need a minder.", stance: "hostile" }
            ]
        },
        lead: { building: "classMentor" }
    },

    "revenge": {
        label: "Revenge",
        blurb: "Someone took something from you. You have come to take it back, and you have a name to follow.",
        classFit: ["Fighter", "Rogue"],
        questions: [
            { prompt: "What was done to you?", options: [
                { label: "They burned my home", slot: { wrong: "burned your home to the ground" }, trait: "boldness" },
                { label: "They killed someone I loved", slot: { wrong: "killed someone you loved" }, trait: "empathy" },
                { label: "They betrayed me and left me for dead", slot: { wrong: "betrayed you and left you for dead" }, trait: "boldness" },
                { label: "They stole my family's name and land", slot: { wrong: "stole your family's name and land" }, trait: "curiosity" } ] },
            { prompt: "Who are you after?", options: [
                { label: "An agent of the Ashen Court", slot: { quarry: "the Ashen Court", quarryFaction: "crown" }, trait: "curiosity" },
                { label: "A captain of the Tattered Banners", slot: { quarry: "the Tattered Banners", quarryFaction: "banners" }, trait: "boldness" },
                { label: "Someone I once trusted", slot: { quarry: "the one who betrayed you", quarryFaction: "" }, trait: "empathy" },
                { label: "Someone whose face I never saw", slot: { quarry: "the one whose face you never saw", quarryFaction: "" }, trait: "curiosity" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ", and for a long time that was enough. Then came the worst day of your life, when someone " + s.wrong + ". " +
                "Since then you have followed one trail: that of " + s.quarry + ". It has led you here, and so has an old comrade who shares your grudge.";
        },
        goal: function (s) { return "Follow the trail of " + s.quarry + " and see justice done."; },
        guide: {
            relation: "an old comrade who shares your grudge",
            species: ["Human", "Dwarf", "Orc", "Halfling"], role: "Adventurer", age: "adult",
            persona: "A hard, quiet old comrade of the player's who shares the grudge and has been tracking the same trail. Speaks low and plainly, trusts few people, loyal without being soft about it.",
            opening: [
                "\"{player}. Keep your voice down. The trail of {quarry} had gone cold, and then a trace of it turned up at {leadPlace}. We ask around quietly, and we don't say who is asking.\"",
                "\"Over here. Don't stare. Last traces of {quarry} were seen at {leadPlace}. Let's ask around, nice and easy, and see who flinches.\"",
                "\"Good, you came. I've something. {quarry}, or someone who deals with them, passed through {leadPlace} not long ago. We start there, and we start quiet.\""
            ],
            replies: [
                { label: "Say you're with them", say: "Then we start there. Lead on.", stance: "friendly" },
                { label: "Ask what exactly they know", say: "How sure are you? I won't chase a rumor.", stance: "guarded" },
                { label: "Say you work alone", say: "I'll do this my way. Stay out of it.", stance: "hostile" }
            ]
        },
        lead: { building: { Fighter: "Guildhall", "default": "Inn" } }
    },

    "redemption": {
        label: "Redemption",
        blurb: "You did something you cannot undo. You have come here to start making up for it.",
        classFit: ["Cleric", "Fighter"],
        questions: [
            { prompt: "What do you carry?", options: [
                { label: "I left my comrades to die", slot: { sin: "left your comrades to die" }, trait: "boldness" },
                { label: "I stole from people who trusted me", slot: { sin: "stole from people who trusted you" }, trait: "curiosity" },
                { label: "I took a life I could have spared", slot: { sin: "took a life you could have spared" }, trait: "empathy" },
                { label: "I ran when I was needed", slot: { sin: "ran when you were needed most" }, trait: "boldness" } ] },
            { prompt: "What do you want now?", options: [
                { label: "To repay what I owe", slot: { penance: "you mean to repay what you owe, whatever it costs" }, trait: "empathy" },
                { label: "To make things right with the one I wronged", slot: { penance: "you mean to make things right with the one you wronged" }, trait: "empathy" },
                { label: "To earn a second chance", slot: { penance: "you mean to earn a second chance, one honest deed at a time" }, trait: "curiosity" },
                { label: "To be somebody I can stand to be", slot: { penance: "you mean to become someone you can stand to be" }, trait: "boldness" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ", but that is not what you are remembered for. You " + s.sin + ", and you have carried it ever since. " +
                "Now " + s.penance + ". Someone who knew you before the worst of it has offered to help you begin.";
        },
        goal: function () { return "Make amends, one honest deed at a time."; },
        guide: {
            relation: "someone who offered you a way to begin making amends",
            species: ["Human", "Dwarf", "Elf", "Halfling"], role: "Priest", age: "elderly",
            persona: "A calm, plainspoken priest who knew the player before the worst of it and chose to offer help anyway. Gentle but never flattering; believes in small deeds over grand gestures.",
            opening: [
                "\"{player}. You came. I was not certain you would. So, what do you make of this town? It is as good a place as any to begin setting things right. I would start with {leadPlace}.\"",
                "\"There you are. Walk with me a moment. What do you make of the town? Folk here remember a kindness a long time, and a harm longer. We should begin at {leadPlace}.\"",
                "\"I'm glad you stayed. No speeches, {player}. This town has people who need help and a shrine worth sitting in. Start at {leadPlace}, and we will see what you make of it.\""
            ],
            replies: [
                { label: "Thank them", say: "Thank you for not giving up on me. Where do I begin?", stance: "friendly" },
                { label: "Admit you don't deserve it", say: "I don't know that I deserve this.", stance: "guarded" },
                { label: "Snap that you didn't ask for pity", say: "I didn't ask for your pity.", stance: "hostile" }
            ]
        },
        lead: { building: "Chapel", shrine: true }
    },

    "missing-kin": {
        label: "Search",
        blurb: "Someone who matters to you vanished. Their last known trail leads to this town.",
        classFit: ["Rogue", "Wizard", "Cleric"],
        questions: [
            { prompt: "Who are you looking for?", options: [
                { label: "My younger sibling", slot: { who: "your younger sibling" }, trait: "empathy" },
                { label: "A parent", slot: { who: "your mother or father" }, trait: "empathy" },
                { label: "My oldest friend", slot: { who: "your oldest friend" }, trait: "curiosity" },
                { label: "My child", slot: { who: "your child" }, trait: "boldness" } ] },
            { prompt: "How did they go missing?", options: [
                { label: "They left to find work in town", slot: { lastSeen: "left for this town to find work and never wrote again" }, trait: "curiosity" },
                { label: "They were taken by sellswords", slot: { lastSeen: "were taken by sellswords on the road" }, trait: "boldness" },
                { label: "They vanished after a quarrel", slot: { lastSeen: "vanished after a bitter quarrel, and you never got to take it back" }, trait: "empathy" },
                { label: "They went to the old capital", slot: { lastSeen: "went to the ruined capital of Aldermere and did not come back" }, trait: "curiosity" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ", but your thoughts are always elsewhere. " + s.who.charAt(0).toUpperCase() + s.who.slice(1) + " " + s.lastSeen + ". " +
                "The last trail you could find points here, and a friend who also wants answers has come to help you follow it.";
        },
        goal: function (s) { return "Find out what happened to " + s.who + "."; },
        guide: {
            relation: "a friend who wants answers as badly as you do",
            species: ["Human", "Elf", "Halfling", "Dwarf"], role: "Townsfolk", age: "adult",
            persona: "A loyal, observant friend of the missing person who has been helping the player search. Practical, quick to notice small details, careful about raising hope too high.",
            opening: [
                "\"{player}, over here. So, what do you make of the place? Big enough that someone could vanish into it. The clerk at {leadPlace} keeps a ledger of who comes and goes. If {who} passed through, a name is in it.\"",
                "\"There you are. First impressions of the town? Mine is that it keeps records, and records are where we start. {leadPlace} should have something on arrivals.\"",
                "\"I've been walking the street all morning. It's smaller than I feared, and that's good news for us. Let's start at {leadPlace}. Someone there will have seen something.\""
            ],
            replies: [
                { label: "Say let's go", say: "Then let's go. I'm not stopping until I know.", stance: "friendly" },
                { label: "Admit you're afraid of the answer", say: "What if the answer is one I can't bear?", stance: "guarded" },
                { label: "Say you'd rather search alone", say: "I'd rather do this on my own.", stance: "hostile" }
            ]
        },
        lead: { building: "Town Hall" }
    },

    "fortune": {
        label: "Fortune",
        blurb: "You are in debt, or in need, or just hungry for more, and this town is where the coin is.",
        classFit: ["Rogue", "Wizard", "Fighter"],
        questions: [
            { prompt: "How did you end up needing coin?", options: [
                { label: "A moneylender called in my family's debt", slot: { need: "a moneylender called in your family's debt" }, trait: "boldness" },
                { label: "A venture of mine failed badly", slot: { need: "a venture of yours failed badly and took everything with it" }, trait: "curiosity" },
                { label: "I gambled it away", slot: { need: "you gambled away a good deal more than you owned" }, trait: "boldness" },
                { label: "I'm just tired of being poor", slot: { need: "you grew tired of being poor and decided to do something about it" }, trait: "empathy" } ] },
            { prompt: "What would count as winning?", options: [
                { label: "Paying off every debt", slot: { dream: "clear every debt you owe" }, trait: "empathy" },
                { label: "A house with a lock only I hold the key to", slot: { dream: "own a place with a lock only you hold the key to" }, trait: "boldness" },
                { label: "Enough to start my own business", slot: { dream: "have enough to start something of your own" }, trait: "curiosity" },
                { label: "More than anyone thinks I deserve", slot: { dream: "prove everyone wrong with more than they think you deserve" }, trait: "boldness" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ", and it was almost enough, until " + s.need + ". Now you want to " + s.dream + ". " +
                "A fellow chancer who got you into this, or out of the last mess, has come along to see how far it goes.";
        },
        goal: function (s) { return "Earn enough coin to " + s.dream + "."; },
        guide: {
            relation: "a fellow chancer who got you into this",
            species: ["Human", "Halfling", "Dwarf", "Elf"], role: "Adventurer", age: "adult",
            persona: "A charming, chancy partner in the player's schemes who talks fast, jokes through danger and has never once been honest about a price. Loyal in their own way.",
            opening: [
                "\"{player}! Well, here we are. So, what do you make of the place? More coin in this town than either of us has seen in a year, and I intend we meet some of it. Start at {leadPlace}. Somebody always pays for a quiet pair of hands.\"",
                "\"There you are. Don't look so grim. Look at the place, there's money in the walls. First stop, {leadPlace}. I hear someone's always hiring.\"",
                "\"Right. Town. Lots of people. Lots of purses. Not that I'd suggest anything. Let's ask around at {leadPlace} for honest work first, and see what turns up after.\""
            ],
            replies: [
                { label: "Grin and agree", say: "Honest work first. Then we see.", stance: "friendly" },
                { label: "Ask if you can trust them", say: "Last time you said that I nearly lost a hand.", stance: "guarded" },
                { label: "Say you'll take the lead", say: "I'll decide where we go. You follow.", stance: "hostile" }
            ]
        },
        lead: { building: { Rogue: "Tavern", "default": "Guildhall" } }
    },

    "exile": {
        label: "Exile",
        blurb: "You can't go home. You came here to disappear, and one person knows where to find you.",
        classFit: ["Rogue", "Fighter", "Cleric"],
        questions: [
            { prompt: "Why can't you go home?", options: [
                { label: "Accused of a crime I didn't commit", slot: { cause: "were accused of a crime you did not commit" }, trait: "empathy" },
                { label: "I refused an order I couldn't stomach", slot: { cause: "refused an order you could not stomach" }, trait: "boldness" },
                { label: "I was caught on the wrong side of a feud", slot: { cause: "were caught on the wrong side of a feud between people far above you" }, trait: "curiosity" },
                { label: "I was cast out for what I believe", slot: { cause: "were cast out for what you believe" }, trait: "boldness" } ] },
            { prompt: "Who might be looking for you?", options: [
                { label: "The Crown's magistrates", slot: { hunters: "the Crown's old magistrates" }, trait: "curiosity" },
                { label: "My former company", slot: { hunters: "your former company" }, trait: "boldness" },
                { label: "A powerful family", slot: { hunters: "a powerful family with long arms" }, trait: "curiosity" },
                { label: "Nobody, if I'm careful", slot: { hunters: "nobody, as long as you stay careful" }, trait: "empathy" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ", until you " + s.cause + ". You cannot go home, and " + s.hunters + " may come looking. " +
                "You came here to be nobody for a while, and one friend who vouched for you has followed to see you through.";
        },
        goal: function () { return "Lie low, and find a way to clear your name or start over."; },
        guide: {
            relation: "a friend who vouched for you when nobody else would",
            species: ["Human", "Elf", "Dwarf", "Halfling"], role: "Adventurer", age: "adult",
            persona: "A steady, protective friend who vouched for the player and has been quietly watching their back. Soft-spoken, always checking the room, never raises their voice.",
            opening: [
                "\"Easy, {player}. Nobody's followed us. So, what do you make of the place? Small enough to hide in, big enough that nobody looks twice. Use no real name where you can help it. {leadPlace} is a good place to start being nobody.\"",
                "\"Steady. Look at the room, not at me. This town asks few questions. We keep it that way. Start at {leadPlace} and keep your head down.\"",
                "\"There you are. Good. First impression of the town? Mine is that it's the sort of place that minds its business. Let's stay in {leadPlace} and watch who comes and goes.\""
            ],
            replies: [
                { label: "Thank them for the warning", say: "Thank you. I'll keep my head down.", stance: "friendly" },
                { label: "Ask whether it's safe", say: "How safe is it, really?", stance: "guarded" },
                { label: "Say you won't hide", say: "I'm done hiding. Let them come.", stance: "hostile" }
            ]
        },
        lead: { building: { Cleric: "Chapel", "default": "Inn" } }
    },

    "calling": {
        label: "Calling",
        blurb: "Something drew you here: a dream, a voice, a sign you can't explain. Someone knows what it means.",
        classFit: ["Cleric", "Wizard"],
        questions: [
            { prompt: "What was the sign?", options: [
                { label: "A dream that came three nights running", slot: { sign: "a dream that returned three nights running" }, trait: "curiosity" },
                { label: "A voice at a roadside shrine", slot: { sign: "a voice at a roadside shrine" }, trait: "empathy" },
                { label: "A dying stranger's last words", slot: { sign: "a dying stranger's last words" }, trait: "empathy" },
                { label: "A relic that came into my hands", slot: { sign: "a relic that came into your hands, unasked" }, trait: "curiosity" } ] },
            { prompt: "How do you feel about it?", options: [
                { label: "Afraid, but I'm going anyway", slot: { feeling: "afraid, and going anyway" }, trait: "boldness" },
                { label: "Certain. It feels like coming home", slot: { feeling: "certain, as if it were coming home" }, trait: "empathy" },
                { label: "Suspicious. I want proof", slot: { feeling: "suspicious, and wanting proof" }, trait: "curiosity" },
                { label: "Resentful. I didn't ask for this", slot: { feeling: "resentful, because you never asked for any of this" }, trait: "boldness" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ", and then came " + s.sign + ". You are " + s.feeling + ". " +
                "It led you to this town, where someone who understands such signs has agreed to help you read it.";
        },
        goal: function () { return "Find out what the sign that brought you here means."; },
        guide: {
            relation: "someone who understands the sign that drew you here",
            species: ["Human", "Elf", "Dwarf", "Halfling"], role: "Priest", age: "elderly",
            persona: "A quiet, unflappable old pilgrim who recognises the sign that drew the player and speaks of it without drama. Patient, amused by questions, never gives a straight answer when a story will do.",
            opening: [
                "\"{player}. You followed it all the way. So, what do you make of this town? Folk say an old shrine tied to {leadPlace} still answers. Come, we'll see whether it answers you.\"",
                "\"There. You can feel it too, can't you? Never mind the town, it's only the road you walked to get here. {leadPlace} is where I'd start.\"",
                "\"I wondered whether you would come. What did you see on the way? Walk with me to {leadPlace}. Some things are easier to understand where they began.\""
            ],
            replies: [
                { label: "Ask them to explain", say: "Then tell me what it means. Please.", stance: "friendly" },
                { label: "Admit you can still turn back", say: "I could still turn around. Couldn't I?", stance: "guarded" },
                { label: "Reject the idea of fate", say: "I don't believe in signs.", stance: "hostile" }
            ]
        },
        lead: { building: { Cleric: "Chapel", "default": "Tavern" }, shrine: true }
    }
};

// Which Town building a green character of each class would start looking
// for a teacher in (used by "coming-of-age"). Hints are per building type.
const CLASS_MENTOR_HINTS = {
    Fighter: { building: "Guildhall" },
    Rogue: { building: "Tavern" },
    Cleric: { building: "Chapel" },
    Wizard: { building: "Town Hall" }
};
const BUILDING_MENTOR_HINTS = {
    "Guildhall": "The guildmaster keeps a roll of recruits, and the training yard behind the hall is where they learn. Ask to speak to the guildmaster.",
    "Chapel": "The priest here takes in the faithful and the lost alike, and teaches those who show a true calling. Ask after the vestry's prayer books.",
    "Tavern": "The kind of people who teach a rogue drink in the taproom. Ask the bartender who is worth knowing.",
    "Town Hall": "The records office at the Town Hall is the nearest thing this town has to a library. Ask the clerk who here can teach.",
    "Inn": "Travellers pass through the inn with all sorts of skills. Ask the innkeeper who is worth learning from."
};
// If a town (an old save, say) has no such building, lead somewhere that does.
const LEAD_FALLBACKS = {
    "Chapel": ["Tavern", "Town Hall"],
    "Guildhall": ["Town Hall", "Tavern"]
};

// Generic wording when the world has no such building (a non-town start).
const GUIDE_FALLBACK_PLACE = "the nearest place where people gather";

function getArchetypeIdsForClass(cls) {
    const ids = Object.keys(PLAYER_ARCHETYPES);
    const fits = ids.filter(function (id) { return PLAYER_ARCHETYPES[id].classFit.indexOf(cls) >= 0; });
    const rest = ids.filter(function (id) { return fits.indexOf(id) < 0; });
    return fits.concat(rest);
}

function _spCap(text) {
    const t = String(text || "");
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// Finds a named building of the live Town ({ name, type, coords }), or null.
function findTownBuilding(type) {
    const rooms = typeof G !== "undefined" && G && G.roomMap ? G.roomMap : null;
    if (!rooms) return null;
    let found = null;
    Object.keys(rooms).forEach(function (key) {
        const r = rooms[key];
        if (found || !r || !r.isEntrance || !r.buildingId || r.buildingType !== type) return;
        found = {
            id: r.buildingId,
            type: type,
            coords: key,
            name: r.buildingName || (type === "Town Hall" ? "the Town Hall" : "the " + type.toLowerCase())
        };
    });
    return found;
}

// The place the first lead points at, resolved against the live world.
function _leadTypeFor(arch, cls) {
    let b = arch.lead ? arch.lead.building : null;
    if (b && typeof b === "object") b = b[cls] || b["default"];
    if (b === "classMentor") b = (CLASS_MENTOR_HINTS[cls] || CLASS_MENTOR_HINTS.Fighter).building;
    return b || "Tavern";
}

function resolveGuideLeadPlace(backstory) {
    const arch = backstory ? PLAYER_ARCHETYPES[backstory.archetype] : null;
    if (!arch) return null;
    let type = _leadTypeFor(arch, backstory.cls);
    let building = findTownBuilding(type);
    if (!building && LEAD_FALLBACKS[type]) {
        const fbs = LEAD_FALLBACKS[type];
        for (let i = 0; i < fbs.length && !building; i++) {
            building = findTownBuilding(fbs[i]);
            if (building) type = fbs[i];
        }
    }
    return { building: building, type: type, hint: BUILDING_MENTOR_HINTS[type] || "" };
}

// The fill map for guide lines and lore facts: slots + player + place.
function getBackstoryFillMap(backstory) {
    const slots = backstory && backstory.slots ? backstory.slots : {};
    const map = {};
    Object.keys(slots).forEach(function (k) { map[k] = slots[k]; });
    map.player = backstory && backstory.playerName ? backstory.playerName : "friend";
    map.class = backstory && backstory.cls ? String(backstory.cls).toLowerCase() : "adventurer";
    const lead = resolveGuideLeadPlace(backstory);
    map.leadPlace = lead && lead.building ? lead.building.name : GUIDE_FALLBACK_PLACE;
    map.mentorHint = lead && lead.hint ? lead.hint : "";
    map.guideName = backstory && backstory.guide && backstory.guide.name ? backstory.guide.name : "your guide";
    return map;
}

// choices = { archetype, cls, playerName, slots }; returns the object the
// engine stores on G.player.backstory (text is the template version; the
// engine may replace it with an AI-polished one and keeps this as `template`).
function buildPlayerBackstory(choices) {
    const arch = PLAYER_ARCHETYPES[choices.archetype];
    if (!arch) return null;
    const slots = Object.assign({}, choices.slots || {});
    const craft = slots.craft || "made your own way in the world";
    const template = arch.build(slots, { name: choices.playerName, cls: choices.cls, craft: craft });
    return {
        archetype: choices.archetype,
        label: arch.label,
        cls: choices.cls,
        playerName: choices.playerName,
        slots: slots,
        template: template,
        text: template,
        goal: arch.goal(slots),
        guide: { state: "pending" },
        version: 1
    };
}

// The guide's opening line for this backstory (one of the variants, stable per player).
function getGuideOpeningLine(backstory) {
    const arch = backstory ? PLAYER_ARCHETYPES[backstory.archetype] : null;
    if (!arch) return "";
    const variants = arch.guide.opening;
    let h = 0;
    const seed = String(backstory.playerName || "") + backstory.archetype;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
    return _spFill(variants[h % variants.length], getBackstoryFillMap(backstory));
}

// First-lead facts the world can answer. These join the lore pool (see
// getNPCKnownLoreFacts in cyoaftw-npc-data.js), so asking around at the
// named building turns up exactly what the guide hinted at.
function getBackstoryLoreFacts() {
    const bs = typeof G !== "undefined" && G && G.player ? G.player.backstory : null;
    const arch = bs ? PLAYER_ARCHETYPES[bs.archetype] : null;
    if (!arch) return [];
    const lead = resolveGuideLeadPlace(bs);
    if (!lead || !lead.building) return [];
    const map = getBackstoryFillMap(bs);
    const place = lead.building.name;
    const base = { buildingId: lead.building.id, zones: ["Town"], know: 85, rumor: true, backstoryLead: true };
    const out = [];
    const id = "lead-" + bs.archetype;
    const common = ["local", "trade"];
    const type = lead.type;
    const isChapel = type === "Chapel";
    const isGuild = type === "Guildhall";
    if (bs.archetype === "coming-of-age") {
        out.push(Object.assign({}, base, { id: id, tiers: common, topic: "finding a teacher",
            text: place + " is where a green " + map.class + " is most likely to find somebody willing to teach. " + lead.hint,
            distorted: "Folk say you can find a teacher at " + place + ", if the teacher likes your face." }));
    } else if (bs.archetype === "revenge") {
        const trace = bs.slots.quarryFaction === "crown" ? "a quiet man in Crown grey who paid in old coin"
            : bs.slots.quarryFaction === "banners" ? "a scarred sellsword with a faded Banner patch under his cloak"
            : "a stranger who gave no name and watched the door the whole evening";
        if (isGuild) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "a stranger at " + place,
                text: "Some time ago " + trace + " came to " + place + ", asked the guildmaster who had taken contracts in this town before the war, and left before dawn. Nobody saw which road.",
                distorted: "A stranger asked about old contracts at " + place + " and left in a hurry. Folk say he was hiring, or hunting." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "a stranger at " + place,
                text: "Some time ago " + trace + " took a room at " + place + ", asked who still lived in the town from before the war, and left before dawn. Nobody saw which road.",
                distorted: "A stranger stayed at " + place + " and left in a hurry. Folk say he was running from something, or toward it." }));
        }
    } else if (bs.archetype === "redemption") {
        if (isChapel) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "the altar at " + place,
                text: "The priest at " + place + " asks nothing of those who kneel at the altar. Folk go there when they have something to answer for, and most walk out lighter.",
                distorted: "There is a chapel where people go to confess. Nobody talks about what they say." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "the shrine below " + place,
                text: "The shrine below " + place + " is kept clean by someone who asks for nothing. Folk go down there when they have something to answer for, and most come back lighter.",
                distorted: "There is a shrine under " + place + " where people go to confess. Nobody talks about what they say." }));
        }
    } else if (bs.archetype === "missing-kin") {
        out.push(Object.assign({}, base, { id: id, tiers: ["local", "military"], topic: "the arrivals ledger",
            text: "The clerk at " + place + " keeps a ledger of who comes through the town. Anyone looking for someone who passed this way should ask there, politely, and the clerk usually has more patience than coin.",
            distorted: "Someone at " + place + " writes down everyone who comes and goes, if you can get past the guards." }));
    } else if (bs.archetype === "fortune") {
        if (isGuild) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "who is hiring",
                text: "The job board at " + place + " is where this town's contracts end up: escorts, bounties, a little quiet work. The guildmaster knows which ones pay and which ones get people killed.",
                distorted: "There is always work on the board at " + place + " for anyone who doesn't ask what it is." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "who is hiring",
                text: "Anyone in this town who wants a job done quietly ends up at " + place + ". The bartender knows who is hiring and what they are willing to pay.",
                distorted: "There is always work at " + place + " for anyone who doesn't ask what it is." }));
        }
    } else if (bs.archetype === "exile") {
        if (isChapel) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "keeping quiet in town",
                text: "The priest at " + place + " takes in anyone who comes to the altar and never asks a penitent's name. Strangers who keep their heads down there are left alone.",
                distorted: "They say " + place + " shelters anyone who kneels, and forgets every face." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "keeping quiet in town",
                text: "Strangers who keep their heads down at " + place + " are left alone, and the people who run it are used to not asking where a guest comes from.",
                distorted: "They say " + place + " takes in anyone who can pay and doesn't remember anyone's face." }));
        }
    } else if (bs.archetype === "calling") {
        if (isChapel) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "the altar at " + place,
                text: "The altar at " + place + " is older than the chapel built around it, and some say it answers those who come with a real question.",
                distorted: "Something at the altar of " + place + " answers questions, if the questioner is willing to hear the answer." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "the old shrine below " + place,
                text: "Below " + place + " is a shrine older than the building, and some say it answers those who come with a real question.",
                distorted: "Something below " + place + " answers questions, if the questioner is willing to hear the answer." }));
        }
    }
    out.forEach(function (f) { f.text = _spCap(f.text); });
    return out;
}

// The concrete first step the guide suggests (used by the "Ask what to do
// first" conversation option and the guide's prompt line).
// A string, or an object keyed by lead building type with a "default".
const ARCHETYPE_PLAN_TEXT = {
    "coming-of-age": "Go to {leadPlace} and ask after a teacher or a guild willing to take you on. {mentorHint}",
    "revenge": {
        "default": "Ask around at {leadPlace}, starting with whoever keeps the place, and keep quiet about who is asking. Someone tied to {quarry} was seen there not long ago.",
        "Guildhall": "Ask the guildmaster at {leadPlace} who has been hiring, and keep quiet about who is asking. Someone tied to {quarry} was seen there not long ago."
    },
    "redemption": {
        "default": "Go down to the shrine below {leadPlace} and sit with it, then ask around town who could use an honest hand.",
        "Chapel": "Go to {leadPlace}, speak with the priest and kneel at the altar, then ask around town who could use an honest hand."
    },
    "missing-kin": "Ask the clerk at {leadPlace} to look through the arrivals ledger for {who}.",
    "fortune": {
        "default": "Ask the bartender at {leadPlace} who is hiring, and take the first honest job that pays.",
        "Guildhall": "Read the job board at {leadPlace}, ask the guildmaster which contracts pay, and take the first honest one."
    },
    "exile": {
        "default": "Keep to {leadPlace}, give no true name, and listen for anyone asking after you.",
        "Chapel": "Keep to {leadPlace}, where nobody asks a penitent's name, and listen for anyone asking after you."
    },
    "calling": {
        "default": "Go down to the old shrine below {leadPlace} and see whether it answers you.",
        "Chapel": "Go to {leadPlace}, kneel at the altar and see whether it answers you."
    }
};

function getGuidePlanText(backstory) {
    if (!backstory) return "";
    const leadStage = backstory.guide && backstory.guide.leadStage ? backstory.guide.leadStage : 0;
    if (leadStage >= 1 && typeof getLeadStage === "function") {
        const st = getLeadStage(backstory, 1);
        if (leadStage >= 2) return st ? st.done : "";
        if (st) return "Next, go to " + st.place + " and " + st.ask.charAt(0).toLowerCase() + st.ask.slice(1) + ".";
    }
    let tpl = ARCHETYPE_PLAN_TEXT[backstory.archetype] || "";
    if (tpl && typeof tpl === "object") {
        const lead = resolveGuideLeadPlace(backstory);
        tpl = (lead && tpl[lead.type]) || tpl["default"] || "";
    }
    return _spFill(tpl, getBackstoryFillMap(backstory)).replace(/\s+/g, " ").trim();
}

// The guide asks whether to join the player's party, once, right after the
// first step is laid out (see maybeOfferGuideParty in the engine). Lines are
// scripted so the question is always asked the same clear way; the menu keeps
// an "Ask them to come along" option afterwards for anyone who said no.
const GUIDE_PARTY_OFFERS = {
    "coming-of-age": "One more thing, {player}. I would not feel right watching you start out alone. Would you like me to come along, at least until you find your feet?",
    "revenge": "I am not going to pretend I can stay out of this, {player}. Would you like me to travel with you? Two of us ask better questions than one.",
    "redemption": "You do not have to carry this alone, {player}. Would you like me to join you? I will walk beside you as far as you let me.",
    "missing-kin": "We are looking for the same person, {player}. Shall I come with you? I would rather we turned up the answer together.",
    "fortune": "A good job goes better with a second pair of eyes, {player}. Shall I join you, and split whatever we find?",
    "exile": "You have been alone long enough, {player}. Would you like me to come with you? I know how to keep my mouth shut.",
    "calling": "Whatever has been calling you, {player}, I would like to see where it leads. May I come with you?"
};
const GUIDE_PARTY_REPLIES = [
    { label: "Yes, come with me", say: "Yes. Come with me.", stance: "friendly", guideParty: "accept" },
    { label: "Not just yet", say: "Not yet. Let me look around first.", stance: "guarded", guideParty: "later" },
    { label: "I'll go alone for now", say: "I'd rather go on my own for now.", stance: "guarded", guideParty: "decline" }
];
const GUIDE_PARTY_RESPONSES = {
    accept: "\"Good. Lead on, {player}. I'll be right behind you.\"",
    later: "\"Take your time. Say the word whenever you want me with you.\"",
    decline: "\"I understand. I'll wait here, and if you change your mind, you know where to find me.\"",
    leave: "\"Alright. I'll stay here and keep my ears open. Come back for me when you need me.\""
};

// { line, replies } for the party offer, or null when the archetype has none.
function getGuidePartyOffer(backstory) {
    if (!backstory) return null;
    const tpl = GUIDE_PARTY_OFFERS[backstory.archetype];
    if (!tpl) return null;
    const map = getBackstoryFillMap(backstory);
    return {
        line: _spFill(tpl, map),
        replies: GUIDE_PARTY_REPLIES.map(function (r) { return Object.assign({}, r); })
    };
}

function getGuidePartyResponse(backstory, kind) {
    const tpl = GUIDE_PARTY_RESPONSES[kind] || "";
    return _spFill(tpl, getBackstoryFillMap(backstory));
}

// ── LEAD STAGES ──────────────────────────────────────────────────
// The guide's first lead is stage 0 (the building in arch.lead). Asking the
// right question of someone there pays it off (see "lead-stage-ask" in
// cyoaftw-npc-data.js and onGuideBeat "lead" in the engine) and opens stage 1,
// a second building; paying that off completes the opening arc and points the
// player out of town. G.player.backstory.guide.leadStage counts payoffs (0-2).
// ask = the menu label, reveal = what the NPC is told to say, done = the story
// line recorded. Only {leadPlace}, {who}, {quarry}, {class} are filled.
const ARCHETYPE_LEADS = {
    "coming-of-age": [
        { ask: "Ask who could teach you",
          reveal: "The player is a green {class} looking for a teacher. Tell them plainly that people here take on newcomers who show grit, and that a real start begins with honest tools: the smith is who to see about a first proper kit. Name only the smith as the next stop.",
          done: "{leadPlace} will take you on, but first you need a proper kit. Try the smith." },
        { building: "Smithy", ask: "Ask about a first proper kit",
          reveal: "Size up the newcomer honestly. A first kit matters less than what they do with it. Apprentices prove themselves on the old road past the Gate, or in the cellar below the tavern where the way down begins. Wish them luck. Do not invent names.",
          done: "Your apprenticeship begins in earnest: the old road past the Gate, or the way down under the tavern." }
    ],
    "revenge": [
        { ask: "Ask about the stranger",
          reveal: "Quietly confirm that someone matching the trail of {quarry} was here not long ago, asked who in town could mend a blade, and left toward the Gate. Say no more than that. Do not invent names.",
          done: "The trail was here, and went looking for a smith." },
        { building: "Smithy", ask: "Ask whom they mended a blade for",
          reveal: "You mended a blade for a stranger tied to {quarry}. Describe them briefly, say they paid in old coin and asked the way to the old road beyond the Gate. Do not invent a name.",
          done: "The trail leads out of the Gate and onto the old road." }
    ],
    "redemption": [
        { ask: "Ask for guidance",
          reveal: "Be gentle. Tell the player that amends are made in deeds, not words, and that the watch at the Town Hall never has enough honest hands. Name only the Town Hall as the next stop.",
          done: "Amends are made in deeds. The Town Hall always needs honest hands." },
        { building: "Town Hall", ask: "Ask about honest work",
          reveal: "The player seeks honest work to make amends. Tell them the watch has patrols that never come back from the old road beyond the Gate, and that someone willing to scout it and return would be thanked. Do not invent names.",
          done: "A task worth doing: scout the old road beyond the Gate and come back." }
    ],
    "missing-kin": [
        { ask: "Ask about the ledger",
          reveal: "Say the arrivals ledger does show {who}, or someone answering to them, passing through not long ago; they asked for a bed at the inn. Do not invent other details or names.",
          done: "The ledger shows {who} passed through and asked for a bed at the inn." },
        { building: "Inn", ask: "Ask about {who}",
          reveal: "Say someone answering to {who} stayed one night, paid for a second they never used, and left before dawn by the Gate toward the old road. Do not invent other names.",
          done: "{who} went out by the Gate toward the old road." }
    ],
    "fortune": [
        { ask: "Ask who is hiring",
          reveal: "Say there is steady work, and that the best standing job in town is the smith's commission board. Name only the smith as the next stop.",
          done: "Steady work and coin: the smith's commission board is the place." },
        { building: "Smithy", ask: "Ask about work",
          reveal: "Tell the player the smith posts commissions on the board in the forge and pays fairly for ore and honest deliveries, and that the real money is out past the Gate where ore is scavenged, or down below the tavern. Do not invent names.",
          done: "Work and coin wait out past the Gate, and below the tavern." }
    ],
    "exile": [
        { ask: "Ask who has been asking questions",
          reveal: "Say, quietly, that someone has been asking after a stranger answering the player's description, and that you told them nothing. Advise talking to the bartender, who hears everything. Name only the tavern as the next stop.",
          done: "Someone has been asking after you. The tavern hears everything." },
        { building: "Tavern", ask: "Ask what people are saying",
          reveal: "Say the person asking left town by the Gate after being told nothing, and that the road out is where trouble waits; staying put is safer for now. Do not invent names.",
          done: "Whoever was asking has gone out the Gate. You can hide here, or go after them." }
    ],
    "calling": [
        { ask: "Ask about the shrine",
          reveal: "Say the shrine answers those who listen, and lately it has been restless. Those who keep it say the old way beneath the tavern's cellar leads down to where it began. Do not invent names.",
          done: "The shrine has been restless. The old way down, under the tavern, is where it began." },
        { building: { Cleric: "Tavern", "default": "Chapel" }, ask: "Ask what the shrine has said",
          reveal: "Say others have heard the same call. It points downward, to the old works under the town, reached through the cellar below the tavern. Do not invent names.",
          done: "The calling points down, to the way below the tavern's cellar." }
    ]
};

const GUIDE_LEAD_ARRIVE_LINES = [
    "This is the place, {player}. Ask quietly, and let's see who here will talk.",
    "Here, then. Same as before: ask quietly, and watch how they answer."
];
const LEAD_STAGE_FALLBACK_TYPES = ["Inn", "Smithy", "Tavern", "Town Hall"];

// idx 0 = first lead, 1 = second. Returns { idx, type, building, place,
// ask, reveal, done } resolved against the live town, or null.
function getLeadStage(backstory, idx) {
    const arch = backstory ? PLAYER_ARCHETYPES[backstory.archetype] : null;
    const list = arch ? ARCHETYPE_LEADS[backstory.archetype] : null;
    const data = list ? list[idx] : null;
    if (!data) return null;
    const first = resolveGuideLeadPlace(backstory);
    let type, building;
    if (idx === 0) {
        type = first.type;
        building = first.building;
    } else {
        let spec = data.building;
        if (spec && typeof spec === "object") spec = spec[backstory.cls] || spec["default"];
        type = spec;
        building = findTownBuilding(type);
        const firstId = first && first.building ? first.building.id : null;
        if (!building || building.id === firstId) {
            building = null;
            for (let i = 0; i < LEAD_STAGE_FALLBACK_TYPES.length && !building; i++) {
                const b = findTownBuilding(LEAD_STAGE_FALLBACK_TYPES[i]);
                if (b && b.id !== firstId) { building = b; type = LEAD_STAGE_FALLBACK_TYPES[i]; }
            }
        }
    }
    const map = getBackstoryFillMap(backstory);
    map.leadPlace = building ? building.name : GUIDE_FALLBACK_PLACE;
    return {
        idx: idx,
        type: type,
        building: building,
        place: map.leadPlace,
        ask: _spFill(data.ask, map),
        reveal: _spFill(data.reveal, map),
        done: _spCap(_spFill(data.done, map))
    };
}

// The stage the player is working on now (0 or 1), or null once both are done.
function getCurrentLeadStage(backstory) {
    if (!backstory || !backstory.guide) return null;
    const n = backstory.guide.leadStage || 0;
    return n >= 2 ? null : getLeadStage(backstory, n);
}

// What the guide says on entering a place (once per place type per game),
// only while travelling with the player. {player} is filled.
const GUIDE_ROOM_REMARKS = {
    "Chapel": ["Quiet in here. Whatever else happens, this is a good place to think.", "Chapels are never quite empty, are they? Someone always seems to be listening."],
    "Guildhall": ["Listen to that yard. Hard to tell whether to be impressed or nervous.", "Plenty of steel in here, and every one of them is sizing you up."],
    "Smithy": ["Smell that? Hot iron and honest work. The kind of place that tells you a lot about a town.", "A forge keeps a town honest. Folk who can mend a blade hear everything."],
    "Tavern": ["Every town's real news is poured in a place like this, {player}. Keep your ears open.", "If anyone in town talks too much, it will be here."],
    "Inn": ["Travellers pass through here from all over. Somebody has always seen something worth knowing."],
    "Town Hall": ["The watch keeps its eye on the door. Be polite, and be ready to be looked over."],
    "Training Yard": ["Straw dummies and bruised pride. I like it already."],
    "Council Chamber": ["Careful now. Rooms like this are where decisions get made about people like us."],
    "Gate": ["Beyond that is everything we do not know yet. Stay close, {player}."],
    "Cellar": ["Cold air, old stone. This cellar goes down further than it should, I think."]
};

function getGuideRoomRemark(room, seedText) {
    if (!room) return null;
    const key = GUIDE_ROOM_REMARKS[room.buildingType] && room.isEntrance ? room.buildingType : (GUIDE_ROOM_REMARKS[room.type] ? room.type : null);
    if (!key) return null;
    const lines = GUIDE_ROOM_REMARKS[key];
    let h = 0;
    const seed = String(seedText || "") + key;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
    return { key: key, line: lines[h % lines.length] };
}

// Real building names for the guide to talk about when asked about the town.
function getGuideTownSummary() {
    const names = [];
    ["Tavern", "Inn", "Smithy", "Town Hall", "Guildhall", "Chapel"].forEach(function (type) {
        const b = findTownBuilding(type);
        if (b) names.push(b.name + " (" + type.toLowerCase() + ")");
    });
    return names.join(", ");
}

if (typeof window !== "undefined") {
    window.PLAYER_ARCHETYPES = PLAYER_ARCHETYPES;
    window.CLASS_CRAFT_QUESTIONS = CLASS_CRAFT_QUESTIONS;
    window.APPROACH_QUESTION_POOL = APPROACH_QUESTION_POOL;
    window.APPROACH_QUESTION_COUNT = APPROACH_QUESTION_COUNT;
    window.GUIDE_ARRIVAL_TURN = GUIDE_ARRIVAL_TURN;
    window.getArchetypeIdsForClass = getArchetypeIdsForClass;
    window.buildPlayerBackstory = buildPlayerBackstory;
    window.getBackstoryFillMap = getBackstoryFillMap;
    window.getGuideOpeningLine = getGuideOpeningLine;
    window.getBackstoryLoreFacts = getBackstoryLoreFacts;
    window.resolveGuideLeadPlace = resolveGuideLeadPlace;
    window.getGuidePlanText = getGuidePlanText;
    window.getLeadStage = getLeadStage;
    window.getCurrentLeadStage = getCurrentLeadStage;
    window.getGuideRoomRemark = getGuideRoomRemark;
    window.GUIDE_LEAD_ARRIVE_LINES = GUIDE_LEAD_ARRIVE_LINES;
    window.getGuidePartyOffer = getGuidePartyOffer;
    window.getGuidePartyResponse = getGuidePartyResponse;
    window.getGuideTownSummary = getGuideTownSummary;
    window.findTownBuilding = findTownBuilding;
}
