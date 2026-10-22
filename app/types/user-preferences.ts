export const DEFAULT_SONG_DISPLAY_PREFERENCES = {
  fontSize: 14,
  showChords: true,
} as const;

export type SongDisplayPreferences = {
  fontSize: number;
  showChords: boolean;
};

export type UserPreferences = {
  version: 1;
  songDisplay: SongDisplayPreferences;
};
