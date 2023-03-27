import fs from "fs";
import path from "path";
import { inject, injectable } from "inversify";
import { ErrorResponseType } from "../../application/output/ErrorResponse";
import { Types } from "../../types";
import { Logger } from "./Logger";
import { UserSettingRepository } from "./UserSettingRepository";

@injectable()
export class TempArenaInfoRepository {
  constructor(
    @inject(Types.Logger) private logger: Logger,
    @inject(Types.UserSettingRepository)
    private userSettingRepository: UserSettingRepository
  ) {}

  static getPath(): string {
    return "replays";
  }

  static getFileName(): string {
    return "tempArenaInfo.json";
  }

  get(): string | undefined {
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
      return undefined;
    }

    const tempArenaInfo = fs.readFileSync(filePath, "utf8");

    return tempArenaInfo;
  }
}
