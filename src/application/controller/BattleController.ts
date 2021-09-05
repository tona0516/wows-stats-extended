import Express from "express";
import { inject, injectable } from "tsyringe";
import { Logger } from "../../infrastructure/repository/Logger";
import { BattleStatusValidator } from "../input/BattleStatusValidator";
import { BattleUsecase } from "../usecase/BattleUsecase";
import { ControllerInterface } from "./ControllerInterface";

@injectable()
export class BattleController implements ControllerInterface {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: Logger,
    @inject("BattleUsecase") private battleUsecase: BattleUsecase,
    @inject("BattleStatusValidator")
    private battleStatusValidator: BattleStatusValidator
  ) {
    this.router = Express.Router();

    this.router.get(
      "/status",
      (req: Express.Request, res: Express.Response) => {
        const status = this.battleUsecase.getStatus();
        if (!status) {
          res.status(204).send();
          return;
        }
        res.status(200).send(status);
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

          // eslint-disable-next-line
          const result = await battleStatusValidator.validate(req.body);
          if (result.isFailure()) {
            throw result.value;
          }

          const detail = await this.battleUsecase.getDetail(
            result.value.localStatus
          );

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
