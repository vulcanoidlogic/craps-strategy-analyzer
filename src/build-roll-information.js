import assign from 'lodash/assign';
import get from 'lodash/get';
import map from 'lodash/map';
import flow from 'lodash/flow';
import { MersenneTwister19937 } from 'random-js';
import { die } from 'random-js';
import { POINT_VALUES, FIELD_VALUES, HORN_VALUES, CRAPS_VALUES, PASS_LINE_WIN_VALUES, PASS_LINE_LOSE_VALUES } from './constants';

const buildRollItem = (die1, die2) => {
    const total = die1 + die2;
    const isHardWay = die1 === die2;
    const is7 = total === 7;

    const rollInfo = {
        total,
        isHardWay,
        isPoint: POINT_VALUES.includes(total),
        isNoField: !FIELD_VALUES.includes(total),
        isField: FIELD_VALUES.includes(total),
        isHorn: HORN_VALUES.includes(total),
        isCraps: CRAPS_VALUES.includes(total),
        is7,
        die1,
        die2,
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
    return diceRolls;
};

const applyOutcomes = (diceRolls = []) => {
    //shooterId, outcomeCode (D,P,L,W), outcomeValue, isWin, isLose, isComeoutRoll, isSevenOut, isPass, pointValue, , shooterRollCnt, isPointThenImmediatePass, isPointSevenOut,  shooter10Cnt, shooter4Cnt, hornStreakCnt, passStreakCnt, noFieldStreakCnt, noHardWayStreakCnt, sevenStreakCnt, winStreakCnt, loseStreakCnt

    let isPointEstablished = false;
    let pointValue = null;
    let shooter4Cnt = 0;
    let shooter5Cnt = 0;
    let shooter6Cnt = 0;
    let shooter8Cnt = 0;
    let shooter9Cnt = 0;
    let shooter10Cnt = 0;
    let hornStreakCnt = 0;
    let passStreakCnt = 0;
    let noFieldStreakCnt = 0;
    let noHardWayStreakCnt = 0;
    let sevenStreakCnt = 0;
    let winStreakCnt = 0;
    let loseStreakCnt = 0;
    let previousOutcome = {
        shooterId: -1,
        total: 0,
        isComeoutRoll: true,
        isPointEstablished: false,
        pointValue: null,
        isSevenOut: true,
        hornStreakCnt: 0,
    };
    let shooterRollCnt = 0;
    let shooterAfterNewPointRollCnt = 0;
    const outcomes = map(diceRolls, (diceRoll, diceRollIdx) => {
        let isComeoutRoll = false;
        let isSevenOut = false;
        let isWin = false;
        let isLose = false;
        let isPass = false;
        let outcomeCode = null;
        let outcomeValue = null;
        let isPointThenImmediatePass = false;
        let isPointSevenOut = false;
        let shooterId = get(previousOutcome, 'shooterId');

        const total = get(diceRoll, 'total');
        const is7 = get(diceRoll, 'is7');
        const isNoField = get(diceRoll, 'isNoField');
        const wasNoField = get(previousOutcome, 'isNoField');
        const isHardWay = get(diceRoll, 'isHardWay');
        const wasSevenOut = get(previousOutcome, 'isSevenOut');
        const wasPointMade = get(previousOutcome, 'isPass');
        const previousTotal = get(previousOutcome, 'total');
        const wasLose = get(previousOutcome, 'isLose');
        const wasWin = get(previousOutcome, 'isWin');

        if (wasSevenOut) {
            pointValue = null;
            shooterId = `shooter-${diceRollIdx + 1}`;
            shooterRollCnt = 0;
            isComeoutRoll = true;
            shooterAfterNewPointRollCnt = 0;
            shooter4Cnt = 0;
            shooter5Cnt = 0;
            shooter6Cnt = 0;
            shooter8Cnt = 0;
            shooter9Cnt = 0;
            shooter10Cnt = 0;
            passStreakCnt = 0;
            noFieldStreakCnt = 0;
        }
        if (wasPointMade) {
            pointValue = null;
            isComeoutRoll = true;
            shooterAfterNewPointRollCnt = 0;
            isPointEstablished = false;
        }
        if (!isPointEstablished && POINT_VALUES.includes(total)) {
            isPointEstablished = true;
            pointValue = total;
        } else if (isPointEstablished && POINT_VALUES.includes(total)) {
            shooterAfterNewPointRollCnt++;
            if (total === pointValue) {
                isWin = true;
                isLose = false;
                isPass = true;
                outcomeCode = 'P';
                outcomeValue = total;
                if (shooterAfterNewPointRollCnt === 1) {
                    isPointThenImmediatePass = true;
                }
                if (wasPointMade) {
                    passStreakCnt++;
                }
                if (wasWin || wasPointMade) {
                    winStreakCnt++;
                } else {
                    if (isWin || isPass) {
                        winStreakCnt = 1;
                    } else {
                        winStreakCnt = 0;
                    }
                }
                loseStreakCnt = 0;
            }
        } else if (!isPointEstablished && PASS_LINE_LOSE_VALUES.includes(total)) {
            isWin = false;
            isLose = true;
            outcomeCode = 'L';
            outcomeValue = total;
            if (wasLose || wasSevenOut) {
                loseStreakCnt++;
            } else {
                if (isLose || isSevenOut) {
                    loseStreakCnt = 1;
                } else {
                    loseStreakCnt = 0;
                }
            }
            winStreakCnt = 0;
        } else if (!isPointEstablished && PASS_LINE_WIN_VALUES.includes(total)) {
            isWin = true;
            isLose = false;
            outcomeCode = 'W';
            outcomeValue = total;
            if (wasWin || wasPointMade) {
                winStreakCnt++;
            } else {
                if (isWin || isPass) {
                    winStreakCnt = 1;
                } else {
                    winStreakCnt = 0;
                }
            }
            loseStreakCnt = 0;
        } else if (isPointEstablished && is7) {
            isPointEstablished = false;
            isWin = false;
            isLose = true;
            isSevenOut = true;
            outcomeCode = 'D';
            outcomeValue = total;
            if (shooterAfterNewPointRollCnt === 0) {
                isPointSevenOut = true;
            }
            if (wasLose || wasSevenOut) {
                loseStreakCnt++;
            } else {
                if (isLose || isSevenOut) {
                    loseStreakCnt = 1;
                } else {
                    loseStreakCnt = 0;
                }
            }
            winStreakCnt = 0;
        } else if (isPointEstablished && HORN_VALUES.includes(total)) {
            shooterAfterNewPointRollCnt++;
        }
        if (HORN_VALUES.includes(total) && HORN_VALUES.includes(previousTotal)) {
            hornStreakCnt++;
        } else {
            if (HORN_VALUES.includes(total)) {
                hornStreakCnt = 1;
            } else {
                hornStreakCnt = 0;
            }
        }
        if (total === 4) {
            shooter4Cnt++;
        }
        if (total === 5) {
            shooter5Cnt++;
        }
        if (total === 6) {
            shooter6Cnt++;
        }
        if (total === 8) {
            shooter8Cnt++;
        }
        if (total === 9) {
            shooter9Cnt++;
        }
        if (total === 10) {
            shooter10Cnt++;
        }
        if (isNoField && wasNoField) {
            noFieldStreakCnt++;
        } else {
            noFieldStreakCnt = 0;
        }
        if (isHardWay) {
            noHardWayStreakCnt = 1;
        } else {
            noHardWayStreakCnt++;
        }
        if (is7) {
            sevenStreakCnt++;
        } else {
            sevenStreakCnt = 0;
        }
        if (isLose === false && isWin === false) {
            winStreakCnt = 0;
            loseStreakCnt = 0;
        }

        shooterRollCnt++;
        const outcomeItem = {
            isComeoutRoll,
            isPointEstablished,
            pointValue,
            isLose,
            isWin,
            isPass,
            isSevenOut,
            shooterRollCnt,
            outcomeCode,
            outcomeValue,
            isPointSevenOut,
            isPointThenImmediatePass,
            shooterId,
            shooter4Cnt,
            shooter5Cnt,
            shooter6Cnt,
            shooter8Cnt,
            shooter9Cnt,
            shooter10Cnt,
            shooterAfterNewPointRollCnt,
            hornStreakCnt,
            passStreakCnt,
            noFieldStreakCnt,
            noHardWayStreakCnt,
            sevenStreakCnt,
            loseStreakCnt,
            winStreakCnt,
        };
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
