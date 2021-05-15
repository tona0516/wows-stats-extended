import "reflect-metadata";
import Express, { NextFunction, Request, Response } from "express";
import ResponseTime from "response-time";
import UserSetting from "./api/infrastructure/entity/UserSetting";
import Logger from "./api/infrastructure/repository/Logger";
import DependencyInjection from "./dependency_injection";
import ErrorResponse from "./api/domain/model/ErrorResponse";
import { router as BattleRouter } from "./api/application/router/BattleRouter";

const container = DependencyInjection.getInstance().container;
const logger = container.resolve<Logger>("Logger");
const userSetting = container.resolve<UserSetting>("UserSetting");
const responseTime = ResponseTime(
  (request: Express.Request, response: Express.Response, time: number) => {
    if (request.originalUrl == "/battle/detail") {
      logger.info(request.method, request.originalUrl, `${time.toFixed(0)}ms`);
    } else {
      logger.debug(request.method, request.originalUrl, `${time.toFixed(0)}ms`);
    }
  }
);

const app: Express.Express = Express();
app.set("view engine", "pug");
app.set("views", `${__dirname}/fe/views`);
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(Express.static(`${__dirname}/fe/public`));
app.use(responseTime);
app.use("/battle", BattleRouter);
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);

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

app.get("/", (req: Express.Request, res: Express.Response) => {
  res.render("index", { title: "wows-stat-extended" });
});

app.listen(userSetting.port, () => {
  // TODO need to fix index.js
  logger.info(`Start wows-stats-extected on port ${userSetting.port}.`);
});
