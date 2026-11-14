import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BuildingTypeId,
  MissionTarget,
  OUTPOST_PADS,
  PlacedBuilding,
  BUILDING_SPECS,
} from '../game/rules';

export interface MarsViewport3DProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  mission: MissionTarget;
  buildings: PlacedBuilding[];
  selectedPadIndex: number;
  selectedBuildType: BuildingTypeId;
  isStormActive: boolean;
  cameraPreset: 'overview' | 'rover' | 'top' | 'cinematic';
  onSelectPad: (padIndex: number) => void;
  onRoverCollectSample?: () => void;
}

// Pre-allocated scratch math objects outside the animation loop (Zero GC)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _color = new THREE.Color();

function createPlanetTextures(
  renderer: THREE.WebGLRenderer,
  target: MissionTarget
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;

  if (target === 'mars') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#e27b58');
    grad.addColorStop(0.25, '#c8522a');
    grad.addColorStop(0.5, '#9e3818');
    grad.addColorStop(0.75, '#bf4d28');
    grad.addColorStop(1, '#d98b6c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Polar ice caps
    ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    ctx.fillRect(0, 0, 512, 14);
    ctx.fillRect(0, 242, 512, 14);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(0.5, '#64748b');
    grad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
  }

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 256);

  // Deterministic craters and basalt plains
  let seed = target === 'mars' ? 1337 : 7331;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 120; i++) {
    const x = rand() * 512;
    const y = 20 + rand() * 216;
    const r = 3 + rand() * 22;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle =
      target === 'mars'
        ? `rgba(${80 + Math.floor(rand() * 60)}, ${25 + Math.floor(rand() * 30)}, 15, 0.35)`
        : `rgba(${50 + Math.floor(rand() * 50)}, ${60 + Math.floor(rand() * 50)}, 75, 0.4)`;
    ctx.fill();

    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fillStyle = 'rgb(60, 60, 60)';
    bCtx.fill();
    bCtx.lineWidth = 2;
    bCtx.strokeStyle = 'rgb(210, 210, 210)';
    bCtx.stroke();
  }

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAniso;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAniso;

  return { map, bumpMap };
}

function groundHeightAt(x: number, z: number): number {
  const distFromCenter = Math.hypot(x, z);
  // Keep central outpost build zone (radius < 28m) gently graded and flat on pads
  if (distFromCenter < 29) {
    return 0;
  }
  const rimFactor = Math.min(1, (distFromCenter - 29) / 45);
  const ridge =
    Math.sin(x * 0.06) * Math.cos(z * 0.06) * 6.5 * rimFactor +
    Math.cos(distFromCenter * 0.09) * 3.5 * rimFactor +
    rimFactor * rimFactor * 9.5;
  return Math.max(-1.5, ridge);
}

/**
 * Builds a composite 3-12 part procedural 3D model for each of the 8 outpost building types.
 */
