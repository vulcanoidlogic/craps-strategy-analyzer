import { isEmpty, noop, forEach } from 'lodash';
import { max, mean, median, deviation, group, quantile } from 'd3-array';
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
    // const prop = 'sevenStreakCnt';
    // const prop = 'winStreakCnt';
    const curMax = max(results, f);
    const curMean = mean(results, f);
    const curMedian = median(results, f);
    const curDeviation = deviation(results, f);
    // const curVariance = variance(results, f);
    console.log(
        `===========================\ngetStats ${prop}\n===========================\nprop=${prop}, \ncurMax=${curMax}, \ncurMean=${curMean}, \ncurMedian=${curMedian}, \ncurDeviation=${curDeviation}`
    );
};

export const getStatsPointSevenOut = (results, prop = 'isPointSevenOut') => {
    const f = (d) => (d[prop] === true ? `${prop}True` : `${prop}False`);
    const frequencyFalse = group(results, f).get(`${prop}False`);
    const frequencyTrue = group(results, f).get(`${prop}True`);

    console.log(`Frequency 0: ${frequencyFalse.length}`);

    let prevRollCnt = 0;
    let streakCnt = 1;

    const g = (d) => d.count;
    const trueCnts = group(
        frequencyTrue.reduce((cumulativeCnts, item) => {
            if (item.rollCnt - prevRollCnt === 2) {
                ++streakCnt;
            } else {
                streakCnt = 1;
            }
            prevRollCnt = item.rollCnt;

            return cumulativeCnts.concat({ count: streakCnt });
        }, []),
        g
    );

    trueCnts.forEach((item, key) => {
        console.log(`Frequency ${key}: ${item.length}`);
    });
};

export const getStats = (results, prop = 'sevenStreakCnt') => {
    const f = (d) => d[prop];
    printStats(results, prop, f);
};
