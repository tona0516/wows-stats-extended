import Express from "express";
import BattleState from "../../domain/model/BattleState";
import BattleUsecase from "../../domain/usecase/BattleUsecase";
import DependencyInjection from "../../../dependency_injection";
import { ErrorResponseType } from "../../domain/model/ErrorResponse";

export const router = Express.Router();
const battleUsecase = DependencyInjection.getInstance().container.resolve<BattleUsecase>(
  "BattleUsecase"
);

router.get("/status", (req: Express.Request, res: Express.Response) => {
  const status = battleUsecase.getStatus();
  res.status(200).send(status);
});

router.post(
  "/detail",
  (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    // TODO separate validation logic
    const isBattleState = (body: any): body is BattleState => {
      try {
        body as BattleState;
        return true;
      } catch {
        return false;
      }
    };

    if (!isBattleState(req.body)) {
      throw ErrorResponseType.invalidTempArenaInfo;
    }

    const battleState = req.body;
    if (!battleState.encodedTempArenaInfo) {
      throw ErrorResponseType.invalidTempArenaInfo;
    }

    (async () => {
      const detail = await battleUsecase.getDetail(
        battleState.encodedTempArenaInfo
      );
      res.status(200).send(detail);
    })().catch(next);
  }
);
