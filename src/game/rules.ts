export type MissionTarget = 'mars' | 'moon';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CrewRoleId = 'commander' | 'engineer' | 'scientist' | 'medical';
export type BuildingTypeId =
  | 'habitat'
  | 'solar'
  | 'oxygen'
  | 'water'
  | 'greenhouse'
  | 'antenna'
  | 'shelter'
  | 'lab';

export interface MissionConfig {
  id: MissionTarget;
  name: string;
  subtitle: string;
  location: string;
  durationSols: number;
  gravityLabel: string;
  tempRangeLabel: string;
  atmosphereLabel: string;
  radiationBaseMsv: number;
  solarMultiplier: number;
  briefing: string;
  startingMaterials: number;
  objectives: {
    id: string;
    title: string;
    description: string;
    targetValue: number;
  }[];
}

export const MISSIONS: Record<MissionTarget, MissionConfig> = {
  mars: {
    id: 'mars',
    name: 'Mars Exploration Mission',
    subtitle: 'Jezero Crater Delta Outpost · Ares V Program',
    location: '18.38°N, 77.58°E · Jezero Crater, Mars',
    durationSols: 12,
    gravityLabel: '3.72 m/s² (0.38 g)',
    tempRangeLabel: '-14°C to -79°C',
    atmosphereLabel: '95.3% CO₂ · 742 Pa (Thin)',
    radiationBaseMsv: 0.64,
    solarMultiplier: 0.85,
    briefing:
      'Establish a self-sustaining human research outpost on the ancient river delta of Jezero Crater. Extract breathable O₂ from Martian CO₂ using MOXIE reactors, survive regional dust storms that cut solar output, and collect astrobiology core samples.',
    startingMaterials: 140,
    objectives: [
      {
        id: 'survive_sols',
        title: 'Complete 12-Sol Surface Stay',
        description: 'Maintain crew survival and life support across 12 Martian Sols.',
        targetValue: 12,
      },
      {
        id: 'build_modules',
        title: 'Establish Core Outpost (6+ Modules)',
        description: 'Construct or upgrade at least 6 functional outpost structures.',
        targetValue: 6,
      },
      {
        id: 'science_data',
        title: 'Gather 100 Research Data Points',
        description: 'Operate the Research Laboratory and surface rover to reach 100 Science.',
        targetValue: 100,
      },
      {
        id: 'crew_safety',
        title: 'Keep Crew Health ≥ 75% & Radiation ≤ 25%',
        description: 'Protect astronauts from radiation and hypoxia until mission completion.',
        targetValue: 75,
      },
    ],
  },
  moon: {
    id: 'moon',
    name: 'Lunar Base Mission',
    subtitle: 'Shackleton Crater Rim · Artemis Polar Base',
    location: '89.9°S, 0.0°E · Lunar South Pole',
    durationSols: 12,
    gravityLabel: '1.62 m/s² (0.16 g)',
    tempRangeLabel: '-53°C to -203°C (Shadowed Crater)',
    atmosphereLabel: 'Hard Vacuum (3×10⁻¹⁵ bar)',
    radiationBaseMsv: 1.36,
    solarMultiplier: 1.15,
    briefing:
      'Build NASA’s Artemis permanent lunar foothold along the sunlit rim of Shackleton Crater. Harness intense polar sunlight while shielding the crew against unshielded cosmic radiation (1.36 mSv/day) and mining water ice from cryogenic craters.',
    startingMaterials: 135,
    objectives: [
      {
        id: 'survive_sols',
        title: 'Complete 12-Cycle Lunar Campaign',
        description: 'Keep the Artemis crew operational through 12 lunar work cycles.',
        targetValue: 12,
      },
      {
        id: 'build_modules',
        title: 'Construct 6+ Lunar Modules',
        description: 'Deploy and upgrade at least 6 pressurized lunar structures.',
        targetValue: 6,
      },
      {
        id: 'science_data',
        title: 'Collect 100 Ice-Core & Telemetry Points',
        description: 'Analyze cryogenic polar ice cores and deep-space comms data.',
        targetValue: 100,
      },
      {
        id: 'crew_safety',
        title: 'Keep Crew Health ≥ 75% & Radiation ≤ 25%',
        description: 'Counteract intense cosmic rays with Radiation Shelters and active shielding.',
        targetValue: 75,
      },
    ],
  },
};

export interface CrewRole {
  id: CrewRoleId;
  title: string;
  astronautName: string;
  callsign: string;
  specialty: string;
  bonusSummary: string;
  bio: string;
  modifiers: {
    buildCostDiscount: number;
    powerBonusPct: number;
    scienceBonusPct: number;
    healthRecoveryBonus: number;
    radiationReductionPct: number;
    commsStabilityBonus: number;
  };
}

export const CREW_ROLES: CrewRole[] = [
  {
    id: 'commander',
    title: 'Mission Commander',
    astronautName: 'Cdr. Elena Vance',
    callsign: 'VALKYRIE',
    specialty: 'Flight Operations & Comms Coordination',
    bonusSummary: '+15% Comms Stability · -10% Emergency Resource Loss',
    bio: 'Veteran orbital test pilot who keeps Deep Space Network links locked and leads calm responses during crises.',
    modifiers: {
      buildCostDiscount: 0.05,
      powerBonusPct: 0.05,
      scienceBonusPct: 0.05,
      healthRecoveryBonus: 1,
      radiationReductionPct: 0.05,
      commsStabilityBonus: 15,
    },
  },
  {
    id: 'engineer',
    title: 'Chief Systems Engineer',
    astronautName: 'Lt. Marcus Chen',
    callsign: 'FORGE',
    specialty: 'Power Grids, Robotics & Habitat Construction',
    bonusSummary: '-15% Building Material Cost · +15% Solar Power Output',
    bio: 'Aerospace structural and electrical engineer who optimizes solar arrays and builds modular domes with less scrap.',
    modifiers: {
      buildCostDiscount: 0.15,
      powerBonusPct: 0.15,
      scienceBonusPct: 0,
      healthRecoveryBonus: 0,
      radiationReductionPct: 0.05,
      commsStabilityBonus: 5,
    },
  },
  {
    id: 'scientist',
    title: 'Planetary Scientist & Botanist',
    astronautName: 'Dr. Amara Okafor',
    callsign: 'FLORA',
    specialty: 'Astrobiology, ISRU Chemistry & Hydroponics',
    bonusSummary: '+25% Science Output · +15% Greenhouse Food Yield',
    bio: 'Geochemist and space botanist specializing in closed-loop hydroponic crop cycles and ice-core spectroscopy.',
    modifiers: {
      buildCostDiscount: 0,
      powerBonusPct: 0,
      scienceBonusPct: 0.25,
      healthRecoveryBonus: 1,
      radiationReductionPct: 0,
      commsStabilityBonus: 5,
    },
  },
  {
    id: 'medical',
    title: 'Aerospace Medical Officer',
    astronautName: 'Dr. Julian Reyes',
    callsign: 'AEGIS',
    specialty: 'Space Medicine, Dosimetry & Life Support',
    bonusSummary: '+4 Crew Health Recovery/Sol · -20% Radiation Exposure',
    bio: 'Flight surgeon focused on radiation counter-measures, bone-density exercise protocols, and ECLSS air purity.',
    modifiers: {
      buildCostDiscount: 0,
      powerBonusPct: 0,
      scienceBonusPct: 0.05,
      healthRecoveryBonus: 4,
      radiationReductionPct: 0.2,
      commsStabilityBonus: 0,
    },
  },
];

