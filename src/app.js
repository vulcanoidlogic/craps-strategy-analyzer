import { interpret } from 'xstate';
import { getDiceRolls } from './build-roll-information.js';
import { createCrapsMachine } from './craps-machine';
import { get, values, assign } from 'lodash';
import { winLossPassDontPass, analyze, getStats, getStatsPointSevenOut } from './lib';
import { makeBets } from './bets-manager';
import fs from 'fs';

// const rollCnt = 20;
// const rollCnt = 100;
// const rollCnt = 500;
const rollCnt = 1000;
// const rollCnt = 3000;
// const rollCnt = 10000;
// const rollCnt = 20000;
// const rollCnt = 30000;
// const rollCnt = 40000;
// const diceRollSeed = 384328578983;
// const diceRollSeed = 934348438;
const diceRollSeed = 2343243;
// const diceRollSeed = 325532;
// const diceRollSeed = 1024;
const preLoadedDiceRolls = getDiceRolls(rollCnt, diceRollSeed);
console.log('Finished preLoadedDiceRolls');

const crapsGame = interpret(createCrapsMachine())
    // .onTransition((state) => console.log(state.value))
    .start();

console.log('Started crapsGame');

crapsGame.send({ type: 'JOIN_GAME', bankRoll: 1000, preLoadedDiceRolls: preLoadedDiceRolls.map(({ total }) => total) });

const outfile = fs.createWriteStream('diceRollHistory.txt', { flags: 'w' });
// outfile.write('[');
// preLoadedDiceRolls.forEach(({ total }, index) => {
//     outfile.write(`${total},`);
// });
// outfile.write(']\n\n');

outfile.write('[');
const results = preLoadedDiceRolls.reduce((diceRolls, currentDiceRollInfo) => {
    crapsGame.send({ type: 'MAKE_BETS', bets: makeBets(diceRolls, currentDiceRollInfo) });
    crapsGame.send('ROLL_DICE');
    const diceRolled = crapsGame.send({ type: 'DICE_ROLLED', diceRollInfo: currentDiceRollInfo });
    const outcomeXStateTarget = values(diceRolled.value)[0];
    const reconcileBets = crapsGame.send({ type: 'RECONCILE_BETS', diceRollInfo: currentDiceRollInfo });
    const diceTotal = get(reconcileBets, 'context.diceTotal');
    const shooterId = get(reconcileBets, 'context.shooterId');
    const wlpd = winLossPassDontPass(outcomeXStateTarget);
    const rollCnt = get(reconcileBets, 'context.rollCnt');
    const bets = get(reconcileBets, 'context.bets');
    const bankRoll = get(reconcileBets, 'context.bankRoll');
    const rollHistory = assign(currentDiceRollInfo, {
        diceTotal,
        shooterId,
        outcomeTarget: outcomeXStateTarget,
        wlpd,
        rollCnt,
        bets,
        bankRoll,
        diceRollSeed: `S: ${diceRollSeed}`,
    });
    outfile.write(`${JSON.stringify(rollHistory)},\n`);
    return diceRolls.concat(rollHistory);
}, []);
outfile.write(']\n\n');

console.log('Sending Leave Game to crapsGame');

crapsGame.send('LEAVE_GAME');

const analysis = analyze(results);
outfile.write(JSON.stringify(analysis));

console.log('Finished analyze');

outfile.end();

getStats(results, 'sevenStreakCnt');
getStats(results, 'noFieldStreakCnt');
getStatsPointSevenOut(results, 'isPointSevenOut');

console.log('END OF APP');
