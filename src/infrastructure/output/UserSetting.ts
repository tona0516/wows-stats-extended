import { injectable } from "tsyringe";

/**
 * note: define with class for dependency injection.
 */
@injectable()
export class UserSetting {
  version: number;
  appid: string;
  installPath: string;
  region: string;

  constructor(
    version: number,
    appid: string,
    installPath: string,
    region: string
  ) {
    this.version = version;
    this.appid = appid;
    this.installPath = installPath;
    this.region = region;
  }
}
