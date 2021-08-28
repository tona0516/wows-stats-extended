import {
  container,
  DependencyContainer as TsyringeDependencyContainer,
} from "tsyringe";
import { BattleController } from "./application/controller/BattleController";
import { ConfigureController } from "./application/controller/ConfigureController";
import { IndexController } from "./application/controller/IndexController";
import { BattleUsecase } from "./application/usecase/BattleUsecase";
import { ConfigureUsecase } from "./application/usecase/ConfigureUsecase";
import { IndexUsecase } from "./application/usecase/IndexUsecase";
import { StatsCalculator } from "./domain/StatsCalculator";
import { BasicShipInfoRepository } from "./infrastructure/repository/BasicShipInfoRepository";
import { CacheRepository } from "./infrastructure/repository/CacheRepository";
import { GameClientRepository } from "./infrastructure/repository/GameClientRepository";
import { Logger } from "./infrastructure/repository/Logger";
import { NumbersRepository } from "./infrastructure/repository/NumbersRepository";
import { RadarRepository } from "./infrastructure/repository/RadarRepository";
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
    const logLevel =
      process.env.NODE_ENV === "production" ? "info" : "debug";

    container.register("LogLevel", { useValue: logLevel });
    container.register("Logger", { useClass: Logger });

    // domain
    container.register("StatsCalculator", { useClass: StatsCalculator });

    // repository
    container.register("UserSettingRepository", {
      useClass: UserSettingRepository,
    });
    container.register("CacheRepository", { useClass: CacheRepository });
    container.register("BasicShipInfoRepository", {
      useClass: BasicShipInfoRepository,
    });
    container.register("RadarRepository", { useClass: RadarRepository });
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

    // usecase
    container.register("BattleUsecase", { useClass: BattleUsecase });
    container.register("IndexUsecase", { useClass: IndexUsecase });
    container.register("ConfigureUsecase", { useClass: ConfigureUsecase });

    // controller
    container.register("BattleController", { useClass: BattleController });
    container.register("IndexController", { useClass: IndexController });
    container.register("ConfigureController", {
      useClass: ConfigureController,
    });

    return container;
  }
}
