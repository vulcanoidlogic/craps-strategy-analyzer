import { forEach, get } from 'lodash';

const isSeven = ({ diceTotal = 0 }) => {
    return diceTotal === 7;
};

const rollIncludes = (diceTotalList = [], { diceTotal = 0 }) => {
    return diceTotalList.includes(diceTotal);
};

export const betDefinitions = {
    place6: { payout: 7 / 6, win: rollIncludes.bind(null, [6]), lose: isSeven, canToggleOnOff: true },
    place8: { payout: 7 / 6, win: rollIncludes.bind(null, [8]), lose: isSeven, canToggleOnOff: true },
};

export const reconcileBets = (testReconcileType, context) => {
    const diceTotal = context.diceTotal;
    const bets = context.bets;
    let bankRoll = context.bankRoll;

    console.log('bets=', bets);
    forEach(bets, (bet, betIdx) => {
        console.log(
            `${testReconcileType} diceTotal, bankRoll, win, lose=`,
            diceTotal,
            bankRoll,
            bet.betDefinitions.win({ isOn: bet.isOn, diceTotal }),
            bet.betDefinitions.lose({ isOn: bet.isOn, diceTotal })
        );
        const win = get(bet, 'betDefinitions.win');
        const isOn = get(bet, 'isOn');
        if (isOn) {
            if (win({ diceTotal })) {
                const payout = get(bet, 'betDefinitions.payout');
                const amount = get(bet, 'amount');
                // At first, return amount and force betting again
                const winAmount = payout * amount;
                bankRoll += winAmount;
            }
        }
        // Assume decrement from bankRoll when makeBets.  A loss just means we don't receive money back.  Only return amount to bank if did not lose.
        const lose = get(bet, 'betDefinitions.lose');
        if (isOn) {
            if (!lose({ diceTotal })) {
                const amount = get(bet, 'amount');
                bankRoll += amount;
            }
        }
    });
    return bankRoll;
};

export const makeBets = (context, event) => {
    const diceTotal = context.diceTotal;
    const bets = event.bets;
    let bankRoll = context.bankRoll;

    forEach(bets, (bet, betIdx) => {
        console.log(`makeBets diceTotal, bankRoll=`, diceTotal, bankRoll);
        const isOn = get(bet, 'isOn');
        if (isOn) {
            const amount = get(bet, 'amount');
            bankRoll -= amount;
        }
    });
    return bankRoll;
};
