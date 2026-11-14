import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getInitialResources,
  getInitialBuildings,
  calculateEffectiveBuildCost,
  calculatePerSolRates,
  applySolStep,
  evaluateMissionScore,
  PlacedBuilding,
} from './rules';

test('initial resources scale by difficulty and crew selection', () => {
  const easyRes = getInitialResources('mars', 'easy', ['commander', 'engineer']);
  const hardRes = getInitialResources('mars', 'hard', ['scientist']);

  assert.ok(easyRes.oxygen > hardRes.oxygen, 'Easy mode should start with higher oxygen than Hard');
  assert.ok(easyRes.materials > hardRes.materials, 'Easy mode should start with more materials');
  assert.ok(easyRes.comms > hardRes.comms, 'Commander should boost starting comms');
});

test('engineer crew role reduces building and upgrade material costs', () => {
  const baseCost = calculateEffectiveBuildCost('lab', false, 1, ['commander']);
  const engCost = calculateEffectiveBuildCost('lab', false, 1, ['engineer']);
  assert.ok(engCost < baseCost, 'Engineer should apply 15% material discount');
});

test('engineering trade-offs: boosting science or greenhouse increases power and water consumption', () => {
  const buildings: PlacedBuilding[] = [
    ...getInitialBuildings(),
    { padIndex: 3, type: 'lab', level: 1 },
    { padIndex: 4, type: 'greenhouse', level: 1 },
    { padIndex: 5, type: 'shelter', level: 1 },
  ];

  const nominalRates = calculatePerSolRates(
    'mars',
    'medium',
    buildings,
    ['commander', 'engineer', 'scientist', 'medical'],
    { lifeSupportPct: 100, sciencePct: 100, shieldingPct: 100, greenhousePct: 100 }
  );

  const highScienceAndFoodRates = calculatePerSolRates(
    'mars',
    'medium',
    buildings,
    ['commander', 'engineer', 'scientist', 'medical'],
    { lifeSupportPct: 100, sciencePct: 150, shieldingPct: 140, greenhousePct: 150 }
  );

  assert.ok(
    highScienceAndFoodRates.scienceNet > nominalRates.scienceNet,
    'Boosting science allocation increases science output'
  );
  assert.ok(
    highScienceAndFoodRates.foodNet > nominalRates.foodNet,
    'Boosting greenhouse allocation increases food output'
  );
  assert.ok(
    highScienceAndFoodRates.powerNet < nominalRates.powerNet,
    'Boosting science, shielding, and greenhouse consumes more power'
  );
  assert.ok(
    highScienceAndFoodRates.waterNet < nominalRates.waterNet,
    'Expanding food production in greenhouse consumes more water'
  );
});

test('power brownout cascades into oxygen loss and radiation warning on applySolStep', () => {
  const lowPowerState = {
    oxygen: 70,
    water: 70,
    food: 70,
    power: 5,
    crewHealth: 85,
    radiation: 15,
    comms: 75,
    materials: 40,
    science: 30,
  };

  const rates = {
    oxygenNet: 2,
    waterNet: 2,
    foodNet: 2,
    powerNet: -4,
    healthNet: 1,
    radiationNet: 2,
    commsNet: 1,
    scienceNet: 10,
    totalShieldingPct: 30,
  };

  const { next, warnings } = applySolStep(lowPowerState, rates);
  assert.ok(warnings.length > 0, 'Should emit power brownout warning when power < 10');
  assert.ok(next.oxygen < lowPowerState.oxygen, 'Power brownout should penalize oxygen');
});

test('evaluateMissionScore rewards balanced resources over single-resource hoarding', () => {
  const buildings: PlacedBuilding[] = [
    { padIndex: 0, type: 'habitat', level: 2 },
    { padIndex: 1, type: 'solar', level: 2 },
    { padIndex: 2, type: 'oxygen', level: 2 },
    { padIndex: 3, type: 'water', level: 1 },
    { padIndex: 4, type: 'greenhouse', level: 1 },
    { padIndex: 5, type: 'shelter', level: 1 },
  ];

  const balancedReport = evaluateMissionScore({
    mission: 'mars',
    sol: 12,
    targetSols: 12,
    resources: {
      oxygen: 82,
      water: 80,
      food: 78,
      power: 80,
      crewHealth: 88,
      radiation: 14,
      comms: 80,
      materials: 50,
      science: 110,
    },
    buildings,
    balancedDecisionsCount: 4,
    quizPoints: 50,
  });

  const lopsidedReport = evaluateMissionScore({
    mission: 'mars',
    sol: 12,
    targetSols: 12,
    resources: {
      oxygen: 100,
      water: 18,
      food: 15,
      power: 15,
      crewHealth: 60,
      radiation: 55,
      comms: 20,
      materials: 200,
      science: 110,
    },
    buildings,
    balancedDecisionsCount: 1,
    quizPoints: 50,
  });

  assert.equal(balancedReport.isSuccess, true);
  assert.ok(
    balancedReport.overallScore > lopsidedReport.overallScore + 20,
    'Balanced mission management must score significantly higher than single-resource hoarding'
  );
});
