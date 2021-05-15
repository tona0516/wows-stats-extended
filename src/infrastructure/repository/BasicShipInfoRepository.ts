import storage from "node-persist";
import { inject, injectable } from "tsyringe";
import { IBasicShipInfoRepository } from "../../application/interface/IBasicShipInfoRepository";
import { ILogger } from "../../application/interface/ILogger";
import { BasicShipInfo } from "../output/BasicShipInfo";
import { CacheRepository } from "./CacheRepository";

@injectable()
export class BasicShipInfoRepository implements IBasicShipInfoRepository {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("CacheRepository")
    private cacheRepository: CacheRepository<{
      [shipID: number]: BasicShipInfo;
    }>
  ) {
    void storage.init();
  }

  static getPrefix(): string {
    return "basic_ship_info";
  }

  async get(
    gameVersion: string
  ): Promise<{ [shipID: number]: BasicShipInfo } | null> {
    return (await storage.getItem(
      `${BasicShipInfoRepository.getPrefix()}_${gameVersion}`
    )) as {
      [shipID: number]: BasicShipInfo;
    } | null;
  }

  async set(
    basicShipInfo: { [shipID: number]: BasicShipInfo },
    gameVersion: string
  ): Promise<void> {
    await storage.setItem(
      `${BasicShipInfoRepository.getPrefix()}_${gameVersion}`,
      basicShipInfo
    );
  }

  async deleteOld(): Promise<void> {
    await this.cacheRepository.deleteOld(BasicShipInfoRepository.getPrefix());
  }
}
