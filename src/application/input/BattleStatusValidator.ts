import { BattleStatus } from "../output/BattleStatus";
import { AbstractValidator } from "./AbstractValidator";

export class BattleStatusValidator extends AbstractValidator<BattleStatus> {
  protected input: any;
  protected output?: BattleStatus;

  constructor(input: any) {
    super(input);
  }

  isValid(): boolean {
    try {
      this.output = this.input as BattleStatus;
      return true;
    } catch {
      return false;
    }
  }
}
