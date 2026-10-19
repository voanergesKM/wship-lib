import { MENU_ACTIONS } from "../contsants";
import {
  menuAddCallback,
  menuFindCallback,
  menuResetCallback,
  menuPlaylistsCallback,
  menuMainCallback,
} from "../callbacks";

export const callbackRegistry = {
  [MENU_ACTIONS.ADD]: menuAddCallback,
  [MENU_ACTIONS.FIND]: menuFindCallback,
  [MENU_ACTIONS.RESET]: menuResetCallback,
  [MENU_ACTIONS.PLAYLISTS]: menuPlaylistsCallback,
  [MENU_ACTIONS.MAIN_MENU]: menuMainCallback,
  menu_playlists_noop: async () => {},
};
