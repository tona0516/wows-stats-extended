import { injectable } from "tsyringe";

/**
 * note: define with class for dependency injection.
 */
@injectable()
export default class UserSetting {
  version: number;
  appid: string;
  install_path: string;
  region: string;
  port: number;

  constructor(
    version: number,
    appid: string,
    install_path: string,
    region: string,
    port: number
  ) {
    this.version = version;
    this.appid = appid;
    this.install_path = install_path;
    this.region = region;
    this.port = port;
  }
}
