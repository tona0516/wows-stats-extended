import fs from "fs";
import JSON5 from "json5";
import { injectable } from "tsyringe";
import { IUserSettingRepository } from "../../application/interface/IUserSettingRepository";
import { UserSetting } from "../output/UserSetting";

@injectable()
export class UserSettingRepository implements IUserSettingRepository {
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
