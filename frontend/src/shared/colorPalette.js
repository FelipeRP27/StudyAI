const MATTER_STRIPE_PALETTE = [
  '#2563eb',
  '#7c3aed',
  '#0891b2',
  '#0d9488',
  '#d97706',
  '#db2777'
];

export function getMateriaStripe(id) {
  if (!id) return MATTER_STRIPE_PALETTE[0];
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) return MATTER_STRIPE_PALETTE[0];
  return MATTER_STRIPE_PALETTE[Math.abs(numeric) % MATTER_STRIPE_PALETTE.length];
}
