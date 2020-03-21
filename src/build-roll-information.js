import assign from 'lodash/assign';
import get from 'lodash/get';
import map from 'lodash/map';
import flow from 'lodash/flow';
import { MersenneTwister19937 } from 'random-js';
import { die } from 'random-js';
import { isElement } from './library';
import { POINT_VALUES, FIELD_VALUES, HORN_VALUES, CRAPS_VALUES } from './constants';

const buildRollItem = (die1, die2) => {
    const total = die1 + die2;
    const isHardWay = die1 === die2;
    const is7 = total === 7;

    const rollInfo = {
        die1,
        die2,
        total,
        isHardWay,
        isPoint: isElement(POINT_VALUES, total),
        isNoField: !isElement(FIELD_VALUES, total),
        isField: isElement(FIELD_VALUES, total),
        isHorn: isElement(HORN_VALUES, total),
        isCraps: isElement(CRAPS_VALUES, total),
        is7
    };
    return rollInfo;
};

const getDieRoll = (randomEngine, sideCnt = 6) => {
    return die(sideCnt)(randomEngine);
};

const generateDiceRolls = (rollCnt = 216, seed = new Date().getTime()) => {
    const randomEngine = MersenneTwister19937.seed(seed);
    const diceRolls = map(new Array(rollCnt), () => {
        const die1 = getDieRoll(randomEngine);
        const die2 = getDieRoll(randomEngine);
        const roll = buildRollItem(die1, die2);
        return roll;
    });
    console.log('diceRolls=', diceRolls);
    return diceRolls;
};

const applyOutcomes = (diceRolls = []) => {
    //shooterId, outcomeCode (D,P,L,W), outcomeValue, isWin, isLose, isComeoutRoll,
    // isPSO, passStreakCnt, isSevenOut, nonFieldStreakCnt, hornStreakCnt,
    // winStreakCnt, loseStreakCnt, pointValue, isPointMade, shooterRollCnt

    let isPointEstablished = false;
    let pointValue = null;
    let previousOutcome = { shooterId: -1, total: 0, isComeoutRoll: true, isPointEstablished: false, pointValue: null, isSevenOut: true };
    let shooterRollCnt = 0;
    const outcomes = map(diceRolls, (diceRoll, diceRollIdx) => {
        let isComeoutRoll = false;
        let isSevenOut = false;
        let isWin = false;
        let isLose = false;
        let isPointMade = false;
        let outcomeCode = null;
        let outcomeValue = null;
        const total = get(diceRoll, 'total');
        const is7 = get(diceRoll, 'is7');
        const wasSevenOut = get(previousOutcome, 'isSevenOut');
        const wasPointMade = get(previousOutcome, 'isPointMade');
        let shooterId = get(previousOutcome, 'shooterId');
        if (wasSevenOut) {
            pointValue = null;
            shooterId = `shooter-${diceRollIdx + 1}`;
            shooterRollCnt = 0;
            isComeoutRoll = true;
        }
        if (wasPointMade) {
            pointValue = null;
            isComeoutRoll = true;
        }
        if (!isPointEstablished && isElement(POINT_VALUES, total)) {
            isPointEstablished = true;
            pointValue = total;
        } else if (!isPointEstablished && isElement([7, 11], total)) {
            isWin = true;
            isLose = false;
        } else if (isPointEstablished && (is7 || total === pointValue)) {
            isPointEstablished = false;
            if (is7) {
                isWin = false;
                isLose = true;
                isSevenOut = true;
                outcomeCode = 'D';
                outcomeValue = total;
            } else if (total === pointValue) {
                isWin = true;
                isLose = false;
                isPointMade = true;
                outcomeCode = 'P';
                outcomeValue = total;
            }
        }
        if (diceRollIdx === 0) {
            isComeoutRoll = true;
        }
        shooterRollCnt++;
        const outcomeItem = { shooterId, isComeoutRoll, isPointEstablished, pointValue, isLose, isWin, isSevenOut, shooterRollCnt, outcomeCode, outcomeValue };
        const outcome = assign({}, diceRoll, outcomeItem);
        previousOutcome = outcome;
        return outcome;
    });
    return outcomes;
};

export const getDiceRolls = () => {
    const diceRolls = flow(generateDiceRolls, applyOutcomes)(100, 1024);
    return diceRolls;
};
