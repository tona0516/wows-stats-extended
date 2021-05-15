export default interface BattleDetail {
  teams: Teams;
}

export interface Teams {
  friends: User[];
  enemies: User[];
}

export interface User {
  shipInfo: ModifiedShipInfo;
  shipStats: ModifiedShipStats;
  playerInfo: ModifiedPlayerInfo;
  playerStats: ModifiedPlayerStat;
}

export interface ModifiedShipInfo {
  name?: string;
  nation?: string;
  tier?: number;
  type?: string;
  detectDistance?: number;
  radarDistance?: number;
}

export interface ModifiedShipStats {
  battles?: number;
  averageDamage?: number;
  averageExperience?: number;
  winRate?: number;
  killDeathRate?: number;
  combatPower?: number;
}

export interface ModifiedPlayerInfo {
  name?: string;
  clan?: string;
  relation?: number;
  isHidden?: boolean;
}

export interface ModifiedPlayerStat {
  battles?: number;
  averageDamage?: number;
  averageExperience?: number;
  winRate?: number;
  killDeathRate?: number;
  averageTier?: number;
}
