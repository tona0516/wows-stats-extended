import { inject, injectable } from "tsyringe";
import { Region } from "../../domain/Region";
import { Logger } from "../../infrastructure/repository/Logger";
import { UserSettingRepository } from "../../infrastructure/repository/UserSettingRepository";
import { ConfigureResponse } from "../output/ConfigureResponse";

@injectable()
export class GetConfigureUsecase {
  constructor(
    @inject("Logger") private logger: Logger,
    @inject("UserSettingRepository")
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
