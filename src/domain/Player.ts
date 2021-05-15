export interface Player {
  shipInfo: ShipInfo;
  shipStats: ShipStats;
  playerInfo: PlayerInfo;
  playerStats: PlayerStats;
}

export interface ShipInfo {
  name?: string;
  nation?: string;
  tier?: number;
  type?: string;
}

export interface PlayerStats {
  battles?: number;
  averageDamage?: number;
  averageExperience?: number;
  winRate?: number;
  killDeathRate?: number;
  averageTier?: number;
}

export interface PlayerInfo {
  name?: string;
  clan?: string;
  isHidden?: boolean;
}

export interface ShipStats {
  battles?: number;
  averageDamage?: number;
  averageExperience?: number;
  winRate?: number;
  killDeathRate?: number;
  combatPower?: number;
  personalRating?: number;
}
