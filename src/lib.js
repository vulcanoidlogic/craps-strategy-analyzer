import { isEmpty, noop, last, sortBy, keys, get } from 'lodash';
import { max, mean, median, deviation, group, rollup } from 'd3-array';
import { DICE_TOTAL_PROBABILITIES } from './constants';
import { betDefinitions, getBetOutcome } from './bets-manager';

// win, loss, pass, dont-pass
export const winLossPassDontPass = (wlpd) => {
    const lookup = {
        point_off_win: 'W',
        point_off_lose: 'L',
        point_pass: 'P',
        point_dont_pass: 'D',
    };
    return lookup[wlpd] || null;
};

export const roundToNext6 = (x) => Math.ceil(x / 6) * 6;

const initialAnalysis = {
    maxShooter4Cnt: 0,
    maxShooter5Cnt: 0,
    maxShooter6Cnt: 0,
    maxShooter8Cnt: 0,
    maxShooter9Cnt: 0,
    maxShooter10Cnt: 0,
    maxWinStreakCnt: 0,
    maxHornStreakCnt: 0,
    maxHornSevenStreakCnt: 0,
    maxPassStreakCnt: 0,
    maxLoseStreakCnt: 0,
    maxSevenStreakCnt: 0,
    maxNoFieldStreakCnt: 0,
    maxNoSevenStreakCnt: 0,
    maxDontPassStreakCnt: 0,
    maxNoHardWayStreakCnt: 0,
    maxPointSevenOutStreakCnt: 0,
    maxYes5689StreakCnt: 0,
    maxNo5689StreakCnt: 0,
    gtThresholdWinStreakCnt: 0,
    gtThresholdSevenStreakCnt: 0,
    gtThresholdShooter4Cnt: 0,
    gtThresholdShooter10Cnt: 0,
    eqThresholdShooter4Cnt: 0,
    eqThresholdShooter10Cnt: 0,
    gtThresholdPassStreakCnt: 0,
    gtThresholdDontPassStreakCnt: 0,
    helperPassStreakCnt: 0,
    helperDontPassStreakCnt: 0,
    helperShooter4Cnt: 0,
    helperShooter10Cnt: 0,
    helperShooterId: '',
    helperIsPointEstablished: false,
    helperPointSevenOutStreakCnt: 0,
    helperPSO: [],
};

const winStreakThreshold = 3;
const sevenStreakThreshold = 3;
const shooter4CntThreshold = 4;
const shooter10CntThreshold = 4;
const passStreakThreshold = 4;
const dontPassStreakThreshold = 8;