export interface BuildingSpec {
  id: BuildingTypeId;
  name: string;
  shortName: string;
  category: 'Life Support' | 'Power' | 'Science & Comms' | 'Protection';
  materialCost: number;
  upgradeCost: number;
  powerDeltaPerSol: number;
  oxygenDeltaPerSol: number;
  waterDeltaPerSol: number;
  foodDeltaPerSol: number;
  radiationShieldingPct: number;
  commsDeltaPerSol: number;
  scienceDeltaPerSol: number;
  healthDeltaPerSol: number;
  description: string;
  tradeOffNote: string;
  accentHex: string;
}

export const BUILDING_SPECS: Record<BuildingTypeId, BuildingSpec> = {
  habitat: {
    id: 'habitat',
    name: 'Astronaut Habitat Dome',
    shortName: 'Habitat',
    category: 'Life Support',
    materialCost: 25,
    upgradeCost: 20,
    powerDeltaPerSol: -5,
    oxygenDeltaPerSol: -2,
    waterDeltaPerSol: -2,
    foodDeltaPerSol: 0,
    radiationShieldingPct: 10,
    commsDeltaPerSol: 0,
    scienceDeltaPerSol: 2,
    healthDeltaPerSol: 5,
    description: 'Pressurized living quarters with sleep pods, exercise ergometers, and medical bay.',
    tradeOffNote: 'Boosts Crew Health (+5/Sol) and basic shielding, but draws 5 Power, 2 O₂, and 2 Water/Sol.',
    accentHex: '#38bdf8',
  },
  solar: {
    id: 'solar',
    name: 'Solar Power Station',
    shortName: 'Solar Array',
    category: 'Power',
    materialCost: 20,
    upgradeCost: 18,
    powerDeltaPerSol: 18,
    oxygenDeltaPerSol: 0,
    waterDeltaPerSol: 0,
    foodDeltaPerSol: 0,
    radiationShieldingPct: 0,
    commsDeltaPerSol: 0,
    scienceDeltaPerSol: 0,
    healthDeltaPerSol: 0,
    description: 'Dual-axis sun-tracking photovoltaic wings with lithium-sulfur battery bank.',
    tradeOffNote: 'Generates +18 Power/Sol (scaled by planetary sunlight and dust storms). Costs 20 Materials.',
    accentHex: '#f59e0b',
  },
  oxygen: {
    id: 'oxygen',
    name: 'Oxygen Generation System',
    shortName: 'O₂ Generator',
    category: 'Life Support',
    materialCost: 24,
    upgradeCost: 20,
    powerDeltaPerSol: -7,
    oxygenDeltaPerSol: 15,
    waterDeltaPerSol: -2,
    foodDeltaPerSol: 0,
    radiationShieldingPct: 0,
    commsDeltaPerSol: 0,
    scienceDeltaPerSol: 2,
    healthDeltaPerSol: 1,
    description: 'MOXIE atmospheric CO₂ splitter and water-electrolysis oxygen refinery.',
    tradeOffNote: 'Produces +15 Oxygen/Sol, but consumes 7 Power and 2 Water for electrolysis.',
    accentHex: '#06b6d4',
  },
  water: {
    id: 'water',
    name: 'Water Recycling Unit',
    shortName: 'Water Recycler',
    category: 'Life Support',
    materialCost: 22,
    upgradeCost: 18,
    powerDeltaPerSol: -5,
    oxygenDeltaPerSol: 0,
    waterDeltaPerSol: 14,
    foodDeltaPerSol: 0,
    radiationShieldingPct: 5,
    commsDeltaPerSol: 0,
    scienceDeltaPerSol: 1,
    healthDeltaPerSol: 1,
    description: 'Closed-loop distillation & regolith ice extractor recovering 98% of outpost moisture.',
    tradeOffNote: 'Produces +14 Water/Sol and water-wall shielding (+5%), using 5 Power/Sol.',
    accentHex: '#3b82f6',
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Hydroponic Greenhouse',
    shortName: 'Greenhouse',
    category: 'Life Support',
    materialCost: 26,
    upgradeCost: 22,
    powerDeltaPerSol: -6,
    oxygenDeltaPerSol: 4,
    waterDeltaPerSol: -5,
    foodDeltaPerSol: 14,
    radiationShieldingPct: 0,
    commsDeltaPerSol: 0,
    scienceDeltaPerSol: 3,
    healthDeltaPerSol: 2,
    description: 'Pressurized LED agricultural dome cultivating dwarf wheat, potatoes, and red romaine lettuce.',
    tradeOffNote: 'Grows +14 Food and +4 O₂ (photosynthesis!), but requires 6 Power and 5 Water every Sol.',
    accentHex: '#10b981',
  },
  antenna: {
    id: 'antenna',
    name: 'Communication Antenna',
    shortName: 'Comms Dish',
    category: 'Science & Comms',
    materialCost: 20,
    upgradeCost: 16,
    powerDeltaPerSol: -4,
    oxygenDeltaPerSol: 0,
    waterDeltaPerSol: 0,
    foodDeltaPerSol: 0,
    radiationShieldingPct: 0,
    commsDeltaPerSol: 14,
    scienceDeltaPerSol: 6,
    healthDeltaPerSol: 0,
    description: 'High-gain Ka-band parabolic dish linking the outpost to NASA’s Deep Space Network.',
    tradeOffNote: 'Maintains +14 Comms Integrity and transmits +6 Science/Sol, drawing 4 Power.',
    accentHex: '#a855f7',
  },
  shelter: {
    id: 'shelter',
    name: 'Radiation Shelter',
    shortName: 'Rad Shelter',
    category: 'Protection',
    materialCost: 28,
    upgradeCost: 22,
    powerDeltaPerSol: -6,
    oxygenDeltaPerSol: -1,
    waterDeltaPerSol: 0,
    foodDeltaPerSol: 0,
    radiationShieldingPct: 28,
    commsDeltaPerSol: 0,
    scienceDeltaPerSol: 0,
    healthDeltaPerSol: 3,
    description: 'Sintered regolith vault lined with boron-polyethylene and active magnetic deflectors.',
    tradeOffNote: 'Blocks 28% incoming space radiation and protects Crew Health (+3), but draws 6 Power/Sol.',
    accentHex: '#eab308',
  },
  lab: {
    id: 'lab',
    name: 'Research Laboratory',
    shortName: 'Science Lab',
    category: 'Science & Comms',
    materialCost: 30,
    upgradeCost: 24,
    powerDeltaPerSol: -9,
    oxygenDeltaPerSol: -2,
    waterDeltaPerSol: -1,
    foodDeltaPerSol: 0,
    radiationShieldingPct: 0,
    commsDeltaPerSol: 2,
    scienceDeltaPerSol: 16,
    healthDeltaPerSol: 0,
    description: 'Pressurized astrobiology & geology laboratory with mass spectrometers and core drills.',
    tradeOffNote: 'Generates +16 Science Data/Sol, but is power-hungry (-9 Power, -2 O₂, -1 Water/Sol).',
    accentHex: '#ec4899',
  },
};

