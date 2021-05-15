import { inject, injectable } from "tsyringe";
import storage from "node-persist";
import LoggerInterface from "../../domain/repository/LoggerInterface";
import BasicShipInfoRepositoryInterface from "../../domain/repository/BasicShipInfoRepositoryInterface";
import BasicShipInfo from "../entity/BasicShipInfo";

@injectable()
export default class BasicShipInfoRepository
  implements BasicShipInfoRepositoryInterface {
  readonly PREFIX = "basic_ship_info";

  constructor(@inject("Logger") private logger: LoggerInterface) {
    void storage.init();
  }

  async get(
    gameVersion: string
  ): Promise<{ [shipID: number]: BasicShipInfo } | null> {
    return (await storage.getItem(`${this.PREFIX}_${gameVersion}`)) as {
      [shipID: number]: BasicShipInfo;
    } | null;
  }

  async set(
    basicShipInfo: { [shipID: number]: BasicShipInfo },
    gameVersion: string
  ) {
    await storage.setItem(`${this.PREFIX}_${gameVersion}`, basicShipInfo);
  }

  async deleteOld() {
    const keys = (await storage.keys()).sort();
    keys.splice(-1, 1);
    keys.forEach((it) => {
      void (async () => {
        await storage.removeItem(it);
      })();
    });
  }
}
