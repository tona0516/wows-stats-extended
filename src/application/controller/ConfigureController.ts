import Express from "express";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../interface/ILogger";
import { GetConfigureUsecase } from "../usecase/GetConfigureUsecase";
import { PostConfigureUsecase } from "../usecase/PostConfigureUsecase";
import { ControllerInterface } from "./ControllerInterface";

@injectable()
export class ConfigureController implements ControllerInterface {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("GetConfigureUsecase")
    private getConfigureUsecase: GetConfigureUsecase,
    @inject("PostConfigureUsecase")
    private postConfigureUsecase: PostConfigureUsecase
  ) {
    this.router = Express.Router();

    this.router.get("/", (req: Express.Request, res: Express.Response) => {
      const configureResult = this.getConfigureUsecase.invoke();
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
          const configureResult = await this.postConfigureUsecase.invoke(
            req.body
          );
          if (configureResult) {
            res.render("configure", configureResult);
            return;
          }
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
