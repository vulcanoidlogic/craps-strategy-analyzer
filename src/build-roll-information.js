import map from 'lodash/map';
import { MersenneTwister19937 } from 'random-js';
import { die } from 'random-js';
import { isInList } from './library';
import { POINT_VALUES, FIELD_VALUES, HORN_VALUES, CRAPS_VALUES } from './constants';

const buildRollInfo = (die1, die2) => {
    const total = die1 + die2;
    const isHardWay = die1 === die2;

    const rollInfo = {
        die1,
        die2,
        total,
        isHardWay,
        isPoint: isInList(POINT_VALUES, total),
        isNoField: !isInList(FIELD_VALUES, total),
        isField: isInList(FIELD_VALUES, total),
        isHorn: isInList(HORN_VALUES, total),
        isCraps: isInList(CRAPS_VALUES, total)
    };
    return rollInfo;
};

const getDieRoll = (randomEngine, sideCount = 6) => {
    return die(sideCount)(randomEngine);
};

const generateDiceRolls = (rollCount = 216, seed = 1024) => {
    const randomEngine = MersenneTwister19937.seed(seed);
    const diceRolls = map(new Array(rollCount), roll => {
        const die1 = getDieRoll(randomEngine);
        const die2 = getDieRoll(randomEngine);
        roll = buildRollInfo(die1, die2);
        return roll;
    });
    console.log('diceRolls=', diceRolls);
    return diceRolls;
};

export const getDiceRollInfo = () => {
    const diceRollInfo = generateDiceRolls(100, 1024);
    return diceRollInfo;
};
