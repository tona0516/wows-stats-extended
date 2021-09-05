import { inject, injectable } from "tsyringe";
import { Failure, Result, Success } from "../../common/Result";
import { Region } from "../../domain/Region";
import { IGameClientRepository } from "../interface/IGameClientRepository";
import { IWargamingRepository } from "../interface/IWargamingRepository";
import { ConfigureResult } from "../output/ConfigureResult";
import { ConfigureResultData } from "../output/ConfigureResultData";
import { ConfigureResultError } from "../output/ConfigureResultError";
import { ConfigureInput } from "./ConfigureInput";
import { ValidatorInterface } from "./ValidatorInterface";

@injectable()
export class ConfigureInputValidator
  implements ValidatorInterface<ConfigureInput, ConfigureResult | undefined> {
  constructor(
    @inject("WargamingRepository")
    private wargamingRepository: IWargamingRepository,
    @inject("GameClientRepository")
    private gameClientRepository: IGameClientRepository
  ) {}

  async validate(
    input: any // eslint-disable-line
  ): Promise<Result<ConfigureInput, ConfigureResult | undefined>> {
    try {
      const configureInput = input as ConfigureInput;

      let reigonError: string | undefined;
      if (!Region.getAll().includes(configureInput.region)) {
        reigonError = "Invalid region.";
      }

      let appidError: string | undefined;
      if (
        !(await this.wargamingRepository.test(
          configureInput.region,
          configureInput.appid
        ))
      ) {
        appidError = "Invalid Appliction ID.";
      }

      let installPathError: string | undefined;
      if (
        !this.gameClientRepository.isInstallPath(configureInput.installPath)
      ) {
        installPathError = "Invalid install path";
      }

      const data: ConfigureResultData = {
        appid: configureInput.appid,
        region: configureInput.region,
        installPath: configureInput.installPath,
        servers: Region.getAll(),
      };

      let errors: ConfigureResultError | undefined;
      if (appidError || reigonError || installPathError) {
        errors = {
          appid: appidError,
          region: reigonError,
          installPath: installPathError,
        };

        const configureResult: ConfigureResult = {
          data: data,
          errors: errors,
        };
        return new Failure(configureResult);
      }

      return new Success(configureInput);
    } catch {
      return new Failure(undefined);
    }
  }
}
