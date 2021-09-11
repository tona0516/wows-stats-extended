import { inject, injectable } from "tsyringe";
import { UserSettingVersion } from "../../domain/UserSettingVersion";
import { UserSetting } from "../../infrastructure/output/UserSetting";
import { ConfigureInputValidator } from "../input/ConfigureInputValidator";
import { ILogger } from "../interface/ILogger";
import { IUserSettingRepository } from "../interface/IUserSettingRepository";
import { ConfigureResponse } from "../output/ConfigureResponse";

@injectable()
export class PostConfigureUsecase {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository,
    @inject("ConfigureInputValidator")
    private configureInputValidator: ConfigureInputValidator
  ) {}

  // eslint-disable-next-line
  async invoke(body: any): Promise<ConfigureResponse | undefined> {
    // eslint-disable-next-line
    const result = await this.configureInputValidator.validate(body);
    if (result.isFailure()) {
      return result.value;
    }

    const userSetting: UserSetting = {
      version: UserSettingVersion.latest(),
      appid: result.value.appid,
      installPath: result.value.installPath,
      region: result.value.region,
    };
    this.userSettingRepository.write(userSetting);
    return undefined;
  }
}
