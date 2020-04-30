import { interpret } from 'xstate';
import { getDiceRolls } from './build-roll-information.js';
import { createCrapsMachine } from './craps-machine';
import { get, values, assign } from 'lodash';
import { winLossPassDontPass } from './lib';
import { makeBets } from './bets-manager';
import fs from 'fs';

const preLoadedDiceRolls = getDiceRolls(20, 1024);
// const preLoadedDiceRolls = getDiceRolls(1000, 1024);
// const preLoadedDiceRolls = getDiceRolls(30, 1024);
// const preLoadedDiceRolls = getDiceRolls(10000, 1024);

const crapsGame = interpret(createCrapsMachine())
    // .onTransition((state) => console.log(state.value))
    .start();

crapsGame.send({ type: 'JOIN_GAME', bankRoll: 1000, preLoadedDiceRolls: preLoadedDiceRolls.map(({ total }) => total) });

const outfile = fs.createWriteStream('diceRollHistory.txt', { flags: 'w' });
outfile.write('[');
preLoadedDiceRolls.forEach(({ total }, index) => {
    outfile.write(`${total},`);
});
outfile.write(']\n\n');

outfile.write('[');
preLoadedDiceRolls.reduce((diceRolls, currentDiceRollInfo) => {
    crapsGame.send({ type: 'MAKE_BETS', bets: makeBets(diceRolls, currentDiceRollInfo) });
    crapsGame.send('ROLL_DICE');
    const diceRolled = crapsGame.send('DICE_ROLLED');
    const outcomeXStateTarget = values(diceRolled.value)[0];
    const reconcileBets = crapsGame.send('RECONCILE_BETS');
    const diceTotal = get(reconcileBets, 'context.diceTotal');
    const shooterId = get(reconcileBets, 'context.shooterId');
    const wlpd = winLossPassDontPass(outcomeXStateTarget);
    const rollCnt = get(reconcileBets, 'context.rollCnt');
    const bets = get(reconcileBets, 'context.bets');
    const bankRoll = get(reconcileBets, 'context.bankRoll');
    const rollHistory = assign(currentDiceRollInfo, { diceTotal, shooterId, outcomeTarget: outcomeXStateTarget, wlpd, rollCnt, bets, bankRoll });
    outfile.write(`${JSON.stringify(rollHistory)},\n`);
    return diceRolls.concat(currentDiceRollInfo);
}, []);
outfile.write(']\n');

crapsGame.send('LEAVE_GAME');

outfile.end();
console.log('END');
