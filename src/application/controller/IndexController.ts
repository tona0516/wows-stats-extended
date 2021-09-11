import Express from "express";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../interface/ILogger";
import { IndexUsecase } from "../usecase/IndexUsecase";
import { ControllerInterface } from "./ControllerInterface";

@injectable()
export class IndexController implements ControllerInterface {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("IndexUsecase") private indexUsecase: IndexUsecase
  ) {
    this.router = Express.Router();

    this.router.get("/", (req: Express.Request, res: Express.Response) => {
      const isConfigured = this.indexUsecase.invoke();
      if (isConfigured) {
        res.render("index");
        return;
      }

      res.redirect("/configure");
    });
  }

  getPath(): string {
    return "/";
  }

  getRouter(): Express.Router {
    return this.router;
  }
}
