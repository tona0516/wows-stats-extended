import { injectable } from "tsyringe";
import { Failure, Result, Success } from "../../common/Result";
import { BattleStatus } from "../output/BattleStatus";
import { ErrorResponse, ErrorResponseType } from "../output/ErrorResponse";
import { ValidatorInterface } from "./ValidatorInterface";

@injectable()
export class BattleStatusValidator
  implements ValidatorInterface<BattleStatus, ErrorResponse> {
  // eslint-disable-next-line
  async validate(
    input: any // eslint-disable-line
  ): Promise<Result<BattleStatus, ErrorResponse>> {
    try {
      // eslint-disable-next-line
      const battleStatus = input as BattleStatus;
      return new Success(battleStatus);
    } catch {
      return new Failure(ErrorResponseType.invalidTempArenaInfo);
    }
  }
}
