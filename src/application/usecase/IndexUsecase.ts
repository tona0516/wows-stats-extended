import { inject, injectable } from "tsyringe";
import { ILogger } from "../interface/ILogger";
import { IUserSettingRepository } from "../interface/IUserSettingRepository";

@injectable()
export class IndexUsecase {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository
  ) {}

  isConfigured(): boolean {
    return this.userSettingRepository.isExist();
  }
}
