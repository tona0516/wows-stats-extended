import BasicShipInfo from "../../infrastructure/entity/BasicShipInfo";

export default interface BasicShipInfoRepositoryInterface {
  get(gameVersion: string): Promise<{ [shipID: number]: BasicShipInfo } | null>;
  set(
    basicShipInfo: { [shipID: number]: BasicShipInfo },
    gameVersion: string
  ): void;
  deleteOld(): void;
}
