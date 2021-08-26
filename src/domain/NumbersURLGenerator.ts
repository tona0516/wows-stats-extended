import { Region } from "./Region";

export class NumbersURLGenerator {
  static genetatePlayerPageURL(
    region: string | undefined,
    accountID: string,
    accountName: string
  ): string | undefined {
    const baseURL = NumbersURLGenerator.generateBaseURL(region);
    if (!baseURL) return undefined;
    return `${baseURL}/player/${accountID},${accountName}`;
  }

  static genetateShipPageURL(
    region: string | undefined,
    shipID: string,
    shipName: string | undefined
  ): string | undefined {
    const baseURL = NumbersURLGenerator.generateBaseURL(region);
    if (!baseURL) return undefined;
    if (!shipName) return undefined;
    return `${baseURL}/ship/${shipID},${shipName.replace(" ", "-")}`;
  }

  private static generateBaseURL(
    region: string | undefined
  ): string | undefined {
    switch (region) {
      case Region.na:
        return "https://na.wows-numbers.com";
      case Region.eu:
        return "https://wows-numbers.com";
      case Region.ru:
        return "https://ru.wows-numbers.com";
      case Region.asia:
        return "https://asia.wows-numbers.com";
      default:
        return undefined;
    }
  }
}
