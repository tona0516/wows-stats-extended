import { inject, injectable } from "inversify";
import { Logger } from "log4js";
import { TempArenaInfoRepository } from "../../infrastructure/repository/TempArenaInfoRepository";
import { Types } from "../../types";
import { BattleStatus } from "../output/BattleStatus";

@injectable()
export class GetBattleStatusUsecase {
  constructor(
    @inject(Types.Logger) private logger: Logger,
    @inject(Types.TempArenaInfoRepository)
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
