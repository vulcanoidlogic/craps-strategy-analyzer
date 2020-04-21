import { interpret } from 'xstate';
import { MAX_ROLL_CNT } from './constants';
import { getDiceRolls } from './build-roll-information.js';
import { createCrapsMachine } from './craps-machine';
import { get, values } from 'lodash';
import { winLossPassDontPass } from './lib';
import { betDefinitions } from './bets-manager';

const diceRolls = getDiceRolls();
// console.log(diceRolls);

const preLoadedDiceRolls = [5, 7, 8, 6, 7, 6, 4, 6, 6, 7, 7, 11, 7, 6, 10, 9, 7];

const crapsGame = interpret(createCrapsMachine())
    // .onTransition((state) => console.log(state.value))
    .start();

crapsGame.send({ type: 'JOIN_GAME', bankRoll: 1000, preLoadedDiceRolls });

const testBets = {
    place6: { amount: 36, betDefinitions: betDefinitions.place6, isOn: true },
};

const diceRollHistory = [];
for (let i = 0; i < MAX_ROLL_CNT + 15; i++) {
    const step = crapsGame.send('LEAVE_GAME');
    if (step.changed) {
        console.log('allowed to leave game and GAME OVER');
        break;
    } else {
        const step2 = crapsGame.send({ type: 'MAKE_BETS', bets: testBets });
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
        // const rollOutcome = get(step4, 'context.rollOutcome');
        const rollHistory = { diceTotal, shooterId, outcomeTarget, wlpd, rollCnt, bets, bankRoll };
        diceRollHistory.push(rollHistory);
    }
}

console.log('Reached end of game diceRollHistory=', diceRollHistory);
