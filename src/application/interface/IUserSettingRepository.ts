import { UserSetting } from "../../infrastructure/output/UserSetting";

export interface IUserSettingRepository {
  isExist(): boolean;
  read(): UserSetting | undefined;
  write(setting: UserSetting): void;
}
