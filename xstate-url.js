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
const getPointNumber = context => {
    const { diceTotal } = context;
    return diceTotal;
};
const isStart = (context, event) => {
    return context.diceTotal === null;
};
const isRollResolved = (context, event) => {
    return context.rollResolved === true;
};
const isPassLineWinAndDontPassLineLose = (context, event) => {
    const { diceTotal } = context;
    return diceTotal === 7 || diceTotal === 11;
};
const isPassLineLoseAndDontPassLinePush = (context, event) => {
    const { diceTotal } = context;
    return diceTotal === 12;
};
const isPassLineLoseAndDontPassLineWin = (context, event) => {
    const { diceTotal } = context;
    return diceTotal === 2 || diceTotal === 3;
};
const isPointPass = (context, event) => {
    const { diceTotal, pointNumber } = context;
    return diceTotal === pointNumber;
};
const isPointDontPass = (context, event) => {
    return context.diceTotal === 7;
};
const isBoxNumber = (context, event) => {
    const { diceTotal } = context;
    return diceTotal === 4 || diceTotal === 5 || diceTotal === 6 || diceTotal === 8 || diceTotal === 9 || diceTotal === 10;
};
const isPointContinueRoll = (context, event) => {
    const { diceTotal, pointNumber } = context;
    return diceTotal !== 7 && diceTotal !== pointNumber;
};
const isPointNumberNotEmpty = (context, event) => {
    const { pointNumber } = context;
    return pointNumber !== null;
};

const crapsMachine = Machine(
    {
        id: 'craps',
        initial: 'start',
        context: {
            diceTotal: null,
            rollResolved: false,
            pointNumber: null,
            bets: []
        },
        states: {
            start: {
                on: {
                    ROLL_DICE: {
                        cond: isStart,
                        target: 'point_off.dice_rolled',
                        actions: ['setDiceTotal']
                    }
                }
            },
            point_off: {
                initial: 'roll_resolved',
                states: {
                    roll_resolved: {
                        on: {
                            ROLL_DICE: [
                                {
                                    cond: isRollResolved,
                                    target: 'dice_rolled',
                                    actions: ['setDiceTotal']
                                }
                            ]
                        }
                    },
                    dice_rolled: {
                        entry: () => console.log('entry point_off dice rolled'),
                        on: {
                            DICE_ROLLED: [
                                {
                                    cond: isPassLineWinAndDontPassLineLose,
                                    target: 'pass_line_win_and_dont_pass_line_lose',
                                    actions: ['handleDiceRolled', 'setRollResolved']
                                },
                                {
                                    cond: isPassLineLoseAndDontPassLineWin,
                                    target: 'pass_line_lose_and_dont_pass_line_win',
                                    actions: ['handleDiceRolled', 'setRollResolved']
                                },
                                {
                                    cond: isPassLineLoseAndDontPassLinePush,
                                    target: 'pass_line_lose_and_dont_pass_line_push',
                                    actions: ['handleDiceRolled', 'setRollResolved']
                                },
                                {
                                    cond: isBoxNumber,
                                    target: 'transition_to_point_on',
                                    actions: ['handleDiceRolled', 'setRollResolved', 'setPointNumber']
                                }
                            ]
                        },
                        exit: () => console.log('exit point_off dice rolled')
                    },
                    pass_line_win_and_dont_pass_line_lose: {
                        on: { PAY_BETS: '#craps.point_off.roll_resolved' }
                    },
                    pass_line_lose_and_dont_pass_line_push: {
                        on: { PAY_BETS: '#craps.point_off.roll_resolved' }
                    },
                    pass_line_lose_and_dont_pass_line_win: {
                        on: { PAY_BETS: '#craps.point_off.roll_resolved' }
                    },
                    transition_to_point_on: {
                        on: { PAY_BETS: { target: '#craps.point_on.point_established', actions: ['setRollResolved', 'payBetsNewPoint'] } }
                    }
                }
            },
            point_on: {
                initial: 'roll_resolved',
                states: {
                    point_established: {
                        on: {
                            ROLL_DICE: {
                                cond: isPointNumberNotEmpty,
                                target: 'dice_rolled',
                                actions: ['setDiceTotal']
                            }
                        }
                    },
                    roll_resolved: {
                        on: {
                            ROLL_DICE: [
                                {
                                    cond: isRollResolved,
                                    target: 'dice_rolled',
                                    actions: ['setDiceTotal']
                                }
                            ]
                        }
                    },
                    dice_rolled: {
                        on: {
                            DICE_ROLLED: [
                                {
                                    cond: isPointPass,
                                    target: 'point_pass',
                                    actions: ['handleDiceRolled', 'setRollResolved', 'resetPointNumber']
                                },
                                {
                                    cond: isPointDontPass,
                                    target: 'point_dont_pass',
                                    actions: ['handleDiceRolled', 'setRollResolved', 'resetPointNumber']
                                },
                                {
                                    cond: isPointContinueRoll,
                                    target: 'continue_roll',
                                    actions: ['handleDiceRolled', 'setRollResolved']
                                }
                            ]
                        }
                    },
                    point_pass: {
                        on: { PAY_BETS: { target: '#craps.point_off.roll_resolved', actions: ['payBetsPointPass'] } }
                    },
                    point_dont_pass: {
                        on: { PAY_BETS: { target: '#craps.point_off.roll_resolved', actions: ['payBetsPointDontPass'] } }
                    },
                    continue_roll: {
                        on: { PAY_BETS: { target: 'roll_resolved', actions: ['payBetsPointContinueRoll'] } }
                    }
                }
            }
        }
    },
    {
        guards: {
            isStart,
            isRollResolved,
            isPointPass,
            isPointDontPass,
            isPassLineLoseAndDontPassLinePush,
            isPassLineLoseAndDontPassLineWin,
            isPassLineWinAndDontPassLineLose,
            isBoxNumber,
            isPointContinueRoll,
            isPointNumberNotEmpty
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
                    diceTotal
                };
            }),
            setPointNumber: assign({
                pointNumber: ({ diceTotal }) => diceTotal
            }),
            resetPointNumber: assign({
                pointNumber: null
            }),
            setRollResolved: assign({
                rollResolved: true
            }),
            payBetsNewPoint: (context, event, actionMeta) => {
                console.log('in payBetsNewPoint', context, event, actionMeta);
                return true;
            },
            payBetsPointPass: (context, event, actionMeta) => {
                console.log('in payBetsPointPass', context, event, actionMeta);
                return true;
            },
            payBetsPointDontPass: (context, event, actionMeta) => {
                console.log('in payBetsPointDontPass', context, event, actionMeta);
                return true;
            },
            payBetsPointContinueRoll: (context, event, actionMeta) => {
                console.log('in payBetsPointContinueRoll', context, event, actionMeta);
                return true;
            }
        }
    }
);
