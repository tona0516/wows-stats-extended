import fs from "fs";
import path from "path";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../../application/interface/ILogger";
import { ITempArenaInfoRepository } from "../../application/interface/ITempArenaInfoRepository";
import { IUserSettingRepository } from "../../application/interface/IUserSettingRepository";
import { ErrorResponseType } from "../../application/output/ErrorResponse";

@injectable()
export class TempArenaInfoRepository implements ITempArenaInfoRepository {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository
  ) {}

  static getPath(): string {
    return "replays";
  }

  static getFileName(): string {
    return "tempArenaInfo.json";
  }

  get(): string {
    const userSetting = this.userSettingRepository.read();
    const installPath = userSetting?.installPath;
    if (!installPath) {
      throw ErrorResponseType.notFoundInstallPath;
    }

    const filePath = path.join(
      installPath,
      TempArenaInfoRepository.getPath(),
      TempArenaInfoRepository.getFileName()
    );

    if (!fs.existsSync(filePath)) {
      throw ErrorResponseType.notFoundTempArenaInfo;
    }

    const tempArenaInfo = fs.readFileSync(filePath, "utf8");

    return tempArenaInfo;
  }
}
