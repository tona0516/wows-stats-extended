/* eslint-disable */

import { inject, injectable } from "tsyringe";
import { Failure, Result, Success } from "../../common/Result";
import { Region } from "../../domain/Region";
import { IGameClientRepository } from "../interface/IGameClientRepository";
import { IWargamingRepository } from "../interface/IWargamingRepository";
import {
  ConfigureResponse as ConfigureValidateResult,
  ConfigureResponseError,
} from "../output/ConfigureResponse";
import { ConfigureInput } from "./ConfigureInput";
import { ValidatorInterface } from "./ValidatorInterface";

@injectable()
export class ConfigureInputValidator
  implements ValidatorInterface<ConfigureInput, ConfigureValidateResult>
{
  constructor(
    @inject("WargamingRepository")
    private wargamingRepository: IWargamingRepository,
    @inject("GameClientRepository")
    private gameClientRepository: IGameClientRepository
  ) {}

  private async validateAppid(
    appid: string,
    region: string
  ): Promise<string | undefined> {
    return (await this.wargamingRepository.test(region, appid))
      ? undefined
      : "Invalid Appliction ID.";
  }

  private validateInstallPath(installPath: string): string | undefined {
    return this.gameClientRepository.isInstallPath(installPath)
      ? undefined
      : "Invalid install path";
  }

  private validateRegion(region: string): string | undefined {
    return Region.getAll().includes(region) ? undefined : "Invalid region.";
  }

  async validate(
    input: any
  ): Promise<Result<ConfigureInput, ConfigureValidateResult>> {
    const regionError = this.validateRegion(input.region);
    const appidError = await this.validateAppid(input.appid, input.region);
    const installPathError = this.validateInstallPath(input.installPath);

    if (appidError || regionError || installPathError) {
      const errors: ConfigureResponseError = {
        appid: appidError,
        region: regionError,
        installPath: installPathError,
      };

      const validateResult: ConfigureValidateResult = {
        data: { ...input, ...{ servers: Region.getAll() } },
        errors: errors,
      };
      return new Failure(validateResult);
    }

    return new Success(input);
  }
}
