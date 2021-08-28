import Express from "express";
import { inject, injectable } from "tsyringe";
import { Region } from "../../domain/Region";
import { ConfigureInput } from "../input/ConfigureInput";
import { ILogger } from "../interface/ILogger";
import { ConfigureResult } from "../output/ConfigureResult";
import { ConfigureUsecase } from "../usecase/ConfigureUsecase";

@injectable()
export class ConfigureController {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("ConfigureUsecase") private configureUsecase: ConfigureUsecase
  ) {
    this.router = Express.Router();

    this.router.get("/", (req: Express.Request, res: Express.Response) => {
      const userSetting = configureUsecase.get();
      const configureResult: ConfigureResult = {
        appid: userSetting?.appid,
        region: userSetting?.region,
        installPath: userSetting?.installPath,
        servers: Region.getAll(),
      };
      res.render("configure", configureResult);
    });

    this.router.post(
      "/",
      (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
      ) => {
        const configureInput: ConfigureInput = {
          appid: req.body.appid,
          region: req.body.region,
          installPath: req.body.installPath,
        };

        (async () => {
          const configureResult = await configureUsecase.validate(
            configureInput
          );
          if (
            configureResult.appidError ||
            configureResult.regionError ||
            configureResult.installPathError
          ) {
            res.render("configure", configureResult);
            return;
          }

          configureUsecase.save(configureInput);
          res.redirect("/");
        })().catch(next);
      }
    );
  }
}
