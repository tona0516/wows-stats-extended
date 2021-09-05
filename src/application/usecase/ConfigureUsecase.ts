import { inject, injectable } from "tsyringe";
import { UserSettingVersion } from "../../domain/UserSettingVersion";
import { UserSetting } from "../../infrastructure/output/UserSetting";
import { ConfigureInput } from "../input/ConfigureInput";
import { ILogger } from "../interface/ILogger";
import { IUserSettingRepository } from "../interface/IUserSettingRepository";

@injectable()
export class ConfigureUsecase {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository
  ) {}

  get(): UserSetting | undefined {
    return this.userSettingRepository.read();
  }

  save(configureInput: ConfigureInput): void {
    const userSetting: UserSetting = {
      version: UserSettingVersion.latest(),
      appid: configureInput.appid,
      installPath: configureInput.installPath,
      region: configureInput.region,
    };
    this.userSettingRepository.write(userSetting);
  }
}
