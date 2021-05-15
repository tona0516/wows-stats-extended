import Express from "express";
import { inject, injectable } from "tsyringe";
import { Region } from "../../domain/Region";
import { InstallInput } from "../input/InstallInput";
import { ILogger } from "../interface/ILogger";
import { InstallResult } from "../output/InstallResult";
import { InstallUsecase } from "../usecase/InstallUsecase";

@injectable()
export class InstallController {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("InstallUsecase") private installUsecase: InstallUsecase
  ) {
    this.router = Express.Router();

    this.router.get("/", (req: Express.Request, res: Express.Response) => {
      const userSetting = installUsecase.get();
      const installResult: InstallResult = {
        appid: userSetting?.appid,
        region: userSetting?.region,
        installPath: userSetting?.installPath,
        servers: Region.getAll(),
      };
      res.render("install", installResult);
    });

    this.router.post(
      "/",
      (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
      ) => {
        const installInput: InstallInput = {
          appid: req.body.appid,
          region: req.body.region,
          installPath: req.body.installPath,
        };

        (async () => {
          const installResult = await installUsecase.validate(installInput);
          if (
            installResult.appidError ||
            installResult.regionError ||
            installResult.installPathError
          ) {
            res.render("install", installResult);
            return;
          }

          installUsecase.save(installInput);
          res.redirect("/");
        })().catch(next);
      }
    );
  }
}
