import { BasicShipInfo } from "../../infrastructure/output/BasicShipInfo";

export interface IBasicShipInfoRepository {
  get(gameVersion: string): Promise<{ [shipID: number]: BasicShipInfo }>;
  set(
    basicShipInfo: { [shipID: number]: BasicShipInfo },
    gameVersion: string
  ): Promise<void>;
  deleteOld(): Promise<void>;
}
