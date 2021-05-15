export interface TempArenaInfo {
  vehicles: Vehicle[];
}

interface Vehicle {
  shipId: number;
  relation: number;
  id: number;
  name: string;
}
