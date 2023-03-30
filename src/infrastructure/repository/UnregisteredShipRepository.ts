import { readFileSync } from "fs";
import * as path from "path";
import { inject, injectable } from "inversify";
import { Types } from "../../types";
import { BasicShipInfo } from "../output/BasicShipInfo";
import { Logger } from "./Logger";

@injectable()
export class UnregisteredShipRepository {
  constructor(@inject(Types.Logger) private logger: Logger) {}

  getShips(): { [shipID: number]: BasicShipInfo } {
    const ships = JSON.parse(
      readFileSync(
        path.join(__dirname, "../../../resource/wargamings/ships.json"),
        "utf8"
      )
    ) as UnregisteredShip[];

    return this.toBasicShipInfo(ships);
  }

  private toBasicShipInfo(ships: UnregisteredShip[]): {
    [shipID: number]: BasicShipInfo;
  } {
    const result: { [shipID: number]: BasicShipInfo } = {};
    ships.forEach((it) => {
      result[it.id] = {
        name: it.en,
        tier: it.level,
        type: it.species,
        nation:
          it.nation === "United_Kingdom" ? "uk" : it.nation?.toLowerCase(),
      };
    });

    return result;
  }
}

interface UnregisteredShip {
  id: number; // ship id
  en?: string; // ship name
  level?: number; // tier
  nation?: string; // nation
  species?: string; // ship type
}
