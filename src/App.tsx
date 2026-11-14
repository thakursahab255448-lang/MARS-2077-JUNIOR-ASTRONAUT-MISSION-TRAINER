import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BuildingTypeId,
  CrewRoleId,
  DifficultyLevel,
  MISSIONS,
  MISSION_CHALLENGES,
  MissionChallengeEvent,
  MissionEventOption,
  MissionTarget,
  PlacedBuilding,
  PowerAllocation,
  ResourceState,
  applySolStep,
  calculateEffectiveBuildCost,
  calculatePerSolRates,
  evaluateMissionScore,
  getInitialBuildings,
  getInitialResources,
} from './game/rules';
import { NasaApodItem, fetchNasaSpaceBriefing } from './game/nasaData';
import { MarsViewport3D } from './components/MarsViewport3D';
import { TitleScreenOverlay } from './components/TitleScreenOverlay';
import { MissionHud, SolHistoryPoint } from './components/MissionHud';
import {
  ChallengeEventModal,
  HowToPlayModal,
  LearnSpaceModal,
  MissionRecordsModal,
  MissionSetupModal,
  NasaTelemetryModal,
  PauseAndOutcomeModal,
  SavedMissionRecord,
} from './components/Modals';
import { sound } from './utils/sound';

const STORAGE_KEY_RECORDS = 'mars2077_mission_records_v1';
const STORAGE_KEY_QUIZZES = 'mars2077_completed_quizzes_v1';

const BUILDING_KEY_MAP: Record<string, BuildingTypeId> = {
  Digit1: 'habitat',
  Digit2: 'solar',
  Digit3: 'oxygen',
  Digit4: 'water',
  Digit5: 'greenhouse',
  Digit6: 'antenna',
  Digit7: 'shelter',
  Digit8: 'lab',
};