function createBuildingMeshGroup(type: BuildingTypeId, level: number, isSoftwareGl: boolean): THREE.Group {
  const group = new THREE.Group();
  const accentColor = new THREE.Color(BUILDING_SPECS[type].accentHex);

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.65,
    metalness: 0.25,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.8,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.25,
    metalness: 0.5,
    emissive: accentColor,
    emissiveIntensity: 0.25,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: type === 'greenhouse' ? 0x34d399 : 0x38bdf8,
    roughness: 0.15,
    metalness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.75,
    transparent: true,
    opacity: isSoftwareGl ? 0.55 : 0.9,
  });

  // Base foundation plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.45, 16), darkMetalMat);
  plinth.position.y = 0.225;
  plinth.castShadow = !isSoftwareGl;
  plinth.receiveShadow = !isSoftwareGl;
  group.add(plinth);

  if (type === 'habitat') {
    // 1. Main pressurized geodesic dome
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hullMat
    );
    dome.position.y = 0.4;
    group.add(dome);

    // 2. Structural rib ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.12, 8, 24), darkMetalMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.55;
    group.add(ring);

    // 3. Airlock tunnel cylinder
    const airlock = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.8, 12), darkMetalMat);
    airlock.rotation.x = Math.PI / 2;
    airlock.position.set(0, 1.1, 2.3);
    group.add(airlock);

    // 4. Airlock viewport
    const viewport = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), glassMat);
    viewport.position.set(0, 1.1, 3.22);
    group.add(viewport);

    // 5. Top comms/sensor mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.4, 8), accentMat);
    mast.position.set(0, 3.2, 0);
    group.add(mast);

    if (level >= 2) {
      const annex = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 1.4, 8, 12), hullMat);
      annex.rotation.z = Math.PI / 2;
      annex.position.set(2.2, 1.2, 0);
      group.add(annex);
    }
    if (level >= 3) {
      const annexLeft = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 1.4, 8, 12), hullMat);
      annexLeft.rotation.z = Math.PI / 2;
      annexLeft.position.set(-2.2, 1.2, 0);
      group.add(annexLeft);
    }
  } else if (type === 'solar') {
    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.2,
    });

    // 1. Central tracking pylon
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.4, 12), darkMetalMat);
    pylon.position.y = 1.4;
    group.add(pylon);

    // 2. Crossbar axle
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5.6, 8), hullMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.y = 2.4;
    group.add(crossbar);

    // 3 & 4. Dual angled photovoltaic wings
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 3.4), solarPanelMat);
      wing.position.set(side * 1.55, 2.45, 0);
      wing.rotation.x = 0.35;
      group.add(wing);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 3.5), accentMat);
      frame.position.set(side * 1.55, 2.42, 0);
      frame.rotation.x = 0.35;
      group.add(frame);
    }

    // 5. Battery inverter cabinet
    const batteryBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.1), hullMat);
    batteryBox.position.set(0, 0.85, 1.4);
    group.add(batteryBox);

    if (level >= 2) {
      const extraWing = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 1.6), solarPanelMat);
      extraWing.position.set(0, 3.2, -1.6);
      extraWing.rotation.x = 0.35;
      group.add(extraWing);
    }
  } else if (type === 'oxygen') {
    // MOXIE CO2 Splitter & O2 Cryo Tanks
    const coreTower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 3.0, 14), hullMat);
    coreTower.position.set(0, 1.9, 0);
    group.add(coreTower);

    for (const side of [-1, 1]) {
      const o2Tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.65, 1.3, 8, 12), accentMat);
      o2Tank.position.set(side * 1.65, 1.6, 0.4);
      group.add(o2Tank);
    }

    const intakeHood = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.7, 14), darkMetalMat);
    intakeHood.position.set(0, 3.7, 0);
    group.add(intakeHood);

    const statusRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 8, 20), accentMat);
    statusRing.rotation.x = Math.PI / 2;
    statusRing.position.y = 2.6;
    group.add(statusRing);
  } else if (type === 'water') {
    // Closed-loop water distillation & ice processor
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const vat = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.3, 14), hullMat);
      vat.position.set(Math.cos(angle) * 1.3, 1.55, Math.sin(angle) * 1.3);
      group.add(vat);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), accentMat);
      cap.position.set(Math.cos(angle) * 1.3, 2.7, Math.sin(angle) * 1.3);
      group.add(cap);
    }
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.2, 10), darkMetalMat);
    manifold.position.set(0, 2.0, 0);
    group.add(manifold);
  } else if (type === 'greenhouse') {
    // Transparent vaulted agricultural biodome with green crop beds inside
    const bioDome = new THREE.Mesh(
      new THREE.SphereGeometry(2.75, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      glassMat
    );
    bioDome.position.y = 0.42;
    bioDome.renderOrder = 2;
    group.add(bioDome);

    const cropMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.5,
      metalness: 0.1,
      emissive: 0x059669,
      emissiveIntensity: 0.3,
    });

    for (const rowX of [-1.1, 0, 1.1]) {
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 3.2), darkMetalMat);
      tray.position.set(rowX, 0.65, 0);
      group.add(tray);

      const plants = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 3.0), cropMat);
      plants.position.set(rowX, 1.1, 0);
      group.add(plants);
    }

    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.76, 0.08, 8, 24, Math.PI), accentMat);
    arch.position.y = 0.42;
    group.add(arch);
  } else if (type === 'antenna') {
    // Deep Space Network high-gain parabolic dish
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.85, 2.6, 8), darkMetalMat);
    tower.position.y = 1.7;
    group.add(tower);

    const dishGroup = new THREE.Group();
    dishGroup.position.set(0, 3.2, 0);
    dishGroup.rotation.x = -0.45;

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 20, 12, 0, Math.PI * 2, 0, 0.9),
      hullMat
    );
    dish.rotation.x = Math.PI;
    dishGroup.add(dish);

    const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 1.5, 8), accentMat);
    feedHorn.position.y = -0.9;
    dishGroup.add(feedHorn);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), accentMat);
    beacon.position.y = -1.65;
    dishGroup.add(beacon);

    group.add(dishGroup);
  } else if (type === 'shelter') {
    // Reinforced regolith & boron-polyethylene bunker
    const regolithMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.9,
      metalness: 0.1,
    });
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.8, 8), regolithMat);
    vault.position.y = 1.3;
    group.add(vault);

    const armorCap = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.45, 3.8), darkMetalMat);
    armorCap.position.y = 2.3;
    group.add(armorCap);

    const shieldEmitter = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), accentMat);
    shieldEmitter.position.y = 3.1;
    group.add(shieldEmitter);

    const blastDoor = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.4, 0.6), hullMat);
    blastDoor.position.set(0, 1.1, 2.8);
    group.add(blastDoor);
  } else if (type === 'lab') {
    // Twin research modules + spectrometer turret
    const mainLab = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 2.2), hullMat);
    mainLab.position.set(0, 1.3, -0.3);
    group.add(mainLab);

    const labStripe = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.3, 2.3), accentMat);
    labStripe.position.set(0, 1.7, -0.3);
    group.add(labStripe);

    const cleanroom = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.0, 14), darkMetalMat);
    cleanroom.position.set(1.2, 1.4, 1.2);
    group.add(cleanroom);

    const laserTurret = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), glassMat);
    laserTurret.position.set(-1.1, 2.45, -0.3);
    group.add(laserTurret);
  }

  // Upgrade level badge pillars around the plinth
  for (let l = 0; l < level; l++) {
    const pip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55 + l * 0.25, 0.32), accentMat);
    pip.position.set(-1.2 + l * 1.2, 0.6, -2.9);
    group.add(pip);
  }

  return group;
}

