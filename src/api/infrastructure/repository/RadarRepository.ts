import { inject, injectable } from "tsyringe";
import axios from "axios";
import cheerio from "cheerio";
import LoggerInterface from "../../domain/repository/LoggerInterface";
import RadarRepositoryInterface from "../../domain/repository/RadarRepositoryInterface";

@injectable()
export default class RadarRepository implements RadarRepositoryInterface {
  static getBaseUrl(): string {
    return "https://wiki.wargaming.net/en/Ship:Surveillance_Radar_Data";
  }

  constructor(@inject("Logger") private logger: LoggerInterface) {}

  async fetch(): Promise<{ [shipName: string]: number }> {
    const radarMap: { [shipName: string]: number } = {};

    const response = await axios.get(RadarRepository.getBaseUrl());
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
