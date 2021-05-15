import { inject, injectable } from "tsyringe";
import axios, { AxiosInstance } from "axios";
import LoggerInterface from "../../domain/repository/LoggerInterface";
import AccountInfo from "../entity/AccountInfo";
import RemoteStatusRepositoryInterface from "../../domain/repository/RemoteStatusRepositoryInterface";
import AccountList from "../entity/AccountList";
import ClansAccountInfo from "../entity/ClansAccountInfo";
import ClansInfo from "../entity/ClansInfo";
import EncyclopediaInfo from "../entity/EncyclopediaInfo";
import EncyclopediaShips from "../entity/EncyclopediaShips";
import ShipsStats from "../entity/ShipsStats";
import UserSetting from "../entity/UserSetting";

@injectable()
export default class WargamingRepositpory
  implements RemoteStatusRepositoryInterface {
  // TODO DI
  httpClient: AxiosInstance;

  constructor(
    @inject("Logger") private logger: LoggerInterface,
    @inject("UserSetting") private userSetting: UserSetting
  ) {
    this.logger = logger;
    this.userSetting = userSetting;
    // TODO NA server
    this.httpClient = axios.create({
      baseURL: `https://api.worldofwarships.${userSetting.region}`,
      timeout: 3000,
    });
  }

  async getAccountInfo(accountIDs: number[]): Promise<AccountInfo> {
    const response = await this.httpClient.get<AccountInfo>(
      "/wows/account/info/",
      {
        params: {
          application_id: this.userSetting.appid,
          account_id: accountIDs.join(","),
          fields: [
            "hidden_profile",
            "statistics.pvp.xp",
            "statistics.pvp.survived_battles",
            "statistics.pvp.battles",
            "statistics.pvp.frags",
            "statistics.pvp.wins",
            "statistics.pvp.damage_dealt",
          ].join(","),
        },
      }
    );
    return response.data;
  }

  async getAccountList(accountNames: string[]): Promise<AccountList> {
    const response = await this.httpClient.get<AccountList>(
      "/wows/account/list/",
      {
        params: {
          application_id: this.userSetting.appid,
          search: accountNames.join(","),
          type: "exact",
        },
      }
    );
    return response.data;
  }

  async getClansAccountInfo(accountIDs: number[]): Promise<ClansAccountInfo> {
    const response = await this.httpClient.get<ClansAccountInfo>(
      "/wows/clans/accountinfo/",
      {
        params: {
          application_id: this.userSetting.appid,
          account_id: accountIDs.join(","),
          fields: "clan_id",
        },
      }
    );
    return response.data;
  }

  async getClansInfo(clanIDs: number[]): Promise<ClansInfo> {
    const response = await this.httpClient.get<ClansInfo>("/wows/clans/info/", {
      params: {
        application_id: this.userSetting.appid,
        clan_id: clanIDs.join(","),
        fields: "tag",
      },
    });
    return response.data;
  }

  async getEncyclopediaInfo(): Promise<EncyclopediaInfo> {
    const response = await this.httpClient.get<EncyclopediaInfo>(
      "/wows/encyclopedia/info/",
      {
        params: {
          application_id: this.userSetting.appid,
          fields: "game_version",
          language: "ja",
        },
      }
    );
    return response.data;
  }

  async getEncyclopediaShips(pageNo: number): Promise<EncyclopediaShips> {
    const response = await this.httpClient.get<EncyclopediaShips>(
      "/wows/encyclopedia/ships/",
      {
        params: {
          application_id: this.userSetting.appid,
          fields: [
            "name",
            "tier",
            "type",
            "nation",
            "default_profile.concealment.detect_distance_by_ship",
          ].join(","),
          language: "ja",
          page_no: pageNo,
        },
      }
    );
    return response.data;
  }

  async getShipsStats(accountID: number): Promise<ShipsStats> {
    const response = await this.httpClient.get<ShipsStats>(
      "/wows/ships/stats/",
      {
        params: {
          application_id: this.userSetting.appid,
          account_id: accountID,
          fields: [
            "ship_id",
            "pvp.wins",
            "pvp.battles",
            "pvp.damage_dealt",
            "pvp.xp",
            "pvp.frags",
            "pvp.survived_battles",
          ].join(","),
        },
      }
    );
    return response.data;
  }
}
