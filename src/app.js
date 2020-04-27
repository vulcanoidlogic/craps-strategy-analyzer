import { interpret } from 'xstate';
import { getDiceRolls } from './build-roll-information.js';
import { createCrapsMachine } from './craps-machine';
import { get, values, assign, last } from 'lodash';
import { winLossPassDontPass } from './lib';
import { betDefinitions } from './bets-manager';
import fs from 'fs';

// const diceRolls = getDiceRolls();
// console.log(diceRolls);

// const preLoadedDiceRolls = [5, 7, 8, 6, 7, 6, 4, 6, 6, 7, 7, 11, 7, 6, 10, 9, 7];
// const preLoadedDiceRolls = getDiceRolls(20, 1024);
const preLoadedDiceRolls = getDiceRolls(1000, 1024);
// const preLoadedDiceRolls = getDiceRolls(30, 1024);
// const preLoadedDiceRolls = getDiceRolls(10000, 1024);
// console.log('preLoadedDiceRolls.length=', preLoadedDiceRolls.length);

const crapsGame = interpret(createCrapsMachine())
    // .onTransition((state) => console.log(state.value))
    .start();

crapsGame.send({ type: 'JOIN_GAME', bankRoll: 1000, preLoadedDiceRolls: preLoadedDiceRolls.map(({ total }) => total) });

const testBets = {
    place6: { amount: 36, betDefinitions: betDefinitions.place6, isOn: true },
    place8: { amount: 36, betDefinitions: betDefinitions.place8, isOn: true },
};

const makeBets = (diceRolls, diceRollInfo) => {
    const previousRoll = last(diceRolls);
    if (previousRoll) {
        const { noFieldStreakCnt } = previousRoll;
        if (noFieldStreakCnt >= 3) {
            return { field: { amount: 25, betDefinitions: betDefinitions.field, isOn: true } };
        } else {
            return null;
        }
    }
    // return testBets;
};

const outfile = fs.createWriteStream('diceRollHistory.txt', { flags: 'w' });
outfile.write('[');
preLoadedDiceRolls.forEach(({ total }, index) => {
    outfile.write(`${total},`);
});
outfile.write(']\n\n');

outfile.write('[');
const diceRollHistory = preLoadedDiceRolls.reduce((diceRolls, currentDiceRollInfo) => {
    crapsGame.send({ type: 'MAKE_BETS', bets: makeBets(diceRolls, currentDiceRollInfo) });
    crapsGame.send('ROLL_DICE');
    const step4 = crapsGame.send('DICE_ROLLED');
    const outcomeTarget = values(step4.value)[0];
    const step5 = crapsGame.send('RECONCILE_BETS');
    const diceTotal = get(step5, 'context.diceTotal');
    const shooterId = get(step5, 'context.shooterId');
    const wlpd = winLossPassDontPass(outcomeTarget);
    const rollCnt = get(step5, 'context.rollCnt');
    const bets = get(step5, 'context.bets');
    const bankRoll = get(step5, 'context.bankRoll');
    const rollHistory = assign(currentDiceRollInfo, { diceTotal, shooterId, outcomeTarget, wlpd, rollCnt, bets, bankRoll });
    outfile.write(`${JSON.stringify(rollHistory)},\n`);
    // outfile.write(`${JSON.stringify(_curr)},\n`);

    // return diceRolls.concat(rollHistory);
    return diceRolls.concat(currentDiceRollInfo);
}, []);
outfile.write(']\n');

crapsGame.send('LEAVE_GAME');

outfile.end();
console.log('END');

// console.log('Reached end of game diceRollHistory=', diceRollHistory);
