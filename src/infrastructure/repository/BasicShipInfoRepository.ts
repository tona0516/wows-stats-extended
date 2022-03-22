import { inject, injectable } from "tsyringe";
import { IBasicShipInfoRepository } from "../../application/interface/IBasicShipInfoRepository";
import { ILogger } from "../../application/interface/ILogger";
import { IWargamingRepository } from "../../application/interface/IWargamingRepository";
import { BasicShipInfo } from "../output/BasicShipInfo";
import { EncyclopediaShips } from "../output/EncyclopediaShips";
import { AbstractCacheRepository } from "./AbstractCacheRepository";

@injectable()
export class BasicShipInfoRepository
  extends AbstractCacheRepository<{
    [shipID: number]: BasicShipInfo;
  }>
  implements IBasicShipInfoRepository
{
  protected prefix = "basic_ship_info";

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("WargamingRepository")
    private wargamingRepository: IWargamingRepository
  ) {
    super();
  }

  async get(gameVersion: string): Promise<{ [shipID: number]: BasicShipInfo }> {
    const cache = await super.get(gameVersion);

    if (cache) {
      return cache;
    }

    return await this.fetchBasicShipInfo();
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
