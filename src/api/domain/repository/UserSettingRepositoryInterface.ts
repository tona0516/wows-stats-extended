import UserSetting from "../../infrastructure/entity/UserSetting";

export default interface UserSettingRepositoryInterface {
  isExist(): boolean;
  craete(): void;
  read(): UserSetting | null;
  update(setting: UserSetting): void;
  delete(): void;
}