export interface PlacedBuilding {
  padIndex: number;
  type: BuildingTypeId;
  level: number; // 1 to 3
}

export interface OutpostPad {
  index: number;
  label: string;
  x: number;
  z: number;
}

export const OUTPOST_PADS: OutpostPad[] = [
  { index: 0, label: 'Pad A1 (Core Center)', x: -12, z: -10 },
  { index: 1, label: 'Pad A2 (Core North)', x: 0, z: -12 },
  { index: 2, label: 'Pad A3 (Core East)', x: 12, z: -10 },
  { index: 3, label: 'Pad B1 (West Flank)', x: -16, z: 2 },
  { index: 4, label: 'Pad B2 (Central Plaza)', x: 0, z: 2 },
  { index: 5, label: 'Pad B3 (East Flank)', x: 16, z: 2 },
  { index: 6, label: 'Pad C1 (South-West Ridge)', x: -12, z: 14 },
  { index: 7, label: 'Pad C2 (South Perimeter)', x: 0, z: 15 },
  { index: 8, label: 'Pad C3 (South-East Ridge)', x: 12, z: 14 },
  { index: 9, label: 'Pad D1 (Far West Array)', x: -24, z: -6 },
  { index: 10, label: 'Pad D2 (Far East Array)', x: 24, z: -6 },
  { index: 11, label: 'Pad D3 (High Overlook)', x: 0, z: -24 },
];

export interface PowerAllocation {
  lifeSupportPct: number; // 50 to 150 (default 100)
  sciencePct: number; // 50 to 150 (default 100)
  shieldingPct: number; // 50 to 150 (default 100)
  greenhousePct: number; // 50 to 150 (default 100)
}

export interface ResourceState {
  oxygen: number; // 0 - 100
  water: number; // 0 - 100
  food: number; // 0 - 100
  power: number; // 0 - 100
  crewHealth: number; // 0 - 100
  radiation: number; // 0 - 100 (Lower is safer! >= 85 is critical)
  comms: number; // 0 - 100
  materials: number; // Construction regolith & titanium alloy units
  science: number; // Research points toward mission objective
}

export interface ResourceRates {
  oxygenNet: number;
  waterNet: number;
  foodNet: number;
  powerNet: number;
  healthNet: number;
  radiationNet: number;
  commsNet: number;
  scienceNet: number;
  totalShieldingPct: number;
}

export interface MissionEventOption {
  id: string;
  label: string;
  tradeOffTag: string;
  effects: Partial<ResourceState>;
  educationalOutcome: string;
  isBalancedChoice: boolean;
}

export interface MissionChallengeEvent {
  id: string;
  title: string;
  severity: 'warning' | 'critical' | 'opportunity';
  targetFilter?: MissionTarget;
  situationSimple: string;
  nasaScienceContext: string;
  options: MissionEventOption[];
}

