import { forEach, get, last } from 'lodash';
import { FIELD_VALUES, NON_FIELD_VALUES } from './constants';

const isSeven = ({ diceTotal = 0 }) => {
    return diceTotal === 7;
};

const rollIncludes = (diceTotalList = [], { diceTotal = 0 }) => {
    return diceTotalList.includes(diceTotal);
};

export const betDefinitions = {
    place6: { payout: 7 / 6, win: rollIncludes.bind(null, [6]), lose: isSeven, canToggleOnOff: true },
    place8: { payout: 7 / 6, win: rollIncludes.bind(null, [8]), lose: isSeven, canToggleOnOff: true },
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
    const diceTotal = context.diceTotal;
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
    const previousRoll = last(diceRolls);
    if (previousRoll) {
        const { noFieldStreakCnt, bets } = previousRoll;
        console.log('previousRoll bets=', bets);
        const fieldStreakMinumum = 3;
        const baseFieldBetAmount = 25;
        if (noFieldStreakCnt >= fieldStreakMinumum) {
            const amount = Math.max(baseFieldBetAmount, 2 * (noFieldStreakCnt - fieldStreakMinumum) * baseFieldBetAmount);
            return { field: { amount, betDefinitions: betDefinitions.field, isOn: true, betOutcome: null } };
        } else {
            return null;
        }
    }
    // return testBets;
};