// Fire bet
// Can we do anything with loseStreakCnt?
// is there a difference between sevenStreakCnt and shooterSevenCnt?
//
export const analyze = (results) => {
    const { max } = Math;
    const analysis = results.reduce((cumulative, result) => {
        const {
            winStreakCnt,
            sevenStreakCnt,
            passStreakCnt,
            dontPassStreakCnt,
            shooter4Cnt,
            shooter10Cnt,
            shooterId,
            isPointSevenOut,
            isPointEstablished,
            yes5689StreakCnt,
            no5689StreakCnt,
        } = result;

        if (isPointSevenOut) {
            cumulative.helperPSO = cumulative.helperPSO.concat(result);
            // May be first PSO or a PSO after a previous PSO
            if (isEmpty(cumulative.helperPSO)) {
                // First PSO
                cumulative.helperPointSevenOutStreakCnt = 1;
            } else {
                // Second or greater PSO
                cumulative.helperPointSevenOutStreakCnt += 1;
            }
            cumulative.maxPointSevenOutStreakCnt = max(cumulative.maxPointSevenOutStreakCnt, cumulative.helperPointSevenOutStreakCnt);
        } else {
            // Clear helperPSO if we have two consecutive rolls with point established.
            if (cumulative.helperIsPointEstablished && isPointEstablished) {
                cumulative.helperPointSevenOutStreakCnt = 0;
                cumulative.helperPSO = [];
            }
        }
        cumulative.gtThresholdWinStreakCnt += winStreakCnt > winStreakThreshold ? 1 : 0;
        cumulative.gtThresholdSevenStreakCnt += sevenStreakCnt > sevenStreakThreshold ? 1 : 0;

        if (cumulative.shooterId !== shooterId) {
            cumulative.gtThresholdShooter4Cnt += cumulative.shooter4Cnt > shooter4CntThreshold ? 1 : 0;
            cumulative.gtThresholdShooter10Cnt += cumulative.shooter10Cnt > shooter10CntThreshold ? 1 : 0;
            cumulative.eqThresholdShooter4Cnt += cumulative.shooter4Cnt === shooter4CntThreshold ? 1 : 0;
            cumulative.eqThresholdShooter10Cnt += cumulative.shooter10Cnt === shooter10CntThreshold ? 1 : 0;
            cumulative.gtThresholdPassStreakCnt += cumulative.passStreakCnt > passStreakThreshold ? 1 : 0;
            cumulative.gtThresholdDontPassStreakCnt += cumulative.dontPassStreakCnt > dontPassStreakThreshold ? 1 : 0;
        }

        cumulative.maxDontPassStreakCnt = max(result.dontPassStreakCnt, cumulative.maxDontPassStreakCnt);
        cumulative.maxPassStreakCnt = max(result.passStreakCnt, cumulative.maxPassStreakCnt);
        cumulative.maxHornStreakCnt = max(result.hornStreakCnt, cumulative.maxHornStreakCnt);
        cumulative.maxHornSevenStreakCnt = max(result.hornSevenStreakCnt, cumulative.maxHornSevenStreakCnt);
        cumulative.maxNoHardWayStreakCnt = max(result.noHardWayStreakCnt, cumulative.maxNoHardWayStreakCnt);
        cumulative.maxNoSevenStreakCnt = max(result.noSevenStreakCnt, cumulative.maxNoSevenStreakCnt);
        cumulative.maxSevenStreakCnt = max(result.sevenStreakCnt, cumulative.maxSevenStreakCnt);
        cumulative.maxWinStreakCnt = max(winStreakCnt, cumulative.maxWinStreakCnt);
        cumulative.maxLoseStreakCnt = max(result.loseStreakCnt, cumulative.maxLoseStreakCnt);
        cumulative.maxNoFieldStreakCnt = max(result.noFieldStreakCnt, cumulative.maxNoFieldStreakCnt);
        cumulative.maxShooter4Cnt = max(result.shooter4Cnt, cumulative.maxShooter4Cnt);
        cumulative.maxShooter5Cnt = max(result.shooter5Cnt, cumulative.maxShooter5Cnt);
        cumulative.maxShooter6Cnt = max(result.shooter6Cnt, cumulative.maxShooter6Cnt);
        cumulative.maxShooter8Cnt = max(result.shooter8Cnt, cumulative.maxShooter8Cnt);
        cumulative.maxShooter9Cnt = max(result.shooter9Cnt, cumulative.maxShooter9Cnt);
        cumulative.maxShooter10Cnt = max(result.shooter10Cnt, cumulative.maxShooter10Cnt);
        cumulative.maxYes5689StreakCnt = max(result.yes5689StreakCnt, cumulative.maxYes5689StreakCnt);
        cumulative.maxNo5689StreakCnt = max(result.no5689StreakCnt, cumulative.maxNo5689StreakCnt);
        cumulative.helperShooter4Cnt = shooter4Cnt;
        cumulative.helperShooter10Cnt = shooter10Cnt;
        cumulative.helperShooterId = shooterId;
        cumulative.helperPassStreakCnt = passStreakCnt;
        cumulative.helperDontPassStreakCnt = dontPassStreakCnt;
        cumulative.helperIsPointEstablished = isPointEstablished;
        return cumulative;
    }, initialAnalysis);
    return analysis;
};

const printStats = (results, prop = 'sevenStreakCnt', f = noop) => {
    const curMax = max(results, f);
    const curMean = mean(results, f);
    const curMedian = median(results, f);
    const curDeviation = deviation(results, f);
    console.log(
        `\n===========================\ngetStats ${prop}\n===========================\nprop=${prop}, \nmax=${curMax}, \nmean=${curMean}, \nmedian=${curMedian}, \ndeviation=${curDeviation}`
    );
    console.log(`===========================`);
};

export const getFrequencySevenStreakCnt = (results) => {
    const prop = 'sevenStreakCnt';

    console.log(`\n===========================\nFrequency sevenStreakCnt\n===========================`);

    let totalSevenCnt = 0;
    rollup(
        results,
        (v) => v.length,
        (d) => d[prop]
    ).forEach((freqCnt, key) => {
        if (key > 0) totalSevenCnt += freqCnt;
        console.log(`freqCnts ${key} = ${freqCnt}`);
    });

    console.log(`Expect 7 Count = ${Number((1 / 6) * results.length).toFixed(4)}`);
    console.log(`Actual 7 Count = ${totalSevenCnt}`);
    console.log(`----------------------------`);
    console.log(`Freq 1 Expect = ${Number(Math.pow(1 / 6, 1) * results.length).toFixed(4)}`);
    console.log(`Freq 2 Expect = ${Number(Math.pow(1 / 6, 2) * results.length).toFixed(4)}`);
    console.log(`Freq 3 Expect = ${Number(Math.pow(1 / 6, 3) * results.length).toFixed(4)}`);
    console.log(`Freq 4 Expect = ${Number(Math.pow(1 / 6, 4) * results.length).toFixed(4)}`);
    console.log(`Freq 5 Expect = ${Number(Math.pow(1 / 6, 5) * results.length).toFixed(4)}`);
    console.log(`Freq 6 Expect = ${Number(Math.pow(1 / 6, 6) * results.length).toFixed(4)}`);
    console.log(`Freq 7 Expect = ${Number(Math.pow(1 / 6, 7) * results.length).toFixed(4)}`);
    console.log(`Freq 8 Expect = ${Number(Math.pow(1 / 6, 8) * results.length).toFixed(4)}`);
    console.log(`Freq 9 Expect = ${Number(Math.pow(1 / 6, 9) * results.length).toFixed(4)}`);
    console.log(`Freq 10 Expect = ${Number(Math.pow(1 / 6, 10) * results.length).toFixed(4)}`);
    console.log(`===========================`);
};

