import { injectable } from "tsyringe";
import UserSettingRepositoryInterface from "../../domain/repository/UserSettingRepositoryInterface";
import UserSetting from "../entity/UserSetting";
import fs from "fs";
import JSON5 from "json5";

@injectable()
export default class UserSettingRepository
  implements UserSettingRepositoryInterface {
  static getSettingFileName(): string {
    return "user_setting.json5";
  }

  isExist(): boolean {
    return fs.existsSync(UserSettingRepository.getSettingFileName());
  }

  craete(): void {
    const settings = {
      version: 1,
      appid: "<appid>",
      install_path: "<install_path>",
      region: "region",
      port: 3000,
    };

    fs.writeFileSync(
      UserSettingRepository.getSettingFileName(),
      JSON5.stringify(settings, null, 2)
    );
  }

  read(): UserSetting | null {
    if (!this.isExist()) {
      return null;
    }

    const file = fs.readFileSync(
      UserSettingRepository.getSettingFileName(),
      "utf-8"
    );

    return JSON5.parse(file);
  }

  update(settings: UserSetting): void {
    fs.writeFileSync(
      UserSettingRepository.getSettingFileName(),
      JSON5.stringify(settings, null, 2)
    );
  }

  delete(): void {
    throw new Error("Method not implemented.");
  }
}
