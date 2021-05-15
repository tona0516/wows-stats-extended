export interface ExpectedStats {
  time: number;
  data: { [shipID: string]: ExpectedValues };
}

export interface ExpectedValues {
  average_damage_dealt: number;
  average_frags: number;
  win_rate: number;
}