export const MISSION_CHALLENGES: MissionChallengeEvent[] = [
  {
    id: 'dust-storm-warning',
    title: 'Regional Dust Storm Approaching',
    severity: 'critical',
    targetFilter: 'mars',
    situationSimple:
      'Orbital satellites detect a massive wall of Martian iron-oxide dust sweeping across Jezero Crater. Sunlight reaching your solar panels will drop by 45% for the next Sol!',
    nasaScienceContext:
      'NASA Science: Martian dust storms can span thousands of kilometers. In 2018, a global dust storm blocked sunlight and ended the Opportunity rover’s 15-year mission.',
    options: [
      {
        id: 'conserve-power-hibernate',
        label: 'Throttle Science Lab & Dim Greenhouse LEDs to Protect Life Support',
        tradeOffTag: '+8 Power · +4 O₂ · -8 Science · -5 Food',
        effects: { power: 8, oxygen: 4, science: -8, food: -5, crewHealth: 2 },
        educationalOutcome:
          'Smart engineering trade-off! Real NASA mission controllers always prioritize life support (oxygen and heating) over science experiments when solar power drops.',
        isBalancedChoice: true,
      },
      {
        id: 'eva-brush-arrays',
        label: 'Send Crew Outside in Spacesuits to Mechanically Clear Solar Arrays',
        tradeOffTag: '+14 Power · -8 Crew Health · +6 Radiation · -5 O₂',
        effects: { power: 14, crewHealth: -8, radiation: 6, oxygen: -5 },
        educationalOutcome:
          'Risky trade-off! You saved your solar power output, but working outside in low visibility used extra suit oxygen and exposed the crew to radiation and fatigue.',
        isBalancedChoice: false,
      },
      {
        id: 'full-science-push',
        label: 'Keep All Labs Running at 100% and Drain Reserve Batteries',
        tradeOffTag: '+15 Science · -20 Power · -8 O₂ · -4 Crew Health',
        effects: { science: 15, power: -20, oxygen: -8, crewHealth: -4 },
        educationalOutcome:
          'Dangerous choice! Collecting storm data boosted Science, but draining battery reserves starved the oxygen heaters and chilled the habitat.',
        isBalancedChoice: false,
      },
    ],
  },
  {
    id: 'solar-particle-event',
    title: 'Coronal Mass Ejection (Radiation Alert)',
    severity: 'critical',
    situationSimple:
      'NASA’s Solar Dynamics Observatory just spotted an X-class solar flare heading straight toward your outpost! High-energy protons will strike the surface in 30 minutes.',
    nasaScienceContext:
      'NASA Science: Without Earth’s magnetosphere, a Solar Particle Event (SPE) can deliver a dangerous radiation dose unless astronauts shelter behind water walls or regolith shielding.',
    options: [
      {
        id: 'boost-electromagnetic-shield',
        label: 'Divert Reserve Power to Active Shielding & Huddle in Water-Lined Shelter',
        tradeOffTag: '-14 Power · -12 Radiation · +4 Crew Health · -4 Science',
        effects: { power: -14, radiation: -12, crewHealth: 4, science: -4 },
        educationalOutcome:
          'Excellent safety decision! Diverting electricity and pausing research kept crew radiation low and protected astronaut DNA.',
        isBalancedChoice: true,
      },
      {
        id: 'pile-regolith-berms',
        label: 'Use Construction Materials & Rover to Pile Regolith Over the Habitat Roof',
        tradeOffTag: '-20 Materials · -10 Radiation · -6 Power',
        effects: { materials: -20, radiation: -10, power: -6, crewHealth: 2 },
        educationalOutcome:
          'Good practical engineering! Packed lunar or Martian dirt (regolith) is a great natural radiation shield, though it used up 20 construction materials.',
        isBalancedChoice: true,
      },
      {
        id: 'ignore-flare-work',
        label: 'Keep Working Normally to Save Power and Materials',
        tradeOffTag: '+0 Power Cost · +22 Radiation · -14 Crew Health',
        effects: { radiation: 22, crewHealth: -14, science: 5 },
        educationalOutcome:
          'Hazardous decision! Saving electricity is never worth exposing astronauts to a solar storm—radiation spiked by +22% and hurt crew health.',
        isBalancedChoice: false,
      },
    ],
  },
  {
    id: 'oxygen-electrolyzer-maintenance',
    title: 'Oxygen System Catalyst Fouling',
    severity: 'warning',
    situationSimple:
      'Fine planetary dust and salt crystals are clogging the primary oxygen generator filter. Oxygen output is dropping by 30%!',
    nasaScienceContext:
      'NASA Science: On the ISS and future Mars habitats, Environmental Control and Life Support Systems (ECLSS) require regular filter and catalyst replacements to prevent CO₂ buildup.',
    options: [
      {
        id: 'replace-filters-materials',
        label: 'Spend 15 Materials & 6 Power to Rebuild the Catalyst Stack Now',
        tradeOffTag: '-15 Materials · -6 Power · +12 Oxygen · +3 Health',
        effects: { materials: -15, power: -6, oxygen: 12, crewHealth: 3 },
        educationalOutcome:
          'Great preventative maintenance! Spending spare parts early prevented hypoxia and restored full breathable air production.',
        isBalancedChoice: true,
      },
      {
        id: 'electrolyze-reserve-water',
        label: 'Crack Emergency Water Reserves into Oxygen Using High-Voltage Electrolysis',
        tradeOffTag: '-14 Water · -10 Power · +14 Oxygen',
        effects: { water: -14, power: -10, oxygen: 14 },
        educationalOutcome:
          'Clever chemical trade-off! Splitting H₂O into H₂ and O₂ gave the crew plenty of air to breathe, but depleted precious drinking and greenhouse water.',
        isBalancedChoice: true,
      },
      {
        id: 'lower-cabin-pressure',
        label: 'Lower Habitat Air Pressure & Ration Crew Breathing O₂',
        tradeOffTag: '-4 Oxygen · -10 Crew Health · +5 Power Saved',
        effects: { oxygen: -4, crewHealth: -10, power: 5 },
        educationalOutcome:
          'Risky shortcut! Lowering oxygen partial pressure made the astronauts dizzy and tired, hurting Crew Health.',
        isBalancedChoice: false,
      },
    ],
  },
  {
    id: 'greenhouse-hydroponic-leak',
    title: 'Greenhouse Nutrient Pump Failure',
    severity: 'warning',
    situationSimple:
      'A seal cracked on the hydroponic misting manifold inside the Greenhouse! Nutrient water is pooling on the floor and potato crops are wilting.',
    nasaScienceContext:
      'NASA Science: Space greenhouses rely on closed-loop water circulation. Any leak threatens both food crops and cabin humidity balance.',
    options: [
      {
        id: 'repair-manifold-recycle',
        label: 'Shut Down Lab for 1 Sol to Fabricate Replacement Seals & Recover Spilled Water',
        tradeOffTag: '-10 Materials · -6 Science · +8 Water · +8 Food',
        effects: { materials: -10, science: -6, water: 8, food: 8, crewHealth: 2 },
        educationalOutcome:
          'Balanced engineering! Pausing research let the crew 3D-print a new seal, saving both the harvest and the spilled water.',
        isBalancedChoice: true,
      },
      {
        id: 'harvest-early-ration',
        label: 'Harvest Surviving Crops Early and Shut Off the Leaking Hydroponic Bay',
        tradeOffTag: '+4 Food · -6 Water · -4 Oxygen',
        effects: { food: 4, water: -6, oxygen: -4 },
        educationalOutcome:
          'Conservative salvage! You saved some food right away, but losing growing plants reduced natural photosynthesis oxygen.',
        isBalancedChoice: false,
      },
      {
        id: 'overdrive-water-pumps',
        label: 'Pump Extra Reserve Water to Keep All Plants Alive Despite the Leak',
        tradeOffTag: '+10 Food · -18 Water · -8 Power',
        effects: { food: 10, water: -18, power: -8 },
        educationalOutcome:
          'Costly trade-off! The crops thrived, but ignoring the leak wasted 18 units of precious water and extra pumping power.',
        isBalancedChoice: false,
      },
    ],
  },
  {
    id: 'power-grid-bus-fault',
    title: 'Primary Power Bus Short Circuit',
    severity: 'critical',
    situationSimple:
      'Extreme day-night temperature swings (-15°C to -85°C) cracked an outdoor power cable junction box, causing a sudden voltage drop across the base.',
    nasaScienceContext:
      'NASA Science: Thermal cycling in space causes metals and plastics to expand and contract rapidly, stressing electrical cables and solar joints.',
    options: [
      {
        id: 'reroute-redundant-bus',
        label: 'Install Insulated Copper-Alloy Bypass & Balance Load Across Modules',
        tradeOffTag: '-16 Materials · +10 Power · +4 Comms',
        effects: { materials: -16, power: 10, comms: 4, crewHealth: 2 },
        educationalOutcome:
          'Textbook aerospace engineering! Redundant wiring paths ("fail-operational design") keep spacecraft and habitats safe when one cable fails.',
        isBalancedChoice: true,
      },
      {
        id: 'cut-heating-and-comms',
        label: 'Turn Off Deep Space Antenna & Cabin Heaters Until Morning',
        tradeOffTag: '+8 Power · -16 Comms · -8 Crew Health',
        effects: { power: 8, comms: -16, crewHealth: -8 },
        educationalOutcome:
          'Hard lesson! You prevented a total blackout, but losing cabin heat and Earth communications stressed the crew.',
        isBalancedChoice: false,
      },
      {
        id: 'overload-inverter',
        label: 'Bypass Safety Breakers to Force Full Power Through the Damaged Line',
        tradeOffTag: '+6 Science · -16 Power · -12 Materials',
        effects: { science: 6, power: -16, materials: -12 },
        educationalOutcome:
          'Never bypass spacecraft circuit breakers! The damaged line arced and melted, costing even more power and spare parts.',
        isBalancedChoice: false,
      },
    ],
  },
  {
    id: 'water-sublimator-freeze',
    title: 'Water Supply Ice-Extractor Freeze-Up',
    severity: 'warning',
    situationSimple:
      'Cryogenic subsurface ice has jammed the heated drill bit on your water extractor, cutting fresh water inflow in half.',
    nasaScienceContext:
      'NASA Science: Lunar polar ice at -200°C is as hard as granite rock! Extracting it requires high-power thermal drills and vacuum ovens.',
    options: [
      {
        id: 'thermal-thaw-cycle',
        label: 'Divert 12 Power to Thermal Heaters to Thaw the Drill Core Safely',
        tradeOffTag: '-12 Power · +14 Water · +4 O₂',
        effects: { power: -12, water: 14, oxygen: 4 },
        educationalOutcome:
          'Smart thermal management! Using controlled electrical heat melted the ice plug and refilled your water tanks cleanly.',
        isBalancedChoice: true,
      },
      {
        id: 'strict-water-rationing',
        label: 'Cancel Crew Showers & Halve Greenhouse Irrigation for 1 Sol',
        tradeOffTag: '+6 Water · -6 Food · -5 Crew Health',
        effects: { water: 6, food: -6, crewHealth: -5 },
        educationalOutcome:
          'Tough trade-off! Rationing saved drinking water, but dehydrated crops and reduced crew morale and hygiene.',
        isBalancedChoice: true,
      },
      {
        id: 'mechanical-percussion-force',
        label: 'Rev Drill Torque to 200% to Smash Through the Frozen Core',
        tradeOffTag: '+8 Water · -18 Materials · -8 Power',
        effects: { water: 8, materials: -18, power: -8 },
        educationalOutcome:
          'Brittle metal shatters at cryogenic temperatures! Forcing the drill broke two tungsten bits, costing 18 Materials.',
        isBalancedChoice: false,
      },
    ],
  },
  {
    id: 'comms-solar-conjunction',
    title: 'Ionospheric Interference & Comms Delay',
    severity: 'warning',
    situationSimple:
      'Charged solar wind plasma is scattering your radio telemetry beam to NASA Mission Control in Houston. Packet loss is at 65%!',
    nasaScienceContext:
      'NASA Science: Deep space communication uses high-frequency Ka-band radio or laser optical links, which require precise pointing and error-correcting codes.',
    options: [
      {
        id: 'realign-dish-boost-gain',
        label: 'Spend 8 Power to Boost Amplifier Gain & Switch to Error-Correcting Telemetry',
        tradeOffTag: '-8 Power · +14 Comms · +8 Science',
        effects: { power: -8, comms: 14, science: 8 },
        educationalOutcome:
          'Spot-on telecommunications engineering! Boosting signal-to-noise ratio kept Mission Control connected and uploaded bonus science data.',
        isBalancedChoice: true,
      },
      {
        id: 'store-data-locally',
        label: 'Buffer Science Data Onboard & Operate Autonomously Until Static Clears',
        tradeOffTag: '-6 Comms · +6 Science · +4 Power',
        effects: { comms: -6, science: 6, power: 4 },
        educationalOutcome:
          'Practical autonomy! Storing data onboard saved electricity while waiting for clear skies, though real-time Comms dipped slightly.',
        isBalancedChoice: true,
      },
      {
        id: 'transmit-uncompressed',
        label: 'Blast Continuous Uncompressed Broadcasts on All Frequencies',
        tradeOffTag: '-16 Power · -8 Comms',
        effects: { power: -16, comms: -8 },
        educationalOutcome:
          'Wasteful broadcasting! Sending uncalibrated signals through plasma static drained 16 Power without improving reception.',
        isBalancedChoice: false,
      },
    ],
  },
  {
    id: 'subsurface-ice-vein-discovery',
    title: 'Rover Ground-Penetrating Radar Discovery!',
    severity: 'opportunity',
    situationSimple:
      'Your surface rover’s radar just detected a pristine pocket of buried water ice and titanium-rich regolith 120 meters from the base!',
    nasaScienceContext:
      'NASA Science: In-Situ Resource Utilization (ISRU)—living off the land by mining local ice and minerals—is the key to permanent Moon and Mars bases.',
    options: [
      {
        id: 'balanced-core-excavation',
        label: 'Deploy Automated Rover Scoop to Harvest Both Ice & Construction Regolith',
        tradeOffTag: '-8 Power · +12 Water · +22 Materials · +10 Science',
        effects: { power: -8, water: 12, materials: 22, science: 10 },
        educationalOutcome:
          'Outstanding ISRU operation! Using robotic excavation turned 8 units of rover battery power into water, building blocks, and geological data.',
        isBalancedChoice: true,
      },
      {
        id: 'sterile-astrobiology-core',
        label: 'Seal the Site for Ultra-Clean Astrobiology Sampling Only',
        tradeOffTag: '-6 Power · +24 Science · +5 Materials',
        effects: { power: -6, science: 24, materials: 5 },
        educationalOutcome:
          'Great planetary protection science! Preserving pristine ice cores yielded huge scientific insights.',
        isBalancedChoice: true,
      },
      {
        id: 'strip-mine-overtime',
        label: 'Push Crew on a Double-Shift EVA to Haul Maximum Ore by Hand',
        tradeOffTag: '+35 Materials · -12 Crew Health · +8 Radiation · -8 O₂',
        effects: { materials: 35, crewHealth: -12, radiation: 8, oxygen: -8 },
        educationalOutcome:
          'Overworking astronauts outside is dangerous! You hauled lots of ore, but exhausted the crew and increased radiation exposure.',
        isBalancedChoice: false,
      },
    ],
  },
];