/**
 * Builds a multi-part 3D Astronaut figure (helmet, gold visor, torso, PLSS backpack, limbs).
 */
function createAstronautMesh(): THREE.Group {
  const astro = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55, metalness: 0.2 });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.15,
    metalness: 0.9,
    emissive: 0x78350f,
    emissiveIntensity: 0.2,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.5 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.95, 0.48), suitMat);
  torso.position.y = 1.25;
  astro.add(torso);

  // Chest control unit
  const dcu = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.15), trimMat);
  dcu.position.set(0, 1.32, 0.28);
  astro.add(dcu);

  // PLSS Life-Support Backpack
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.88, 0.38), suitMat);
  backpack.position.set(0, 1.3, -0.38);
  astro.add(backpack);

  // Helmet + Gold Visor
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), suitMat);
  helmet.position.set(0, 2.02, 0);
  astro.add(helmet);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 12), visorMat);
  visor.position.set(0, 2.02, 0.12);
  astro.add(visor);

  // Arms & Legs
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 6, 8), suitMat);
    arm.position.set(side * 0.5, 1.25, 0.1);
    arm.rotation.x = -0.3;
    astro.add(arm);

    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.62, 6, 8), suitMat);
    leg.position.set(side * 0.22, 0.45, 0);
    astro.add(leg);
  }

  return astro;
}

/**
 * Builds a multi-part 6-wheeled NASA Mars/Lunar Rover.
 */
