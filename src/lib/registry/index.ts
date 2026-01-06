import registryData from './registry.json';
import type { Library } from './schema';

export const registry = (registryData as { libraries: Library[] }).libraries;

export const registryById = new Map<string, Library>(registry.map((l) => [l.id, l]));
