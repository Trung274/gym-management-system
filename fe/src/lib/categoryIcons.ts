import {
  Bike, BicepsFlexed, Dumbbell, Flower2, HandFist, HeartPulse,
  Music, PersonStanding, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import type { ClassCategory } from '@/src/types/class.types';
import type { EquipmentCategory } from '@/src/types/equipment.types';

export const CLASS_CATEGORY_ICONS: Record<ClassCategory, LucideIcon> = {
  yoga:    Flower2,
  zumba:   Music,
  cycling: Bike,
  hiit:    Zap,
  pilates: PersonStanding,
  boxing:  HandFist,
  other:   Dumbbell,
};

export const EQUIPMENT_CATEGORY_ICONS: Record<EquipmentCategory, LucideIcon> = {
  cardio:       HeartPulse,
  strength:     BicepsFlexed,
  flexibility:  PersonStanding,
  free_weights: Dumbbell,
  other:        Wrench,
};
