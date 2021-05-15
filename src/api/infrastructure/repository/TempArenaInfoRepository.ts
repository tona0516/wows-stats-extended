import { inject, injectable } from "tsyringe";
import fs from "fs";
import path from "path";
import LocalStatusRepositoryInterface from "../../domain/repository/LocalStatusRepositoryInterface";
import LoggerInterface from "../../domain/repository/LoggerInterface";
import UserSetting from "../entity/UserSetting";
import { ErrorResponseType } from "../../domain/model/ErrorResponse";

@injectable()
export default class TempArenaInfoRepositoy
  implements LocalStatusRepositoryInterface {
  constructor(
    @inject("Logger") private logger: LoggerInterface,
    @inject("UserSetting") private userSetting: UserSetting
  ) {}

  static getFileName(): string {
    return "tempArenaInfo.json";
  }

  get(): string {
    const filePath = path.join(
      this.userSetting.install_path,
      TempArenaInfoRepositoy.getFileName()
    );

    if (!fs.existsSync(filePath)) {
      throw ErrorResponseType.notFoundTempArenaInfo;
    }

    const tempArenaInfo = fs.readFileSync(filePath, "utf8");

    return tempArenaInfo;
  }
}
