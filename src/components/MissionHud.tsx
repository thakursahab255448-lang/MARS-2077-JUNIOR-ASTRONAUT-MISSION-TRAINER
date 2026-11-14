import React, { useState } from 'react';
import {
  BUILDING_SPECS,
  BuildingTypeId,
  CREW_ROLES,
  CrewRoleId,
  DifficultyLevel,
  MISSIONS,
  MissionTarget,
  OUTPOST_PADS,
  PlacedBuilding,
  PowerAllocation,
  ResourceRates,
  ResourceState,
  calculateEffectiveBuildCost,
} from '../game/rules';

export interface SolHistoryPoint {
  sol: number;
  oxygen: number;
  water: number;
  food: number;
  power: number;
  health: number;
}

export interface MissionHudProps {
  mission: MissionTarget;
  difficulty: DifficultyLevel;
  sol: number;
  resources: ResourceState;
  rates: ResourceRates;
  buildings: PlacedBuilding[];
  selectedCrew: CrewRoleId[];
  selectedPadIndex: number;
  selectedBuildType: BuildingTypeId;
  allocation: PowerAllocation;
  history: SolHistoryPoint[];
  warnings: string[];
  cameraPreset: 'overview' | 'rover' | 'top' | 'cinematic';
  isMuted: boolean;
  isDockCollapsed: boolean;
  onSelectPad: (idx: number) => void;
  onSelectBuildType: (t: BuildingTypeId) => void;
  onConstructOrUpgrade: (type: BuildingTypeId, padIndex: number) => void;
  onDemolishPad: (padIndex: number) => void;
  onChangeAllocation: (next: PowerAllocation) => void;
  onAdvanceSol: () => void;
  onTriggerChallengeNow: () => void;
  onChangeCameraPreset: (p: 'overview' | 'rover' | 'top' | 'cinematic') => void;
  onToggleDock: () => void;
  onOpenNasaModal: () => void;
  onOpenLearnModal: () => void;
  onOpenSetupModal: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onFinishReport: () => void;
}

const BUILDING_ORDER: BuildingTypeId[] = [
  'habitat',
  'solar',
  'oxygen',
  'water',
  'greenhouse',
  'antenna',
  'shelter',
  'lab',
];

function formatRate(val: number, invertColor = false): { text: string; tone: string } {
  const sign = val > 0 ? `+${val}` : `${val}`;
  if (val === 0) return { text: '0/s', tone: 'text-slate-400' };
  const isGood = invertColor ? val < 0 : val > 0;
  return {
    text: `${sign}/s`,
    tone: isGood ? 'text-emerald-400' : 'text-amber-400',
  };
}

