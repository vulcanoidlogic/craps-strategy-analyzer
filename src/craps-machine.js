import { Machine, assign } from 'xstate';
import { uniqueId, assign as _assign, get } from 'lodash';
import { POINT_VALUES, PASS_LINE_WIN_VALUES, PASS_LINE_LOSE_VALUES } from './constants';
import { reconcileBets, applyBets } from './bets-manager';

// Stateless machine definition
const getDiceTotal = (context, event) => {
    const preLoadedDiceRolls = get(context, 'preLoadedDiceRolls');
    if (preLoadedDiceRolls) {
        return preLoadedDiceRolls[context.rollCnt];
    } else {
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        return dice1 + dice2;
    }
};
const isPointOff = (context, event) => {
    return context.pointNumber === null;
};
// const isMaxRollCntReached = (context, event) => {
//     const preLoadedDiceRolls = get(context, 'preLoadedDiceRolls');
//     return context.rollCnt >= preLoadedDiceRolls.length;
// };
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
    // console.log('isNewShooter context=', context);
    const rollOutcome = context.rollOutcome;
    return rollOutcome === 'DONT_PASS';
};
const isSameShooter = (context, event) => {
    // console.log('isSameShooter context=', context);
    const rollOutcome = context.rollOutcome;
    return rollOutcome !== 'DONT_PASS';
};
export const createCrapsMachine = (additionalContext) => {
    const baseContext = {
        diceTotal: null,
        pointNumber: null,
        bets: [],
        rollCnt: 0,
        rollOutcome: null,
        shooterId: `shooter-${uniqueId()}`,
        bankRoll: 0,
    };
    const context = _assign({}, baseContext, additionalContext);
    // console.log('context=', context);

    return Machine(
        {
            id: 'craps',
            initial: 'start',
            context,
            states: {
                start: {
                    on: {
                        JOIN_GAME: {
                            cond: isPointOff,
                            target: 'point_off.accept_bets',
                            actions: ['joinedGame'],
                        },
                    },
                },
                end: {
                    entry: () => console.log('END STATE ENTRY'),
                    type: 'final',
                },
                point_off: {
                    initial: 'accept_bets',
                    states: {
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
                                // LEAVE_GAME: [{ cond: isMaxRollCntReached, target: 'end' }],
                                LEAVE_GAME: [{ target: '#craps.end' }],
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
                                    // {
                                    //     id: 'no-box-number',
                                    //     cond: { type: 'isDiceRollIncludes', diceValues: NON_POINT_VALUES },
                                    //     target: '#craps.point_off.accept_bets',
                                    //     actions: ['reconcileBetsPointOff', 'handleDiceRolled'],
                                    // },
                                    {
                                        id: 'pass-line-win',
                                        cond: { type: 'isDiceRollIncludes', diceValues: PASS_LINE_WIN_VALUES },
                                        target: 'point_off_win',
                                        actions: ['handleDiceRolled'],
                                    },
                                    {
                                        id: 'pass-line-lose',
                                        cond: { type: 'isDiceRollIncludes', diceValues: PASS_LINE_LOSE_VALUES },
                                        target: 'point_off_lose',
                                        actions: ['handleDiceRolled'],
                                    },
                                    // {
                                    //     id: 'twelve',
                                    //     cond: { type: 'isDiceRollIncludes', diceValues: [12] },
                                    //     target: 'pass_line_lose_and_dont_pass_line_push',
                                    //     actions: ['handleDiceRolled'],
                                    // },
                                    {
                                        id: 'box-number',
                                        cond: { type: 'isDiceRollIncludes', diceValues: POINT_VALUES },
                                        target: '#craps.point_on.accept_bets',
                                        actions: ['reconcileBetsNewPoint', 'handleDiceRolled', 'setPointNumber'],
                                    },
                                ],
                            },
                            // exit: (context, state) => console.log('exit point_off dice rolled, context=', context),
                        },
                        //Targets are used to determine wlpd
                        point_off_win: {
                            on: { RECONCILE_BETS: { target: '#craps.point_off.accept_bets', actions: ['reconcileBetsPointOff'] } },
                        },
                        point_off_lose: {
                            on: { RECONCILE_BETS: { target: '#craps.point_off.accept_bets', actions: ['reconcileBetsPointOff'] } },
                        },

                        // pass_line_win_and_dont_pass_line_lose: {
                        //     on: { RECONCILE_BETS: { target: '#craps.point_off.accept_bets', actions: ['reconcileBetsPointOff'] } },
                        // },
                        // pass_line_lose_and_dont_pass_line_push: {
                        //     on: { RECONCILE_BETS: { target: '#craps.point_off.accept_bets', actions: ['reconcileBetsPointOff'] } },
                        // },
                        // pass_line_lose_and_dont_pass_line_win: {
                        //     on: { RECONCILE_BETS: { target: '#craps.point_off.accept_bets', actions: ['reconcileBetsPointOff'] } },
                        // },
                        // point_established: {
                        //     on: { RECONCILE_BETS: { target: '#craps.point_on.accept_bets', actions: ['reconcileBetsNewPoint'] } },
                        // },
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
                                LEAVE_GAME: [{ target: '#craps.end' }],
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
                joinedGame: assign((context, event, actionMeta) => {
                    const bankRoll = get(event, 'bankRoll');
                    const preLoadedDiceRolls = get(event, 'preLoadedDiceRolls');
                    return { bankRoll, preLoadedDiceRolls };
                }),
                handleDiceRolled: assign((context, event, actionMeta) => {
                    const rollCnt = context.rollCnt + 1;
                    return { rollCnt };
                }),
                setDiceTotal: assign((context, event) => {
                    const diceTotal = getDiceTotal(context, event);
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
                reconcileBetsPointOff: assign((context, event, actionMeta) => {
                    const bankRoll = reconcileBets('reconcileBetsPointOff', context, event);
                    return { rollOutcome: 'INDETERMINATE', bankRoll };
                }),
                reconcileBetsNewPoint: assign((context, event, actionMeta) => {
                    const bankRoll = reconcileBets('reconcileBetsNewPoint', context, event);
                    return { rollOutcome: 'INDETERMINATE', bankRoll };
                }),
                reconcileBetsPointPass: assign((context, event, actionMeta) => {
                    const bankRoll = reconcileBets('reconcileBetsPointPass', context, event);
                    return { rollOutcome: 'PASS', bankRoll };
                }),
                reconcileBetsPointDontPass: assign((context, event, actionMeta) => {
                    const bankRoll = reconcileBets('reconcileBetsPointDontPass', context, event);
                    return { rollOutcome: 'DONT_PASS', bankRoll };
                }),
                reconcileBetsPointContinueRoll: assign((context, event, actionMeta) => {
                    const bankRoll = reconcileBets('reconcileBetsPointContinueRoll', context, event);
                    return { rollOutcome: 'INDETERMINATE', bankRoll };
                }),
                makeBets: assign((context, event, actionMeta) => {
                    const bankRoll = applyBets(context, event);
                    // console.log('makeBets context, event=', context, event);
                    return { bets: event.bets, bankRoll };
                }),
                setShooterId: assign({ shooterId: () => `shooter-${uniqueId()}` }),
            },
        }
    );
};
