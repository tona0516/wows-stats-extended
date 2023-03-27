import { readFileSync } from "fs";
import { inject, injectable } from "inversify";
import { load } from "js-yaml";
import { Types } from "../../types";
import { BasicShipInfo } from "../output/BasicShipInfo";
import { Logger } from "./Logger";

@injectable()
export class UnregisteredShipRepository {
  constructor(@inject(Types.Logger) private logger: Logger) {}

  getShips(): { [shipID: number]: BasicShipInfo } {
    return load(readFileSync("resource/wargamings/ships.yaml", "utf8")) as {
      [shipID: number]: BasicShipInfo;
    };
  }
}
