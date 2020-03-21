import curry from 'lodash/curry';
import indexOf from 'lodash/indexOf';

export const isInList = curry((values, value) => (indexOf(values, value) >= 0 ? true : false));
