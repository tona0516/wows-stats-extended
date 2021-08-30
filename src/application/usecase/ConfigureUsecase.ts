import { inject, injectable } from "tsyringe";
import { Region } from "../../domain/Region";
import { UserSettingVersion } from "../../domain/UserSettingVersion";
import { UserSetting } from "../../infrastructure/output/UserSetting";
import { ConfigureInput } from "../input/ConfigureInput";
import { IGameClientRepository } from "../interface/IGameClientRepository";
import { ILogger } from "../interface/ILogger";
import { IUserSettingRepository } from "../interface/IUserSettingRepository";
import { IWargamingRepository } from "../interface/IWargamingRepository";
import { ConfigureResult } from "../output/ConfigureResult";
import { ConfigureResultData } from "../output/ConfigureResultData";
import { ConfigureResultError } from "../output/ConfigureResultError";

@injectable()
export class ConfigureUsecase {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository,
    @inject("WargamingRepository")
    private wargamingRepository: IWargamingRepository,
    @inject("GameClientRepository")
    private gameClientRepository: IGameClientRepository
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

  async validate(configureInput: ConfigureInput): Promise<ConfigureResult> {
    let reigonError: string | undefined;
    if (!Region.getAll().includes(configureInput.region)) {
      reigonError = "Invalid region.";
    }

    let appidError: string | undefined;
    if (
      !(await this.wargamingRepository.test(
        configureInput.region,
        configureInput.appid
      ))
    ) {
      appidError = "Invalid Appliction ID.";
    }

    let installPathError: string | undefined;
    if (!this.gameClientRepository.isInstallPath(configureInput.installPath)) {
      installPathError = "Invalid install path";
    }

    const data: ConfigureResultData = {
      appid: configureInput.appid,
      region: configureInput.region,
      installPath: configureInput.installPath,
      servers: Region.getAll(),
    };

    let errors: ConfigureResultError | undefined;
    if (appidError || reigonError || installPathError) {
      errors = {
        appid: appidError,
        region: reigonError,
        installPath: installPathError,
      };
    }

    const configureResult: ConfigureResult = {
      data: data,
      errors: errors,
    };

    this.logger.debug("configureResult", configureResult);

    return configureResult;
  }
}
