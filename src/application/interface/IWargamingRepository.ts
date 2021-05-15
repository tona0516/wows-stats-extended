import { AccountInfo } from "../../infrastructure/output/AccountInfo";
import { AccountList } from "../../infrastructure/output/AccountList";
import { ClansAccountInfo } from "../../infrastructure/output/ClansAccountInfo";
import { ClansInfo } from "../../infrastructure/output/ClansInfo";
import { EncyclopediaInfo } from "../../infrastructure/output/EncyclopediaInfo";
import { EncyclopediaShips } from "../../infrastructure/output/EncyclopediaShips";
import { ShipsStats } from "../../infrastructure/output/ShipsStats";

export interface IWargamingRepository {
  test(region: string, appid: string): Promise<boolean>;
  getAccountInfo(accountIDs: number[]): Promise<AccountInfo>;
  getAccountList(accountNames: string[]): Promise<AccountList>;
  getClansAccountInfo(accountIDs: number[]): Promise<ClansAccountInfo>;
  getClansInfo(clanIDs: number[]): Promise<ClansInfo>;
  getEncyclopediaInfo(): Promise<EncyclopediaInfo>;
  getEncyclopediaShips(pageNo: number): Promise<EncyclopediaShips>;
  getShipsStats(accountID: number): Promise<ShipsStats>;
}
