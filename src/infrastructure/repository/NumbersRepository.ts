import axios, { AxiosInstance } from "axios";
import { inject, injectable } from "inversify";
import { Types } from "../../types";
import { ExpectedStats } from "../output/ExpectedStats";
import { AbstractCacheRepository } from "./AbstractCacheRepository";
import { Logger } from "./Logger";

@injectable()
export class NumbersRepository extends AbstractCacheRepository<ExpectedStats> {
  protected prefix = "numbers";
  private httpClient: AxiosInstance;

  constructor(@inject(Types.Logger) private logger: Logger) {
    super();
    this.httpClient = axios.create({
      baseURL: `https://api.wows-numbers.com`,
      timeout: 10000,
    });
  }

  async get(gameVersion: string): Promise<ExpectedStats> {
    const cache = await super.get(gameVersion);

    if (cache) {
      return cache;
    }

    return await this.fetchExpectedStats();
  }

  private async fetchExpectedStats(): Promise<ExpectedStats> {
    const response = await this.httpClient.get<ExpectedStats>(
      "/personal/rating/expected/json/"
    );
    return response.data;
  }
}
