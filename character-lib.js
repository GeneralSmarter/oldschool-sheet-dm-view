import {
  ABILITIES,
  SKILLS,
  SIZE_UNARMED,
  XP_THRESHOLDS,
  COINS_PER_POUND,
  COIN_TYPES,
  ARMOUR_KINDS,
  armourKind,
  isCarried,
  LIGHT_SOURCE_TERMS,
  HEALERS_KIT_TERMS,
} from './game-data.js?v=1788672202888'

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`

// Weights are floats; keep them from drifting into 171.19999999999999.
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

export const num = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** An override wins whenever it is not null/undefined/''. */
export const resolve = (auto, override) =>
  override === null || override === undefined || override === '' ? auto : num(override, auto)

export const isOverridden = (override) =>
  override !== null && override !== undefined && override !== ''

export const signed = (n) => (n >= 0 ? `+${n}` : `${n}`)

// --------------------------------------------------------------------------
// Character template & normalisation
// --------------------------------------------------------------------------

const emptySaves = () =>
  Object.fromEntries(ABILITIES.map((a) => [a.key, { prof: false, override: null }]))

const emptySkills = () =>
  Object.fromEntries(SKILLS.map((s) => [s.key, { prof: false, expertise: false, override: null }]))

export function blankCharacter(name = 'New Character') {
  return {
    id: uid(),
    name,
    race: '',
    klass: '',
    level: 1,
    background: '',
    alignment: '',
    deity: '',
    size: 'Medium',
    baseSpeed: 30,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    // Everything here stays null so the sheet computes it. Type over a field to
    // hand-set it; the UI marks it and offers a one-click revert.
    overrides: { profBonus: null, ac: null, initiative: null, passivePerception: null, speed: null },
    saves: emptySaves(),
    skills: emptySkills(),
    attacks: [],
    inventory: [],
    coins: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    hp: { current: 1, max: 1, temp: 0 },
    hitDice: { die: 'd8', total: 1, spent: 0 },
    resources: [],
    spellSlots: [],
    preparedSpells: [],
    prepQueue: [],
    deathState: freshDeathState(),
    xpLog: [],
    xpOverride: null,
    notes: [], // journal entries: { id, title, body, tag, date, pinned }
    text: {
      features: '',
      traits: '',
      backgroundText: '',
      languages: '',
      tools: '',
    },
  }
}

export function freshDeathState() {
  return {
    down: false,
    turnsPassed: 0,
    saves: [], // [{ id, result: 'success'|'failure'|'nat20'|'nat1' }]
    dead: false,
    stabilised: false,
    stabilisedFailures: 0,
    hadAdvantage: false,
    recoveredSelf: false,
  }
}

/**
 * Fill in anything missing against the template. Runs on every load and every
 * import so old save files and old JSON backups keep working as the app grows.
 */
export function normalise(raw) {
  const base = blankCharacter()
  const c = { ...base, ...(raw || {}) }

  c.id = raw?.id || uid()
  c.abilities = { ...base.abilities, ...(raw?.abilities || {}) }
  c.overrides = { ...base.overrides, ...(raw?.overrides || {}) }
  c.coins = { ...base.coins, ...(raw?.coins || {}) }
  c.hp = { ...base.hp, ...(raw?.hp || {}) }
  c.hitDice = { ...base.hitDice, ...(raw?.hitDice || {}) }
  c.deathState = { ...freshDeathState(), ...(raw?.deathState || {}) }
  c.text = { ...base.text, ...(raw?.text || {}) }

  // Dropped fields from earlier versions of the sheet.
  delete c.clock
  delete c.log
  delete c.encumbranceView
  delete c.rests

  const saves = emptySaves()
  for (const key of Object.keys(saves)) {
    if (raw?.saves?.[key]) saves[key] = { ...saves[key], ...raw.saves[key] }
  }
  c.saves = saves

  const skills = emptySkills()
  for (const key of Object.keys(skills)) {
    if (raw?.skills?.[key]) skills[key] = { ...skills[key], ...raw.skills[key] }
  }
  c.skills = skills

  const withIds = (arr) => (Array.isArray(arr) ? arr : []).map((r) => ({ ...r, id: r?.id || uid() }))
  c.attacks = withIds(raw?.attacks)
  c.inventory = withIds(raw?.inventory).map((i) => ({
    armour: 'none',
    armourAC: 0,
    ...i,
  }))
  c.resources = withIds(raw?.resources)
  c.preparedSpells = withIds(raw?.preparedSpells)
  c.prepQueue = withIds(raw?.prepQueue)
  c.xpLog = withIds(raw?.xpLog)
  c.notes = withIds(raw?.notes)

  // The old sheet had a single free-text notes box. Carry it into the journal
  // rather than orphaning it now that the box is gone.
  const legacyNotes = typeof raw?.text?.notes === 'string' ? raw.text.notes.trim() : ''
  if (legacyNotes) {
    c.notes = [
      {
        id: uid(),
        title: 'Notes',
        body: legacyNotes,
        tag: 'note',
        date: new Date().toISOString().slice(0, 10),
        pinned: true,
      },
      ...c.notes,
    ]
  }
  delete c.text.notes
  c.spellSlots = Array.isArray(raw?.spellSlots) ? raw.spellSlots : []
  if (Array.isArray(raw?.deathState?.saves)) {
    c.deathState.saves = raw.deathState.saves.map((s) => ({ ...s, id: s?.id || uid() }))
  }

  return c
}

/** Deep clone with brand-new ids everywhere, for the roster's Duplicate button. */
export function duplicateCharacter(c) {
  const copy = normalise(JSON.parse(JSON.stringify(c)))
  copy.id = uid()
  copy.name = `${c.name} (copy)`
  const reid = (arr) => arr.map((r) => ({ ...r, id: uid() }))
  copy.attacks = reid(copy.attacks)
  copy.inventory = reid(copy.inventory)
  copy.resources = reid(copy.resources)
  copy.preparedSpells = reid(copy.preparedSpells)
  copy.prepQueue = reid(copy.prepQueue)
  copy.xpLog = reid(copy.xpLog)
  copy.notes = reid(copy.notes)
  copy.deathState.saves = reid(copy.deathState.saves)
  return copy
}

// --------------------------------------------------------------------------
// Core derived numbers
// --------------------------------------------------------------------------

export const mod = (score) => Math.floor((num(score, 10) - 10) / 2)

export const abilityMod = (c, key) => mod(c.abilities?.[key])

export const autoProfBonus = (level) => 2 + Math.floor((Math.max(1, num(level, 1)) - 1) / 4)

export const profBonus = (c) => resolve(autoProfBonus(c.level), c.overrides?.profBonus)

export function saveBonus(c, key) {
  const auto = abilityMod(c, key) + (c.saves?.[key]?.prof ? profBonus(c) : 0)
  return { auto, value: resolve(auto, c.saves?.[key]?.override) }
}

export function skillBonus(c, key) {
  const skill = SKILLS.find((s) => s.key === key)
  const entry = c.skills?.[key] || {}
  const pb = profBonus(c)
  let auto = abilityMod(c, skill.ability)
  if (entry.prof) auto += pb
  if (entry.expertise) auto += pb
  return { auto, value: resolve(auto, entry.override) }
}

export function passivePerception(c) {
  const auto = 10 + skillBonus(c, 'perception').auto
  return { auto, value: resolve(auto, c.overrides?.passivePerception) }
}

export function initiative(c) {
  const auto = abilityMod(c, 'dex')
  return { auto, value: resolve(auto, c.overrides?.initiative) }
}

/** Medicine modifier + proficiency — added to the stabilise roll (DM's doc). */
export const stabiliseBonus = (c) => skillBonus(c, 'medicine').value

// --------------------------------------------------------------------------
// Armour class — derived from what is actually worn and in hand
// --------------------------------------------------------------------------

/** Armour and shields only count while worn or held. */
const equipped = (item) => item.location === 'worn' || item.location === 'inHand'

/**
 * AC = body armour (or 10) + the DEX allowed by that armour + every shield in
 * hand. Built from the inventory, so swapping chain mail for leather in the
 * inventory table moves the AC on its own.
 */
export function armourClass(c) {
  const dex = abilityMod(c, 'dex')
  const worn = (c.inventory || []).filter(equipped)

  const body = worn.find((i) => {
    const kind = armourKind(i.armour)
    return kind && kind.body
  })
  const shields = worn.filter((i) => i.armour === 'shield')

  const kind = body ? armourKind(body.armour) : armourKind('none')
  const base = body ? num(body.armourAC, 10) : 10

  let dexPart = dex
  if (kind.maxDex !== null && kind.maxDex !== undefined) dexPart = Math.min(dex, kind.maxDex)

  const shieldBonus = shields.reduce((sum, s) => sum + num(s.armourAC, 0), 0)
  const auto = base + dexPart + shieldBonus

  return {
    auto,
    value: resolve(auto, c.overrides?.ac),
    base,
    dexPart,
    shieldBonus,
    bodyName: body?.name ?? null,
    bodyKind: kind,
    shieldNames: shields.map((s) => s.name).filter(Boolean),
    /** e.g. "Chain mail 16 + shield 2" */
    breakdown: [
      body ? `${body.name || 'Armour'} ${base}` : `Unarmoured ${base}`,
      dexPart !== 0 ? `DEX ${signed(dexPart)}` : null,
      shieldBonus ? `shield ${signed(shieldBonus)}` : null,
    ]
      .filter(Boolean)
      .join(' + '),
  }
}

// --------------------------------------------------------------------------
// Attacks
// --------------------------------------------------------------------------

export function attackToHit(c, atk) {
  const auto = abilityMod(c, atk.ability || 'str') + (atk.addProf ? profBonus(c) : 0)
  return { auto, value: resolve(auto, atk.toHitOverride) }
}

export function attackDamage(c, atk) {
  const m = abilityMod(c, atk.ability || 'str')
  const dice = (atk.damageDice || '').trim()
  const bonus = atk.addAbilityToDamage === false ? 0 : m
  const parts = []
  if (dice) parts.push(dice)
  if (bonus !== 0) parts.push(bonus > 0 ? `+${bonus}` : `${bonus}`)
  const auto = parts.join('') || '—'
  const value = isOverridden(atk.damageOverride) ? String(atk.damageOverride) : auto
  return { auto, value }
}

/** House rule: base damage by size, IN ADDITION to the STR modifier. */
export function unarmedStrike(c) {
  const entry = SIZE_UNARMED[c.size] || SIZE_UNARMED.Medium
  const strMod = abilityMod(c, 'str')
  return {
    base: entry.base,
    baseLabel: entry.label,
    strMod,
    damage: `${entry.label}${strMod >= 0 ? '+' : ''}${strMod}`,
    total: entry.base + strMod,
  }
}

/** House rule: Small characters have disadvantage with Heavy weapons. */
export const heavyDisadvantage = (c, atk) =>
  Boolean(atk.heavy) && (c.size === 'Small' || c.size === 'Tiny')

// --------------------------------------------------------------------------
// Inventory & encumbrance (standard rules)
// --------------------------------------------------------------------------

/** Magical armour weighs nothing (house rule). */
export function itemWeight(item) {
  if (item.magicArmour) return 0
  return round2(num(item.qty, 0) * num(item.unitWeight, 0))
}

export const totalCoins = (coins) =>
  COIN_TYPES.reduce((sum, t) => sum + num(coins?.[t.key], 0), 0)

export const coinWeight = (coins) => round2(totalCoins(coins) / COINS_PER_POUND)

export function encumbrance(c) {
  let gearCarried = 0
  let gearStowed = 0
  let magicArmourSaved = 0

  for (const item of c.inventory || []) {
    const w = itemWeight(item)
    if (item.magicArmour) {
      magicArmourSaved += round2(num(item.qty, 0) * num(item.unitWeight, 0))
    }
    if (isCarried(item.location)) gearCarried += w
    else gearStowed += w
  }

  const coins = coinWeight(c.coins)
  const carried = round2(gearCarried + coins)
  const stowed = round2(gearStowed)
  const str = num(c.abilities?.str, 10)
  const baseSpeed = num(c.baseSpeed, 30)

  const capacity = str * 15
  const pushDragLift = str * 30
  const over = carried > capacity

  return {
    gearCarried: round2(gearCarried),
    gearStowed: stowed,
    coinWeight: coins,
    magicArmourSaved: round2(magicArmourSaved),
    carried,
    stowed,
    total: round2(carried + stowed),
    capacity,
    pushDragLift,
    over,
    remaining: round2(capacity - carried),
    pct: capacity > 0 ? Math.min(100, (carried / capacity) * 100) : 0,
    status: over ? 'Over capacity' : 'Within capacity',
    // Beyond capacity you can only push, drag or lift: speed 5.
    effectiveSpeed: over ? 5 : baseSpeed,
    penaltyNote: over
      ? 'Beyond your carrying capacity — you can only push, drag or lift this. Speed 5 ft.'
      : null,
    baseSpeed,
  }
}

export const effectiveSpeed = (c) => {
  const e = encumbrance(c)
  const auto = e.effectiveSpeed
  return { auto, value: resolve(auto, c.overrides?.speed), enc: e }
}

const matchesAny = (name, terms) => {
  const n = (name || '').toLowerCase()
  return terms.some((t) => n.includes(t))
}

export const findItems = (c, terms) =>
  (c.inventory || []).filter((i) => matchesAny(i.name, terms) && num(i.qty, 0) > 0)

export const lightSources = (c) => findItems(c, LIGHT_SOURCE_TERMS)

export const healersKits = (c) => findItems(c, HEALERS_KIT_TERMS)

export const consumables = (c) => (c.inventory || []).filter((i) => i.consumable)

// --------------------------------------------------------------------------
// XP
// --------------------------------------------------------------------------

export const xpEarned = (c) =>
  (c.xpLog || []).reduce((sum, e) => (e.earnsXP ? sum + num(e.amount, 0) : sum), 0)

export function xpTotal(c) {
  const auto = xpEarned(c)
  return { auto, value: resolve(auto, c.xpOverride) }
}

export function xpProgress(c) {
  const xp = xpTotal(c).value
  const level = Math.max(1, Math.min(20, num(c.level, 1)))
  const current = XP_THRESHOLDS[level - 1] ?? 0
  const next = level >= 20 ? null : XP_THRESHOLDS[level]
  const span = next === null ? 0 : next - current
  const into = Math.max(0, xp - current)
  return {
    xp,
    level,
    currentThreshold: current,
    nextThreshold: next,
    toNext: next === null ? 0 : Math.max(0, next - xp),
    pct: next === null ? 100 : span > 0 ? Math.min(100, (into / span) * 100) : 0,
    readyToLevel: next !== null && xp >= next,
  }
}

/** Highest level the character's XP qualifies for. */
export function levelForXp(xp) {
  let lvl = 1
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) lvl = i + 1
  }
  return lvl
}

// --------------------------------------------------------------------------
// Death saves
// --------------------------------------------------------------------------

export function deathTally(ds) {
  let successes = 0
  let failures = 0
  let nat1s = 0
  for (const s of ds?.saves || []) {
    if (s.result === 'success') successes += 1
    else if (s.result === 'nat20') successes += 3
    else if (s.result === 'failure') failures += 1
    else if (s.result === 'nat1') {
      failures += 2 // a natural 1 counts as two failures
      nat1s += 1
    }
  }
  return { successes, failures: Math.min(failures, 3), rawFailures: failures, nat1s }
}

/**
 * A nat 1 forces an immediate extra save on top of the saves owed for turns
 * passed. A second nat 1 is death.
 */
export function deathStatus(ds) {
  const tally = deathTally(ds)
  const owed = Math.max(0, num(ds?.turnsPassed, 0)) + tally.nat1s
  const rolled = (ds?.saves || []).length
  const pending = Math.max(0, owed - rolled)
  const dead = tally.nat1s >= 2 || tally.rawFailures >= 3
  const revived = tally.successes >= 3 || (ds?.saves || []).some((s) => s.result === 'nat20')
  return { ...tally, owed, rolled, pending, dead, revived }
}

export const stabiliseDC = (failures) => (failures >= 2 ? 17 : failures === 1 ? 13 : 10)

export const recoveryHours = (failures) => (failures >= 2 ? 132 : failures === 1 ? 66 : 27)

export const recoveryDetail = (failures) =>
  failures >= 2
    ? '24 h coma, then 12 h helpless, then 96 h of full rest.'
    : failures === 1
      ? '12 h coma, then 6 h helpless, then 48 h of full rest.'
      : '3 h helpless, then 24 h of full rest.'

// --------------------------------------------------------------------------
// Spell preparation
// --------------------------------------------------------------------------

export function formatDuration(totalMinutes) {
  const m = Math.max(0, Math.floor(num(totalMinutes, 0)))
  const h = Math.floor(m / 60)
  const mm = m % 60
  const parts = []
  if (h) parts.push(`${h}h`)
  if (mm || parts.length === 0) parts.push(`${mm}m`)
  return parts.join(' ')
}

/** House rule: 15 minutes per level of each spell being changed. */
export const prepQueueMinutes = (queue) =>
  (queue || []).reduce((sum, s) => sum + 15 * num(s.level, 0), 0)

export { ARMOUR_KINDS }
