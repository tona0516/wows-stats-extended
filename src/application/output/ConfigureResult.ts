import { ConfigureResultData } from "./ConfigureResultData";
import { ConfigureResultError } from "./ConfigureResultError";

export interface ConfigureResult {
  data: ConfigureResultData;
  errors?: ConfigureResultError;
}
