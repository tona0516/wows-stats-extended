import { inject, injectable } from "inversify";
import { Logger } from "../../infrastructure/repository/Logger";
import { UserSettingRepository } from "../../infrastructure/repository/UserSettingRepository";
import { Types } from "../../types";

@injectable()
export class IndexUsecase {
  constructor(
    @inject(Types.Logger) private logger: Logger,
    @inject(Types.UserSettingRepository)
    private userSettingRepository: UserSettingRepository
  ) {}

  invoke(): boolean {
    return this.userSettingRepository.isExist();
  }
}