export function getInitialResources(
  mission: MissionTarget,
  difficulty: DifficultyLevel,
  selectedCrew: CrewRoleId[]
): ResourceState {
  const cfg = MISSIONS[mission];
  const diffMult = difficulty === 'easy' ? 1.15 : difficulty === 'medium' ? 1.0 : 0.85;
  const hasCommander = selectedCrew.includes('commander');

  return {
    oxygen: Math.min(100, Math.round(82 * diffMult)),
    water: Math.min(100, Math.round(80 * diffMult)),
    food: Math.min(100, Math.round(80 * diffMult)),
    power: Math.min(100, Math.round(84 * diffMult)),
    crewHealth: 95,
    radiation: mission === 'moon' ? 12 : 8,
    comms: Math.min(100, Math.round(78 * diffMult) + (hasCommander ? 10 : 0)),
    materials: Math.round(cfg.startingMaterials * diffMult),
    science: 15,
  };
}

export function getInitialBuildings(): PlacedBuilding[] {
  return [
    { padIndex: 0, type: 'habitat', level: 1 },
    { padIndex: 1, type: 'solar', level: 1 },
    { padIndex: 2, type: 'oxygen', level: 1 },
  ];
}

export function calculateEffectiveBuildCost(
  type: BuildingTypeId,
  isUpgrade: boolean,
  currentLevel: number,
  selectedCrew: CrewRoleId[]
): number {
  const spec = BUILDING_SPECS[type];
  const base = isUpgrade ? spec.upgradeCost * currentLevel : spec.materialCost;
  const discount = selectedCrew.reduce((acc, roleId) => {
    const role = CREW_ROLES.find((r) => r.id === roleId);
    return acc + (role ? role.modifiers.buildCostDiscount : 0);
  }, 0);
  return Math.max(8, Math.round(base * (1 - Math.min(0.35, discount))));
}

