import {
  Accessibility,
  Building2,
  ChefHat,
  ClipboardCheck,
  Droplets,
  FileText,
  Hammer,
  House,
  KeyRound,
  Layers,
  MessagesSquare,
  Paintbrush,
  Ruler,
  ShowerHead,
  Shovel,
  Stamp,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

/**
 * Explicit icon registry.
 *
 * site-data.json stores an icon *name*, not a component. Looking it up through
 * this map — rather than indexing the whole lucide namespace dynamically — means
 * a typo in the data file falls back to a sensible default instead of crashing
 * the render, and it keeps the bundle to the icons actually used.
 */
const registry = {
  Accessibility,
  Building2,
  ChefHat,
  ClipboardCheck,
  Droplets,
  FileText,
  Hammer,
  House,
  KeyRound,
  Layers,
  MessagesSquare,
  Paintbrush,
  Ruler,
  ShowerHead,
  Shovel,
  Stamp,
  Warehouse,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof registry;

export function getIcon(name: string): LucideIcon {
  return (registry as Record<string, LucideIcon>)[name] ?? Hammer;
}
