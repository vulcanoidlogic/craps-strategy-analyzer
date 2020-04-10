// https://xstate.js.org/viz/?gist=320960a55ea84e2a0192718b99e245b8

// Available variables:
// - Machine
// - interpret
// - assign
// - send
// - sendParent
// - spawn
// - raise
// - actions
// - XState (all XState exports)
const getDiceTotal = () => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return dice1 + dice2;
};
const isPointOff = (context, event) => {
    return context.pointNumber === null;
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
const crapsMachine = Machine(
    {
        id: 'craps',
        initial: 'start',
        context: {
            diceTotal: null,
            pointNumber: null,
            bets: [],
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
                            LEAVE_GAME: 'end',
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
            handleDiceRolled: (context, event, actionMeta) => {
                // console.log('in handleDiceRolled', context, event, actionMeta);
                return true;
            },
            setDiceTotal: assign((context, event) => {
                const diceTotal = getDiceTotal();
                console.log('in setDiceTotal new diceTotal=', diceTotal);
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