function createRoverMesh(): THREE.Group {
  const rover = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4, metalness: 0.6 });
  const goldFoilMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.85 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.3 });
  const camEyeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.8,
  });

  // Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.65, 2.2), bodyMat);
  chassis.position.y = 0.75;
  rover.add(chassis);

  // Gold thermal blanket deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 1.6), goldFoilMat);
  deck.position.set(0, 1.15, -0.1);
  rover.add(deck);

  // RTG power source angled at rear
  const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.95, 10), bodyMat);
  rtg.rotation.x = 0.6;
  rtg.position.set(0, 1.05, -1.25);
  rover.add(rtg);

  // Remote sensing mast & SuperCam head
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.15, 8), bodyMat);
  mast.position.set(0.35, 1.65, 0.65);
  rover.add(mast);

  const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.36), bodyMat);
  camHead.position.set(0.35, 2.25, 0.68);
  rover.add(camHead);

  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 12), camEyeMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0.35, 2.25, 0.88);
  rover.add(lens);

  // 6 Rocker-Bogie Wheels
  for (const side of [-0.95, 0.95]) {
    for (const zOff of [-0.95, 0, 0.95]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.32, 14), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side, 0.38, zOff);
      rover.add(wheel);
    }
  }

  return rover;
}

/**
 * Builds the Orbital Space Station for the Title / Orbital view.
 */
function createOrbitalStationMesh(): THREE.Group {
  const station = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.8 });
  const darkTrussMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.7 });
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0x1e40af,
    emissiveIntensity: 0.35,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
  });

  // Main integrated truss spine
  const truss = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.35, 0.35), darkTrussMat);
  station.add(truss);

  // Pressurized Destiny/Gateway habitat cylinder
  const habCore = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 4.2, 16), metalMat);
  habCore.rotation.x = Math.PI / 2;
  station.add(habCore);

  // Rotating artificial-gravity centrifuge ring
  const habRing = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.22, 12, 32), metalMat);
  station.add(habRing);

  // Cupola observation dome
  const cupola = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), glowMat);
  cupola.position.set(0, 0, 2.25);
  station.add(cupola);

  // 4 Double Solar Wings
  for (const xPos of [-3.4, -2.0, 2.0, 3.4]) {
    for (const yDir of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.8, 0.06), solarMat);
      wing.position.set(xPos, yDir * 1.65, 0);
      wing.rotation.y = 0.25;
      station.add(wing);
    }
  }

  return station;
}

