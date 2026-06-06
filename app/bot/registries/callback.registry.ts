import { MENU_ACTIONS } from "../contsants";
import {
  menuAddCallback,
  menuFindCallback,
  menuResetCallback,
} from "../callbacks";

export const callbackRegistry = {
  [MENU_ACTIONS.ADD]: menuAddCallback,
  [MENU_ACTIONS.FIND]: menuFindCallback,
  [MENU_ACTIONS.RESET]: menuResetCallback,
};
