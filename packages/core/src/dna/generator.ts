import {
  DeterministicDNA,
  ColorPalette,
  ArchitectureDNA,
  GlobeDNA,
  CircuitDNA,
  BiomorphicDNA,
  CityDNA,
} from '../types.js';
import { fnv1a64, normalizeInput } from './hasher.js';
import { Mulberry32 } from './prng.js';


const PALETTES: ColorPalette[] = [
  // Cyberpunk Neo-Tokyo
  {
    primary: '#00f0ff',
    secondary: '#ff0055',
    accent: '#ffe600',
    background: '#05070f',
    groundSubstrate: '#0b1021',
    finderEmissive: '#00ffff',
  },
  // Brutalist Monolith
  {
    primary: '#b0b5bc',
    secondary: '#6c757d',
    accent: '#f39c12',
    background: '#121417',
    groundSubstrate: '#1b1f24',
    finderEmissive: '#f1c40f',
  },
  // Obsidian Emerald
  {
    primary: '#2ecc71',
    secondary: '#16a085',
    accent: '#1abc9c',
    background: '#0a1410',
    groundSubstrate: '#0f2019',
    finderEmissive: '#00ff88',
  },
  // Synthwave Sunset
  {
    primary: '#ff71ce',
    secondary: '#01cdfe',
    accent: '#05ffa1',
    background: '#19052b',
    groundSubstrate: '#2a0845',
    finderEmissive: '#ff71ce',
  },
  // Titanium Minimalist
  {
    primary: '#e0e6ed',
    secondary: '#8492a6',
    accent: '#3b82f6',
    background: '#090b10',
    groundSubstrate: '#141824',
    finderEmissive: '#60a5fa',
  },
  // Solar Flare
  {
    primary: '#ff5722',
    secondary: '#ff9800',
    accent: '#ffc107',
    background: '#120702',
    groundSubstrate: '#260f04',
    finderEmissive: '#ffab00',
  },
];

export function generateDNA(input: string): DeterministicDNA {
  const normalizedUrl = normalizeInput(input);
  const rawHash = fnv1a64(normalizedUrl);
  // Safe 32-bit conversion for Mulberry32 bitwise operations
  const seed32 = Number(BigInt.asUintN(32, rawHash));
  const rng = new Mulberry32(seed32);

  const palette = rng.choice(PALETTES);

  const roofStyles: ArchitectureDNA['roofStyle'][] = ['flat', 'stepped', 'sloped', 'spire'];
  const towerArchetypes: ArchitectureDNA['towerArchetype'][] = [
    'monolith',
    'citadel',
    'obelisk',
    'pagoda',
  ];

  const architecture: ArchitectureDNA = {
    maxHeight: Number(rng.range(1.5, 4.0).toFixed(2)),
    heightVariance: Number(rng.range(0.3, 0.9).toFixed(2)),
    roofStyle: rng.choice(roofStyles),
    facadeDensity: Number(rng.range(0.35, 0.85).toFixed(2)),
    towerArchetype: rng.choice(towerArchetypes),
    bevelRadius: Number(rng.range(0.02, 0.08).toFixed(3)),
  };

  const globe: GlobeDNA = {
    continentElevation: Number(rng.range(0.12, 0.35).toFixed(2)),
    oceanDepth: Number(rng.range(0.05, 0.18).toFixed(2)),
    satelliteCount: rng.rangeInt(3, 10),
    rotationSpeed: Number(rng.range(0.2, 0.8).toFixed(2)),
  };

  const traceStyles: CircuitDNA['traceStyle'][] = ['orthogonal', 'diagonal', 'curved'];
  const chipPackages: CircuitDNA['chipPackage'][] = ['qfp', 'bga', 'soic'];
  const solderMaskColors: CircuitDNA['solderMaskColor'][] = ['green', 'black', 'blue', 'purple'];

  const circuit: CircuitDNA = {
    traceStyle: rng.choice(traceStyles),
    chipPackage: rng.choice(chipPackages),
    solderMaskColor: rng.choice(solderMaskColors),
    componentDensity: Number(rng.range(0.35, 0.85).toFixed(2)),
    viaDensity: Number(rng.range(0.2, 0.6).toFixed(2)),
    traceWidth: Number(rng.range(0.12, 0.28).toFixed(2)),
  };

  const crystalStyles: BiomorphicDNA['crystalGrowthStyle'][] = [
    'hexagonal',
    'coral_branch',
    'geode_cluster',
    'needle_prism',
  ];

  const biomorphic: BiomorphicDNA = {
    crystalGrowthStyle: rng.choice(crystalStyles),
    refractionIndex: Number(rng.range(1.45, 1.75).toFixed(2)),
    facetSharpness: Number(rng.range(0.4, 0.95).toFixed(2)),
    clusterDensity: Number(rng.range(0.3, 0.8).toFixed(2)),
    glowIntensity: Number(rng.range(0.4, 1.2).toFixed(2)),
  };

  const zoningStyles: CityDNA['zoningArchetype'][] = [
    'downtown',
    'gridiron',
    'avenues',
    'cyber_district',
  ];

  const landmarkStyles: CityDNA['landmarkStyle'][] = [
    'monumental_tower',
    'stepped_spire',
    'twin_plaza',
  ];

  const city: CityDNA = {
    zoningArchetype: rng.choice(zoningStyles),
    skylineDensity: Number(rng.range(0.4, 0.9).toFixed(2)),
    streetOrientationBias: Number(rng.range(0.5, 0.95).toFixed(2)),
    landmarkStyle: rng.choice(landmarkStyles),
    buildingScale: Number(rng.range(0.85, 1.15).toFixed(2)),
  };

  return {
    rawHash,
    seed32,
    normalizedUrl,
    palette,
    architecture,
    globe,
    circuit,
    biomorphic,
    city,
  };
}

