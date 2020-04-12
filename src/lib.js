// win, loss, pass, dont-pass
export const winLossPassDontPass = (wlpd) => {
    const lookup = {
        pass_line_win_and_dont_pass_line_lose: 'W',
        pass_line_lose_and_dont_pass_line_push: 'L',
        pass_line_lose_and_dont_pass_line_win: 'L',
        point_pass: 'P',
        point_dont_pass: 'D',
    };
    return lookup[wlpd] || null;
};
