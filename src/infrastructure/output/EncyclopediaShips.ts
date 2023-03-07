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
  nation?: string;
}
