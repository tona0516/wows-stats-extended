import { Region } from "../../domain/Region";

export interface InstallResult {
  appid?: string;
  appidError?: string;
  region?: string;
  regionError?: string;
  installPath?: string;
  installPathError?: string;
  servers: string[];
}
