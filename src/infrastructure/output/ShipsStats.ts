export interface ShipsStats {
  data: {
    [accountID: number]: Data[];
  };
}

export interface Data {
  pvp?: Pvp;
  ship_id?: number;
}

export interface Pvp {
  wins?: number;
  battles?: number;
  damage_dealt?: number;
  xp?: number;
  frags?: number;
  survived_battles?: number;
}
