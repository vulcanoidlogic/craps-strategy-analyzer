import { Machine, createMachine, interpret } from 'xstate';
import { getDiceRolls } from './build-roll-information.js';

const diceRolls = getDiceRolls();
// console.log(diceRolls);

// Stateless machine definition
// machine.transition(...) is a pure function used by the interpreter.
const toggleMachine = Machine({
    id: 'toggle',
    initial: 'active',
    states: {
        indeterminate: { on: { TOGGLE: 'active' } },
        active: { on: { TOGGLE: 'inactive' } },
        inactive: { on: { TOGGLE: 'indeterminate' } }
    }
});

// Machine instance with internal state
const toggleService = interpret(toggleMachine)
    .onTransition(state => console.log(state.value))
    .start();
// => 'active'

toggleService.send('TOGGLE');
toggleService.send('TOGGLE');
toggleService.send('TOGGLE');
toggleService.send('TOGGLE');
toggleService.send('TOGGLE');
toggleService.send('TOGGLE');
toggleService.send('TOGGLE');
toggleService.send('TOGGLE');

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
