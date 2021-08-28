export interface ConfigureResult {
  appid?: string;
  appidError?: string;
  region?: string;
  regionError?: string;
  installPath?: string;
  installPathError?: string;
  servers: string[];
}