export default function App() {
  const isAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>(
    isAutostart ? 'playing' : 'title'
  );
  const [mission, setMission] = useState<MissionTarget>('mars');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [selectedCrew, setSelectedCrew] = useState<CrewRoleId[]>([
    'commander',
    'engineer',
    'scientist',
    'medical',
  ]);

  const [sol, setSol] = useState<number>(1);
  const [resources, setResources] = useState<ResourceState>(() =>
    getInitialResources('mars', 'medium', ['commander', 'engineer', 'scientist', 'medical'])
  );
  const [buildings, setBuildings] = useState<PlacedBuilding[]>(() => getInitialBuildings());
  const [selectedPadIndex, setSelectedPadIndex] = useState<number>(3);
  const [selectedBuildType, setSelectedBuildType] = useState<BuildingTypeId>('greenhouse');
  const [allocation, setAllocation] = useState<PowerAllocation>({
    lifeSupportPct: 100,
    sciencePct: 100,
    shieldingPct: 100,
    greenhousePct: 100,
  });

  const [history, setHistory] = useState<SolHistoryPoint[]>([
    { sol: 1, oxygen: 82, water: 80, food: 80, power: 84, health: 95 },
  ]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'rover' | 'top' | 'cinematic'>(
    'overview'
  );
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Active modals
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showHowToModal, setShowHowToModal] = useState<boolean>(false);
  const [showLearnModal, setShowLearnModal] = useState<boolean>(false);
  const [showNasaModal, setShowNasaModal] = useState<boolean>(false);
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);

  // Random Mission Challenge state
  const [activeChallenge, setActiveChallenge] = useState<MissionChallengeEvent | null>(null);
  const [chosenChallengeOption, setChosenChallengeOption] = useState<MissionEventOption | null>(
    null
  );
  const [balancedDecisionsCount, setBalancedDecisionsCount] = useState<number>(0);

  // Persistent Records & Quizzes
  const [records, setRecords] = useState<SavedMissionRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUIZZES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [apodBriefing, setApodBriefing] = useState<NasaApodItem | null>(null);

  // Mirror game state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Fetch NASA Open API briefing on mount
  useEffect(() => {
    fetchNasaSpaceBriefing().then(setApodBriefing);
  }, []);

  // Live per-Sol rates
  const rates = useMemo(
    () => calculatePerSolRates(mission, difficulty, buildings, selectedCrew, allocation),
    [mission, difficulty, buildings, selectedCrew, allocation]
  );

  // Live mission evaluation score report
  const quizPoints = completedQuizzes.length * 25;
  const scoreReport = useMemo(
    () =>
      evaluateMissionScore({
        mission,
        sol,
        targetSols: MISSIONS[mission].durationSols,
        resources,
        buildings,
        balancedDecisionsCount,
        quizPoints,
      }),
    [mission, sol, resources, buildings, balancedDecisionsCount, quizPoints]
  );

  const saveMissionRecord = useCallback(
    (finalSol: number, finalResources: ResourceState, finalBuildings: PlacedBuilding[]) => {
      const rep = evaluateMissionScore({
        mission,
        sol: finalSol,
        targetSols: MISSIONS[mission].durationSols,
        resources: finalResources,
        buildings: finalBuildings,
        balancedDecisionsCount,
        quizPoints,
      });
      const newRec: SavedMissionRecord = {
        id: `${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        mission,
        difficulty,
        solReached: finalSol,
        targetSols: MISSIONS[mission].durationSols,
        score: rep.overallScore,
        isSuccess: rep.isSuccess,
        learningPoints: rep.learningPointsTotal,
      };
      setRecords((prev) => {
        const next = [newRec, ...prev].slice(0, 15);
        try {
          localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [mission, difficulty, balancedDecisionsCount, quizPoints]
  );

  const resetAndStartMission = useCallback(
    (nextMission = mission, nextDiff = difficulty, nextCrew = selectedCrew) => {
      const initRes = getInitialResources(nextMission, nextDiff, nextCrew);
      const initBlds = getInitialBuildings();
      setSol(1);
      setResources(initRes);
      setBuildings(initBlds);
      setSelectedPadIndex(3);
      setAllocation({
        lifeSupportPct: 100,
        sciencePct: 100,
        shieldingPct: 100,
        greenhousePct: 100,
      });
      setHistory([
        {
          sol: 1,
          oxygen: initRes.oxygen,
          water: initRes.water,
          food: initRes.food,
          power: initRes.power,
          health: initRes.crewHealth,
        },
      ]);
      setWarnings([]);
      setActiveChallenge(null);
      setChosenChallengeOption(null);
      setBalancedDecisionsCount(0);
      setShowSetupModal(false);
      setShowHowToModal(false);
      setGameState('playing');
      document.body.dataset.state = 'playing';
      sound.playClick();
    },
    [mission, difficulty, selectedCrew]
  );

  // Construct or upgrade a module on a 3D landing pad
  const handleConstructOrUpgrade = useCallback(
    (type: BuildingTypeId, padIdx: number) => {
      const existing = buildings.find((b) => b.padIndex === padIdx);
      const isUpg = Boolean(existing);
      const curLvl = existing ? existing.level : 0;
      if (existing && existing.level >= 3) return;

      const cost = calculateEffectiveBuildCost(type, isUpg, curLvl || 1, selectedCrew);
      if (resources.materials < cost) return;

      sound.playBuild();
      setResources((prev) => ({
        ...prev,
        materials: prev.materials - cost,
        science: prev.science + 4,
      }));

      setBuildings((prev) => {
        if (existing) {
          return prev.map((b) => (b.padIndex === padIdx ? { ...b, level: b.level + 1 } : b));
        }
        return [...prev, { padIndex: padIdx, type, level: 1 }];
      });
    },
    [buildings, resources.materials, selectedCrew]
  );

  const handleDemolishPad = useCallback((padIdx: number) => {
    sound.playClick();
    setBuildings((prev) => prev.filter((b) => b.padIndex !== padIdx));
    setResources((prev) => ({ ...prev, materials: prev.materials + 10 }));
  }, []);

  // Trigger a random mission challenge
  const triggerChallengeEvent = useCallback(
    (nextSolNumber: number) => {
      const pool = MISSION_CHALLENGES.filter(
        (ev) => !ev.targetFilter || ev.targetFilter === mission
      );
      const chosen = pool[nextSolNumber % pool.length];
      if (chosen) {
        sound.playAlert();
        setActiveChallenge(chosen);
        setChosenChallengeOption(null);
      }
    },
    [mission]
  );

  // Advance simulation by 1 Sol
  const handleAdvanceSol = useCallback(() => {
    if (activeChallenge) return;
    sound.playAdvanceSol();

    const { next, warnings: nextWarnings } = applySolStep(resources, rates);
    const nextSol = sol + 1;
    const targetSols = MISSIONS[mission].durationSols;

    setResources(next);
    setSol(nextSol);
    setWarnings(nextWarnings);
    setHistory((prev) => [
      ...prev.slice(-11),
      {
        sol: nextSol,
        oxygen: next.oxygen,
        water: next.water,
        food: next.food,
        power: next.power,
        health: next.crewHealth,
      },
    ]);

    // Check critical failure or mission completion
    if (
      next.crewHealth <= 0 ||
      next.oxygen <= 0 ||
      next.water <= 0 ||
      next.radiation >= 95
    ) {
      sound.playDefeat();
      saveMissionRecord(nextSol, next, buildings);
      setGameState('gameover');
      return;
    }

    if (nextSol >= targetSols) {
      sound.playVictory();
      saveMissionRecord(nextSol, next, buildings);
      setGameState('gameover');
      return;
    }

    // Trigger random mission challenge on even Sols (Sol 2, 4, 6, 8, 10)
    if (nextSol % 2 === 0) {
      triggerChallengeEvent(nextSol / 2);
    }
  }, [
    activeChallenge,
    resources,
    rates,
    sol,
    mission,
    buildings,
    saveMissionRecord,
    triggerChallengeEvent,
  ]);

  // Apply decision from Random Mission Challenge
  const handleSelectChallengeDecision = useCallback((opt: MissionEventOption) => {
    sound.playClick();
    setChosenChallengeOption(opt);
    if (opt.isBalancedChoice) {
      setBalancedDecisionsCount((c) => c + 1);
    }
    setResources((prev) => ({
      oxygen: Math.max(0, Math.min(100, prev.oxygen + (opt.effects.oxygen || 0))),
      water: Math.max(0, Math.min(100, prev.water + (opt.effects.water || 0))),
      food: Math.max(0, Math.min(100, prev.food + (opt.effects.food || 0))),
      power: Math.max(0, Math.min(100, prev.power + (opt.effects.power || 0))),
      crewHealth: Math.max(0, Math.min(100, prev.crewHealth + (opt.effects.crewHealth || 0))),
      radiation: Math.max(0, Math.min(100, prev.radiation + (opt.effects.radiation || 0))),
      comms: Math.max(0, Math.min(100, prev.comms + (opt.effects.comms || 0))),
      materials: Math.max(0, prev.materials + (opt.effects.materials || 0)),
      science: Math.max(0, prev.science + (opt.effects.science || 0)),
    }));
  }, []);

  // Surface Rover collects geological sample crystal
  const handleRoverCollectSample = useCallback(() => {
    sound.playBuild();
    setResources((prev) => ({
      ...prev,
      science: prev.science + 8,
      materials: prev.materials + 8,
    }));
  }, []);

  // Toggle crew specialist (ensure at least 1 crew member remains assigned)
  const handleToggleCrewRole = useCallback((roleId: CrewRoleId) => {
    sound.playClick();
    setSelectedCrew((prev) => {
      if (prev.includes(roleId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((r) => r !== roleId);
      }
      return [...prev, roleId];
    });
  }, []);

  // Global keyboard shortcuts (Enter/Space on Title, Space Advance Sol, Esc/P Pause, H Toggle Dock, M Mute, 1-8 Build Type)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const anyModalOpen =
        showSetupModal ||
        showHowToModal ||
        showLearnModal ||
        showNasaModal ||
        showRecordsModal ||
        Boolean(activeChallenge);

      if (e.code === 'KeyM') {
        setIsMuted(sound.toggleMute());
        return;
      }

      if (gameState === 'title' && !anyModalOpen) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          resetAndStartMission();
        }
        return;
      }

      if (gameState === 'playing' && !anyModalOpen) {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          setGameState('paused');
        } else if (e.code === 'KeyH') {
          e.preventDefault();
          setIsDockCollapsed((c) => !c);
        } else if (e.code === 'KeyR') {
          e.preventDefault();
          resetAndStartMission();
        } else if (e.code === 'Space') {
          e.preventDefault();
          handleAdvanceSol();
        } else if (BUILDING_KEY_MAP[e.code]) {
          setSelectedBuildType(BUILDING_KEY_MAP[e.code]);
        }
      } else if (gameState === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
        e.preventDefault();
        setGameState('playing');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    showSetupModal,
    showHowToModal,
    showLearnModal,
    showNasaModal,
    showRecordsModal,
    activeChallenge,
    resetAndStartMission,
    handleAdvanceSol,
  ]);

  const handleAnswerQuizCorrect = useCallback((topicId: string) => {
    sound.playBuild();
    setCompletedQuizzes((prev) => {
      if (prev.includes(topicId)) return prev;
      const next = [...prev, topicId];
      try {
        localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const isStormActive = Boolean(activeChallenge && activeChallenge.id === 'dust-storm-warning');

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07090e] select-none">
      {/* Isolated 3D WebGL Viewport */}
      <MarsViewport3D
        gameState={gameState}
        mission={mission}
        buildings={buildings}
        selectedPadIndex={selectedPadIndex}
        selectedBuildType={selectedBuildType}
        isStormActive={isStormActive}
        cameraPreset={cameraPreset}
        onSelectPad={(idx) => {
          sound.playClick();
          setSelectedPadIndex(idx);
        }}
        onRoverCollectSample={handleRoverCollectSample}
      />

      {/* STATE 1: TITLE SCREEN OVERLAY */}
      {gameState === 'title' && (
        <TitleScreenOverlay
          mission={mission}
          difficulty={difficulty}
          selectedCrew={selectedCrew}
          isMuted={isMuted}
          onSelectMission={(m) => {
            sound.playClick();
            setMission(m);
          }}
          onSelectDifficulty={(d) => {
            sound.playClick();
            setDifficulty(d);
          }}
          onStartMission={() => resetAndStartMission(mission, difficulty, selectedCrew)}
          onOpenSetupModal={() => {
            sound.playClick();
            setShowSetupModal(true);
          }}
          onOpenHowToPlay={() => {
            sound.playClick();
            setShowHowToModal(true);
          }}
          onOpenLearnModal={() => {
            sound.playClick();
            setShowLearnModal(true);
          }}
          onOpenRecordsModal={() => {
            sound.playClick();
            setShowRecordsModal(true);
          }}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
        />
      )}

      {/* STATE 2: ACTIVE PLAYING HUD & UNIFIED BOTTOM DOCK */}
      {gameState !== 'title' && (
        <MissionHud
          mission={mission}
          difficulty={difficulty}
          sol={sol}
          resources={resources}
          rates={rates}
          buildings={buildings}
          selectedCrew={selectedCrew}
          selectedPadIndex={selectedPadIndex}
          selectedBuildType={selectedBuildType}
          allocation={allocation}
          history={history}
          warnings={warnings}
          cameraPreset={cameraPreset}
          isMuted={isMuted}
          isDockCollapsed={isDockCollapsed}
          onSelectPad={(idx) => {
            sound.playClick();
            setSelectedPadIndex(idx);
          }}
          onSelectBuildType={(t) => {
            sound.playClick();
            setSelectedBuildType(t);
          }}
          onConstructOrUpgrade={handleConstructOrUpgrade}
          onDemolishPad={handleDemolishPad}
          onChangeAllocation={setAllocation}
          onAdvanceSol={handleAdvanceSol}
          onTriggerChallengeNow={() => triggerChallengeEvent(sol + 1)}
          onChangeCameraPreset={(p) => {
            sound.playClick();
            setCameraPreset(p);
          }}
          onToggleDock={() => {
            sound.playClick();
            setIsDockCollapsed((c) => !c);
          }}
          onOpenNasaModal={() => {
            sound.playClick();
            setShowNasaModal(true);
          }}
          onOpenLearnModal={() => {
            sound.playClick();
            setShowLearnModal(true);
          }}
          onOpenSetupModal={() => {
            sound.playClick();
            setShowSetupModal(true);
          }}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
          onPause={() => {
            sound.playClick();
            setGameState('paused');
          }}
          onRestart={() => resetAndStartMission()}
          onFinishReport={() => {
            sound.playVictory();
            saveMissionRecord(sol, resources, buildings);
            setGameState('gameover');
          }}
        />
      )}

      {/* INTERACTIVE MODALS */}
      {showSetupModal && (
        <MissionSetupModal
          mission={mission}
          difficulty={difficulty}
          selectedCrew={selectedCrew}
          onSelectMission={(m) => {
            sound.playClick();
            setMission(m);
          }}
          onSelectDifficulty={(d) => {
            sound.playClick();
            setDifficulty(d);
          }}
          onToggleCrewRole={handleToggleCrewRole}
          onClose={() => setShowSetupModal(false)}
          onLaunchMission={() => resetAndStartMission(mission, difficulty, selectedCrew)}
        />
      )}

      {showHowToModal && (
        <HowToPlayModal
          onClose={() => setShowHowToModal(false)}
          onStart={() => resetAndStartMission()}
        />
      )}

      {showLearnModal && (
        <LearnSpaceModal
          completedQuizzes={completedQuizzes}
          quizPoints={quizPoints}
          onAnswerQuizCorrect={handleAnswerQuizCorrect}
          onClose={() => setShowLearnModal(false)}
        />
      )}

      {showNasaModal && (
        <NasaTelemetryModal
          mission={mission}
          apodBriefing={apodBriefing}
          simulatedResources={{
            oxygen: resources.oxygen,
            water: resources.water,
            power: resources.power,
            radiation: resources.radiation,
          }}
          onClose={() => setShowNasaModal(false)}
        />
      )}

      {showRecordsModal && (
        <MissionRecordsModal records={records} onClose={() => setShowRecordsModal(false)} />
      )}

      {activeChallenge && (
        <ChallengeEventModal
          event={activeChallenge}
          chosenOption={chosenChallengeOption}
          onSelectDecision={handleSelectChallengeDecision}
          onAcknowledgeOutcome={() => {
            sound.playClick();
            setActiveChallenge(null);
            setChosenChallengeOption(null);
          }}
        />
      )}

      {(gameState === 'paused' || gameState === 'gameover') && !showSetupModal && (
        <PauseAndOutcomeModal
          mode={gameState}
          report={scoreReport}
          sol={sol}
          targetSols={MISSIONS[mission].durationSols}
          onResume={() => {
            sound.playClick();
            setGameState('playing');
          }}
          onRestart={() => resetAndStartMission()}
          onReturnTitle={() => {
            sound.playClick();
            setGameState('title');
          }}
          onOpenSetup={() => {
            sound.playClick();
            setShowSetupModal(true);
          }}
        />
      )}
    </main>
  );
}
