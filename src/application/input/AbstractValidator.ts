/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unsafe-assignment */
export abstract class AbstractValidator<T> {
  protected input: any;
  protected output?: T;

  constructor(input: any) {
    this.input = input;
  }

  get(): T | undefined {
    return this.output;
  }

  abstract isValid(): boolean;
}
