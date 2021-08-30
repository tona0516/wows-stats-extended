import Express from "express";
import { inject, injectable } from "tsyringe";
import { Region } from "../../domain/Region";
import { ConfigureInputValidator } from "../input/ConfigureInputValidator";
import { ILogger } from "../interface/ILogger";
import { ConfigureResult } from "../output/ConfigureResult";
import { ErrorResponseType } from "../output/ErrorResponse";
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
        // eslint-disable-next-line
        const configureInputValidator = new ConfigureInputValidator(req.body);
        if (!configureInputValidator.isValid()) {
          throw ErrorResponseType.invalidConfigureInput;
        }

        (async () => {
          const configureResult = await configureUsecase.validate(
            // eslint-disable-next-line
            configureInputValidator.get()!
          );
          if (configureResult.errors) {
            res.render("configure", configureResult);
            return;
          }

          // eslint-disable-next-line
          configureUsecase.save(configureInputValidator.get()!);
          res.redirect("/");
        })().catch(next);
      }
    );
  }
}
