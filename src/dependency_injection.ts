import {
  container,
  DependencyContainer as TsyringeDependencyContainer,
} from "tsyringe";
import { BattleUsecase } from "./application/usecase/BattleUsecase";
import { BattleController } from "./application/controller/BattleController";
import { IndexController } from "./application/controller/IndexController";
import { InstallController } from "./application/controller/InstallController";
import { StatsCalculator } from "./domain/StatsCalculator";
import { BasicShipInfoRepository } from "./infrastructure/repository/BasicShipInfoRepository";
import { CacheRepository } from "./infrastructure/repository/CacheRepository";
import { Logger } from "./infrastructure/repository/Logger";
import { NumbersRepository } from "./infrastructure/repository/NumbersRepository";
import { RadarRepository } from "./infrastructure/repository/RadarRepository";
import { TempArenaInfoRepository } from "./infrastructure/repository/TempArenaInfoRepository";
import { UserSettingRepository } from "./infrastructure/repository/UserSettingRepository";
import { WargamingRepositpory } from "./infrastructure/repository/WargamingRepository";
import { IndexUsecase } from "./application/usecase/IndexUsecase";
import { InstallUsecase } from "./application/usecase/InstallUsecase";
import { GameClientRepository } from "./infrastructure/repository/GameClientRepository";

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
    const logLevel = process.env.NODE_ENV === "release" ? "info" : "debug";

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
    container.register("InstallUsecase", { useClass: InstallUsecase });

    // controller
    container.register("BattleController", { useClass: BattleController });
    container.register("IndexController", { useClass: IndexController });
    container.register("InstallController", { useClass: InstallController });

    return container;
  }
}
