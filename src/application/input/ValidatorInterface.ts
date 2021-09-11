/* eslint-disable @typescript-eslint/no-explicit-any */

import { Result } from "../../common/Result";

export interface ValidatorInterface<T, E> {
  validate(input: any): Promise<Result<T, E>>;
}
