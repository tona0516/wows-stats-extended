import Express from "express";
import { inject, injectable } from "tsyringe";
import { Logger } from "../../infrastructure/repository/Logger";
import { BattleStatusValidator } from "../input/BattleStatusValidator";
import { ErrorResponseType } from "../output/ErrorResponse";
import { BattleUsecase } from "../usecase/BattleUsecase";

@injectable()
export class BattleController {
  readonly router: Express.Router;

  constructor(
    @inject("Logger") private logger: Logger,
    @inject("BattleUsecase") private battleUsecase: BattleUsecase
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
        const start = new Date().getTime();

        // eslint-disable-next-line
        const battleStatusValidator = new BattleStatusValidator(req.body);
        if (!battleStatusValidator.isValid()) {
          throw ErrorResponseType.invalidTempArenaInfo;
        }

        (async () => {
          const detail = await this.battleUsecase.getDetail(
            // eslint-disable-next-line
            battleStatusValidator.get()!.localStatus
          );

          this.logger.debug("battleDetail", JSON.stringify(detail));

          const elapsed = new Date().getTime() - start;
          this.logger.info("elapsed time for /detail", `${elapsed}ms`);
          res.status(200).send(detail);
        })().catch(next);
      }
    );
  }
}
