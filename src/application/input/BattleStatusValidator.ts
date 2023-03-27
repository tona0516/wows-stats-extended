/* eslint-disable */

import { injectable } from "inversify";
import { Failure, Result, Success } from "../../common/Result";
import { BattleStatus } from "../output/BattleStatus";
import { ErrorResponse, ErrorResponseType } from "../output/ErrorResponse";
import { ValidatorInterface } from "./ValidatorInterface";

@injectable()
export class BattleStatusValidator
  implements ValidatorInterface<BattleStatus, ErrorResponse>
{
  private isBattleStatus(input: any): input is BattleStatus {
    return input.localStatus !== undefined && input.hash !== undefined;
  }

  async validate(input: any): Promise<Result<BattleStatus, ErrorResponse>> {
    if (!this.isBattleStatus(input)) {
      return new Failure(ErrorResponseType.invalidTempArenaInfo);
    }

    return new Success(input);
  }
}
