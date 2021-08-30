import storage from "node-persist";
import { inject, injectable } from "tsyringe";
import { IBasicShipInfoRepository } from "../../application/interface/IBasicShipInfoRepository";
import { ILogger } from "../../application/interface/ILogger";
import { IWargamingRepository } from "../../application/interface/IWargamingRepository";
import { BasicShipInfo } from "../output/BasicShipInfo";
import { EncyclopediaShips } from "../output/EncyclopediaShips";
import { CacheRepository } from "./CacheRepository";

@injectable()
export class BasicShipInfoRepository implements IBasicShipInfoRepository {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("CacheRepository")
    private cacheRepository: CacheRepository<{
      [shipID: number]: BasicShipInfo;
    }>,
    @inject("WargamingRepository")
    private wargamingRepository: IWargamingRepository
  ) {
    void storage.init();
  }

  static getPrefix(): string {
    return "basic_ship_info";
  }

  async get(gameVersion: string): Promise<{ [shipID: number]: BasicShipInfo }> {
    const cache = (await storage.getItem(
      `${BasicShipInfoRepository.getPrefix()}_${gameVersion}`
    )) as {
      [shipID: number]: BasicShipInfo;
    } | null;

    if (cache) {
      return cache;
    }

    return await this.fetchBasicShipInfo();
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

  private async fetchBasicShipInfo(): Promise<{
    [shipID: number]: BasicShipInfo;
  }> {
    const pageTotal = (await this.wargamingRepository.getEncyclopediaShips(1))
      .meta.page_total;
    const encyclopediaShipsPromises: Promise<EncyclopediaShips>[] = [];
    for (let i = 1; i <= pageTotal; i++) {
      encyclopediaShipsPromises.push(
        this.wargamingRepository.getEncyclopediaShips(i)
      );
    }
    const encyclopediaShipsList = await Promise.all(encyclopediaShipsPromises);

    const basicShipInfo: { [shipID: number]: BasicShipInfo } = {};
    encyclopediaShipsList.forEach((it) => {
      for (const shipID in it.data) {
        const encyclopediaShip = it.data[shipID];
        basicShipInfo[shipID] = {
          name: encyclopediaShip.name,
          tier: encyclopediaShip.tier,
          type: encyclopediaShip.type,
          nation: encyclopediaShip.nation,
          detectDistanceByShip:
            encyclopediaShip.default_profile?.concealment
              ?.detect_distance_by_ship,
        };
      }
    });

    return basicShipInfo;
  }
}
