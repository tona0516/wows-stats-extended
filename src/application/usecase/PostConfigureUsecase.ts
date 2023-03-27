import { inject, injectable } from "inversify";
import { UserSettingVersion } from "../../domain/UserSettingVersion";
import { UserSetting } from "../../infrastructure/output/UserSetting";
import { Logger } from "../../infrastructure/repository/Logger";
import { UserSettingRepository } from "../../infrastructure/repository/UserSettingRepository";
import { Types } from "../../types";
import { ConfigureInputValidator } from "../input/ConfigureInputValidator";
import { ConfigureResponse } from "../output/ConfigureResponse";

@injectable()
export class PostConfigureUsecase {
  constructor(
    @inject(Types.Logger) private logger: Logger,
    @inject(Types.UserSettingRepository)
    private userSettingRepository: UserSettingRepository,
    @inject(Types.ConfigureInputValidator)
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
