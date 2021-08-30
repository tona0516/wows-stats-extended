/* eslint-disable */
import { AbstractValidator } from "./AbstractValidator";
import { ConfigureInput } from "./ConfigureInput";

export class ConfigureInputValidator extends AbstractValidator<ConfigureInput> {
  protected input: any;
  protected output?: ConfigureInput;

  constructor(input: any) {
    super(input);
  }

  isValid(): boolean {
    try {
      this.output = this.input as ConfigureInput;
      return true;
    } catch {
      return false;
    }
  }
}
