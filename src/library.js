import indexOf from 'lodash/indexOf';

export const isElement = (values, value) => (indexOf(values, value) >= 0 ? true : false);