export const MarsViewport3D: React.FC<MarsViewport3DProps> = ({
  gameState,
  mission,
  buildings,
  selectedPadIndex,
  isStormActive,
  cameraPreset,
  onSelectPad,
  onRoverCollectSample,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store latest props in refs so the 60fps/afterDraw loop never re-mounts WebGLRenderer
  const stateRef = useRef({
    gameState,
    mission,
    buildings,
    selectedPadIndex,
    isStormActive,
    cameraPreset,
    onSelectPad,
    onRoverCollectSample,
  });
  stateRef.current = {
    gameState,
    mission,
    buildings,
    selectedPadIndex,
    isStormActive,
    cameraPreset,
    onSelectPad,
    onRoverCollectSample,
  };

  const sceneRefs = useRef<{
    rebuildBuildings?: () => void;
    updateMissionTheme?: () => void;
  }>({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initRect = container.getBoundingClientRect();
    const width = initRect.width || window.innerWidth;
    const height = initRect.height || window.innerHeight;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x1a0d0a, 0.008);

    // 2. Mandatory Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 450);
    camera.position.set(0, 26, 42);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 12;
    controls.maxDistance = 95;
    controls.target.set(0, 1, 0);

    // 3. Balanced 3-Point Studio & Planetary Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xfde68a, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    keyLight.position.set(38, 52, 28);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -45;
      keyLight.shadow.camera.right = 45;
      keyLight.shadow.camera.top = 45;
      keyLight.shadow.camera.bottom = -45;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-35, 22, -30);
    scene.add(rimLight);

    // Starfield background (Points)
    const starCount = 900;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 140 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 12;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 1.1,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // =========================================================================
    // GROUP A: TITLE SCREEN ORBITAL SHOWCASE (3D Mars Globe + Space Station + Floating Astronaut)
    // =========================================================================
    const orbitalGroup = new THREE.Group();
    scene.add(orbitalGroup);

    const marsTex = createPlanetTextures(renderer, 'mars');
    const moonTex = createPlanetTextures(renderer, 'moon');

    const globeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: marsTex.map,
      bumpMap: marsTex.bumpMap,
      bumpScale: 0.35,
      roughness: 0.78,
      metalness: 0.1,
    });
    const planetGlobe = new THREE.Mesh(new THREE.SphereGeometry(8.5, 48, 36), globeMat);
    planetGlobe.position.set(7.5, 1.5, 0);
    orbitalGroup.add(planetGlobe);

    // Subtle atmosphere halo around globe
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
    });
    const atmoHalo = new THREE.Mesh(new THREE.SphereGeometry(9.25, 32, 24), atmoMat);
    atmoHalo.position.copy(planetGlobe.position);
    orbitalGroup.add(atmoHalo);

    const orbitalStation = createOrbitalStationMesh();
    orbitalStation.position.set(1.5, 6.2, 8.5);
    orbitalStation.scale.setScalar(0.75);
    orbitalGroup.add(orbitalStation);

    const floatingAstronaut = createAstronautMesh();
    floatingAstronaut.position.set(2.2, -1.8, 12.5);
    floatingAstronaut.rotation.set(0.2, -0.45, 0.15);
    floatingAstronaut.scale.setScalar(1.15);
    orbitalGroup.add(floatingAstronaut);

    // =========================================================================
    // GROUP B: SURFACE OUTPOST & BASE-BUILDING ENVIRONMENT
    // =========================================================================
    const surfaceGroup = new THREE.Group();
    scene.add(surfaceGroup);

    // Terrain Geometry with crater rim and natural mountain ridges
    const terrainGeo = new THREE.PlaneGeometry(180, 180, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, groundHeightAt(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xb4532a,
      bumpMap: marsTex.bumpMap,
      bumpScale: 0.4,
      roughness: 0.88,
      metalness: 0.08,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = !isSoftwareGl;
    surfaceGroup.add(terrainMesh);

    // Instanced Rocks & Boulders on the surrounding crater perimeter (>20 instances -> InstancedMesh)
    const rockCount = 72;
    const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.85,
      metalness: 0.12,
    });
    const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2 + (i % 3) * 0.2;
      const dist = 30 + (i % 7) * 6.5;
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;
      const ry = groundHeightAt(rx, rz);
      _dummyObj.position.set(rx, ry + 0.35, rz);
      _dummyObj.rotation.set(i * 0.7, i * 1.1, i * 0.4);
      const s = 0.65 + (i % 5) * 0.42;
      _dummyObj.scale.set(s * 1.2, s * 0.8, s);
      _dummyObj.updateMatrix();
      rockInstanced.setMatrixAt(i, _dummyObj.matrix);

      _color.setHSL(0.05, 0.45, 0.32 + (i % 4) * 0.05);
      rockInstanced.setColorAt(i, _color);
    }
    rockInstanced.instanceMatrix.needsUpdate = true;
    if (rockInstanced.instanceColor) rockInstanced.instanceColor.needsUpdate = true;
    rockInstanced.computeBoundingSphere();
    surfaceGroup.add(rockInstanced);

    // 12 Outpost Construction Pads & Raycastable Hit Meshes
    const padInteractables: THREE.Object3D[] = [];
    const padRings: THREE.Mesh[] = [];
    const padPlatesGroup = new THREE.Group();
    surfaceGroup.add(padPlatesGroup);

    const padBaseGeo = new THREE.CylinderGeometry(4.1, 4.3, 0.16, 20);
    const padBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.4,
    });
    const ringGeo = new THREE.RingGeometry(4.2, 4.65, 24);
    ringGeo.rotateX(-Math.PI / 2);

    OUTPOST_PADS.forEach((pad) => {
      const plate = new THREE.Mesh(padBaseGeo, padBaseMat);
      plate.position.set(pad.x, 0.08, pad.z);
      plate.userData = { padIndex: pad.index };
      padPlatesGroup.add(plate);
      padInteractables.push(plate);

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pad.x, 0.04, pad.z);
      padPlatesGroup.add(ring);
      padRings.push(ring);
    });

    // Pressurized Walkway Corridors connecting core pads
    const walkwayMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
      metalness: 0.5,
    });
    const walkwayPairs: [number, number][] = [
      [0, 1],
      [1, 2],
      [0, 3],
      [1, 4],
      [2, 5],
      [3, 4],
      [4, 5],
      [4, 7],
    ];
    walkwayPairs.forEach(([aIdx, bIdx]) => {
      const a = OUTPOST_PADS[aIdx];
      const b = OUTPOST_PADS[bIdx];
      const dist = Math.hypot(b.x - a.x, b.z - a.z);
      const road = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, dist), walkwayMat);
      road.position.set((a.x + b.x) / 2, 0.03, (a.z + b.z) / 2);
      road.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      surfaceGroup.add(road);
    });

    // Dynamic Buildings Container
    const buildingsContainer = new THREE.Group();
    surfaceGroup.add(buildingsContainer);

    // Controllable Surface Rover + Glowing Sample Crystal Target
    const roverMesh = createRoverMesh();
    roverMesh.position.set(-6, 0.02, 7);
    surfaceGroup.add(roverMesh);

    // Contact shadow beneath rover
    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 16),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.02;
    roverMesh.add(shadowDisc);

    // Geological Sample Node that rover can drive over to collect bonus Science & Materials
    const sampleNode = new THREE.Group();
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.6,
    });
    for (let c = 0; c < 3; c++) {
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), crystalMat);
      shard.position.set((c - 1) * 0.45, 0.55 + (c % 2) * 0.25, 0);
      shard.scale.set(0.7, 1.4, 0.7);
      sampleNode.add(shard);
    }
    sampleNode.position.set(7.5, 0, 8.5);
    surfaceGroup.add(sampleNode);

    // 2 Surface Astronauts patrolling the base
    const astro1 = createAstronautMesh();
    astro1.scale.setScalar(0.55);
    astro1.position.set(-5, 0, -5);
    surfaceGroup.add(astro1);

    const astro2 = createAstronautMesh();
    astro2.scale.setScalar(0.55);
    astro2.position.set(6, 0, -4);
    surfaceGroup.add(astro2);

    // Pooled Dust / Cosmic Particle Ring Buffer (Zero GC inside tick)
    const particleCount = 180;
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 70;
      particlePos[i * 3 + 1] = 0.5 + Math.random() * 18;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfdba74,
      size: 0.35,
      transparent: true,
      opacity: 0.45,
    });
    const dustParticles = new THREE.Points(particleGeo, particleMat);
    surfaceGroup.add(dustParticles);

    // Rebuild buildings helper
    const rebuildBuildings = () => {
      while (buildingsContainer.children.length > 0) {
        const child = buildingsContainer.children[0];
        buildingsContainer.remove(child);
      }
      const { buildings: currentBuildings, selectedPadIndex: selPad } = stateRef.current;

      currentBuildings.forEach((b) => {
        const pad = OUTPOST_PADS[b.padIndex];
        if (!pad) return;
        const meshGroup = createBuildingMeshGroup(b.type, b.level, isSoftwareGl);
        meshGroup.position.set(pad.x, 0.12, pad.z);
        buildingsContainer.add(meshGroup);
      });

      // Highlight selected pad ring
      padRings.forEach((ring, idx) => {
        const mat = ring.material as THREE.MeshBasicMaterial;
        const hasBld = currentBuildings.some((b) => b.padIndex === idx);
        if (idx === selPad) {
          mat.color.setHex(0xf59e0b);
          mat.opacity = 0.95;
          ring.scale.setScalar(1.08);
        } else if (hasBld) {
          mat.color.setHex(0x10b981);
          mat.opacity = 0.55;
          ring.scale.setScalar(1.0);
        } else {
          mat.color.setHex(0x38bdf8);
          mat.opacity = 0.35;
          ring.scale.setScalar(1.0);
        }
      });
    };

    const updateMissionTheme = () => {
      const { mission: curMission, isStormActive: storm, gameState: gs } = stateRef.current;
      if (gs === 'title') {
        scene.fog = null;
      } else if (curMission === 'mars') {
        scene.fog = new THREE.FogExp2(storm ? 0x451a03 : 0x1c100d, storm ? 0.022 : 0.0075);
      } else {
        scene.fog = new THREE.FogExp2(0x07090e, 0.0055);
      }

      if (curMission === 'mars') {
        globeMat.map = marsTex.map;
        globeMat.bumpMap = marsTex.bumpMap;
        atmoMat.color.setHex(0xf97316);
        terrainMat.color.setHex(0xb4532a);
        terrainMat.bumpMap = marsTex.bumpMap;
        rockMat.color.setHex(0x9a3412);
        particleMat.color.setHex(0xfdba74);
        particleMat.opacity = storm ? 0.85 : 0.35;
      } else {
        globeMat.map = moonTex.map;
        globeMat.bumpMap = moonTex.bumpMap;
        atmoMat.color.setHex(0x38bdf8);
        terrainMat.color.setHex(0x64748b);
        terrainMat.bumpMap = moonTex.bumpMap;
        rockMat.color.setHex(0x475569);
        particleMat.color.setHex(0x93c5fd);
        particleMat.opacity = 0.25;
      }
      globeMat.needsUpdate = true;
      terrainMat.needsUpdate = true;
    };

    sceneRefs.current.rebuildBuildings = rebuildBuildings;
    sceneRefs.current.updateMissionTheme = updateMissionTheme;
    rebuildBuildings();
    updateMissionTheme();

    // Set initial camera framing immediately for title vs playing state
    let prevGameState = stateRef.current.gameState;
    if (prevGameState === 'title') {
      camera.position.set(0, 1.2, 22);
      camera.lookAt(2.5, 0.5, 0);
    } else {
      camera.position.set(0, 26, 42);
      controls.target.set(0, 1, 0);
      controls.update();
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting on pad click
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (stateRef.current.gameState !== 'playing') return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(padInteractables, false);
      if (hits.length > 0) {
        const padIdx = hits[0].object.userData?.padIndex;
        if (typeof padIdx === 'number') {
          stateRef.current.onSelectPad(padIdx);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Keyboard input for Rover exploration (WASD / Arrow keys)
    const keysPressed = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        keysPressed.add(e.code);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };
    const onBlur = () => {
      keysPressed.clear();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // ResizeObserver for crisp responsive viewport
    const onResize = () => {
      if (!container) return;
      const r = container.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.setSize(r.width, r.height);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', onResize);

    // 4. Animation Loop with clamped dt & Software-WebGL afterDraw pacing
    let frameId = 0;
    let isDisposed = false;
    let lastTimeMs = performance.now();
    let elapsedTotal = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const nowMs = performance.now();
      const rawDt = (nowMs - lastTimeMs) / 1000;
      lastTimeMs = nowMs;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      elapsedTotal += dt;

      const { gameState: gs, cameraPreset: preset, isStormActive: storm } = stateRef.current;

      if (gs !== prevGameState) {
        updateMissionTheme();
        if (gs === 'title') {
          camera.position.set(0, 1.2, 22);
          camera.lookAt(2.5, 0.5, 0);
        } else if (prevGameState === 'title') {
          camera.position.set(0, 26, 42);
          controls.target.set(0, 1, 0);
          controls.update();
        }
        prevGameState = gs;
      }

      if (gs === 'title') {
        orbitalGroup.visible = true;
        surfaceGroup.visible = false;
        controls.enabled = false;

        // Smooth orbital rotation of Mars/Moon, Space Station, and Floating Astronaut
        planetGlobe.rotation.y += dt * 0.16;
        orbitalStation.rotation.y += dt * 0.25;
        orbitalStation.position.y = 5.4 + Math.sin(elapsedTotal * 1.1) * 0.45;
        floatingAstronaut.position.y = -1.6 + Math.sin(elapsedTotal * 1.6) * 0.35;
        floatingAstronaut.rotation.z = 0.15 + Math.cos(elapsedTotal * 1.2) * 0.08;

        camera.position.set(0, 1.2, 22);
        camera.lookAt(2.5, 0.5, 0);
      } else {
        orbitalGroup.visible = false;
        surfaceGroup.visible = true;
        controls.enabled = gs === 'playing';

        // Rover WASD / Arrow movement when in 'playing'
        if (gs === 'playing') {
          const moveFwd =
            (keysPressed.has('KeyW') || keysPressed.has('ArrowUp') ? 1 : 0) -
            (keysPressed.has('KeyS') || keysPressed.has('ArrowDown') ? 1 : 0);
          const turnDir =
            (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft') ? 1 : 0) -
            (keysPressed.has('KeyD') || keysPressed.has('ArrowRight') ? 1 : 0);

          if (turnDir !== 0) {
            roverMesh.rotation.y += turnDir * dt * 2.1;
          }
          if (moveFwd !== 0) {
            const speed = 9.0 * moveFwd * dt;
            const nextX = THREE.MathUtils.clamp(
              roverMesh.position.x + Math.sin(roverMesh.rotation.y) * speed,
              -26,
              26
            );
            const nextZ = THREE.MathUtils.clamp(
              roverMesh.position.z + Math.cos(roverMesh.rotation.y) * speed,
              -26,
              26
            );
            roverMesh.position.set(nextX, 0.02, nextZ);
          }

          // Check if rover reached the glowing sample node
          const distToSample = Math.hypot(
            roverMesh.position.x - sampleNode.position.x,
            roverMesh.position.z - sampleNode.position.z
          );
          if (distToSample < 2.6) {
            // Relocate sample node and award bonus science/materials
            const nextAngle = elapsedTotal * 2.3;
            sampleNode.position.set(
              Math.cos(nextAngle) * 14,
              0,
              Math.sin(nextAngle) * 14
            );
            stateRef.current.onRoverCollectSample?.();
          }
        }

        // Rotate sample node crystal & animate patrolling astronauts
        sampleNode.rotation.y += dt * 1.4;
        astro1.position.x = -6 + Math.sin(elapsedTotal * 0.5) * 4.5;
        astro1.position.z = -5 + Math.cos(elapsedTotal * 0.5) * 3.0;
        astro1.rotation.y = Math.atan2(
          Math.cos(elapsedTotal * 0.5) * 4.5,
          -Math.sin(elapsedTotal * 0.5) * 3.0
        );

        astro2.position.x = 6 + Math.cos(elapsedTotal * 0.45) * 4.0;
        astro2.position.z = -4 + Math.sin(elapsedTotal * 0.45) * 4.0;
        astro2.rotation.y = Math.atan2(
          -Math.sin(elapsedTotal * 0.45) * 4.0,
          Math.cos(elapsedTotal * 0.45) * 4.0
        );

        // Update pooled dust particles in-place
        const pArr = particleGeo.attributes.position.array as Float32Array;
        const windSpeed = storm ? 18.0 : 3.2;
        for (let i = 0; i < particleCount; i++) {
          pArr[i * 3] += windSpeed * dt;
          if (pArr[i * 3] > 35) pArr[i * 3] = -35;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Camera framing presets with exponential damping
        if (preset === 'rover') {
          _vec3A.set(
            roverMesh.position.x - Math.sin(roverMesh.rotation.y) * 9,
            roverMesh.position.y + 5.5,
            roverMesh.position.z - Math.cos(roverMesh.rotation.y) * 9
          );
          _vec3B.set(roverMesh.position.x, 1.2, roverMesh.position.z);
          camera.position.lerp(_vec3A, 1 - Math.exp(-4 * dt));
          controls.target.lerp(_vec3B, 1 - Math.exp(-5 * dt));
        } else if (preset === 'top') {
          _vec3A.set(0, 52, 8);
          _vec3B.set(0, 0, 0);
          camera.position.lerp(_vec3A, 1 - Math.exp(-3 * dt));
          controls.target.lerp(_vec3B, 1 - Math.exp(-4 * dt));
        } else if (preset === 'cinematic') {
          _vec3A.set(Math.sin(elapsedTotal * 0.22) * 36, 18, Math.cos(elapsedTotal * 0.22) * 36);
          _vec3B.set(0, 1.5, 0);
          camera.position.lerp(_vec3A, 1 - Math.exp(-2 * dt));
          controls.target.lerp(_vec3B, 1 - Math.exp(-3 * dt));
        }
        controls.update();
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Trigger lightweight scene updates when buildings, pad selection, or mission theme changes
  useEffect(() => {
    sceneRefs.current.rebuildBuildings?.();
  }, [buildings, selectedPadIndex]);

  useEffect(() => {
    sceneRefs.current.updateMissionTheme?.();
  }, [mission, isStormActive]);

  return (
    <div
      ref={mountRef}
      data-testid="mars-viewport-3d"
      className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#07090e]"
    />
  );
};
