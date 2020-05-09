import { forEach, get, last, assign } from 'lodash';
import { FIELD_VALUES, NON_FIELD_VALUES } from './constants';
import { roundToNext6 } from './lib';

const isSeven = ({ diceTotal = 0 }) => {
    return diceTotal === 7;
};

const rollIncludes = (diceTotalList = [], { diceTotal = 0 }) => {
    return diceTotalList.includes(diceTotal);
};

const rollDoesNotInclude = (diceTotalList = [], { diceTotal = 0 }) => {
    return !diceTotalList.includes(diceTotal);
};

export const betDefinitions = {
    two: { payout: 30 / 1, win: rollIncludes.bind(null, [2]), lose: rollDoesNotInclude.bind(null, [2]), canToggleOnOff: false },
    three: { payout: 15 / 1, win: rollIncludes.bind(null, [3]), lose: rollDoesNotInclude.bind(null, [3]), canToggleOnOff: false },
    place4: { payout: 9 / 5, win: rollIncludes.bind(null, [4]), lose: isSeven, canToggleOnOff: true },
    place5: { payout: 7 / 5, win: rollIncludes.bind(null, [5]), lose: isSeven, canToggleOnOff: true },
    place6: { payout: 7 / 6, win: rollIncludes.bind(null, [6]), lose: isSeven, canToggleOnOff: true },
    place8: { payout: 7 / 6, win: rollIncludes.bind(null, [8]), lose: isSeven, canToggleOnOff: true },
    place9: { payout: 7 / 5, win: rollIncludes.bind(null, [9]), lose: isSeven, canToggleOnOff: true },
    place10: { payout: 9 / 5, win: rollIncludes.bind(null, [10]), lose: isSeven, canToggleOnOff: true },
    eleven: { payout: 15 / 1, win: rollIncludes.bind(null, [11]), lose: rollDoesNotInclude.bind(null, [11]), canToggleOnOff: false },
    twelve: { payout: 30 / 1, win: rollIncludes.bind(null, [12]), lose: rollDoesNotInclude.bind(null, [12]), canToggleOnOff: false },
    field: { payout: 1, win: rollIncludes.bind(null, FIELD_VALUES), lose: rollIncludes.bind(null, NON_FIELD_VALUES), canToggleOnOff: false },
};

export const reconcileBets = (testReconcileType, context) => {
    const diceTotal = context.diceTotal;
    const bets = context.bets;
    let bankRoll = context.bankRoll;

    forEach(bets, (bet, betIdx) => {
        bet.betOutcome = 'NEUTRAL';
        const win = get(bet, 'betDefinitions.win');
        const isOn = get(bet, 'isOn');
        if (isOn) {
            if (win({ diceTotal })) {
                const payout = get(bet, 'betDefinitions.payout');
                const amount = get(bet, 'amount');
                // At first, return amount and force betting again
                const winAmount = payout * amount;
                bet.betOutcome = 'W';
                bankRoll += winAmount;
            }
        }
        // Assume decrement from bankRoll when makeBets.  A loss just means we don't receive money back.  Only return amount to bank if did not lose.
        const lose = get(bet, 'betDefinitions.lose');
        if (isOn) {
            if (!lose({ diceTotal })) {
                const amount = get(bet, 'amount');
                bankRoll += amount;
            } else {
                bet.betOutcome = 'L';
            }
        }
    });
    return bankRoll;
};

export const applyBets = (context, event) => {
    // const diceTotal = context.diceTotal;
    const bets = event.bets;
    let bankRoll = context.bankRoll;

    forEach(bets, (bet, betIdx) => {
        const isOn = get(bet, 'isOn');
        if (isOn) {
            const amount = get(bet, 'amount');
            bankRoll -= amount;
        }
    });
    return bankRoll;
};

// const testBets = {
//     place6: { amount: 36, betDefinitions: betDefinitions.place6, isOn: true, betOutcome: null },
//     place8: { amount: 36, betDefinitions: betDefinitions.place8, isOn: true, betOutcome: null },
// };

export const makeBets = (diceRolls, diceRollInfo) => {
    // return assign({}, makeBetsNo5689(diceRolls, diceRollInfo));
    return assign({}, makeBetsField(diceRolls, diceRollInfo), makeBetsNo5689(diceRolls, diceRollInfo), makeBetsWinStreakCnt(diceRolls, diceRollInfo));
    // return testBets;
};

export const makeBetsField = (diceRolls, diceRollInfo) => {
    const previousRoll = last(diceRolls);
    if (previousRoll) {
        const {
            noFieldStreakCnt,
            bets: { field },
        } = previousRoll;
        const streakMinumum = 3;

        if (noFieldStreakCnt >= streakMinumum) {
            if (field) {
                const { amount } = field;
                return { field: { amount: amount * 2, betDefinitions: betDefinitions.field, isOn: true, betOutcome: null } };
            } else {
                const baseBetAmount = 25;
                return { field: { amount: baseBetAmount, betDefinitions: betDefinitions.field, isOn: true, betOutcome: null } };
            }
        } else {
            return {};
        }
    }
};

export const makeBetsNo5689 = (diceRolls, diceRollInfo) => {
    const previousRoll = last(diceRolls);
    if (previousRoll) {
        const { no5689StreakCnt } = previousRoll;
        const streakMinumum = 3;
        const baseBetAmount = 25;
        if (no5689StreakCnt >= streakMinumum) {
            const amount = baseBetAmount;

            return {
                place5: { amount, betDefinitions: betDefinitions.place5, isOn: true, betOutcome: null },
                place6: { amount: roundToNext6(amount), betDefinitions: betDefinitions.place6, isOn: true, betOutcome: null },
                place8: { amount: roundToNext6(amount), betDefinitions: betDefinitions.place8, isOn: true, betOutcome: null },
                place9: { amount, betDefinitions: betDefinitions.place9, isOn: true, betOutcome: null },
            };
        } else {
            return {};
        }
    }
};

export const makeBetsWinStreakCnt = (diceRolls, diceRollInfo) => {
    const previousRoll = last(diceRolls);
    if (previousRoll) {
        const { winStreakCnt } = previousRoll;
        const streakMinumum = 3;
        const baseBetAmount = 25;
        if (winStreakCnt >= streakMinumum) {
            const amount = baseBetAmount;

            return {
                two: { amount: 10, betDefinitions: betDefinitions.two, isOn: true, betOutcome: null },
                three: { amount: 10, betDefinitions: betDefinitions.three, isOn: true, betOutcome: null },
                place4: { amount, betDefinitions: betDefinitions.place4, isOn: true, betOutcome: null },
                place5: { amount, betDefinitions: betDefinitions.place5, isOn: true, betOutcome: null },
                place6: { amount: roundToNext6(amount), betDefinitions: betDefinitions.place6, isOn: true, betOutcome: null },
                place8: { amount: roundToNext6(amount), betDefinitions: betDefinitions.place8, isOn: true, betOutcome: null },
                place9: { amount, betDefinitions: betDefinitions.place9, isOn: true, betOutcome: null },
                place10: { amount, betDefinitions: betDefinitions.place10, isOn: true, betOutcome: null },
                twelve: { amount: 10, betDefinitions: betDefinitions.twelve, isOn: true, betOutcome: null },
            };
        } else {
            return {};
        }
    }
};
