import axios, { AxiosInstance } from "axios";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../../application/interface/ILogger";
import { INumbersRepository } from "../../application/interface/INumbersRepository";
import { ExpectedStats } from "../output/ExpectedStats";
import { AbstractCacheRepository } from "./AbstractCacheRepository";

@injectable()
export class NumbersRepository
  extends AbstractCacheRepository<ExpectedStats>
  implements INumbersRepository
{
  protected prefix = "numbers";
  private httpClient: AxiosInstance;

  constructor(@inject("Logger") private logger: ILogger) {
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
