// ── ZONE TEMPLATES ───────────────────────────────────────────────

const ZONE_TEMPLATES = [
    {
        name: "Town",
        hostileArea: false,
        ambiance: "The sounds of daily life fill the air. People go about their business.",
        roomTypes: ["Tavern", "Inn", "Street", "Alleyway", "Square", "Avenue", "Gate"],
        allowedSpecies: ["Human", "Elf", "Dwarf", "Halfling"],
        lightLevel: "bright",
        defaultDanger: "safe"
    },
    {
        name: "Dungeon",
        hostileArea: true,
        ambiance: "The air is cold and stale. Distant sounds echo from unseen passages.",
        roomTypes: ["Chamber", "Corridor", "Passage", "Vault", "Trap", "Tunnel"],
        allowedSpecies: ["Goblin", "Orc", "Skeleton", "Rat"],
        lightLevel: "dark",
        defaultDanger: "hostile"
    },
    {
        name: "Ruins",
        hostileArea: true,
        ambiance: "Crumbling stone and silence. Whatever once thrived here is long gone.",
        roomTypes: ["Hallway", "Altar", "Library", "Tower", "Shrine"],
        allowedSpecies: ["Skeleton", "Ghost", "Goblin"],
        lightLevel: "dim",
        defaultDanger: "hostile"
    },
    {
        name: "Underground City",
        hostileArea: false,
        ambiance: "Torchlight flickers across ancient stone. A civilization lives below the world.",
        roomTypes: ["Cavern", "Vault", "Underground Hallway", "Underground Gate"],
        allowedSpecies: ["Dwarf", "Goblin", "Human"],
        lightLevel: "dim",
        defaultDanger: "tense"
    }
];

// ── SPECIES TEMPLATES ───────────────────────────────────────────

const SPECIES_TEMPLATES = [
    {
        species: "Human",
        isHumanoid: true,
        size: "medium",
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
        size: "small",
        speechStyle: "clipped",
        lore: "Goblin bands prize cunning, salvage, and status earned by surviving bad odds. They often test strangers before trusting them.",
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
        size: "large",
        speechStyle: "direct",
        lore: "Orcs respect strength, directness, and loyalty proven under pressure. Insults are remembered, but so is courage.",
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
        size: "medium",
        speechStyle: "broken",
        lore: "Animated skeletons retain fragments of purpose rather than full lives. They respond to command, trespass, and ritual disturbance.",
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
        size: "tiny",
        speechStyle: "broken",
        lore: "Rats follow food, warmth, and danger-scent. A lone rat is usually a sign that a larger hidden ecology is nearby.",
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
        size: "medium",
        speechStyle: "whisper",
        lore: "Ghosts are memory given shape. They notice names, unfinished business, and places where the living have repeated old mistakes.",
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
            { id: "chest",        name: "chest",            tags: ["storage", "loot"] }
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
    "Underground Gate": "https://iili.io/qFXzdxf.jpg"
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
