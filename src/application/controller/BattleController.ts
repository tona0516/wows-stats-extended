import Express from "express";
import { inject, injectable } from "tsyringe";
import { Logger } from "../../infrastructure/repository/Logger";
import { GetBattleDetailUsecase } from "../usecase/GetBattleDetailUsecase";
import { GetBattleStatusUsecase } from "../usecase/GetBattleStatusUsecase";
import { ControllerInterface } from "./ControllerInterface";

@injectable()
export class BattleController implements ControllerInterface {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: Logger,
    @inject("GetBattleDetailUsecase")
    private getBattleDetailUsecase: GetBattleDetailUsecase,
    @inject("GetBattleStatusUsecase")
    private getBattleStatusUsecase: GetBattleStatusUsecase
  ) {
    this.router = Express.Router();

    this.router.get(
      "/status",
      (req: Express.Request, res: Express.Response) => {
        const status = this.getBattleStatusUsecase.invoke();
        if (status) {
          res.status(200).send(status);
          return;
        }

        res.status(204).send();
      }
    );

    this.router.post(
      "/detail",
      (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
      ) => {
        (async () => {
          const start = new Date().getTime();

          const detail = await this.getBattleDetailUsecase.invoke(req.body);

          this.logger.debug("battleDetail", JSON.stringify(detail));

          const elapsed = new Date().getTime() - start;
          this.logger.info("elapsed time for /detail", `${elapsed}ms`);
          res.status(200).send(detail);
        })().catch(next);
      }
    );
  }

  getPath(): string {
    return "/battle";
  }

  getRouter(): Express.Router {
    return this.router;
  }
}
