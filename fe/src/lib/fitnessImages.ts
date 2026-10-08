// ─── Fitness imagery ──────────────────────────────────────────────────────────
// Photos from Unsplash (free to use under the Unsplash License), served by their CDN
// at the requested width. Each id was checked to match its class category.

import type { ClassCategory } from '@/src/types/class.types';

const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&auto=format&fit=crop&q=70`;

const CLASS_PHOTOS: Record<ClassCategory, string> = {
  yoga:    '1544367567-0f2fcb009e0b', // yoga pose at sunset
  zumba:   '1524594152303-9fd13543fe6e', // dance class in a mirrored studio
  cycling: '1540497077202-7c8a3999166f', // gym floor with spin bikes
  hiit:    '1599058917212-d750089bc07e', // battle ropes
  pilates: '1518611012118-696072aa579a', // group mat workout
  boxing:  '1549719386-74dfcbf7dbed', // boxing gloves
  other:   '1517838277536-f5f99be501cd', // barbell lift
};

export const classImage = (category: ClassCategory, width = 480): string =>
  unsplash(CLASS_PHOTOS[category] ?? CLASS_PHOTOS.other, width);

/** Portal hero when the gym hasn't set a cover image (Gym info → cover image URL) */
export const DEFAULT_HERO_IMAGE = unsplash('1534438327276-14e5300c3a48', 1600); // dumbbell rack
