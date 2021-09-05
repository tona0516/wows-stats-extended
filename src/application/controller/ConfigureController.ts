import Express from "express";
import { inject, injectable } from "tsyringe";
import { Region } from "../../domain/Region";
import { ConfigureInputValidator } from "../input/ConfigureInputValidator";
import { ILogger } from "../interface/ILogger";
import { ConfigureResult } from "../output/ConfigureResult";
import { ConfigureUsecase } from "../usecase/ConfigureUsecase";
import { ControllerInterface } from "./ControllerInterface";

@injectable()
export class ConfigureController implements ControllerInterface {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("ConfigureUsecase") private configureUsecase: ConfigureUsecase,
    @inject("ConfigureInputValidator")
    private configureInputValidator: ConfigureInputValidator
  ) {
    this.router = Express.Router();

    this.router.get("/", (req: Express.Request, res: Express.Response) => {
      const userSetting = configureUsecase.get();
      const configureResult: ConfigureResult = {
        data: {
          appid: userSetting?.appid,
          region: userSetting?.region,
          installPath: userSetting?.installPath,
          servers: Region.getAll(),
        },
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
        (async () => {
          // eslint-disable-next-line
          const result = await configureInputValidator.validate(req.body);
          if (result.isFailure()) {
            res.render("configure", result.value);
            return;
          }

          configureUsecase.save(result.value);
          res.redirect("/");
        })().catch(next);
      }
    );
  }

  getPath(): string {
    return "/configure";
  }

  getRouter(): Express.Router {
    return this.router;
  }
}
