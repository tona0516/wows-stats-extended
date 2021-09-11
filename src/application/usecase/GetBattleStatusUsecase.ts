import { inject, injectable } from "tsyringe";
import { ILogger } from "../interface/ILogger";
import { ITempArenaInfoRepository } from "../interface/ITempArenaInfoRepository";
import { BattleStatus } from "../output/BattleStatus";

@injectable()
export class GetBattleStatusUsecase {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("TempArenaInfoRepository")
    private tempArenaInfoRepository: ITempArenaInfoRepository
  ) {}

  invoke(): BattleStatus | undefined {
    const localStatus = this.tempArenaInfoRepository.get();
    if (!localStatus) {
      return undefined;
    }
    return new BattleStatus(localStatus);
  }
}
