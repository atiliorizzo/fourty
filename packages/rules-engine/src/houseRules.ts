export interface HouseRules {
  /** Casa/barrio variant: getting dealt 4-of-a-kind (doble ronda) wins the chica instantly instead of scoring points. */
  dobleRondaAutoWin: boolean;
  /** "Todo vale 2" variant: doble ronda scores 2 points instead of the official 4. Ignored if dobleRondaAutoWin is true. */
  allPlaysWorth2: boolean;
  /** Allows combining 3 table cards in a suma (instead of the usual 2), but only if it leaves the table clean. */
  allowThreeCardSumForLimpia: boolean;
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  dobleRondaAutoWin: false,
  allPlaysWorth2: false,
  allowThreeCardSumForLimpia: true,
};