export const MissionHud: React.FC<MissionHudProps> = ({
  mission,
  sol,
  resources,
  rates,
  buildings,
  selectedCrew,
  selectedPadIndex,
  selectedBuildType,
  allocation,
  history,
  warnings,
  cameraPreset,
  isMuted,
  isDockCollapsed,
  onSelectPad,
  onSelectBuildType,
  onConstructOrUpgrade,
  onDemolishPad,
  onChangeAllocation,
  onAdvanceSol,
  onTriggerChallengeNow,
  onChangeCameraPreset,
  onToggleDock,
  onOpenNasaModal,
  onOpenLearnModal,
  onOpenSetupModal,
  onToggleMute,
  onPause,
  onRestart,
  onFinishReport,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'tradeoffs' | 'telemetry' | 'camera'>('build');

  const cfg = MISSIONS[mission];
  const existingOnPad = buildings.find((b) => b.padIndex === selectedPadIndex);
  const activePad = OUTPOST_PADS[selectedPadIndex] || OUTPOST_PADS[0];
  const inspectedType = existingOnPad ? existingOnPad.type : selectedBuildType;
  const spec = BUILDING_SPECS[inspectedType];

  const isUpgrade = Boolean(existingOnPad);
  const currentLevel = existingOnPad ? existingOnPad.level : 0;
  const canUpgradeFurther = !existingOnPad || existingOnPad.level < 3;
  const actionCost = calculateEffectiveBuildCost(
    inspectedType,
    isUpgrade,
    currentLevel || 1,
    selectedCrew
  );
  const canAfford = resources.materials >= actionCost && canUpgradeFurther;

  const resourceWidgets = [
    {
      key: 'oxygen',
      label: 'OXYGEN',
      value: `${Math.round(resources.oxygen)}%`,
      rate: formatRate(rates.oxygenNet),
      critical: resources.oxygen < 30,
    },
    {
      key: 'water',
      label: 'WATER',
      value: `${Math.round(resources.water)}%`,
      rate: formatRate(rates.waterNet),
      critical: resources.water < 30,
    },
    {
      key: 'food',
      label: 'FOOD',
      value: `${Math.round(resources.food)}%`,
      rate: formatRate(rates.foodNet),
      critical: resources.food < 30,
    },
    {
      key: 'power',
      label: 'POWER',
      value: `${Math.round(resources.power)}%`,
      rate: formatRate(rates.powerNet),
      critical: resources.power < 25,
    },
    {
      key: 'health',
      label: 'HEALTH',
      value: `${Math.round(resources.crewHealth)}%`,
      rate: formatRate(rates.healthNet),
      critical: resources.crewHealth < 50,
    },
    {
      key: 'radiation',
      label: 'RAD DOSE',
      value: `${Math.round(resources.radiation)}%`,
      rate: formatRate(rates.radiationNet, true),
      critical: resources.radiation > 45,
    },
    {
      key: 'comms',
      label: 'COMMS',
      value: `${Math.round(resources.comms)}%`,
      rate: formatRate(rates.commsNet),
      critical: resources.comms < 30,
    },
    {
      key: 'materials',
      label: 'MATERIALS',
      value: `${Math.round(resources.materials)}`,
      rate: { text: '+6/s', tone: 'text-sky-400' },
      critical: false,
    },
    {
      key: 'science',
      label: 'SCIENCE',
      value: `${Math.round(resources.science)}`,
      rate: formatRate(rates.scienceNet),
      critical: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-4">
      {/* =====================================================================
          TOP PERIMETER TELEMETRY STRIP (Zero backdrop-filter over WebGL)
      ===================================================================== */}
      <div className="flex flex-col gap-1.5">
        <div className="pointer-events-auto flex flex-wrap xl:flex-nowrap items-center justify-between gap-2 bg-[#090d16]/95 border border-slate-800 rounded-xl px-3 py-1.5 shadow-xl">
          {/* Left: Mission Title & Sol Progress */}
          <div className="flex items-center gap-2 shrink-0">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm text-white tracking-wide whitespace-nowrap">
                  MARS 2077
                </span>
                <span className="text-[11px] font-mono text-amber-400 whitespace-nowrap">
                  {mission === 'mars' ? 'JEZERO' : 'SHACKLETON'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                SOL {sol}/{cfg.durationSols} · SHIELD {rates.totalShieldingPct}%
              </div>
            </div>
          </div>

          {/* Center: 9 Live Resource Readouts (Tabular Numerals) */}
          <div className="flex flex-wrap xl:flex-nowrap items-center gap-1.5">
            {resourceWidgets.map((w) => (
              <div
                key={w.key}
                className={`px-2 py-1 rounded-lg border font-mono shrink-0 ${
                  w.critical
                    ? 'bg-rose-950/90 border-rose-500 text-rose-100'
                    : 'bg-slate-900/95 border-slate-800 text-slate-100'
                }`}
              >
                <div className="text-[9px] tracking-wider text-slate-400 flex items-center justify-between gap-1">
                  <span>{w.label}</span>
                  <span className={w.rate.tone}>{w.rate.text}</span>
                </div>
                <div className="text-xs md:text-sm font-bold leading-tight tabular-nums">
                  {w.value}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Advance Sol CTA + Utility Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onAdvanceSol();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap shadow"
            >
              Advance Sol [Space]
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenNasaModal();
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 text-xs font-mono cursor-pointer whitespace-nowrap"
            >
              NASA Data
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenLearnModal();
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-mono cursor-pointer whitespace-nowrap hidden sm:inline-block"
            >
              Academy
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono cursor-pointer"
              title="Mute / Unmute [M]"
            >
              {isMuted ? 'MUTE' : 'SND'}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Mission"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono cursor-pointer"
              title="Pause [P / Esc]"
            >
              PAUSE
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart Mission"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono cursor-pointer hidden md:inline-block"
              title="Restart [R]"
            >
              RST
            </button>
          </div>
        </div>

        {/* Active Engineering Warnings Strip (Only shown if a system is strained) */}
        {warnings.length > 0 && (
          <div className="pointer-events-auto self-center bg-rose-950/95 border border-rose-500/80 text-rose-100 px-4 py-1.5 rounded-lg text-xs font-mono flex items-center gap-3 shadow-lg">
            <span className="font-bold text-rose-300">▲ SYSTEM ALERT:</span>
            <span>{warnings[0]}</span>
          </div>
        )}
      </div>

      {/* =====================================================================
          UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Zero side-panel clutter)
      ===================================================================== */}
      <div className="self-center w-full max-w-[960px] flex flex-col items-center">
        {/* Collapse / Expand Zen Mode Handle */}
        <div className="pointer-events-auto flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleDock();
            }}
            className="px-3.5 py-1 rounded-t-lg bg-[#090d16]/95 border border-b-0 border-slate-700 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
          >
            {isDockCollapsed ? '▴ Show Outpost Dock [H]' : '▾ Hide Controls (3D View) [H]'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerChallengeNow();
            }}
            className="px-3 py-1 rounded-t-lg bg-[#090d16]/95 border border-b-0 border-amber-500/50 text-xs font-mono text-amber-300 hover:text-amber-200 cursor-pointer"
          >
            Simulate Emergency Event
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onFinishReport();
            }}
            className="px-3 py-1 rounded-t-lg bg-[#090d16]/95 border border-b-0 border-sky-500/50 text-xs font-mono text-sky-300 hover:text-sky-200 cursor-pointer"
          >
            Evaluate Mission Score
          </button>
        </div>

        {!isDockCollapsed && (
          <div className="pointer-events-auto w-full bg-[#090d16]/95 border border-slate-800 rounded-xl p-3 shadow-2xl">
            {/* Dock Mode Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('build')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'build'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  1. Build Outpost ({buildings.length}/12)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tradeoffs')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'tradeoffs'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  2. Power Trade-Offs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('telemetry')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'telemetry'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  3. Mission Control
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('camera')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'camera'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  4. Camera & Rover
                </button>
              </div>

              {/* Pad Quick Selector */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <label htmlFor="pad-select" className="text-slate-400">
                  Selected Pad:
                </label>
                <select
                  id="pad-select"
                  value={selectedPadIndex}
                  onChange={(e) => onSelectPad(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-mono cursor-pointer"
                >
                  {OUTPOST_PADS.map((p) => {
                    const b = buildings.find((item) => item.padIndex === p.index);
                    return (
                      <option key={p.index} value={p.index}>
                        {p.label} {b ? `[${BUILDING_SPECS[b.type].shortName} L${b.level}]` : '[Empty]'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* TAB 1: BUILD & UPGRADE SPACE OUTPOST */}
            {activeTab === 'build' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* 8 Module Selector Buttons */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUILDING_ORDER.map((bType, idx) => {
                    const bSpec = BUILDING_SPECS[bType];
                    const isSelected = selectedBuildType === bType;
                    const cost = calculateEffectiveBuildCost(bType, false, 1, selectedCrew);
                    return (
                      <button
                        key={bType}
                        type="button"
                        onClick={() => onSelectBuildType(bType)}
                        className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>[{idx + 1}]</span>
                          <span className="text-amber-300">{cost} Mat</span>
                        </div>
                        <div className="font-display font-bold text-xs text-white truncate mt-0.5">
                          {bSpec.shortName}
                        </div>
                        <div className="text-[10px] font-mono text-sky-300 truncate mt-0.5">
                          {bSpec.powerDeltaPerSol > 0
                            ? `+${bSpec.powerDeltaPerSol} Pwr`
                            : `${bSpec.powerDeltaPerSol} Pwr`}{' '}
                          · {bSpec.category}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Pad & Construction Action Inspector */}
                <div className="bg-slate-900/95 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-amber-400">{activePad.label}</span>
                      <span className="text-slate-300">
                        {existingOnPad ? `Level ${existingOnPad.level}/3 Built` : 'Ready to Build'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-white">{spec.name}</div>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">{spec.tradeOffNote}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onConstructOrUpgrade(inspectedType, selectedPadIndex)}
                      className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      {existingOnPad
                        ? existingOnPad.level >= 3
                          ? 'Max Level (L3)'
                          : `Upgrade to L${existingOnPad.level + 1} (${actionCost} Mat)`
                        : `Build ${spec.shortName} (${actionCost} Mat)`}
                    </button>
                    {existingOnPad && (
                      <button
                        type="button"
                        onClick={() => onDemolishPad(selectedPadIndex)}
                        className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
                        title="Salvage structure (+10 Materials)"
                      >
                        Salvage
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: POWER & RESOURCE TRADE-OFF SLIDERS */}
            {activeTab === 'tradeoffs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <label htmlFor="slider-life" className="text-sky-300 font-semibold">
                      Life Support (O₂ / H₂O)
                    </label>
                    <span className="text-white">{allocation.lifeSupportPct}%</span>
                  </div>
                  <input
                    id="slider-life"
                    type="range"
                    min={50}
                    max={150}
                    step={10}
                    value={allocation.lifeSupportPct}
                    onChange={(e) =>
                      onChangeAllocation({ ...allocation, lifeSupportPct: Number(e.target.value) })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Higher setting boosts O₂, Water & Crew Health, but draws more Power.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <label htmlFor="slider-greenhouse" className="text-emerald-300 font-semibold">
                      Greenhouse Crop Drive
                    </label>
                    <span className="text-white">{allocation.greenhousePct}%</span>
                  </div>
                  <input
                    id="slider-greenhouse"
                    type="range"
                    min={50}
                    max={150}
                    step={10}
                    value={allocation.greenhousePct}
                    onChange={(e) =>
                      onChangeAllocation({ ...allocation, greenhousePct: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Expanding food production grows more Food & O₂, but uses extra Water & Power.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <label htmlFor="slider-shield" className="text-amber-300 font-semibold">
                      Radiation Shield Coils
                    </label>
                    <span className="text-white">{allocation.shieldingPct}%</span>
                  </div>
                  <input
                    id="slider-shield"
                    type="range"
                    min={50}
                    max={150}
                    step={10}
                    value={allocation.shieldingPct}
                    onChange={(e) =>
                      onChangeAllocation({ ...allocation, shieldingPct: Number(e.target.value) })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Increasing radiation protection lowers crew dose, requiring extra electricity.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <label htmlFor="slider-science" className="text-pink-300 font-semibold">
                      Science Lab & Comms
                    </label>
                    <span className="text-white">{allocation.sciencePct}%</span>
                  </div>
                  <input
                    id="slider-science"
                    type="range"
                    min={50}
                    max={150}
                    step={10}
                    value={allocation.sciencePct}
                    onChange={(e) =>
                      onChangeAllocation({ ...allocation, sciencePct: Number(e.target.value) })
                    }
                    className="w-full accent-pink-400 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Boosting research speeds up Science & Comms, reducing spare life-support power.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MISSION CONTROL DASHBOARD (Telemetry Chart, Objectives, Crew) */}
            {activeTab === 'telemetry' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Mission Objectives Checklist */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-xs font-mono uppercase text-amber-400 mb-2">
                    Mission Objectives Progress
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300">1. Surface Stay:</span>
                      <span className="text-white">
                        Sol {sol} / {cfg.durationSols}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300">2. Outpost Modules:</span>
                      <span className={buildings.length >= 6 ? 'text-emerald-400' : 'text-white'}>
                        {buildings.length} / 6 Built
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300">3. Science Research:</span>
                      <span className={resources.science >= 100 ? 'text-emerald-400' : 'text-white'}>
                        {resources.science} / 100 Pts
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300">4. Crew Health & Rad:</span>
                      <span
                        className={
                          resources.crewHealth >= 75 && resources.radiation <= 25
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }
                      >
                        {resources.crewHealth}% HP · {resources.radiation}% Rad
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Multi-Channel SVG Resource Trend Graph */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-sky-400">TELEMETRY TREND (O₂ / PWR / HP)</span>
                    <span className="text-[10px] text-slate-400">Cyan: O₂ · Amber: Pwr · Green: HP</span>
                  </div>
                  <svg viewBox="0 0 240 68" className="w-full h-16 bg-slate-950 rounded border border-slate-800">
                    {(['oxygen', 'power', 'health'] as const).map((key) => {
                      const stroke =
                        key === 'oxygen' ? '#38bdf8' : key === 'power' ? '#f59e0b' : '#10b981';
                      const pts = history
                        .map((h, i) => {
                          const x = 10 + (i / Math.max(1, history.length - 1)) * 220;
                          const y = 62 - (h[key] / 100) * 54;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ');
                      return (
                        <polyline
                          key={key}
                          fill="none"
                          stroke={stroke}
                          strokeWidth="2"
                          points={pts}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Active Crew Roster */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-emerald-400">ASSIGNED CREW ({selectedCrew.length})</span>
                      <button
                        type="button"
                        onClick={onOpenSetupModal}
                        className="text-sky-400 underline cursor-pointer"
                      >
                        Edit Crew
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedCrew.map((cId) => {
                        const r = CREW_ROLES.find((role) => role.id === cId);
                        if (!r) return null;
                        return (
                          <div key={cId} className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                            <div className="font-semibold text-white truncate">{r.astronautName}</div>
                            <div className="font-mono text-[10px] text-amber-400 truncate">{r.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CAMERA PRESETS & SURFACE ROVER EXPLORATION */}
            {activeTab === 'camera' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: 'overview', label: 'Outpost Overview Cam' },
                      { id: 'rover', label: 'Rover Chase Cam (WASD Drive)' },
                      { id: 'top', label: 'Top Blueprint Cam' },
                      { id: 'cinematic', label: 'Orbital Pan Cam' },
                    ] as const
                  ).map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => onChangeCameraPreset(cam.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                        cameraPreset === cam.id
                          ? 'bg-sky-400 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-slate-300">
                  Tip: Drive the 6-wheeled Rover into glowing blue ice crystals using{' '}
                  <span className="text-amber-400">WASD / Arrow Keys</span> for +8 Science & +8 Materials!
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
