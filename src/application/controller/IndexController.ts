import Express from "express";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../interface/ILogger";
import { IndexUsecase } from "../usecase/IndexUsecase";

@injectable()
export class IndexController {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("IndexUsecase") private indexUsecase: IndexUsecase
  ) {
    this.router = Express.Router();

    this.router.get("/", (req: Express.Request, res: Express.Response) => {
      if (!indexUsecase.isConfigured()) {
        res.redirect("/configure");
        return;
      }

      res.render("index");
    });
  }
}
