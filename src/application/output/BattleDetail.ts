export interface BattleDetail {
  teams: Team[];
}

export interface Team {
  users: FormattedPlayer[];
  average: FormattedPlayer;
}

export interface TeamAverages {
  friend: FormattedPlayer;
  enemy: FormattedPlayer;
}

export interface FormattedPlayer {
  shipInfo: FormattedShipInfo;
  shipStats: FormattedShipStats;
  playerInfo: FormattedPlayerInfo;
  playerStats: FormattedPlayerStat;
}

export interface FormattedShipInfo {
  name?: string;
  nation?: string;
  tier?: string;
  type?: string;
  statsURL?: string;
}

export interface FormattedShipStats {
  battles?: string;
  averageDamage?: string;
  averageExperience?: string;
  winRate?: string;
  killDeathRate?: string;
  combatPower?: string;
  personalRating?: string;
}

export interface FormattedPlayerInfo {
  name?: string;
  clan?: string;
  isHidden?: boolean;
  statsURL?: string;
}

export interface FormattedPlayerStat {
  battles?: string;
  averageDamage?: string;
  averageExperience?: string;
  winRate?: string;
  killDeathRate?: string;
  averageTier?: string;
}
