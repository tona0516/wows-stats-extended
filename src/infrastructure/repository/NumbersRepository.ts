import axios, { AxiosInstance } from "axios";
import storage from "node-persist";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../../application/interface/ILogger";
import { INumbersRepository } from "../../application/interface/INumbersRepository";
import { ExpectedStats } from "../output/ExpectedStats";
import { CacheRepository } from "./CacheRepository";

@injectable()
export class NumbersRepository implements INumbersRepository {
  httpClient: AxiosInstance;

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("CacheRepository")
    private cacheRepository: CacheRepository<ExpectedStats>
  ) {
    this.httpClient = axios.create({
      baseURL: `https://api.wows-numbers.com`,
      timeout: 3000,
    });
    void storage.init();
  }

  static getPrefix(): string {
    return "numbers";
  }

  async get(gameVersion: string): Promise<ExpectedStats> {
    const cache = (await storage.getItem(
      `${NumbersRepository.getPrefix()}_${gameVersion}`
    )) as ExpectedStats | null;

    if (cache) {
      return cache;
    }

    const response = await this.httpClient.get<ExpectedStats>(
      "/personal/rating/expected/json/"
    );
    return response.data;
  }

  async set(expectedStats: ExpectedStats, gameVersion: string): Promise<void> {
    await storage.setItem(
      `${NumbersRepository.getPrefix()}_${gameVersion}`,
      expectedStats
    );
  }

  async deleteOld(): Promise<void> {
    await this.cacheRepository.deleteOld(NumbersRepository.getPrefix());
  }
}
