import Express from "express";
import { inject, injectable } from "inversify";
import { Logger } from "../../infrastructure/repository/Logger";
import { Types } from "../../types";
import { GetConfigureUsecase } from "../usecase/GetConfigureUsecase";
import { PostConfigureUsecase } from "../usecase/PostConfigureUsecase";
import { ControllerInterface } from "./ControllerInterface";

@injectable()
export class ConfigureController implements ControllerInterface {
  readonly router: Express.Router;

  constructor(
    @inject(Types.Logger) private logger: Logger,
    @inject(Types.GetConfigureUsecase)
    private getConfigureUsecase: GetConfigureUsecase,
    @inject(Types.PostConfigureUsecase)
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
