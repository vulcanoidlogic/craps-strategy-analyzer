import { get } from 'lodash';

const isOnAndSeven = (isOn = true, diceTotal = 0) => {
    return isOn && diceTotal === 7;
};

const rollIncludes = (diceTotalList = [], diceTotal = 0) => {
    return diceTotalList.includes(diceTotal);
};

export const betDefinitions = {
    place_6_8: { payout: 7 / 6, win: rollIncludes.bind(null, [6, 8]), lose: isOnAndSeven, canToggleOnOff: true },
};
