// Static reference data shared by every character. Nothing here is per-character state.

export const ABILITIES = [
  { key: 'str', label: 'Strength', short: 'STR' },
  { key: 'dex', label: 'Dexterity', short: 'DEX' },
  { key: 'con', label: 'Constitution', short: 'CON' },
  { key: 'int', label: 'Intelligence', short: 'INT' },
  { key: 'wis', label: 'Wisdom', short: 'WIS' },
  { key: 'cha', label: 'Charisma', short: 'CHA' },
]

export const SKILLS = [
  { key: 'acrobatics', label: 'Acrobatics', ability: 'dex' },
  { key: 'animalHandling', label: 'Animal Handling', ability: 'wis' },
  { key: 'arcana', label: 'Arcana', ability: 'int' },
  { key: 'athletics', label: 'Athletics', ability: 'str' },
  { key: 'deception', label: 'Deception', ability: 'cha' },
  { key: 'history', label: 'History', ability: 'int' },
  { key: 'insight', label: 'Insight', ability: 'wis' },
  { key: 'intimidation', label: 'Intimidation', ability: 'cha' },
  { key: 'investigation', label: 'Investigation', ability: 'int' },
  { key: 'medicine', label: 'Medicine', ability: 'wis' },
  { key: 'nature', label: 'Nature', ability: 'int' },
  { key: 'perception', label: 'Perception', ability: 'wis' },
  { key: 'performance', label: 'Performance', ability: 'cha' },
  { key: 'persuasion', label: 'Persuasion', ability: 'cha' },
  { key: 'religion', label: 'Religion', ability: 'int' },
  { key: 'sleightOfHand', label: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth', label: 'Stealth', ability: 'dex' },
  { key: 'survival', label: 'Survival', ability: 'wis' },
]

// House rule: unarmed strikes deal base damage by size, IN ADDITION to the STR modifier.
export const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']

export const SIZE_UNARMED = {
  Tiny: { base: 0, label: '0' },
  Small: { base: 1, label: '1' },
  Medium: { base: 1, label: '1-2' },
  Large: { base: 3, label: '3' },
  Huge: { base: 4, label: '4' },
  Gargantuan: { base: 5, label: '5' },
}

// Standard 5e XP table multiplied by FIVE (house rule 6). Index = level - 1.
export const XP_THRESHOLDS = [
  0, 1500, 4500, 13500, 32500, 70000, 115000, 170000, 240000, 320000,
  425000, 500000, 600000, 700000, 825000, 975000, 1125000, 1325000, 1525000, 1775000,
]

export const COINS_PER_POUND = 50

export const COIN_TYPES = [
  { key: 'pp', label: 'Platinum', short: 'pp' },
  { key: 'gp', label: 'Gold', short: 'gp' },
  { key: 'ep', label: 'Electrum', short: 'ep' },
  { key: 'sp', label: 'Silver', short: 'sp' },
  { key: 'cp', label: 'Copper', short: 'cp' },
]

// Locations flagged `carried: false` stay on the sheet but do not count toward weight.
export const CARRY_LOCATIONS = [
  { key: 'worn', label: 'Worn', carried: true },
  { key: 'inHand', label: 'In hand', carried: true },
  { key: 'backpack', label: 'Backpack', carried: true },
  { key: 'beltPouch', label: 'Belt pouch', carried: true },
  { key: 'camp', label: 'Camp', carried: false },
  { key: 'mule', label: 'Mule', carried: false },
  { key: 'cart', label: 'Cart', carried: false },
]

export const carryLocation = (key) =>
  CARRY_LOCATIONS.find((l) => l.key === key) ?? CARRY_LOCATIONS[2]

export const isCarried = (key) => carryLocation(key).carried

/**
 * Armour worn or held drives the auto AC. `maxDex` is how much DEX the armour
 * lets through: null = all of it, 0 = none. `body` marks the ones that replace
 * the base 10 (shields stack on top instead).
 */
export const ARMOUR_KINDS = [
  { key: 'none', label: '—', body: false, maxDex: null, defaultAC: 0 },
  { key: 'light', label: 'Light', body: true, maxDex: null, defaultAC: 11 },
  { key: 'medium', label: 'Medium', body: true, maxDex: 2, defaultAC: 14 },
  { key: 'heavy', label: 'Heavy', body: true, maxDex: 0, defaultAC: 16 },
  { key: 'shield', label: 'Shield', body: false, maxDex: null, defaultAC: 2 },
]

export const armourKind = (key) =>
  ARMOUR_KINDS.find((a) => a.key === key) ?? ARMOUR_KINDS[0]

export const RESET_CONDITIONS = [
  { key: 'long', label: 'Long rest' },
  { key: 'short', label: 'Short rest' },
  { key: 'other', label: 'Other' },
]

// Offered as one-click adds in the consumables tracker.
export const CONSUMABLE_PRESETS = [
  { name: 'Torches', unitWeight: 1, qty: 10, location: 'backpack' },
  { name: 'Arrows', unitWeight: 0.05, qty: 20, location: 'worn' },
  { name: 'Rations (days)', unitWeight: 2, qty: 10, location: 'backpack' },
  { name: 'Oil (flask)', unitWeight: 1, qty: 2, location: 'backpack' },
  { name: "Healer's kit", unitWeight: 3, qty: 1, location: 'backpack' },
  { name: 'Waterskin', unitWeight: 5, qty: 1, location: 'backpack' },
  { name: 'Spell components', unitWeight: 0, qty: 1, location: 'belt pouch' },
]

// Substring matches used to spot light sources and healer's kits in the inventory.
export const LIGHT_SOURCE_TERMS = ['torch', 'lantern', 'candle', 'lamp', 'oil']
export const HEALERS_KIT_TERMS = ["healer's kit", 'healers kit', 'healing kit']

export const DAMAGE_TYPES = [
  'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning', 'thunder',
  'acid', 'poison', 'necrotic', 'radiant', 'force', 'psychic',
]
