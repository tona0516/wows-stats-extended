/* eslint-disable */

import { Failure, Result, Success } from "../../common/Result";
import { Region } from "../../domain/Region";
import {
  ConfigureResponse as ConfigureValidateResult,
  ConfigureResponseError,
} from "../output/ConfigureResponse";
import { ValidatorInterface } from "./ValidatorInterface";
import { GameClientRepository } from "../../infrastructure/repository/GameClientRepository";
import { WargamingRepositpory } from "../../infrastructure/repository/WargamingRepository";
import { inject, injectable } from "inversify";
import { Types } from "../../types";

export interface ConfigureInput {
  readonly appid: string;
  readonly region: string;
  readonly installPath: string;
}

@injectable()
export class ConfigureInputValidator
  implements ValidatorInterface<ConfigureInput, ConfigureValidateResult>
{
  constructor(
    @inject(Types.WargamingRepository)
    private wargamingRepository: WargamingRepositpory,
    @inject(Types.GameClientRepository)
    private gameClientRepository: GameClientRepository
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
