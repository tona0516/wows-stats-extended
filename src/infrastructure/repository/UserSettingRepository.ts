import fs from "fs";
import JSON5 from "json5";
import { injectable } from "tsyringe";
import { IUserSettingRepository } from "../../application/interface/IUserSettingRepository";
import { UserSetting } from "../output/UserSetting";

@injectable()
export class UserSettingRepository implements IUserSettingRepository {
  static getSettingFileName(): string {
    return "user_setting.json5";
  }

  isExist(): boolean {
    return fs.existsSync(UserSettingRepository.getSettingFileName());
  }

  read(): UserSetting | undefined {
    if (!this.isExist()) {
      return undefined;
    }

    const file = fs.readFileSync(
      UserSettingRepository.getSettingFileName(),
      "utf-8"
    );

    return JSON5.parse(file);
  }

  write(settings: UserSetting): void {
    fs.writeFileSync(
      UserSettingRepository.getSettingFileName(),
      JSON5.stringify(settings, null, 2)
    );
  }

  delete(): void {
    throw new Error("Method not implemented.");
  }
}
