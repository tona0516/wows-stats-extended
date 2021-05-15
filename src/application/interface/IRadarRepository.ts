export interface IRadarRepository {
  fetch(): Promise<{ [shipName: string]: number }>;
}
