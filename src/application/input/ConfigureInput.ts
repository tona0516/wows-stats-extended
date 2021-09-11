import { Region } from "../../domain/Region";
import { ConfigureResponseData } from "../output/ConfigureResponse";

export class ConfigureInput {
  constructor(
    readonly appid: string,
    readonly region: string,
    readonly installPath: string
  ) {}

  toResponseData(): ConfigureResponseData {
    return {
      appid: this.appid,
      installPath: this.installPath,
      region: this.region,
      servers: Region.getAll(),
    };
  }
}
