import { viewAssetCallback } from "./view-asset.callback";
import { menuPlaylistsPageCallback } from "./menu-playlists-page.callback";

export const callbackMatchers = [
  {
    pattern: /^view_(.+)$/,
    handler: viewAssetCallback,
  },
  {
    pattern: /^menu_playlists_page_(\d+)$/,
    handler: menuPlaylistsPageCallback,
  },
];
