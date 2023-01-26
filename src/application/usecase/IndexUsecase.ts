import { inject, injectable } from "tsyringe";
import { Logger } from "../../infrastructure/repository/Logger";
import { UserSettingRepository } from "../../infrastructure/repository/UserSettingRepository";

@injectable()
export class IndexUsecase {
  constructor(
    @inject("Logger") private logger: Logger,
    @inject("UserSettingRepository")
    private userSettingRepository: UserSettingRepository
  ) {}

  invoke(): boolean {
    return this.userSettingRepository.isExist();
  }
}
