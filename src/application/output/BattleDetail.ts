export interface BattleDetail {
  teams: Team[];
}

export interface Team {
  users: FormattedUser[];
  average: FormattedUser;
}

export interface TeamAverages {
  friend: FormattedUser;
  enemy: FormattedUser;
}

export interface FormattedUser {
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
  // detectDistance?: string,
  // radarDistance?: string,
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
