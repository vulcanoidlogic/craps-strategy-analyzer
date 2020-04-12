import { interpret } from 'xstate';
import { MAX_ROLL_CNT } from './constants';
import { getDiceRolls } from './build-roll-information.js';
import { crapsMachine } from './craps-machine';
import { get, values } from 'lodash';
import { winLossPassDontPass } from './lib';

const diceRolls = getDiceRolls();
// console.log(diceRolls);

const crapsGame = interpret(crapsMachine)
    // .onTransition((state) => console.log(state.value))
    .start();

crapsGame.send('JOIN_GAME');

const diceRollHistory = [];
for (let i = 0; i < MAX_ROLL_CNT + 15; i++) {
    const step = crapsGame.send('LEAVE_GAME');
    if (step.changed) {
        console.log('allowed to leave game and GAME OVER');
        break;
    } else {
        crapsGame.send({ type: 'MAKE_BETS', bets: [0, 2, 3, 4, 5] });
        crapsGame.send('ROLL_DICE');
        const step4 = crapsGame.send('DICE_ROLLED');
        const outcome = values(step4.value)[0];
        const diceTotal = get(step4, 'context.diceTotal');
        const shooterId = get(step4, 'context.shooterId');
        const wlpd = winLossPassDontPass(outcome);
        const rollCnt = get(step4, 'context.rollCnt');
        // const rollOutcome = get(step4, 'context.rollOutcome');
        const rollHistory = { diceTotal, shooterId, outcome, wlpd, rollCnt };
        diceRollHistory.push(rollHistory);
        crapsGame.send('RECONCILE_BETS');
    }
}

console.log('Reached end of game diceRollHistory=', diceRollHistory);
