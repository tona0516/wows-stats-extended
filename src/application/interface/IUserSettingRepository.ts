import { UserSetting } from "../../infrastructure/output/UserSetting";

export interface IUserSettingRepository {
  isExist(): boolean;
  read(): UserSetting | null;
  write(setting: UserSetting): void;
  delete(): void;
}
