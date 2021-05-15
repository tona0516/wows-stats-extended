import {
  container,
  DependencyContainer as TsyringeDependencyContainer,
} from "tsyringe";
import UserSettingRepositoryInterface from "./api/domain/repository/UserSettingRepositoryInterface";
import BattleUsecase from "./api/domain/usecase/BattleUsecase";
import BasicShipInfoRepository from "./api/infrastructure/repository/BasicShipInfoRepository";
import Logger from "./api/infrastructure/repository/Logger";
import RadarRepository from "./api/infrastructure/repository/RadarRepository";
import TempArenaInfoRepositoy from "./api/infrastructure/repository/TempArenaInfoRepository";
import UserSettingRepository from "./api/infrastructure/repository/UserSettingRepository";
import WargamingRepositpory from "./api/infrastructure/repository/WargamingRepository";

export default class DependencyInjection {
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
    const userSettingRepository: UserSettingRepositoryInterface = new UserSettingRepository();
    if (!userSettingRepository.isExist()) {
      userSettingRepository.craete();
    }

    const userSetting = userSettingRepository.read();
    if (!userSetting) {
      throw new Error("Invalid user setting.");
    }

    const logLevel = process.env.NODE_ENV === "release" ? "info" : "debug";

    container.register("UserSetting", { useValue: userSetting });
    container.register("LogLevel", { useValue: logLevel });
    container.register("Logger", { useClass: Logger });
    container.register("BasicShipInfoRepository", {
      useClass: BasicShipInfoRepository,
    });
    container.register("RadarRepository", { useClass: RadarRepository });
    container.register("TempArenaInfoRepositoy", {
      useClass: TempArenaInfoRepositoy,
    });
    container.register("WargamingRepositpory", {
      useClass: WargamingRepositpory,
    });
    container.register("BattleUsecase", { useClass: BattleUsecase });

    return container;
  }
}
