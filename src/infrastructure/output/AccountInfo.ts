export interface AccountInfo {
  data: {
    [accountID: number]: Data;
  };
}

export interface Data {
  hidden_profile?: boolean;
  statistics?: Statistics;
}

export interface Statistics {
  pvp?: Pvp;
}

export interface Pvp {
  xp?: number;
  survived_battles?: number;
  battles?: number;
  frags?: number;
  wins?: number;
  damage_dealt?: number;
}
