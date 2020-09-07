import assign from 'lodash/assign';
import get from 'lodash/get';
import map from 'lodash/map';
import flow from 'lodash/flow';
import { MersenneTwister19937 } from 'random-js';
import { die } from 'random-js';
import { POINT_VALUES, FIELD_VALUES, HORN_VALUES, CRAPS_VALUES, PASS_LINE_WIN_VALUES, PASS_LINE_LOSE_VALUES, BOX_5_6_8_9 } from './constants';

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

const getDieRollRandomJs = (randomEngine, sideCnt = 6) => {
    return die(sideCnt)(randomEngine);
};

const getDieRollWizardOfOdds = (sideCnt = 6) => {
    return RNG.Next(sideCnt) + 1;
};

const getDieRollXorShiftPlus = (xorshiftInstance, sideCnt = 6) => {
    return xorshiftInstance.getRandomIntInclusive(1, sideCnt);
};

const getMathRandom = (sideCnt = 6) => {
    return getRandomIntInclusive(1, 6);
};

const RNG =
    // Mersenne Twister
    {
        // adapted from http://gist.github.com/banksean/300494
        N: 624,
        M: 397,
        MATRIX_A: 0x9908b0df,
        UPPER_MASK: 0x80000000,
        LOWER_MASK: 0x7fffffff,

        Initialize: function (seed) {
            this.mt = new Array(this.N);
            this.mti = this.N + 1;
            // const seed = new Date().getTime();
            this.mt[0] = seed >>> 0;

            for (this.mti = 1; this.mti < this.N; this.mti++) {
                const s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
                this.mt[this.mti] = ((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253 + this.mti;
                this.mt[this.mti] >>>= 0;
            }
        },

        Next: function (max) {
            // returns a random integer greater than or equal to zero and less than max

            let y;
            const mag01 = new Array(0x0, this.MATRIX_A);

            if (this.mti >= this.N) {
                let kk;

                for (kk = 0; kk < this.N - this.M; kk++) {
                    y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                    this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
                }

                for (; kk < this.N - 1; kk++) {
                    y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                    this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
                }

                y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
                this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
                this.mti = 0;
            }

            y = this.mt[this.mti++];

            y ^= y >>> 11;
            y ^= (y << 7) & 0x9d2c5680;
            y ^= (y << 15) & 0xefc60000;
            y ^= y >>> 18;
            y >>>= 0;

            return Math.floor((max * y) / 4294967296.0);
        },
    };

const generateDiceRolls = (rollCnt, seed) => {
    // const randomEngine = MersenneTwister19937.seed(seed);
    RNG.Initialize(seed);

    const xorshift = new XorShift([getXorShiftRandomSeed(), getXorShiftRandomSeed(), getXorShiftRandomSeed(), getXorShiftRandomSeed()]);

    const diceRolls = map(new Array(rollCnt), () => {
        const die1 = getMathRandom();
        const die2 = getMathRandom();
        // const die1 = getDieRollXorShiftPlus(xorshift);
        // const die2 = getDieRollXorShiftPlus(xorshift);
        // const die1 = getDieRollWizardOfOdds();
        // const die2 = getDieRollWizardOfOdds();
        // const die1 = getDieRollRandomJs(randomEngine);
        // const die2 = getDieRollRandomJs(randomEngine);
        const roll = buildRollItem(die1, die2);
        return roll;
    });
    return diceRolls;
};

const applyOutcomes = (diceRolls = []) => {
    let isPointEstablished = false;
    let pointValue = null;
    let shooter4Cnt = 0;
    let shooter5Cnt = 0;
    let shooter6Cnt = 0;
    let shooter8Cnt = 0;
    let shooter9Cnt = 0;
    let shooter10Cnt = 0;
    let hornStreakCnt = 0;
    let hornSevenStreakCnt = 0;
    let passStreakCnt = 0;
    let dontPassStreakCnt = 0;
    let noFieldStreakCnt = 0;
    let noHardWayStreakCnt = 0;
    let sevenStreakCnt = 0;
    let noSevenStreakCnt = 0;
    let no5689StreakCnt = 0;
    let yes5689StreakCnt = 0;
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
        hornSevenStreakCnt: 0,
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
            // noFieldStreakCnt = 0;
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
                passStreakCnt++;
                dontPassStreakCnt = 0;
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
            dontPassStreakCnt++;
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
        if ((HORN_VALUES.includes(total) && HORN_VALUES.includes(previousTotal)) || is7) {
            hornSevenStreakCnt++;
        } else {
            if (HORN_VALUES.includes(total) || is7) {
                hornSevenStreakCnt = 1;
            } else {
                hornSevenStreakCnt = 0;
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
        if (is7) {
            noSevenStreakCnt = 0;
        } else {
            noSevenStreakCnt++;
        }
        if (BOX_5_6_8_9.includes(total)) {
            yes5689StreakCnt++;
            no5689StreakCnt = 0;
        } else {
            yes5689StreakCnt = 0;
            no5689StreakCnt++;
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
            hornSevenStreakCnt,
            dontPassStreakCnt,
            passStreakCnt,
            noFieldStreakCnt,
            noHardWayStreakCnt,
            sevenStreakCnt,
            loseStreakCnt,
            winStreakCnt,
            noSevenStreakCnt,
            yes5689StreakCnt,
            no5689StreakCnt,
        };
        const outcome = assign({}, diceRoll, outcomeItem);
        previousOutcome = outcome;
        return outcome;
    });
    return outcomes;
};

/**
 * Create a pseudorandom number generator, with a seed.
 * @param {array} seed "128-bit" integer, composed of 4x32-bit
 * integers in big endian order.
 */
function XorShift(seed) {
    // Note the extension, this === module.exports is required because
    // the `constructor` function will be used to generate new instances.
    // In that case `this` will point to the default RNG, and `this` will
    // be an instance of XorShift.
    if (!(this instanceof XorShift)) {
        return new XorShift(seed);
    }

    if (!Array.isArray(seed) || seed.length !== 4) {
        throw new TypeError('seed must be an array with 4 numbers');
    }

    // uint64_t s = [seed ...]
    this._state0U = seed[0] | 0;
    this._state0L = seed[1] | 0;
    this._state1U = seed[2] | 0;
    this._state1L = seed[3] | 0;
}

/**
 * Returns a 64bit random number as a 2x32bit array
 * @return {array}
 */
XorShift.prototype.randomint = function () {
    // uint64_t s1 = s[0]
    var s1U = this._state0U,
        s1L = this._state0L;
    // uint64_t s0 = s[1]
    var s0U = this._state1U,
        s0L = this._state1L;

    // result = s0 + s1
    var sumL = (s0L >>> 0) + (s1L >>> 0);
    var resU = (s0U + s1U + ((sumL / 2) >>> 31)) >>> 0;
    var resL = sumL >>> 0;

    // s[0] = s0
    this._state0U = s0U;
    this._state0L = s0L;

    // - t1 = [0, 0]
    var t1U = 0,
        t1L = 0;
    // - t2 = [0, 0]
    var t2U = 0,
        t2L = 0;

    // s1 ^= s1 << 23;
    // :: t1 = s1 << 23
    var a1 = 23;
    var m1 = 0xffffffff << (32 - a1);
    t1U = (s1U << a1) | ((s1L & m1) >>> (32 - a1));
    t1L = s1L << a1;
    // :: s1 = s1 ^ t1
    s1U = s1U ^ t1U;
    s1L = s1L ^ t1L;

    // t1 = ( s1 ^ s0 ^ ( s1 >> 17 ) ^ ( s0 >> 26 ) )
    // :: t1 = s1 ^ s0
    t1U = s1U ^ s0U;
    t1L = s1L ^ s0L;
    // :: t2 = s1 >> 18
    var a2 = 18;
    var m2 = 0xffffffff >>> (32 - a2);
    t2U = s1U >>> a2;
    t2L = (s1L >>> a2) | ((s1U & m2) << (32 - a2));
    // :: t1 = t1 ^ t2
    t1U = t1U ^ t2U;
    t1L = t1L ^ t2L;
    // :: t2 = s0 >> 5
    var a3 = 5;
    var m3 = 0xffffffff >>> (32 - a3);
    t2U = s0U >>> a3;
    t2L = (s0L >>> a3) | ((s0U & m3) << (32 - a3));
    // :: t1 = t1 ^ t2
    t1U = t1U ^ t2U;
    t1L = t1L ^ t2L;

    // s[1] = t1
    this._state1U = t1U;
    this._state1L = t1L;

    // return result
    return [resU, resL];
};

/**
 * Returns a random number normalized [0, 1), just like Math.random()
 * @return {number}
 */
XorShift.prototype.random = function () {
    var t2 = this.randomint();
    // Math.pow(2, -32) = 2.3283064365386963e-10
    // Math.pow(2, -52) = 2.220446049250313e-16
    return t2[0] * 2.3283064365386963e-10 + (t2[1] >>> 12) * 2.220446049250313e-16;
};

XorShift.prototype.getRandomIntInclusive = function (min, max) {
    // const r = this.random();
    // console.log('r=', r);
    return Math.floor(min + this.random() * (max - min));
};

// Seed with Math.random() by default to prevent seed collision
function getXorShiftRandomSeed() {
    return Math.random() * Math.pow(2, 32);
}

export const getDiceRolls = (rollCnt = 100, seed = 1024) => {
    const diceRolls = flow(generateDiceRolls, applyOutcomes)(rollCnt, seed);
    return diceRolls;
};

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}
