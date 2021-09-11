export interface ConfigureResponse {
  data: ConfigureResponseData;
  errors?: ConfigureResponseError;
}

export interface ConfigureResponseData {
  appid?: string;
  region?: string;
  installPath?: string;
  servers: string[];
}

export interface ConfigureResponseError {
  appid?: string;
  region?: string;
  installPath?: string;
}
