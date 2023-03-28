import "reflect-metadata";
import "pug";
import * as path from "path";
import Express, { NextFunction, Request, Response } from "express";
import { BattleController } from "./application/controller/BattleController";
import { ConfigureController } from "./application/controller/ConfigureController";
import { ControllerInterface } from "./application/controller/ControllerInterface";
import { IndexController } from "./application/controller/IndexController";
import { ErrorResponse } from "./application/output/ErrorResponse";
import { DependencyInjection } from "./dependency_injection";
import { Logger } from "./infrastructure/repository/Logger";
import { Types } from "./types";

const container = DependencyInjection.getInstance().container;
const logger = container.get<Logger>(Types.Logger);

const app: Express.Express = Express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../resource/view"));
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(Express.static(path.join(__dirname, "../resource/public")));

const controllers: ControllerInterface[] = [
  container.get<IndexController>(Types.IndexController),
  container.get<ConfigureController>(Types.ConfigureController),
  container.get<BattleController>(Types.BattleController),
];
controllers.forEach((it) => {
  app.use(it.getPath(), it.getRouter());
});

// eslint-disable-next-line
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(JSON.stringify(err));

  if (err instanceof ErrorResponse) {
    return res.status(err.statusCode).send(err.toJSON());
  }

  return res.status(500).send({
    error: {
      name: "UNHANDLED_ERROR",
      message: err.message,
    },
  });
});

app.listen(3000, () => {
  logger.info(`wows-stats-extended started. Access to http://localhost:3000.`);
});
