export const Types = {
  LogLevel: Symbol.for("LogLevel"),
  Logger: Symbol.for("Logger"),
  // repository
  UserSettingRepository: Symbol.for("UserSettingRepository"),
  BasicShipInfoRepository: Symbol.for("BasicShipInfoRepository"),
  NumbersRepository: Symbol.for("NumbersRepository"),
  TempArenaInfoRepository: Symbol.for("TempArenaInfoRepository"),
  WargamingRepository: Symbol.for("WargamingRepository"),
  GameClientRepository: Symbol.for("GameClientRepository"),
  UnregisteredShipRepository: Symbol.for("UnregisteredShipRepository"),
  // validator
  BattleStatusValidator: Symbol.for("BattleStatusValidator"),
  ConfigureInputValidator: Symbol.for("ConfigureInputValidator"),
  // usecase
  GetBattleDetailUsecase: Symbol.for("GetBattleDetailUsecase"),
  GetBattleStatusUsecase: Symbol.for("GetBattleStatusUsecase"),
  IndexUsecase: Symbol.for("IndexUsecase"),
  GetConfigureUsecase: Symbol.for("GetConfigureUsecase"),
  PostConfigureUsecase: Symbol.for("PostConfigureUsecase"),
  // controller
  BattleController: Symbol.for("BattleController"),
  IndexController: Symbol.for("IndexController"),
  ConfigureController: Symbol.for("ConfigureController"),
};
