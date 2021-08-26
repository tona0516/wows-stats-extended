import { inject, injectable } from "tsyringe";
import { Region } from "../../domain/Region";
import { UserSettingVersion } from "../../domain/UserSettingVersion";
import { UserSetting } from "../../infrastructure/output/UserSetting";
import { InstallInput } from "../input/InstallInput";
import { IGameClientRepository } from "../interface/IGameClientRepository";
import { ILogger } from "../interface/ILogger";
import { IUserSettingRepository } from "../interface/IUserSettingRepository";
import { IWargamingRepository } from "../interface/IWargamingRepository";
import { InstallResult } from "../output/InstallResult";

@injectable()
export class InstallUsecase {
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

  save(installInput: InstallInput): void {
    const userSetting: UserSetting = {
      version: UserSettingVersion.latest(),
      appid: installInput.appid,
      installPath: installInput.installPath,
      region: installInput.region,
    };
    this.userSettingRepository.write(userSetting);
  }

  async validate(installInput: InstallInput): Promise<InstallResult> {
    let reigonError: string | undefined;
    if (!Region.getAll().includes(installInput.region)) {
      reigonError = "Invalid region.";
    }

    let appidError: string | undefined;
    if (
      !(await this.wargamingRepository.test(
        installInput.region,
        installInput.appid
      ))
    ) {
      appidError = "Invalid Appliction ID.";
    }

    let installPathError: string | undefined;
    if (!this.gameClientRepository.isInstallPath(installInput.installPath)) {
      installPathError = "Invalid install path";
    }

    const installResult: InstallResult = {
      appid: installInput.appid,
      appidError: appidError,
      region: installInput.region,
      regionError: reigonError,
      installPath: installInput.installPath,
      installPathError: installPathError,
      servers: Region.getAll(),
    };

    this.logger.debug("installResult", installResult);

    return installResult;
  }
}
