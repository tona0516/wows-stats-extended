import { ExpectedStats } from "../../infrastructure/output/ExpectedStats";

export interface INumbersRepository {
  get(gameVersion: string): Promise<ExpectedStats>;
  set(expectedStats: ExpectedStats, gameVersion: string): Promise<void>;
  deleteWithoutLatest(): Promise<void>;
}
