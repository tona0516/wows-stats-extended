import { Logger } from "log4js";
import { inject, injectable } from "tsyringe";
import { TempArenaInfoRepository } from "../../infrastructure/repository/TempArenaInfoRepository";
import { BattleStatus } from "../output/BattleStatus";

@injectable()
export class GetBattleStatusUsecase {
  constructor(
    @inject("Logger") private logger: Logger,
    @inject("TempArenaInfoRepository")
    private tempArenaInfoRepository: TempArenaInfoRepository
  ) {}

  invoke(): BattleStatus | undefined {
    const localStatus = this.tempArenaInfoRepository.get();
    if (!localStatus) {
      return undefined;
    }
    return new BattleStatus(localStatus);
  }
}
