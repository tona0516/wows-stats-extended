import AccountInfo from "../../infrastructure/entity/AccountInfo";
import AccountList from "../../infrastructure/entity/AccountList";
import ClansAccountInfo from "../../infrastructure/entity/ClansAccountInfo";
import ClansInfo from "../../infrastructure/entity/ClansInfo";
import EncyclopediaInfo from "../../infrastructure/entity/EncyclopediaInfo";
import EncyclopediaShips from "../../infrastructure/entity/EncyclopediaShips";
import ShipsStats from "../../infrastructure/entity/ShipsStats";

export default interface RemoteStatusRepositoryInterface {
  getAccountInfo(accountIDs: number[]): Promise<AccountInfo>;
  getAccountList(accountNames: string[]): Promise<AccountList>;
  getClansAccountInfo(accountIDs: number[]): Promise<ClansAccountInfo>;
  getClansInfo(clanIDs: number[]): Promise<ClansInfo>;
  getEncyclopediaInfo(): Promise<EncyclopediaInfo>;
  getEncyclopediaShips(pageNo: number): Promise<EncyclopediaShips>;
  getShipsStats(accountID: number): Promise<ShipsStats>;
}
