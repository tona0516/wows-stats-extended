export default interface RadarRepositoryInterface {
  fetch(): Promise<{ [shipName: string]: number }>;
}
