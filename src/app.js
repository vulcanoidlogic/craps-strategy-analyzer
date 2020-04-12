import { Machine, interpret, assign } from 'xstate';
import { getDiceRolls } from './build-roll-information.js';
import { get, uniqueId, values } from 'lodash';

const diceRolls = getDiceRolls();
// console.log(diceRolls);

// Stateless machine definition
// machine.transition(...) is a pure function used by the interpreter.
const MAX_ROLL_CNT = 12;
const getDiceTotal = () => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return dice1 + dice2;
};
const isPointOff = (context, event) => {
    return context.pointNumber === null;
};
const isMaxRollCntReached = (context, event) => {
    return context.rollCnt >= MAX_ROLL_CNT;
};
const isDiceRollIncludes = (context, event, stateGuard) => {
    const { diceTotal } = context;
    const { diceValues = [] } = stateGuard.cond;
    return diceValues.includes(diceTotal);
};
const isPointPass = (context, event) => {
    const { diceTotal, pointNumber } = context;
    return diceTotal !== null && diceTotal === pointNumber;
};
const isPointContinueRoll = (context, event) => {
    const { diceTotal, pointNumber } = context;
    return diceTotal !== 7 && diceTotal !== pointNumber;
};
const isNewShooter = (context, event) => {
    const rollOutcome = context.rollOutcome;
    return rollOutcome === 'DONT_PASS';
};
const isSameShooter = (context, event) => {
    const rollOutcome = context.rollOutcome;
    return rollOutcome !== 'DONT_PASS';
};
const crapsMachine = Machine(
    {
        id: 'craps',
        initial: 'start',
        context: {
            diceTotal: null,
            pointNumber: null,
            bets: [],
            rollCnt: 0,
            rollOutcome: null,
            shooterId: `shooter-${uniqueId()}`,
        },
        states: {
            start: {
                on: {
                    JOIN_GAME: {
                        cond: isPointOff,
                        target: 'point_off.accept_bets',
                    },
                },
            },
            point_off: {
                initial: 'accept_bets',
                states: {
                    end: {
                        entry: () => console.log('Beginning of the end'),
                        type: 'final',
                    },
                    accept_bets: {
                        on: {
                            MAKE_BETS: [
                                {
                                    cond: isNewShooter,
                                    target: 'ready_to_roll',
                                    actions: ['makeBets', 'setShooterId'],
                                },
                                {
                                    cond: isSameShooter,
                                    target: 'ready_to_roll',
                                    actions: ['makeBets'],
                                },
                            ],
                            LEAVE_GAME: [{ cond: isMaxRollCntReached, target: 'end' }],
                        },
                    },
                    ready_to_roll: {
                        on: {
                            ROLL_DICE: [
                                {
                                    target: 'dice_rolled',
                                    actions: ['setDiceTotal'],
                                },
                            ],
                        },
                    },
                    dice_rolled: {
                        // entry: () => console.log('entry point_off dice rolled'),
                        on: {
                            DICE_ROLLED: [
                                {
                                    id: 'seven-eleven',
                                    cond: { type: 'isDiceRollIncludes', diceValues: [7, 11] },
                                    target: 'pass_line_win_and_dont_pass_line_lose',
                                    actions: ['handleDiceRolled'],
                                },
                                {
                                    id: 'two-three',
                                    cond: { type: 'isDiceRollIncludes', diceValues: [2, 3] },
                                    target: 'pass_line_lose_and_dont_pass_line_win',
                                    actions: ['handleDiceRolled'],
                                },
                                {
                                    id: 'twelve',
                                    cond: { type: 'isDiceRollIncludes', diceValues: [12] },
                                    target: 'pass_line_lose_and_dont_pass_line_push',
                                    actions: ['handleDiceRolled'],
                                },
                                {
                                    id: 'box-number',
                                    cond: { type: 'isDiceRollIncludes', diceValues: [4, 5, 6, 8, 9, 10] },
                                    target: 'point_established',
                                    actions: ['handleDiceRolled', 'setPointNumber'],
                                },
                            ],
                        },
                        // exit: (context, state) => console.log('exit point_off dice rolled, context=', context),
                    },
                    pass_line_win_and_dont_pass_line_lose: {
                        on: { RECONCILE_BETS: '#craps.point_off.ready_to_roll' },
                    },
                    pass_line_lose_and_dont_pass_line_push: {
                        on: { RECONCILE_BETS: '#craps.point_off.ready_to_roll' },
                    },
                    pass_line_lose_and_dont_pass_line_win: {
                        on: { RECONCILE_BETS: '#craps.point_off.ready_to_roll' },
                    },
                    point_established: {
                        on: { RECONCILE_BETS: { target: '#craps.point_on.accept_bets', actions: ['reconcileBetsNewPoint'] } },
                    },
                },
            },
            point_on: {
                initial: 'accept_bets',
                states: {
                    accept_bets: {
                        on: {
                            MAKE_BETS: [
                                {
                                    target: 'ready_to_roll',
                                    actions: ['makeBets'],
                                },
                            ],
                        },
                    },
                    ready_to_roll: {
                        on: {
                            ROLL_DICE: [
                                {
                                    target: 'dice_rolled',
                                    actions: ['setDiceTotal'],
                                },
                            ],
                        },
                    },
                    dice_rolled: {
                        // entry: () => console.log('entry point_on dice rolled'),
                        on: {
                            DICE_ROLLED: [
                                {
                                    cond: isPointPass,
                                    target: 'point_pass',
                                    actions: ['handleDiceRolled', 'resetPointNumber'],
                                },
                                {
                                    cond: { type: 'isDiceRollIncludes', diceValues: [7] },
                                    target: 'point_dont_pass',
                                    actions: ['handleDiceRolled', 'resetPointNumber'],
                                },
                                {
                                    cond: isPointContinueRoll,
                                    target: 'continue_roll',
                                    actions: ['handleDiceRolled'],
                                },
                            ],
                        },
                        // exit: (context, state) => console.log('exit point_on dice rolled, context=', context),
                    },
                    point_pass: {
                        on: { RECONCILE_BETS: { target: '#craps.point_off.accept_bets', actions: ['reconcileBetsPointPass'] } },
                    },
                    point_dont_pass: {
                        on: { RECONCILE_BETS: { target: '#craps.point_off.accept_bets', actions: ['reconcileBetsPointDontPass'] } },
                    },
                    continue_roll: {
                        on: { RECONCILE_BETS: { target: 'accept_bets', actions: ['reconcileBetsPointContinueRoll'] } },
                    },
                },
            },
        },
    },
    {
        guards: {
            isDiceRollIncludes,
        },
        actions: {
            handleDiceRolled: assign((context, event, actionMeta) => {
                const rollCnt = context.rollCnt + 1;
                return { rollCnt };
            }),
            setDiceTotal: assign((context, event) => {
                const diceTotal = getDiceTotal();
                return {
                    diceTotal,
                };
            }),
            setPointNumber: assign({
                pointNumber: ({ diceTotal }) => diceTotal,
            }),
            resetPointNumber: assign({
                pointNumber: null,
            }),
            reconcileBetsNewPoint: assign({ rollOutcome: 'INDETERMINATE' }),
            reconcileBetsPointPass: assign({ rollOutcome: 'PASS' }),
            reconcileBetsPointDontPass: assign({ rollOutcome: 'DONT_PASS' }),
            reconcileBetsPointContinueRoll: (context, event, actionMeta) => {
                // console.log('in reconcileBetsPointContinueRoll', context, event, actionMeta);
                return true;
            },
            makeBets: assign({ bets: (_, event) => event.bets }),
            setShooterId: assign({ shooterId: `shooter-${uniqueId()}` }),
        },
    }
);

// win, loss, pass, dont-pass
const winLossPassDontPass = (wlpd) => {
    const lookup = {
        pass_line_win_and_dont_pass_line_lose: 'W',
        pass_line_lose_and_dont_pass_line_push: 'L',
        pass_line_lose_and_dont_pass_line_win: 'L',
        point_pass: 'P',
        point_dont_pass: 'D',
    };
    return lookup[wlpd] || null;
};

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
        const rollHistory = { diceTotal, shooterId, outcome, wlpd };
        diceRollHistory.push(rollHistory);
        crapsGame.send('RECONCILE_BETS');
    }
}

console.log('Reached end of game diceRollHistory=', diceRollHistory);
