import {
  container,
  DependencyContainer as TsyringeDependencyContainer,
} from "tsyringe";
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
import { PersistRepository } from "./infrastructure/repository/PersistRepository";
import { TempArenaInfoRepository } from "./infrastructure/repository/TempArenaInfoRepository";
import { UserSettingRepository } from "./infrastructure/repository/UserSettingRepository";
import { WargamingRepositpory } from "./infrastructure/repository/WargamingRepository";

export class DependencyInjection {
  private static instance: DependencyInjection;
  container: TsyringeDependencyContainer;

  private constructor() {
    this.container = this.init();
  }

  static getInstance(): DependencyInjection {
    if (!this.instance) {
      this.instance = new DependencyInjection();
    }

    return this.instance;
  }

  private init(): TsyringeDependencyContainer {
    const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

    container.register("LogLevel", { useValue: logLevel });
    container.register("Logger", { useClass: Logger });

    // repository
    container.register("UserSettingRepository", {
      useClass: UserSettingRepository,
    });
    container.register("PersistRepository", { useClass: PersistRepository });
    container.register("BasicShipInfoRepository", {
      useClass: BasicShipInfoRepository,
    });
    container.register("NumbersRepository", { useClass: NumbersRepository });
    container.register("TempArenaInfoRepository", {
      useClass: TempArenaInfoRepository,
    });
    container.register("WargamingRepository", {
      useClass: WargamingRepositpory,
    });
    container.register("GameClientRepository", {
      useClass: GameClientRepository,
    });

    // validator
    container.register("BattleStatusValidator", {
      useClass: BattleStatusValidator,
    });
    container.register("ConfigureInputValidator", {
      useClass: ConfigureInputValidator,
    });

    // usecase
    container.register("GetBattleDetailUsecase", {
      useClass: GetBattleDetailUsecase,
    });
    container.register("GetBattleStatusUsecase", {
      useClass: GetBattleStatusUsecase,
    });
    container.register("IndexUsecase", { useClass: IndexUsecase });
    container.register("GetConfigureUsecase", {
      useClass: GetConfigureUsecase,
    });
    container.register("PostConfigureUsecase", {
      useClass: PostConfigureUsecase,
    });

    // controller
    container.register("BattleController", { useClass: BattleController });
    container.register("IndexController", { useClass: IndexController });
    container.register("ConfigureController", {
      useClass: ConfigureController,
    });

    return container;
  }
}