/**
 * Calculates per-Sol net resource changes and trade-offs from placed buildings,
 * crew skills, planetary environment, and interactive power allocation sliders.
 */
export function calculatePerSolRates(
  mission: MissionTarget,
  difficulty: DifficultyLevel,
  buildings: PlacedBuilding[],
  selectedCrew: CrewRoleId[],
  allocation: PowerAllocation
): ResourceRates {
  const cfg = MISSIONS[mission];
  const diffDrain = difficulty === 'easy' ? 0.85 : difficulty === 'medium' ? 1.0 : 1.2;

  // Base crew metabolism & environmental drain per Sol (4 astronauts)
  let oxygenGen = 0;
  let oxygenDrain = 10 * diffDrain;
  let waterGen = 0;
  let waterDrain = 9 * diffDrain;
  let foodGen = 0;
  let foodDrain = 8 * diffDrain;
  let powerGen = 0;
  let powerDrain = 4 * diffDrain;
  let healthDelta = -2 * diffDrain;
  let commsDelta = -4 * diffDrain;
  let scienceGen = 2; // Base surface telemetry
  let totalShieldingPct = 0;

  // Crew modifiers
  let powerBonusPct = 0;
  let scienceBonusPct = 0;
  let healthBonus = 0;
  let radReductionPct = 0;

  for (const roleId of selectedCrew) {
    const role = CREW_ROLES.find((r) => r.id === roleId);
    if (role) {
      powerBonusPct += role.modifiers.powerBonusPct;
      scienceBonusPct += role.modifiers.scienceBonusPct;
      healthBonus += role.modifiers.healthRecoveryBonus;
      radReductionPct += role.modifiers.radiationReductionPct;
    }
  }

  const hasScientist = selectedCrew.includes('scientist');

  // Building contributions scaled by level and power allocation sliders
  const lifeMult = allocation.lifeSupportPct / 100;
  const sciMult = allocation.sciencePct / 100;
  const shieldMult = allocation.shieldingPct / 100;
  const greenMult = allocation.greenhousePct / 100;

  for (const b of buildings) {
    const spec = BUILDING_SPECS[b.type];
    const lvlScale = 1 + (b.level - 1) * 0.55;

    if (b.type === 'solar') {
      powerGen += spec.powerDeltaPerSol * lvlScale * cfg.solarMultiplier * (1 + powerBonusPct);
    } else if (b.type === 'oxygen' || b.type === 'water' || b.type === 'habitat') {
      // Controlled by Life Support allocation slider
      if (spec.powerDeltaPerSol < 0) {
        powerDrain += Math.abs(spec.powerDeltaPerSol) * lvlScale * lifeMult;
      }
      if (spec.oxygenDeltaPerSol > 0) {
        oxygenGen += spec.oxygenDeltaPerSol * lvlScale * lifeMult;
      } else {
        oxygenDrain += Math.abs(spec.oxygenDeltaPerSol) * lvlScale;
      }
      if (spec.waterDeltaPerSol > 0) {
        waterGen += spec.waterDeltaPerSol * lvlScale * lifeMult;
      } else {
        // Increasing oxygen electrolysis also consumes slightly more water
        const elecWaterMult = b.type === 'oxygen' ? lifeMult : 1;
        waterDrain += Math.abs(spec.waterDeltaPerSol) * lvlScale * elecWaterMult;
      }
      healthDelta += spec.healthDeltaPerSol * lvlScale * lifeMult;
      totalShieldingPct += spec.radiationShieldingPct * lvlScale;
      scienceGen += spec.scienceDeltaPerSol * lvlScale;
    } else if (b.type === 'greenhouse') {
      // Expanding food production consumes more electricity and water
      powerDrain += Math.abs(spec.powerDeltaPerSol) * lvlScale * greenMult;
      waterDrain += Math.abs(spec.waterDeltaPerSol) * lvlScale * greenMult;
      const botanyBonus = hasScientist ? 1.15 : 1.0;
      foodGen += spec.foodDeltaPerSol * lvlScale * greenMult * botanyBonus;
      oxygenGen += spec.oxygenDeltaPerSol * lvlScale * greenMult;
      healthDelta += spec.healthDeltaPerSol * lvlScale;
      scienceGen += spec.scienceDeltaPerSol * lvlScale;
    } else if (b.type === 'lab' || b.type === 'antenna') {
      // Increasing power for science/comms increases electricity & life-support draw
      powerDrain += Math.abs(spec.powerDeltaPerSol) * lvlScale * sciMult;
      oxygenDrain += Math.abs(spec.oxygenDeltaPerSol) * lvlScale * sciMult;
      waterDrain += Math.abs(spec.waterDeltaPerSol) * lvlScale * sciMult;
      commsDelta += spec.commsDeltaPerSol * lvlScale * sciMult;
      scienceGen += spec.scienceDeltaPerSol * lvlScale * sciMult * (1 + scienceBonusPct);
    } else if (b.type === 'shelter') {
      // Increasing radiation protection draws more power
      powerDrain += Math.abs(spec.powerDeltaPerSol) * lvlScale * shieldMult;
      oxygenDrain += Math.abs(spec.oxygenDeltaPerSol) * lvlScale;
      totalShieldingPct += spec.radiationShieldingPct * lvlScale * shieldMult;
      healthDelta += spec.healthDeltaPerSol * lvlScale * shieldMult;
    }
  }

  const clampedShielding = Math.min(85, Math.round(totalShieldingPct + radReductionPct * 100));
  const rawRadGain = (mission === 'moon' ? 9.5 : 6.5) * diffDrain;
  const radiationNet = Math.round((rawRadGain * (1 - clampedShielding / 100) - 2.2) * 10) / 10;

  return {
    oxygenNet: Math.round(oxygenGen - oxygenDrain),
    waterNet: Math.round(waterGen - waterDrain),
    foodNet: Math.round(foodGen - foodDrain),
    powerNet: Math.round(powerGen - powerDrain),
    healthNet: Math.round(healthDelta + healthBonus),
    radiationNet: Math.round(radiationNet),
    commsNet: Math.round(commsDelta),
    scienceNet: Math.max(1, Math.round(scienceGen)),
    totalShieldingPct: clampedShielding,
  };
}

