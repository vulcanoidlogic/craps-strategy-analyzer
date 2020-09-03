import { interpret } from 'xstate';
import { getDiceRolls } from './build-roll-information.js';
import { createCrapsMachine } from './craps-machine';
import { get, values, assign } from 'lodash';
import {
    winLossPassDontPass,
    analyze,
    getStats,
    getFrequencyPointSevenOut,
    getRollCountByShooter,
    getFrequencyTotalByShooter,
    getFrequencySevenStreakCnt,
    getTotalStreakBeforeSeven as getDiceTotalCountBeforeSeven,
} from './lib';
import { makeBets } from './bets-manager';
import fs from 'fs';

// const rollCnt = 20;
// const rollCnt = 100;
// const rollCnt = 500;
// const rollCnt = 1000;
// const rollCnt = 3000;
// const rollCnt = 10000;
// const rollCnt = 20000;
// const rollCnt = 30000;
const rollCnt = 40000;
// const diceRollSeed = 384328578983;
const diceRollSeed = 934348438;
// const diceRollSeed = 2343243;
// const diceRollSeed = 325532;
// const diceRollSeed = 1024;
const preLoadedDiceRolls = getDiceRolls(rollCnt, diceRollSeed);

const crapsGame = interpret(createCrapsMachine())
    // .onTransition((state) => console.log(state.value))
    .start();

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
    // outfile.write(`${JSON.stringify(rollHistory)},\n`);
    return diceRolls.concat(rollHistory);
}, []);
outfile.write(']\n\n');

crapsGame.send('LEAVE_GAME');

const analysis = analyze(results);
// outfile.write(JSON.stringify(analysis));

outfile.end();

getStats(results, 'sevenStreakCnt');
getStats(results, 'noFieldStreakCnt');
getFrequencyPointSevenOut(results);
getRollCountByShooter(results, 'shooterRollCnt');
getFrequencyTotalByShooter(results, 'shooter4Cnt', 4);
getFrequencyTotalByShooter(results, 'shooter5Cnt', 5);
getFrequencyTotalByShooter(results, 'shooter6Cnt', 6);
getFrequencyTotalByShooter(results, 'shooter8Cnt', 8);
getFrequencyTotalByShooter(results, 'shooter9Cnt', 9);
getFrequencyTotalByShooter(results, 'shooter10Cnt', 10);
getDiceTotalCountBeforeSeven(results, 4);
getDiceTotalCountBeforeSeven(results, 5);
getDiceTotalCountBeforeSeven(results, 6);
getDiceTotalCountBeforeSeven(results, 8);
getDiceTotalCountBeforeSeven(results, 9);
getDiceTotalCountBeforeSeven(results, 10);
getFrequencySevenStreakCnt(results);

console.log('END OF APP');
console.log('\n\n');
