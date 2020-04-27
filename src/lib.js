// win, loss, pass, dont-pass
export const winLossPassDontPass = (wlpd, step4) => {
    console.log('winLossPassDontPass wlpd=', wlpd, step4);
    const lookup = {
        point_off_win: 'W',
        point_off_lose: 'L',
        point_pass: 'P',
        point_dont_pass: 'D',
    };
    return lookup[wlpd] || null;
};