export const getFrequencyPointSevenOut = (results) => {
    const prop = 'isPointSevenOut';
    // Separate into True (PSO), False (not PSO), and other
    const groupByRollSession = (d) => {
        if (d[prop] === true) {
            return `${prop}True`;
        } else if (d.outcomeValue !== null) {
            return `${prop}False`;
        } else {
            return `${prop}IrrelevantForCalculation`;
        }
    };

    const frequencyTrue = group(results, groupByRollSession).get(`${prop}True`) || [];
    const frequencyFalse = rollup(results, (v) => v.length, groupByRollSession).get(`${prop}False`);

    console.log(`\n===========================\nFrequency Outcome PSO\n===========================`);

    // Total number of roll sessions.  Each pass is considered a roll session even if same shooter passes multiple times.
    // This is per outcome - *NOT* per shooter.
    // PSO includes a shooter passing one or more times then establish point, and seven-out.
    // It's any seven-out after point is established.
    // The frequency represents number of times in a row a PSO happened.
    const totalRollSessions = rollup(
        results,
        (v) => v.length,
        (d) => (d.outcomeValue === null ? '' : 'SHOOTER_SESSION')
    ).get('SHOOTER_SESSION');
    console.log(`Total outcomes: ${totalRollSessions}`);
    console.log(`Percent PSO: ${Number(frequencyTrue.length / totalRollSessions).toFixed(4)}`);

    console.log(`Frequency 0: ${frequencyFalse}`);

    let prevRollCnt = 0;
    let streakCnt = 1;
    const groupByStreakCnt = (d) => d.streakCnt;
    const trueCnts = group(
        frequencyTrue.reduce((cumulativeCnts, item) => {
            if (item.rollCnt - prevRollCnt === 2) {
                ++streakCnt;
            } else {
                streakCnt = 1;
            }
            prevRollCnt = item.rollCnt;
            return cumulativeCnts.concat({ streakCnt });
        }, []),
        groupByStreakCnt
    );

    trueCnts.forEach((item, key) => {
        console.log(`Frequency ${key}: ${item.length}`);
    });
    console.log(`===========================`);
};

export const getRollCountByShooter = (results, prop = 'shooterRollCnt') => {
    console.log(`\n===========================\nFrequency ${prop}\n===========================`);

    const rollSessionsByShooterId = group(
        results,
        (d) => d.shooterId,
        (d) => (d.outcomeValue === null ? '' : 'SHOOTER_SESSION')
    );

    const freqArr = [];
    rollSessionsByShooterId.forEach((item, key) => {
        const shooterRollSessions = item.get('SHOOTER_SESSION');
        if (shooterRollSessions) {
            const finalRollSession = last(shooterRollSessions);
            freqArr.push({ [prop]: `${finalRollSession[prop]}` });
        }
    });

    rollup(
        sortBy(freqArr, (obj) => Number(obj[prop])),
        (v) => v.length,
        (d) => d[prop]
    ).forEach((freqCnt, key) => {
        console.log(`freqCnts ${key} = ${freqCnt}`);
    });

    console.log(`Distinct Shooter Count ${freqArr.length}`);
    console.log(`===========================`);
};

export const getFrequencyTotalByShooter = (results, prop = 'shooter10Cnt', diceTotal) => {
    console.log(`\n===========================\nFrequency ${prop}\n===========================`);

    const rollSessionsByShooterId = group(
        results,
        (d) => d.shooterId,
        (d) => (d.outcomeValue === null ? '' : 'SHOOTER_SESSION')
    );

    const freqArr = [];
    rollSessionsByShooterId.forEach((item, key) => {
        const shooterRollSessions = item.get('SHOOTER_SESSION');
        if (shooterRollSessions) {
            const finalRollSession = last(shooterRollSessions);
            freqArr.push({ [prop]: `${finalRollSession[prop]}` });
        }
    });

    let totalCnt = 0;
    rollup(
        sortBy(freqArr, (obj) => Number(obj[prop])),
        (v) => v.length,
        (d) => d[prop]
    ).forEach((freqCnt, key) => {
        totalCnt += Number(key) * freqCnt;
        console.log(`freqCnts ${key} = ${freqCnt}`);
    });

    console.log(`Distinct Shooter Count ${freqArr.length}`);

    const diceTotalProbability = DICE_TOTAL_PROBABILITIES[`T${diceTotal}`];

    if (diceTotalProbability) {
        console.log(`----------------------------`);
        console.log(`Count Expect = ${Number(Math.pow(diceTotalProbability, 1) * results.length).toFixed(4)}`);
        console.log(`Count Actual = ${totalCnt}`);
    }

    console.log(`===========================`);
};

