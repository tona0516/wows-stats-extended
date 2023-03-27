import Express from "express";
import { inject, injectable } from "inversify";
import { Logger } from "../../infrastructure/repository/Logger";
import { Types } from "../../types";
import { GetBattleDetailUsecase } from "../usecase/GetBattleDetailUsecase";
import { GetBattleStatusUsecase } from "../usecase/GetBattleStatusUsecase";
import { ControllerInterface } from "./ControllerInterface";

@injectable()
export class BattleController implements ControllerInterface {
  readonly router: Express.Router;

  constructor(
    @inject(Types.Logger) private logger: Logger,
    @inject(Types.GetBattleDetailUsecase)
    private getBattleDetailUsecase: GetBattleDetailUsecase,
    @inject(Types.GetBattleStatusUsecase)
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
