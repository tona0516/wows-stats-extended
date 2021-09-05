import { Result } from "../../common/Result";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unsafe-assignment */
export interface ValidatorInterface<T, E> {
  validate(input: any): Promise<Result<T, E>>;
}
