export interface EncyclopediaShips {
  meta: Meta;
  data: {
    [shipID: number]: Data;
  };
}

interface Meta {
  page_total: number;
}

interface Data {
  tier?: number;
  type?: string;
  name?: string;
  default_profile?: DefaultProfile;
  nation?: string;
}

interface DefaultProfile {
  concealment?: Concealment;
}

interface Concealment {
  detect_distance_by_ship?: number;
}
