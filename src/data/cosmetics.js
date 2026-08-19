// Every cosmetic item is purely visual EXCEPT a small, capped functional stat
// so unlocks genuinely affect gameplay without creating pay-to-win power
// creep (max total swing across a full loadout stays under ~12%).
export const CATEGORIES = ['stick', 'gloves', 'skates', 'jersey', 'pants', 'celebration', 'goalieMask', 'trail'];

export const ITEMS = {
  stick: [
    { id: 'stick_basic', name: 'Composite Starter', cost: 0, unlockLevel: 1, color: 0x3a2a1a, stat: { accuracy: 0 } },
    { id: 'stick_carbon', name: 'Carbon Whip', cost: 250, unlockLevel: 2, color: 0x222222, stat: { accuracy: 0.02 } },
    { id: 'stick_pro', name: 'Pro Curve', cost: 700, unlockLevel: 6, color: 0xaa2222, stat: { accuracy: 0.04, power: 0.02 } },
    { id: 'stick_signature', name: 'Signature Blade', cost: 1600, unlockLevel: 12, color: 0xffcc00, stat: { accuracy: 0.06, power: 0.04 } },
    { id: 'stick_legend', name: 'Legend Series', cost: 3200, unlockLevel: 20, color: 0x66e0ff, stat: { accuracy: 0.08, power: 0.06 } },
  ],
  gloves: [
    { id: 'gloves_basic', name: 'Training Gloves', cost: 0, unlockLevel: 1, color: 0x333333, stat: { dekeSpeed: 0 } },
    { id: 'gloves_grip', name: 'Grip-Tech', cost: 200, unlockLevel: 3, color: 0x1155aa, stat: { dekeSpeed: 0.03 } },
    { id: 'gloves_pro', name: 'Pro Feel', cost: 600, unlockLevel: 7, color: 0x111111, stat: { dekeSpeed: 0.06 } },
    { id: 'gloves_elite', name: 'Elite Flex', cost: 1400, unlockLevel: 14, color: 0xdd2222, stat: { dekeSpeed: 0.09 } },
  ],
  skates: [
    { id: 'skates_basic', name: 'Rental Skates', cost: 0, unlockLevel: 1, color: 0x222222, stat: { moveSpeed: 0 } },
    { id: 'skates_sharp', name: 'Razor Edge', cost: 220, unlockLevel: 3, color: 0x444444, stat: { moveSpeed: 0.03 } },
    { id: 'skates_pro', name: 'Pro Blade', cost: 650, unlockLevel: 8, color: 0x111111, stat: { moveSpeed: 0.06 } },
    { id: 'skates_elite', name: 'Feather Cut', cost: 1500, unlockLevel: 15, color: 0xffffff, stat: { moveSpeed: 0.09 } },
  ],
  jersey: [
    { id: 'jersey_home', name: 'Home Blue', cost: 0, unlockLevel: 1, color: 0x1a4fa0, trim: 0xffffff },
    { id: 'jersey_away', name: 'Away White', cost: 150, unlockLevel: 2, color: 0xf2f2f2, trim: 0x1a4fa0 },
    { id: 'jersey_black', name: 'Blackout', cost: 400, unlockLevel: 5, color: 0x151515, trim: 0xdd2222 },
    { id: 'jersey_sunset', name: 'Sunset Alt', cost: 900, unlockLevel: 10, color: 0xff6a00, trim: 0x222222 },
    { id: 'jersey_gold', name: 'Championship Gold', cost: 2200, unlockLevel: 20, color: 0xd4af37, trim: 0x111111 },
  ],
  pants: [
    { id: 'pants_basic', name: 'Standard Pants', cost: 0, unlockLevel: 1, color: 0x1a2230 },
    { id: 'pants_match', name: 'Team Match', cost: 120, unlockLevel: 3, color: 0x1a4fa0 },
    { id: 'pants_black', name: 'All Black', cost: 300, unlockLevel: 6, color: 0x101010 },
  ],
  celebration: [
    { id: 'cel_fistpump', name: 'Fist Pump', cost: 0, unlockLevel: 1 },
    { id: 'cel_stickraise', name: 'Stick Raise', cost: 180, unlockLevel: 2 },
    { id: 'cel_slide', name: 'Knee Slide', cost: 500, unlockLevel: 5 },
    { id: 'cel_superman', name: 'Superman Slide', cost: 1100, unlockLevel: 9 },
    { id: 'cel_bowandarrow', name: 'Bow and Arrow', cost: 2000, unlockLevel: 16 },
  ],
  goalieMask: [
    { id: 'mask_basic', name: 'Plain White', cost: 0, unlockLevel: 1, color: 0xf0f0f0 },
    { id: 'mask_flames', name: 'Flame Paint', cost: 300, unlockLevel: 4, color: 0xdd4422 },
    { id: 'mask_skull', name: 'Skull Cage', cost: 700, unlockLevel: 9, color: 0x222222 },
    { id: 'mask_gold', name: 'Golden Cage', cost: 1800, unlockLevel: 18, color: 0xd4af37 },
  ],
  trail: [
    { id: 'trail_basic', name: 'Standard Puck', cost: 0, unlockLevel: 1, color: 0x2244ff },
    { id: 'trail_fire', name: 'Fire Trail', cost: 350, unlockLevel: 5, color: 0xff5522 },
    { id: 'trail_ice', name: 'Ice Trail', cost: 350, unlockLevel: 5, color: 0x66e0ff },
    { id: 'trail_gold', name: 'Golden Trail', cost: 1200, unlockLevel: 15, color: 0xffd700 },
  ],
};

export function getItem(category, id) {
  return (ITEMS[category] || []).find((i) => i.id === id);
}

export function defaultLoadout() {
  return {
    stick: 'stick_basic',
    gloves: 'gloves_basic',
    skates: 'skates_basic',
    jersey: 'jersey_home',
    pants: 'pants_basic',
    celebration: 'cel_fistpump',
    goalieMask: 'mask_basic',
    trail: 'trail_basic',
  };
}

// Sums the small functional bonuses across an equipped loadout.
export function computeLoadoutStats(loadout) {
  const stats = { accuracy: 0, power: 0, dekeSpeed: 0, moveSpeed: 0 };
  for (const cat of Object.keys(loadout)) {
    const item = getItem(cat, loadout[cat]);
    if (item && item.stat) {
      for (const k of Object.keys(item.stat)) stats[k] = (stats[k] || 0) + item.stat[k];
    }
  }
  return stats;
}