/**
 * Advances simulation by 1 Sol, applying resource rates and realistic cascading engineering trade-offs
 * (e.g., if Power hits 0, life support and radiation shields brown out).
 */
export function applySolStep(
  current: ResourceState,
  rates: ResourceRates
): { next: ResourceState; warnings: string[] } {
  const warnings: string[] = [];

  let nextPower = Math.max(0, Math.min(100, current.power + rates.powerNet));
  let powerBrownoutPenalty = 0;
  if (current.power + rates.powerNet < 10) {
    powerBrownoutPenalty = 8;
    warnings.push('Power brownout! Low electricity reduced O₂ generation and cabin heating.');
  }

  const nextOxygen = Math.max(
    0,
    Math.min(100, current.oxygen + rates.oxygenNet - powerBrownoutPenalty)
  );
  const nextWater = Math.max(0, Math.min(100, current.water + rates.waterNet));
  const nextFood = Math.max(0, Math.min(100, current.food + rates.foodNet));
  const nextComms = Math.max(0, Math.min(100, current.comms + rates.commsNet));
  const nextRadiation = Math.max(
    0,
    Math.min(100, current.radiation + rates.radiationNet + (powerBrownoutPenalty > 0 ? 4 : 0))
  );

  // Crew health depends on having adequate Oxygen, Water, Food, Power, and low Radiation
  let healthPenalty = 0;
  if (nextOxygen < 25) {
    healthPenalty += 12;
    warnings.push('Critical Oxygen level (<25%) is endangering Crew Health!');
  }
  if (nextWater < 25) {
    healthPenalty += 9;
    warnings.push('Water shortage (<25%) is dehydrating the crew!');
  }
  if (nextFood < 25) {
    healthPenalty += 7;
    warnings.push('Food rationing (<25%) is weakening astronaut stamina!');
  }
  if (nextRadiation > 45) {
    healthPenalty += Math.round((nextRadiation - 40) * 0.25);
    warnings.push('Elevated radiation exposure (>45%) is damaging crew health!');
  }

  const nextHealth = Math.max(
    0,
    Math.min(100, current.crewHealth + rates.healthNet - healthPenalty)
  );

  // Passive regolith material recovery by surface rover (+6/Sol)
  const nextMaterials = current.materials + 6;
  const nextScience = current.science + (powerBrownoutPenalty > 0 ? 2 : rates.scienceNet);

  return {
    next: {
      oxygen: nextOxygen,
      water: nextWater,
      food: nextFood,
      power: nextPower,
      crewHealth: nextHealth,
      radiation: nextRadiation,
      comms: nextComms,
      materials: nextMaterials,
      science: nextScience,
    },
    warnings,
  };
}

export interface MissionScoreReport {
  overallScore: number;
  completionPct: number;
  isSuccess: boolean;
  failureReason: string | null;
  breakdown: {
    crewSafety: number; // 0 - 100
    resourceEfficiency: number; // 0 - 100
    powerManagement: number; // 0 - 100
    foodProduction: number; // 0 - 100
    radiationProtection: number; // 0 - 100
    missionObjectives: number; // 0 - 100
  };
  balanceMultiplier: number;
  badges: { id: string; title: string; description: string; unlocked: boolean }[];
  learningPointsTotal: number;
  summaryFeedback: string;
}

