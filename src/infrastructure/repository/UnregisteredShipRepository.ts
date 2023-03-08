import { readFileSync } from "fs";
import { load } from "js-yaml";
import { inject, injectable } from "tsyringe";
import { BasicShipInfo } from "../output/BasicShipInfo";
import { Logger } from "./Logger";

@injectable()
export class UnregisteredShipRepository {
  constructor(@inject("Logger") private logger: Logger) {}

  getShips(): { [shipID: number]: BasicShipInfo } {
    return load(
      readFileSync(`${__dirname}/../../resource/wargamings/ships.yaml`, "utf8")
    ) as { [shipID: number]: BasicShipInfo };
  }
}
