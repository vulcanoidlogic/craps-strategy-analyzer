import { Machine, createMachine, interpret, assign } from 'xstate';
import { getDiceRolls } from './build-roll-information.js';

const diceRolls = getDiceRolls();
// console.log(diceRolls);

// Stateless machine definition
// machine.transition(...) is a pure function used by the interpreter.
const MAX_ROLL_CNT = 5;
const getDiceTotal = () => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return dice1 + dice2;
};
const isPointOff = (context, event) => {
    console.log('isPointOff guard');
    return context.pointNumber === null;
};
const isMaxRollCntReached = (context, event) => {
    console.log('isMaxRollCntReached rollCnt=', context.rollCnt);
    return context.rollCnt >= MAX_ROLL_CNT;
};
const isDiceRollIncludes = (context, event, stateGuard) => {
    const { diceTotal } = context;
    const { diceValues = [] } = stateGuard.cond;
    return diceValues.includes(diceTotal);
};
const isPointPass = (context, event) => {
    console.log('isPointPass called');
    const { diceTotal, pointNumber } = context;
    return diceTotal !== null && diceTotal === pointNumber;
};
const isPointContinueRoll = (context, event) => {
    const { diceTotal, pointNumber } = context;
    return diceTotal !== 7 && diceTotal !== pointNumber;
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
                        entry: () => console.log('entry point_off dice rolled'),
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
                        exit: () => console.log('exit point_off dice rolled'),
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
                // console.log('in handleDiceRolled', context, event, actionMeta);
                const rollCnt = context.rollCnt + 1;
                return { rollCnt };
            }),
            setDiceTotal: assign((context, event) => {
                const diceTotal = getDiceTotal();
                // console.log('in setDiceTotal new diceTotal=', diceTotal);
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
            reconcileBetsNewPoint: (context, event, actionMeta) => {
                // console.log('in reconcileBetsNewPoint', context, event, actionMeta);
                return true;
            },
            reconcileBetsPointPass: (context, event, actionMeta) => {
                // console.log('in reconcileBetsPointPass', context, event, actionMeta);
                return true;
            },
            reconcileBetsPointDontPass: (context, event, actionMeta) => {
                // console.log('in reconcileBetsPointDontPass', context, event, actionMeta);
                return true;
            },
            reconcileBetsPointContinueRoll: (context, event, actionMeta) => {
                // console.log('in reconcileBetsPointContinueRoll', context, event, actionMeta);
                return true;
            },
            makeBets: assign({
                bets: (_, event) => event.bets,
            }),
        },
    }
);
const crapsGame = interpret(crapsMachine)
    .onTransition((state) => console.log(state.value))
    .start();

const step1 = crapsGame.send('JOIN_GAME');
console.log('crapsGame step1.nextEvents=', step1.nextEvents);

for (let i = 0; i < MAX_ROLL_CNT + 10; i++) {
    const step1_1 = crapsGame.send('LEAVE_GAME');
    if (step1_1.changed) {
        console.log('allowed to leave game and GAME OVER');
        break;
    } else {
        console.log('NOT allowed to leave game i=', i);
        const step2 = crapsGame.send({ type: 'MAKE_BETS', bets: [0, 2, 3, 4, 5] });
        console.log('crapsGame step2=', step2.value, step2.nextEvents);
        crapsGame.send('ROLL_DICE');
        const step4 = crapsGame.send('DICE_ROLLED');
        console.log('crapsGame step4=', step4.value, step4.nextEvents);
        const step5 = crapsGame.send('RECONCILE_BETS');
    }
}

console.log('Reached end of gamme');

// const toggleMachine = Machine({
//     id: 'toggle',
//     initial: 'active',
//     states: {
//         indeterminate: { on: { TOGGLE: 'active' } },
//         active: { on: { TOGGLE: 'inactive' } },
//         inactive: { on: { TOGGLE: 'indeterminate' } },
//     },
// });

// // Machine instance with internal state
// const toggleService = interpret(toggleMachine)
//     .onTransition((state) => console.log(state.value))
//     .start();
// // => 'active'

// toggleService.send('TOGGLE');
// toggleService.send('TOGGLE');
// toggleService.send('TOGGLE');
// toggleService.send('TOGGLE');
// toggleService.send('TOGGLE');
// toggleService.send('TOGGLE');
// toggleService.send('TOGGLE');
// toggleService.send('TOGGLE');

/**
 * Game States: no_point, point
 * Game Outcome: no_point: pass_line_win, pass_line_lose, point: pass, dont_pass
 * Event: dice_roll
 * Dice Roll States: start_roll, end_roll
 * Dice Roll Data: total, info from dice roll information
 * Player Actions: make bets
 * Player Bank Actions:  decrement, increment
 * Table Bets: each bet may have a monetary amount ranging from 0 - max bet.  Each bet has payout odds.  Some bets have a vig.
 *
 *
 * Note: rxjs = events over time.
 */
