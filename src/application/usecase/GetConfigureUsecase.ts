import { inject, injectable } from "inversify";
import { Region } from "../../domain/Region";
import { Logger } from "../../infrastructure/repository/Logger";
import { UserSettingRepository } from "../../infrastructure/repository/UserSettingRepository";
import { Types } from "../../types";
import { ConfigureResponse } from "../output/ConfigureResponse";

@injectable()
export class GetConfigureUsecase {
  constructor(
    @inject(Types.Logger) private logger: Logger,
    @inject(Types.UserSettingRepository)
    private userSettingRepository: UserSettingRepository
  ) {}

  invoke(): ConfigureResponse {
    const userSetting = this.userSettingRepository.read();
    return {
      data: {
        appid: userSetting?.appid,
        region: userSetting?.region,
        installPath: userSetting?.installPath,
        servers: Region.getAll(),
      },
    };
  }
}
