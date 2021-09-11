import { inject, injectable } from "tsyringe";
import { Region } from "../../domain/Region";
import { ILogger } from "../interface/ILogger";
import { IUserSettingRepository } from "../interface/IUserSettingRepository";
import { ConfigureResponse } from "../output/ConfigureResponse";

@injectable()
export class GetConfigureUsecase {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository
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
