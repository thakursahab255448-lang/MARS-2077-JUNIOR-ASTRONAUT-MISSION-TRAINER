import React, { useState } from 'react';
import {
  CREW_ROLES,
  CrewRoleId,
  DifficultyLevel,
  MISSIONS,
  MissionChallengeEvent,
  MissionEventOption,
  MissionScoreReport,
  MissionTarget,
} from '../game/rules';
import {
  LEARNING_TOPICS,
  NasaApodItem,
  VERIFIED_NASA_TELEMETRY,
} from '../game/nasaData';

export interface SavedMissionRecord {
  id: string;
  date: string;
  mission: MissionTarget;
  difficulty: DifficultyLevel;
  solReached: number;
  targetSols: number;
  score: number;
  isSuccess: boolean;
  learningPoints: number;
}

// ============================================================================
// 1. MISSION & ASTRONAUT CREW SELECTION MODAL
// ============================================================================
export const MissionSetupModal: React.FC<{
  mission: MissionTarget;
  difficulty: DifficultyLevel;
  selectedCrew: CrewRoleId[];
  onSelectMission: (m: MissionTarget) => void;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  onToggleCrewRole: (r: CrewRoleId) => void;
  onClose: () => void;
  onLaunchMission: () => void;
}> = ({
  mission,
  difficulty,
  selectedCrew,
  onSelectMission,
  onSelectDifficulty,
  onToggleCrewRole,
  onClose,
  onLaunchMission,
}) => {
  const cfg = MISSIONS[mission];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mission Selection and Astronaut Crew Setup"
      className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
    >
      <div className="bg-[#0b101b] border border-slate-700 rounded-xl max-w-4xl w-full p-6 md:p-7 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-white">
              Mission Briefing & Astronaut Crew Selection
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure your planetary target, difficulty, and specialist crew roles before launch.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
          >
            Close [Esc]
          </button>
        </div>

        {/* Step 1: Mars vs. Lunar Base Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {(['mars', 'moon'] as MissionTarget[]).map((mId) => {
            const m = MISSIONS[mId];
            const isSelected = mission === mId;
            return (
              <button
                key={mId}
                type="button"
                onClick={() => onSelectMission(mId)}
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 text-white'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-base text-white">{m.name}</span>
                  <span className="font-mono text-xs text-amber-400">
                    {m.durationSols} Sols · {m.startingMaterials} Mat
                  </span>
                </div>
                <div className="text-xs text-sky-400 font-mono mb-2">{m.location}</div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{m.briefing}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono text-slate-400">
                  <span>Gravity: {m.gravityLabel}</span>
                  <span>·</span>
                  <span>Temp: {m.tempRangeLabel}</span>
                  <span>·</span>
                  <span>Rad: {m.radiationBaseMsv} mSv/d</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step 2: Mission Objectives & Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <h3 className="font-display font-semibold text-sm text-amber-400 mb-2.5">
              Primary Mission Objectives ({cfg.name})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cfg.objectives.map((obj, idx) => (
                <div key={obj.id} className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <div className="text-xs font-semibold text-white">
                    0{idx + 1}. {obj.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{obj.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-semibold text-sm text-sky-400 mb-2">
                Mission Difficulty
              </h3>
              <div className="flex flex-col gap-2">
                {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onSelectDifficulty(d)}
                    className={`w-full text-left px-3 py-2 rounded border text-xs font-mono uppercase cursor-pointer transition-colors ${
                      difficulty === d
                        ? 'bg-sky-500/20 border-sky-400 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {d} —{' '}
                    {d === 'easy'
                      ? '+15% Supplies · Lower Drain'
                      : d === 'medium'
                        ? 'Standard NASA Nominal'
                        : '-15% Supplies · High Drain'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Astronaut Crew Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-display font-semibold text-sm text-white">
              Select Astronaut Crew Roles (Click to Toggle Specialists — {selectedCrew.length}/4 Active)
            </h3>
            <span className="text-xs text-slate-400">
              Each specialist modifies life support, power, construction, or research
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CREW_ROLES.map((role) => {
              const active = selectedCrew.includes(role.id);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onToggleCrewRole(role.id)}
                  className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-amber-400">{role.callsign}</span>
                      <span className={active ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {active ? '✓ ASSIGNED' : 'STANDBY'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-white">{role.title}</div>
                    <div className="text-xs text-slate-300 mb-2">{role.astronautName}</div>
                    <p className="text-xs text-slate-400 leading-snug mb-2.5">{role.bio}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-sky-300">
                    {role.bonusSummary}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onLaunchMission}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wider cursor-pointer"
          >
            Launch Mission Now
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. HOW TO PLAY MODAL
// ============================================================================
export const HowToPlayModal: React.FC<{ onClose: () => void; onStart: () => void }> = ({
  onClose,
  onStart,
}) => {
  const steps = [
    {
      num: '01',
      title: 'Choose Moon or Mars & Your Crew',
      desc: 'Mars has a thin CO₂ atmosphere and dust storms; the Moon has hard vacuum and intense cosmic radiation. Assign your Commander, Engineer, Scientist, and Medical Officer.',
    },
    {
      num: '02',
      title: 'Build & Upgrade Your 3D Outpost',
      desc: 'Click any of the 12 glowing landing pads on the 3D terrain (or select a pad in the bottom dock) to build Habitats, Solar Stations, Oxygen Generators, Water Recyclers, Greenhouses, Antennas, Shelters, and Labs.',
    },
    {
      num: '03',
      title: 'Master Engineering Trade-Offs',
      desc: 'Every module has a real cost! Greenhouses grow food and oxygen but drink lots of water and electricity. Science Labs discover data fast but drain power needed for life support.',
    },
    {
      num: '04',
      title: 'Drive the Surface Rover & Survive Challenges',
      desc: 'Use WASD or Arrow keys to drive the 6-wheeled rover into glowing blue ice/mineral crystals for bonus Science and Materials! Advance Sols to face dust storms and solar flares.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How to Play Junior Astronaut Mission Trainer"
      className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
    >
      <div className="bg-[#0b101b] border border-slate-700 rounded-xl max-w-2xl w-full p-6 md:p-7 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <h2 className="font-display font-bold text-xl text-white">
            How to Play — Junior Astronaut Handbook
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {steps.map((s) => (
            <div key={s.num} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="font-mono text-xs text-amber-400 font-semibold mb-1">STEP {s.num}</div>
              <div className="font-display font-bold text-sm text-white mb-1.5">{s.title}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800/70 text-xs text-sky-200 mb-6">
          <strong>Golden Rule of Space Engineering:</strong> Never try to max out just one resource!
          NASA missions succeed when Oxygen, Water, Food, Power, Radiation Shielding, and Crew Health stay
          in safe balance together.
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-200 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onStart}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Start Training Mission
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. EDUCATIONAL LEARNING MODE & INTERACTIVE QUIZ MODAL (Ages 7-12)
// ============================================================================
export const LearnSpaceModal: React.FC<{
  completedQuizzes: string[];
  quizPoints: number;
  onAnswerQuizCorrect: (topicId: string) => void;
  onClose: () => void;
}> = ({ completedQuizzes, quizPoints, onAnswerQuizCorrect, onClose }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const topic = LEARNING_TOPICS[activeIdx];
  const isCompleted = completedQuizzes.includes(topic.id);

  const handleSelectAnswer = (idx: number) => {
    setSelectedOption(idx);
    if (idx === topic.quiz.correctIndex && !isCompleted) {
      onAnswerQuizCorrect(topic.id);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Learn About Space and Interactive Astronaut Quiz"
      className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
    >
      <div className="bg-[#0b101b] border border-slate-700 rounded-xl max-w-4xl w-full p-6 md:p-7 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-white">
              NASA Junior Astronaut Academy (Ages 7–12 Learning Lab)
            </h2>
            <p className="text-xs text-slate-400">
              Explore all 7 space engineering lessons and complete the quizzes to earn Learning Points!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-amber-400 font-semibold">
              Quiz Score: {quizPoints} pts ({completedQuizzes.length}/{LEARNING_TOPICS.length} Mastered)
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Topic Selector List */}
          <div className="flex flex-col gap-1.5">
            {LEARNING_TOPICS.map((t, idx) => {
              const done = completedQuizzes.includes(t.id);
              const current = idx === activeIdx;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveIdx(idx);
                    setSelectedOption(null);
                  }}
                  className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    current
                      ? 'bg-sky-500/20 border-sky-400 text-white font-semibold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{t.questionTitle}</span>
                  <span className="font-mono text-xs ml-2 shrink-0 text-emerald-400">
                    {done ? '★ Done' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Lesson Card + Interactive Quiz */}
          <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-1">
                <span>{topic.badgeLabel}</span>
                <span>
                  Lesson {activeIdx + 1} of {LEARNING_TOPICS.length}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-3">{topic.questionTitle}</h3>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 leading-relaxed mb-3">
                {topic.summaryForKids}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {topic.scientificExplanation}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  {topic.nasaFactBox}
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
                  <strong>Mission Tip:</strong> {topic.engineeringTradeoffTip}
                </div>
              </div>

              {/* Interactive Quiz Box */}
              <div className="border-t border-slate-800 pt-4">
                <div className="text-xs font-mono uppercase text-amber-400 mb-1.5">
                  Interactive Check-Up Quiz (+25 Learning Points)
                </div>
                <div className="text-sm font-semibold text-white mb-3">{topic.quiz.question}</div>
                <div className="flex flex-col gap-2">
                  {topic.quiz.options.map((opt, idx) => {
                    const isPicked = selectedOption === idx;
                    const isRight = idx === topic.quiz.correctIndex;
                    let btnStyle = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-600';
                    if (selectedOption !== null) {
                      if (isRight) {
                        btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-100 font-semibold';
                      } else if (isPicked) {
                        btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-200';
                      }
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAnswer(idx)}
                        className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedOption !== null && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-xs ${
                      selectedOption === topic.quiz.correctIndex
                        ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-200'
                        : 'bg-rose-950/60 border border-rose-700 text-rose-200'
                    }`}
                  >
                    {selectedOption === topic.quiz.correctIndex
                      ? topic.quiz.explanation
                      : 'Not quite! Read the NASA Science explanation above and click another answer.'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={activeIdx === 0}
                onClick={() => {
                  setActiveIdx((i) => Math.max(0, i - 1));
                  setSelectedOption(null);
                }}
                className="px-3 py-1.5 rounded bg-slate-800 disabled:opacity-40 text-xs text-slate-200 cursor-pointer"
              >
                ← Previous Lesson
              </button>
              <button
                type="button"
                disabled={activeIdx === LEARNING_TOPICS.length - 1}
                onClick={() => {
                  setActiveIdx((i) => Math.min(LEARNING_TOPICS.length - 1, i + 1));
                  setSelectedOption(null);
                }}
                className="px-3 py-1.5 rounded bg-sky-500 text-slate-950 font-semibold disabled:opacity-40 text-xs cursor-pointer"
              >
                Next Lesson →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. NASA OPEN DATA & ENVIRONMENTAL TELEMETRY MODAL
// ============================================================================
export const NasaTelemetryModal: React.FC<{
  mission: MissionTarget;
  apodBriefing: NasaApodItem | null;
  simulatedResources: {
    oxygen: number;
    water: number;
    power: number;
    radiation: number;
  };
  onClose: () => void;
}> = ({ mission, apodBriefing, simulatedResources, onClose }) => {
  const [tabTarget, setTabTarget] = useState<MissionTarget>(mission);
  const datasets = VERIFIED_NASA_TELEMETRY[tabTarget];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="NASA Open Data and Planetary Telemetry"
      className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
    >
      <div className="bg-[#0b101b] border border-slate-700 rounded-xl max-w-4xl w-full p-6 md:p-7 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-white">
              Authentic NASA Planetary Data vs. Simulated Outpost Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              Verified measurements from NASA Planetary Data System (PDS), Perseverance MEDA, Curiosity REMS, and LRO.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Distinction Banner: Real NASA Data vs. Simulated Gameplay Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
          <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/80">
            <div className="text-xs font-mono font-semibold text-sky-400 mb-1">
              AUTHENTIC NASA INSTRUMENT DATA (EXTERNAL ENVIRONMENT)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The environmental tables below show real physical measurements recorded by NASA spacecraft on
              Mars and the Moon (temperature in °C, pressure in Pascals, irradiance in W/m², radiation dose in
              mSv/day).
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/80">
            <div className="text-xs font-mono font-semibold text-amber-400 mb-1">
              SIMULATED OUTPOST GAMEPLAY STATE (INTERNAL HABITAT)
            </div>
            <div className="text-xs text-slate-300 font-mono flex flex-wrap gap-x-3 gap-y-1 mt-1">
              <span>Cabin O₂: {simulatedResources.oxygen}%</span>
              <span>·</span>
              <span>Water: {simulatedResources.water}%</span>
              <span>·</span>
              <span>Power: {simulatedResources.power}%</span>
              <span>·</span>
              <span>Crew Rad Dose Index: {simulatedResources.radiation}%</span>
            </div>
          </div>
        </div>

        {/* Target Switcher */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTabTarget('mars')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
              tabTarget === 'mars'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            Mars Datasets (MEDA / REMS / InSight)
          </button>
          <button
            type="button"
            onClick={() => setTabTarget('moon')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
              tabTarget === 'moon'
                ? 'bg-sky-400 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            Lunar Datasets (LRO Diviner / CRaTER / Apollo)
          </button>
        </div>

        {/* Authentic NASA Datasets Cards */}
        <div className="flex flex-col gap-3.5 mb-5">
          {datasets.map((rec) => (
            <div key={rec.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <span className="font-display font-bold text-sm text-white">{rec.missionName}</span>
                  <span className="text-xs text-slate-400 ml-2">({rec.instrument})</span>
                </div>
                <span className="text-xs font-mono text-amber-400">
                  Recorded: {rec.dateRecorded} · {rec.solOrDay}
                </span>
              </div>

              <div className="text-xs text-sky-300 font-mono mb-3">Location: {rec.location}</div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400">Max / Min Temp</div>
                  <div className="font-mono font-semibold text-xs text-white mt-0.5">
                    {rec.surfaceTempMaxC}°C / {rec.surfaceTempMinC}°C
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400">Surface Pressure</div>
                  <div className="font-mono font-semibold text-xs text-white mt-0.5">
                    {rec.pressurePa < 0.001 ? '3×10⁻¹⁰ Pa (Vacuum)' : `${rec.pressurePa} Pa`}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400">Solar Irradiance</div>
                  <div className="font-mono font-semibold text-xs text-white mt-0.5">
                    {rec.solarIrradianceWm2} W/m²
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400">Unshielded Radiation</div>
                  <div className="font-mono font-semibold text-xs text-amber-300 mt-0.5">
                    {rec.radiationDoseMsvPerDay} mSv/day
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400">Surface Gravity</div>
                  <div className="font-mono font-semibold text-xs text-white mt-0.5">
                    {rec.gravityMs2} m/s²
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Atmosphere: {rec.atmosphereComposition}</span>
                <span className="font-mono text-slate-300">Source: {rec.citation}</span>
              </div>
            </div>
          ))}
        </div>

        {/* NASA Open API Live / Archive Status */}
        {apodBriefing && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-semibold text-sky-400">
                NASA Open API Feed ({apodBriefing.sourceMode === 'live_nasa_api' ? 'LIVE API CONNECTED' : 'EDUCATIONAL ARCHIVE MODE'})
              </span>
              <span className="font-mono text-slate-400">{apodBriefing.date}</span>
            </div>
            <div className="font-semibold text-white mb-1">{apodBriefing.title}</div>
            <p className="text-slate-300 leading-relaxed line-clamp-3">{apodBriefing.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 5. RANDOM MISSION CHALLENGE & SMART DECISION MODAL
// ============================================================================
export const ChallengeEventModal: React.FC<{
  event: MissionChallengeEvent;
  chosenOption: MissionEventOption | null;
  onSelectDecision: (opt: MissionEventOption) => void;
  onAcknowledgeOutcome: () => void;
}> = ({ event, chosenOption, onSelectDecision, onAcknowledgeOutcome }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Mission Alert: ${event.title}`}
      className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
    >
      <div className="bg-[#0b101b] border-2 border-amber-500/80 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-bold text-xs uppercase">
              {event.severity === 'opportunity' ? 'ISRU Discovery' : 'Mission Alert'}
            </span>
            <h2 className="font-display font-bold text-lg md:text-xl text-white">{event.title}</h2>
          </div>
        </div>

        <p className="text-sm text-slate-100 leading-relaxed mb-3">{event.situationSimple}</p>

        <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/70 text-xs text-sky-200 mb-5">
          {event.nasaScienceContext}
        </div>

        {!chosenOption ? (
          <div>
            <div className="text-xs font-mono uppercase text-amber-400 mb-2.5">
              Choose Your Engineering Decision (Every Choice Has Trade-Offs):
            </div>
            <div className="flex flex-col gap-2.5">
              {event.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectDecision(opt)}
                  className="text-left p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 transition-colors cursor-pointer"
                >
                  <div className="font-display font-semibold text-sm text-white mb-1">{opt.label}</div>
                  <div className="font-mono text-xs text-amber-300">{opt.tradeOffTag}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
            <div className="text-xs font-mono uppercase text-emerald-400 mb-1">
              Decision Applied: {chosenOption.label}
            </div>
            <div className="font-mono text-xs text-amber-300 mb-2.5">{chosenOption.tradeOffTag}</div>
            <p className="text-sm text-slate-200 leading-relaxed mb-4">
              {chosenOption.educationalOutcome}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onAcknowledgeOutcome}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Continue Mission
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 6. MISSION RECORDS MODAL
// ============================================================================
export const MissionRecordsModal: React.FC<{
  records: SavedMissionRecord[];
  onClose: () => void;
}> = ({ records, onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mission Records and Achievements"
      className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
    >
      <div className="bg-[#0b101b] border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="font-display font-bold text-xl text-white">
            Mission Flight Log & Commander Records
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400">
            No completed missions logged yet. Complete or evaluate a Mars or Lunar mission to record your
            commander telemetry!
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto">
            {records.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-display font-bold text-sm text-white">
                    {r.mission === 'mars' ? 'Mars Exploration Outpost' : 'Lunar South Pole Base'} (
                    {r.difficulty.toUpperCase()})
                  </div>
                  <div className="text-slate-400 font-mono mt-0.5">
                    {r.date} · Sol {r.solReached}/{r.targetSols} · {r.learningPoints} Learning Pts
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-base font-bold text-amber-400">{r.score} / 100</div>
                  <div className={r.isSuccess ? 'text-emerald-400' : 'text-rose-400'}>
                    {r.isSuccess ? 'MISSION SUCCESS' : 'INCOMPLETE'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 7. PAUSE & FINAL MISSION PERFORMANCE REPORT MODAL
// ============================================================================
export const PauseAndOutcomeModal: React.FC<{
  mode: 'paused' | 'gameover';
  report: MissionScoreReport;
  sol: number;
  targetSols: number;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenSetup: () => void;
}> = ({ mode, report, sol, targetSols, onResume, onRestart, onReturnTitle, onOpenSetup }) => {
  if (mode === 'paused') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mission Paused"
        className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 pointer-events-auto"
      >
        <div className="bg-[#0b101b] border border-slate-700 rounded-xl max-w-md w-full p-6 text-center shadow-2xl">
          <h2 className="font-display font-bold text-2xl text-white mb-1">Mission Paused</h2>
          <p className="text-xs text-slate-400 font-mono mb-5">
            Sol {sol} of {targetSols} · Current Balanced Score: {report.overallScore}/100
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wider cursor-pointer"
            >
              Resume Mission [Esc / P]
            </button>
            <button
              type="button"
              onClick={onOpenSetup}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
            >
              Change Mission or Crew
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
            >
              Restart Outpost [R]
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
            >
              Return to Title Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: 'Crew Safety', val: report.breakdown.crewSafety },
    { label: 'Resource Efficiency', val: report.breakdown.resourceEfficiency },
    { label: 'Power Management', val: report.breakdown.powerManagement },
    { label: 'Food Production', val: report.breakdown.foodProduction },
    { label: 'Radiation Protection', val: report.breakdown.radiationProtection },
    { label: 'Mission Objectives', val: report.breakdown.missionObjectives },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Final Mission Performance Report"
      className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
    >
      <div className="bg-[#0b101b] border border-slate-700 rounded-xl max-w-2xl w-full p-6 md:p-7 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div
              className={`text-xs font-mono font-bold uppercase ${
                report.isSuccess ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {report.isSuccess ? 'MISSION ACCOMPLISHED — OUTPOST ESTABLISHED' : 'MISSION EVALUATION REPORT'}
            </div>
            <h2 className="font-display font-bold text-2xl text-white">
              Final Commander Performance Report
            </h2>
          </div>
          <div className="text-right font-mono">
            <div className="text-3xl font-bold text-amber-400">{report.overallScore} / 100</div>
            <div className="text-xs text-slate-400">
              Completion: {report.completionPct}% · {report.learningPointsTotal} Learning Pts
            </div>
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-200 leading-relaxed mb-5 p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          {report.summaryFeedback}
        </p>

        {/* 6 Pillar Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {metrics.map((m) => (
            <div key={m.label} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">{m.label}</div>
              <div className="font-mono font-bold text-lg text-white mb-1.5">{m.val}%</div>
              <div className="w-full h-1.5 bg-slate-800 rounded overflow-hidden">
                <div
                  className={`h-full ${
                    m.val >= 70 ? 'bg-emerald-400' : m.val >= 45 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${m.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Achievement Badges */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase text-slate-400 mb-2">
            Mission Achievement Badges
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {report.badges.map((b) => (
              <div
                key={b.id}
                className={`p-3 rounded-lg border text-xs ${
                  b.unlocked
                    ? 'bg-amber-500/15 border-amber-400/80 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="font-display font-bold flex items-center justify-between">
                  <span>{b.title}</span>
                  <span className="font-mono">{b.unlocked ? '★ UNLOCKED' : 'LOCKED'}</span>
                </div>
                <div className="mt-0.5 text-[11px] opacity-85">{b.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onReturnTitle}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
          >
            Return to Title Screen
          </button>
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wider cursor-pointer"
          >
            Play Again / Try New Decisions
          </button>
        </div>
      </div>
    </div>
  );
};