export const getDiceTotalCountBeforeSeven = (results, diceTotal) => {
    console.log(`\n===========================\n${diceTotal} Count Before Seven \n===========================`);

    let diceTotalCnt = 0;
    const diceTotalCnts = results.reduce((cumulative, current) => {
        if (current.total === diceTotal) {
            diceTotalCnt++;
        } else if (current.total === 7) {
            const curProp = `Freq ${diceTotalCnt.toString().padStart(2, '0')}`;
            if (cumulative[curProp] === undefined) {
                cumulative[curProp] = diceTotalCnt;
            } else {
                cumulative[curProp] = ++cumulative[curProp];
            }

            diceTotalCnt = 0;
        }
        return cumulative;
    }, {});

    keys(diceTotalCnts)
        .sort()
        .forEach((diceTotalCntsKey) => {
            console.log(`${diceTotalCntsKey} = ${diceTotalCnts[diceTotalCntsKey]}`);
        });

    console.log(`===========================`);
};

export const getWLPDFrequency = (results) => {
    const prop = 'wlpd';
    console.log(`\n===========================\nFrequency ${prop}\n===========================`);

    let winPassTotal = 0;
    let loseDontTotal = 0;
    let passTotal = 0;
    let winTotal = 0;
    let dontTotal = 0;
    let loseTotal = 0;
    rollup(
        results,
        (v) => v.length,
        (d) => d[prop]
    ).forEach((freqCnt, key) => {
        console.log(`WLPD ${key} = ${freqCnt}`);
        if (key === 'D') {
            loseDontTotal += freqCnt;
            dontTotal += freqCnt;
        }
        if (key === 'L') {
            loseDontTotal += freqCnt;
            loseTotal += freqCnt;
        }
        if (key === 'P') {
            winPassTotal += freqCnt;
            passTotal += freqCnt;
        }
        if (key === 'W') {
            winPassTotal += freqCnt;
            winTotal += freqCnt;
        }
    });

    const totalNumberOutcomes = winPassTotal + loseDontTotal;
    console.log(`Total # Outcomes: ${totalNumberOutcomes}`);
    console.log(`Win/Pass Total: ${winPassTotal}`);
    console.log(`Lose/Dont Total: ${loseDontTotal}`);
    console.log(`Percent W/P = ${Number(winPassTotal / totalNumberOutcomes).toFixed(4)}`);
    console.log(`Percent L/D = ${Number(loseDontTotal / totalNumberOutcomes).toFixed(4)}`);
    console.log(`Percent P = ${Number(passTotal / (passTotal + dontTotal)).toFixed(4)}`);
    console.log(`Expected W = ${Number(DICE_TOTAL_PROBABILITIES.T7 + DICE_TOTAL_PROBABILITIES.T11).toFixed(4)}`);
    console.log(`Actual W = ${Number(winTotal / totalNumberOutcomes).toFixed(4)}`);
    console.log(`Percent D = ${Number(dontTotal / (passTotal + dontTotal)).toFixed(4)}`);
    console.log(`Expected L = ${Number(DICE_TOTAL_PROBABILITIES.T2 + DICE_TOTAL_PROBABILITIES.T3 + DICE_TOTAL_PROBABILITIES.T12).toFixed(4)}`);
    console.log(`Actual L = ${Number(loseTotal / totalNumberOutcomes).toFixed(4)}`);

    console.log(`===========================`);
};

export const writeBetOutcomes = (file, results) => {
    results.forEach((result, resultIdx) => {
        const outcome = {
            total: get(result, 'total'),
            place4: getBetOutcome('place4', result),
            place5: getBetOutcome('place5', result),
            place6: getBetOutcome('place6', result),
            place8: getBetOutcome('place8', result),
            place9: getBetOutcome('place9', result),
            place10: getBetOutcome('place10', result),
        };
        // file.write(`${JSON.stringify(outcome)},\n`);
    });
};

export const getStats = (results, prop = 'sevenStreakCnt') => {
    const f = (d) => d[prop];
    printStats(results, prop, f);
};
