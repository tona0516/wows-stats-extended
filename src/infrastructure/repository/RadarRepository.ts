import axios from "axios";
import cheerio from "cheerio";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../../application/interface/ILogger";
import { IRadarRepository } from "../../application/interface/IRadarRepository";

@injectable()
export class RadarRepository implements IRadarRepository {
  constructor(@inject("Logger") private logger: ILogger) {}

  static getBaseUrl(): string {
    return "https://wiki.wargaming.net/en/Ship:Surveillance_Radar_Data";
  }

  async fetch(): Promise<{ [shipName: string]: number }> {
    const radarMap: { [shipName: string]: number } = {};

    const response = await axios.get(RadarRepository.getBaseUrl());
    // eslint-disable-next-line
    const $ = cheerio.load(response.data);
    const lines = $("#mw-content-text > div > table > tbody > tr");
    lines.each((_index, element) => {
      const children = $(element).children();
      if (children.length < 7) {
        return;
      }

      const shipNameNode = children[1];
      const shipNames = $(shipNameNode).text().trim().split(",");

      const detectionRangeNode = children[5];
      const detectionRange = parseFloat($(detectionRangeNode).text().trim());

      if (!shipNames || !detectionRange) {
        return;
      }

      shipNames.forEach((shipName) => {
        radarMap[shipName] = detectionRange;
      });
    });

    return radarMap;
  }
}