/**
 * Evaluates balanced mission performance.
 * Explicitly penalizes unbalanced hoarding (maximizing one resource while neglecting others).
 */
export function evaluateMissionScore(params: {
  mission: MissionTarget;
  sol: number;
  targetSols: number;
  resources: ResourceState;
  buildings: PlacedBuilding[];
  balancedDecisionsCount: number;
  quizPoints: number;
}): MissionScoreReport {
  const { sol, targetSols, resources, buildings, balancedDecisionsCount, quizPoints } = params;

  // Check failure conditions
  let failureReason: string | null = null;
  if (resources.crewHealth <= 0) {
    failureReason = 'Crew Health dropped to 0%. Astronaut safety is always Priority #1.';
  } else if (resources.oxygen <= 0) {
    failureReason = 'Oxygen reserves depleted completely (0%). Life support failed.';
  } else if (resources.water <= 0) {
    failureReason = 'Water supply reached 0%. Closed-loop recycling collapsed.';
  } else if (resources.radiation >= 95) {
    failureReason = 'Radiation dose exceeded safe career limits (95%+).';
  }

  const crewSafety = Math.max(
    0,
    Math.min(100, Math.round(resources.crewHealth * 0.75 + (100 - resources.radiation) * 0.25))
  );

  // Resource efficiency rewards keeping O2, Water, Food, and Comms in the healthy 55-90% band
  const coreResources = [resources.oxygen, resources.water, resources.food, resources.comms];
  const minCore = Math.min(...coreResources);
  const maxCore = Math.max(...coreResources);
  const avgCore = coreResources.reduce((a, b) => a + b, 0) / coreResources.length;
  // Penalize wide imbalance if one resource is 100 and another is 15
  const imbalancePenalty = Math.max(0, (maxCore - minCore - 25) * 0.6);
  const resourceEfficiency = Math.max(0, Math.min(100, Math.round(avgCore - imbalancePenalty)));

  const hasSolar = buildings.some((b) => b.type === 'solar');
  const powerManagement = Math.max(
    0,
    Math.min(100, Math.round(resources.power * 0.8 + (hasSolar ? 20 : 0) - (resources.power < 20 ? 25 : 0)))
  );

  const greenhouseCount = buildings.filter((b) => b.type === 'greenhouse').length;
  const foodProduction = Math.max(
    0,
    Math.min(100, Math.round(resources.food * 0.7 + Math.min(30, greenhouseCount * 18)))
  );

  const shelterCount = buildings.filter((b) => b.type === 'shelter').length;
  const radiationProtection = Math.max(
    0,
    Math.min(100, Math.round((100 - resources.radiation) * 0.8 + Math.min(20, shelterCount * 15)))
  );

  const solProgress = Math.min(1, sol / Math.max(1, targetSols));
  const moduleProgress = Math.min(1, buildings.length / 6);
  const scienceProgress = Math.min(1, resources.science / 100);
  const safetyProgress = resources.crewHealth >= 75 && resources.radiation <= 25 ? 1 : 0.5;

  const missionObjectives = Math.round(
    (solProgress * 0.35 + moduleProgress * 0.25 + scienceProgress * 0.25 + safetyProgress * 0.15) * 100
  );

  // Balance multiplier rewards keeping all 6 pillars healthy rather than maxing just one
  const pillars = [
    crewSafety,
    resourceEfficiency,
    powerManagement,
    foodProduction,
    radiationProtection,
    missionObjectives,
  ];
  const lowestPillar = Math.min(...pillars);
  const balanceMultiplier = lowestPillar >= 65 ? 1.12 : lowestPillar < 35 ? 0.82 : 1.0;

  const rawAvg = pillars.reduce((a, b) => a + b, 0) / pillars.length;
  const overallScore = failureReason
    ? Math.min(45, Math.round(rawAvg * 0.5))
    : Math.min(100, Math.round(rawAvg * balanceMultiplier));

  const completionPct = Math.min(
    100,
    Math.round(((solProgress * 0.5 + moduleProgress * 0.25 + scienceProgress * 0.25) * 100))
  );

  const isSuccess = !failureReason && sol >= targetSols && overallScore >= 55;

  const badges = [
    {
      id: 'eclss-guardian',
      title: 'ECLSS Life-Support Guardian',
      description: 'Maintained Oxygen, Water, and Crew Health ≥ 75% simultaneously.',
      unlocked: !failureReason && resources.oxygen >= 75 && resources.water >= 75 && resources.crewHealth >= 75,
    },
    {
      id: 'radiation-shield-architect',
      title: 'Radiation Shield Architect',
      description: 'Built a Radiation Shelter and kept crew radiation exposure ≤ 20%.',
      unlocked: !failureReason && shelterCount >= 1 && resources.radiation <= 20,
    },
    {
      id: 'space-botanist',
      title: 'Cosmic Botanist',
      description: 'Operated a Hydroponic Greenhouse and maintained Food Supply ≥ 75%.',
      unlocked: !failureReason && greenhouseCount >= 1 && resources.food >= 75,
    },
    {
      id: 'nasa-systems-thinker',
      title: 'NASA Systems Engineer',
      description: 'Made 3+ balanced engineering trade-off decisions and earned ≥ 100 Science.',
      unlocked: !failureReason && balancedDecisionsCount >= 3 && resources.science >= 100,
    },
  ];

  const learningPointsTotal =
    quizPoints + balancedDecisionsCount * 25 + (isSuccess ? 100 : 25);

  const summaryFeedback = failureReason
    ? `${failureReason} Try building redundant life-support and power modules early, and balance your power sliders during storms.`
    : lowestPillar >= 65
      ? 'Outstanding balanced mission management! You protected Crew Health, recycled water and air, shielded against radiation, and hit your science targets without exhausting any single resource.'
      : 'Mission survived, but some systems ran dangerously thin. Remember: in space, over-investing in one resource at the expense of power or life support puts the whole outpost at risk!';

  return {
    overallScore,
    completionPct,
    isSuccess,
    failureReason,
    breakdown: {
      crewSafety,
      resourceEfficiency,
      powerManagement,
      foodProduction,
      radiationProtection,
      missionObjectives,
    },
    balanceMultiplier,
    badges,
    learningPointsTotal,
    summaryFeedback,
  };
}
