import fs from "fs";
import { injectable } from "inversify";
import JSON5 from "json5";
import { UserSetting } from "../output/UserSetting";

@injectable()
export class UserSettingRepository {
  static getFileName(): string {
    return "user_setting.json5";
  }

  isExist(): boolean {
    return fs.existsSync(UserSettingRepository.getFileName());
  }

  read(): UserSetting | undefined {
    if (!this.isExist()) {
      return undefined;
    }

    return JSON5.parse(
      fs.readFileSync(UserSettingRepository.getFileName(), "utf-8")
    );
  }

  write(settings: UserSetting): void {
    fs.writeFileSync(
      UserSettingRepository.getFileName(),
      JSON5.stringify(settings, null, 2)
    );
  }
}
