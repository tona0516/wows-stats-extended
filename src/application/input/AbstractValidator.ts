export abstract class AbstractValidator<T> {
  protected input: any;
  protected output?: T;

  constructor(input: any) {
    this.input = input;
  }

  get(): T {
    return this.output!;
  }

  abstract isValid(): boolean;
}
