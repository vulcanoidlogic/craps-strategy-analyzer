import { interpret } from 'xstate';
import { getDiceRolls } from './build-roll-information.js';
import { createCrapsMachine } from './craps-machine';
import { get, values } from 'lodash';
import { winLossPassDontPass } from './lib';
import { betDefinitions } from './bets-manager';
import fs from 'fs';

// const diceRolls = getDiceRolls();
// console.log(diceRolls);

// const preLoadedDiceRolls = [5, 7, 8, 6, 7, 6, 4, 6, 6, 7, 7, 11, 7, 6, 10, 9, 7];
const preLoadedDiceRolls = getDiceRolls(20, 1024).map(({ total }) => total);
// const preLoadedDiceRolls = getDiceRolls(30, 1024).map(({ total }) => total);
// const preLoadedDiceRolls = getDiceRolls(10000, 1024).map(({ total }) => total);
// console.log('preLoadedDiceRolls.length=', preLoadedDiceRolls.length);

const crapsGame = interpret(createCrapsMachine())
    // .onTransition((state) => console.log(state.value))
    .start();

crapsGame.send({ type: 'JOIN_GAME', bankRoll: 1000, preLoadedDiceRolls });

const testBets = {
    place6: { amount: 36, betDefinitions: betDefinitions.place6, isOn: true },
    place8: { amount: 36, betDefinitions: betDefinitions.place8, isOn: true },
};

const outfile = fs.createWriteStream('diceRollHistory.txt', { flags: 'w' });
outfile.write('[');
preLoadedDiceRolls.forEach((item, index) => {
    outfile.write(`${item},`);
});
outfile.write(']\n');

outfile.write('[');
const diceRollHistory = preLoadedDiceRolls.reduce((diceRolls, _curr) => {
    crapsGame.send({ type: 'MAKE_BETS', bets: testBets });
    crapsGame.send('ROLL_DICE');
    const step4 = crapsGame.send('DICE_ROLLED');
    const outcomeTarget = values(step4.value)[0];
    const step5 = crapsGame.send('RECONCILE_BETS');
    const diceTotal = get(step5, 'context.diceTotal');
    const shooterId = get(step5, 'context.shooterId');
    const wlpd = winLossPassDontPass(outcomeTarget, step4.value);
    const rollCnt = get(step5, 'context.rollCnt');
    const bets = get(step5, 'context.bets');
    const bankRoll = get(step5, 'context.bankRoll');
    const rollHistory = { diceTotal, shooterId, outcomeTarget, wlpd, rollCnt, bets, bankRoll };
    outfile.write(`${JSON.stringify(rollHistory)},\n`);

    return diceRolls.concat(rollHistory);
}, []);
outfile.write(']\n');

crapsGame.send('LEAVE_GAME');

outfile.end();
console.log('END');

// console.log('Reached end of game diceRollHistory=', diceRollHistory);
