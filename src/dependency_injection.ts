import { Container } from "inversify";
import { BattleController } from "./application/controller/BattleController";
import { ConfigureController } from "./application/controller/ConfigureController";
import { IndexController } from "./application/controller/IndexController";
import { BattleStatusValidator } from "./application/input/BattleStatusValidator";
import { ConfigureInputValidator } from "./application/input/ConfigureInputValidator";
import { GetBattleDetailUsecase } from "./application/usecase/GetBattleDetailUsecase";
import { GetBattleStatusUsecase } from "./application/usecase/GetBattleStatusUsecase";
import { GetConfigureUsecase } from "./application/usecase/GetConfigureUsecase";
import { IndexUsecase } from "./application/usecase/IndexUsecase";
import { PostConfigureUsecase } from "./application/usecase/PostConfigureUsecase";
import { BasicShipInfoRepository } from "./infrastructure/repository/BasicShipInfoRepository";
import { GameClientRepository } from "./infrastructure/repository/GameClientRepository";
import { Logger } from "./infrastructure/repository/Logger";
import { NumbersRepository } from "./infrastructure/repository/NumbersRepository";
import { TempArenaInfoRepository } from "./infrastructure/repository/TempArenaInfoRepository";
import { UnregisteredShipRepository } from "./infrastructure/repository/UnregisteredShipRepository";
import { UserSettingRepository } from "./infrastructure/repository/UserSettingRepository";
import { WargamingRepositpory } from "./infrastructure/repository/WargamingRepository";
import { Types } from "./types";

export class DependencyInjection {
  private static instance: DependencyInjection;
  container: Container;

  private constructor() {
    this.container = this.init();
  }

  static getInstance(): DependencyInjection {
    if (!this.instance) {
      this.instance = new DependencyInjection();
    }

    return this.instance;
  }

  private init(): Container {
    const container = new Container();
    const logLevel = process.env.NODE_ENV === "development" ? "debug" : "info";

    container.bind<string>(Types.LogLevel).toConstantValue(logLevel);
    container.bind<Logger>(Types.Logger).to(Logger).inSingletonScope();

    // repository
    container
      .bind<UserSettingRepository>(Types.UserSettingRepository)
      .to(UserSettingRepository);
    container
      .bind<BasicShipInfoRepository>(Types.BasicShipInfoRepository)
      .to(BasicShipInfoRepository);
    container
      .bind<NumbersRepository>(Types.NumbersRepository)
      .to(NumbersRepository);
    container
      .bind<TempArenaInfoRepository>(Types.TempArenaInfoRepository)
      .to(TempArenaInfoRepository);
    container
      .bind<WargamingRepositpory>(Types.WargamingRepository)
      .to(WargamingRepositpory);
    container
      .bind<GameClientRepository>(Types.GameClientRepository)
      .to(GameClientRepository);
    container
      .bind<UnregisteredShipRepository>(Types.UnregisteredShipRepository)
      .to(UnregisteredShipRepository);

    // validator1
    container
      .bind<BattleStatusValidator>(Types.BattleStatusValidator)
      .to(BattleStatusValidator);
    container
      .bind<ConfigureInputValidator>(Types.ConfigureInputValidator)
      .to(ConfigureInputValidator);

    // usecase
    container
      .bind<GetBattleDetailUsecase>(Types.GetBattleDetailUsecase)
      .to(GetBattleDetailUsecase);
    container
      .bind<GetBattleStatusUsecase>(Types.GetBattleStatusUsecase)
      .to(GetBattleStatusUsecase);
    container.bind<IndexUsecase>(Types.IndexUsecase).to(IndexUsecase);
    container
      .bind<GetConfigureUsecase>(Types.GetConfigureUsecase)
      .to(GetConfigureUsecase);
    container
      .bind<PostConfigureUsecase>(Types.PostConfigureUsecase)
      .to(PostConfigureUsecase);

    // controller
    container
      .bind<BattleController>(Types.BattleController)
      .to(BattleController);
    container.bind<IndexController>(Types.IndexController).to(IndexController);
    container
      .bind<ConfigureController>(Types.ConfigureController)
      .to(ConfigureController);

    return container;
  }
}
