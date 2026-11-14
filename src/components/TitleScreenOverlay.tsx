import React from 'react';
import {
  CREW_ROLES,
  CrewRoleId,
  DifficultyLevel,
  MISSIONS,
  MissionTarget,
} from '../game/rules';

export interface TitleScreenOverlayProps {
  mission: MissionTarget;
  difficulty: DifficultyLevel;
  selectedCrew: CrewRoleId[];
  isMuted: boolean;
  onSelectMission: (m: MissionTarget) => void;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  onStartMission: () => void;
  onOpenSetupModal: () => void;
  onOpenHowToPlay: () => void;
  onOpenLearnModal: () => void;
  onOpenRecordsModal: () => void;
  onToggleMute: () => void;
}

export const TitleScreenOverlay: React.FC<TitleScreenOverlayProps> = ({
  mission,
  difficulty,
  selectedCrew,
  isMuted,
  onSelectMission,
  onSelectDifficulty,
  onStartMission,
  onOpenSetupModal,
  onOpenHowToPlay,
  onOpenLearnModal,
  onOpenRecordsModal,
  onToggleMute,
}) => {
  const activeMission = MISSIONS[mission];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-10">
      {/* Top Bar: NASA Space Apps Kicker + Audio Mute Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="pointer-events-auto inline-flex items-center gap-3 px-3.5 py-1.5 rounded bg-[#0b101b]/90 border border-slate-800 text-xs text-slate-300">
          <span className="font-mono font-semibold text-amber-400">NASA SPACE APPS 2026</span>
          <span aria-hidden="true">·</span>
          <span>Junior Astronaut Mission Trainer</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#0b101b]/90 border border-slate-700 hover:border-amber-400 text-xs font-mono text-slate-200 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMuted ? (
              <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
            ) : (
              <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            )}
          </svg>
          <span>{isMuted ? 'Audio Muted [M]' : 'Audio Active [M]'}</span>
        </button>
      </div>

      {/* Left-Third Focal Column over Calm Negative Space */}
      <div className="pointer-events-auto max-w-xl w-full bg-[#090d16]/92 border border-slate-800/90 rounded-xl p-6 md:p-7 shadow-2xl">
        {/* Custom Inline SVG Title Emblem */}
        <div className="mb-4">
          <svg
            viewBox="0 0 520 110"
            className="w-full max-w-[460px] h-auto"
            role="img"
            aria-label="MARS 2077: Junior Astronaut Mission Trainer"
          >
            {/* Mission Patch Hex Shield */}
            <polygon
              points="46,12 82,28 82,72 46,92 10,72 10,28"
              fill="#111827"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            {/* Planet Arc & Orbital Ring inside Emblem */}
            <circle cx="46" cy="52" r="20" fill="#c2410c" />
            <ellipse
              cx="46"
              cy="52"
              rx="31"
              ry="10"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              transform="rotate(-22 46 52)"
            />
            <circle cx="68" cy="40" r="3.5" fill="#f8fafc" />

            {/* Bespoke Display Lockup */}
            <text
              x="102"
              y="56"
              fill="#f8fafc"
              fontFamily="'Chakra Petch', sans-serif"
              fontWeight="700"
              fontSize="48"
              letterSpacing="3"
            >
              MARS 2077
            </text>
            <rect x="104" y="67" width="380" height="2" fill="#f59e0b" />
            <text
              x="104"
              y="90"
              fill="#38bdf8"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="600"
              fontSize="14.5"
              letterSpacing="1.8"
            >
              JUNIOR ASTRONAUT MISSION TRAINER
            </text>
          </svg>

          <p className="text-xs md:text-sm text-amber-300/95 font-medium tracking-wide mt-1">
            Every Decision Matters. Every Resource Counts. Every Mission Matters.
          </p>
        </div>

        {/* Quick Mission Target Selector (Mars vs. Moon) */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Select Planetary Outpost</span>
            <span className="font-mono text-slate-300">
              {activeMission.gravityLabel} · {activeMission.durationSols} Sols
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {(['mars', 'moon'] as MissionTarget[]).map((mId) => {
              const m = MISSIONS[mId];
              const active = mission === mId;
              return (
                <button
                  key={mId}
                  type="button"
                  onClick={() => onSelectMission(mId)}
                  className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-500/15 border-amber-400 text-white'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-display font-bold text-sm flex items-center justify-between">
                    <span>{m.name}</span>
                    <span className="font-mono text-xs text-amber-400">{mId === 'mars' ? 'MARS' : 'MOON'}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">{m.location}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty & Active Crew Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3.5 rounded-lg bg-slate-900/90 border border-slate-800 mb-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Difficulty:</span>
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onSelectDifficulty(d)}
                className={`px-2.5 py-1 rounded font-mono uppercase transition-colors cursor-pointer ${
                  difficulty === d
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenSetupModal}
            className="text-sky-400 hover:text-sky-300 font-medium underline underline-offset-4 cursor-pointer"
          >
            Crew ({selectedCrew.length}/4):{' '}
            {selectedCrew
              .map((id) => CREW_ROLES.find((r) => r.id === id)?.title.split(' ').pop())
              .join(', ')}
          </button>
        </div>

        {/* Primary Start Mission CTA + 4 Home Screen Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartMission();
            }}
            className="w-full py-3.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base tracking-wider uppercase transition-transform active:scale-[0.99] cursor-pointer shadow-lg"
          >
            Start Mission
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={onOpenSetupModal}
              className="py-2.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap text-center"
            >
              Mission & Crew
            </button>
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="py-2.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap text-center"
            >
              How to Play
            </button>
            <button
              type="button"
              onClick={onOpenLearnModal}
              className="py-2.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap text-center"
            >
              Learn About Space
            </button>
            <button
              type="button"
              onClick={onOpenRecordsModal}
              className="py-2.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap text-center"
            >
              Mission Records
            </button>
          </div>
        </div>
      </div>

      {/* Flat Single-Line Control Hint in Bottom Safe Margin */}
      <div className="text-xs font-mono text-slate-300/90 tracking-wide">
        Enter / Space Start Mission · WASD Drive Surface Rover · Click Pad to Construct · H Collapse HUD · Esc Pause
      </div>
    </div>
  );
};
