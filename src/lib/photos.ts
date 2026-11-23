import type { ImageMetadata } from 'astro';
import type { PhotoKey } from '../data/photos';

const mods = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.jpg', { eager: true });
export const photos = Object.fromEntries(
  Object.entries(mods).map(([path, m]) => [path.split('/').pop()!.replace('.jpg', ''), m.default]),
) as Record<PhotoKey, ImageMetadata>;
