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
    maxPassStreakCnt: 0,
    maxLoseStreakCnt: 0,
    maxSevenStreakCnt: 0,
    maxNo5689StreakCnt: 0,
    maxNoFieldStreakCnt: 0,
    maxNoSevenStreakCnt: 0,
    maxDontPassStreakCnt: 0,
    maxNoHardWayStreakCnt: 0,
    gtThresholdWinStreakCnt: 0,
    gtThresholdSevenStreakCnt: 0,
    gtThresholdShooter4Cnt: 0,
    gtThresholdShooter10Cnt: 0,
    eqThresholdShooter4Cnt: 0,
    eqThresholdShooter10Cnt: 0,
    gtThresholdPassStreakCnt: 0,
    gtThresholdDontPassStreakCnt: 0,
    passStreakCnt: 0,
    dontPassStreakCnt: 0,
    shooter4Cnt: 0,
    shooter10Cnt: 0,
    shooterId: '',
};

const winStreakThreshold = 3;
const sevenStreakThreshold = 3;
const shooter4CntThreshold = 4;
const shooter10CntThreshold = 4;
const passStreakThreshold = 4;
const dontPassStreakThreshold = 8;

// Fire bet
// Can we do anything with loseStreakCnt?
// sevenStreakCnt

export const analyze = (results) => {
    const analysis = results.reduce((cumulative, result) => {
        const { winStreakCnt, sevenStreakCnt, passStreakCnt, dontPassStreakCnt, shooter4Cnt, shooter10Cnt, shooterId } = result;
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

        cumulative.maxDontPassStreakCnt = Math.max(result.dontPassStreakCnt, cumulative.maxDontPassStreakCnt);
        cumulative.maxPassStreakCnt = Math.max(result.passStreakCnt, cumulative.maxPassStreakCnt);
        cumulative.maxHornStreakCnt = Math.max(result.hornStreakCnt, cumulative.maxHornStreakCnt);
        cumulative.maxNoHardWayStreakCnt = Math.max(result.noHardWayStreakCnt, cumulative.maxNoHardWayStreakCnt);
        cumulative.maxNoSevenStreakCnt = Math.max(result.noSevenStreakCnt, cumulative.maxNoSevenStreakCnt);
        cumulative.maxSevenStreakCnt = Math.max(result.sevenStreakCnt, cumulative.maxSevenStreakCnt);
        cumulative.maxWinStreakCnt = Math.max(winStreakCnt, cumulative.maxWinStreakCnt);
        cumulative.maxLoseStreakCnt = Math.max(result.loseStreakCnt, cumulative.maxLoseStreakCnt);
        cumulative.maxNoFieldStreakCnt = Math.max(result.noFieldStreakCnt, cumulative.maxNoFieldStreakCnt);
        cumulative.maxNo5689StreakCnt = Math.max(result.no5689StreakCnt, cumulative.maxNo5689StreakCnt);
        cumulative.maxShooter4Cnt = Math.max(result.shooter4Cnt, cumulative.maxShooter4Cnt);
        cumulative.maxShooter5Cnt = Math.max(result.shooter5Cnt, cumulative.maxShooter5Cnt);
        cumulative.maxShooter6Cnt = Math.max(result.shooter6Cnt, cumulative.maxShooter6Cnt);
        cumulative.maxShooter8Cnt = Math.max(result.shooter8Cnt, cumulative.maxShooter8Cnt);
        cumulative.maxShooter9Cnt = Math.max(result.shooter9Cnt, cumulative.maxShooter9Cnt);
        cumulative.maxShooter10Cnt = Math.max(result.shooter10Cnt, cumulative.maxShooter10Cnt);
        cumulative.shooter4Cnt = shooter4Cnt;
        cumulative.shooter10Cnt = shooter10Cnt;
        cumulative.shooterId = shooterId;
        cumulative.passStreakCnt = passStreakCnt;
        cumulative.dontPassStreakCnt = dontPassStreakCnt;
        return cumulative;
    }, initialAnalysis);
    return analysis;
};
