import "reflect-metadata";
import "pug";
import Express, { NextFunction, Request, Response } from "express";
import { BattleController } from "./application/controller/BattleController";
import { IndexController } from "./application/controller/IndexController";
import { ErrorResponse } from "./application/output/ErrorResponse";
import { DependencyInjection } from "./dependency_injection";
import { Logger } from "./infrastructure/repository/Logger";
import { InstallController } from "./application/controller/InstallController";

const container = DependencyInjection.getInstance().container;
const logger = container.resolve<Logger>("Logger");
const indexController = container.resolve<IndexController>("IndexController");
const installController = container.resolve<InstallController>(
  "InstallController"
);
const battleController = container.resolve<BattleController>(
  "BattleController"
);

const app: Express.Express = Express();
app.set("view engine", "pug");
app.set("views", `${__dirname}/../resource/view`);
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(Express.static(`${__dirname}/../resource/public`));
app.use("/", indexController.router);
app.use("/install", installController.router);
app.use("/battle", battleController.router);
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
  logger.info(`Start wows-stats-extected on port 3000.`);
});
