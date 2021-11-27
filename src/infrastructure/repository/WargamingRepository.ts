import axios, { AxiosInstance } from "axios";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../../application/interface/ILogger";
import { IUserSettingRepository } from "../../application/interface/IUserSettingRepository";
import { IWargamingRepository } from "../../application/interface/IWargamingRepository";
import { ErrorResponseType } from "../../application/output/ErrorResponse";
import { AccountInfo } from "../output/AccountInfo";
import { AccountList } from "../output/AccountList";
import { ClansAccountInfo } from "../output/ClansAccountInfo";
import { ClansInfo } from "../output/ClansInfo";
import { EncyclopediaInfo } from "../output/EncyclopediaInfo";
import { EncyclopediaShips } from "../output/EncyclopediaShips";
import { ShipsStats } from "../output/ShipsStats";

@injectable()
export class WargamingRepositpory implements IWargamingRepository {
  httpClient: AxiosInstance;

  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository
  ) {
    this.httpClient = axios.create({
      timeout: 5000,
      headers: {
        Connection: "Keep-Alive",
      },
    });
  }

  async test(region: string, appid: string): Promise<boolean> {
    const httpClient = axios.create({
      baseURL: this.toBaseUrl(region),
    });
    const response = await httpClient.get<EncyclopediaInfo>(
      "/wows/encyclopedia/info/",
      {
        params: {
          application_id: appid,
          fields: "game_version",
          language: "en",
        },
      }
    );

    return response.data.status === "ok";
  }

  async getAccountInfo(accountIDs: number[]): Promise<AccountInfo> {
    this.setBaseURL();
    const response = await this.httpClient.get<AccountInfo>(
      "/wows/account/info/",
      {
        params: {
          application_id: this.getAppid(),
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
    this.setBaseURL();
    const response = await this.httpClient.get<AccountList>(
      "/wows/account/list/",
      {
        params: {
          application_id: this.getAppid(),
          field: "account_id",
          search: accountNames.join(","),
          type: "exact",
        },
      }
    );
    return response.data;
  }

  async getClansAccountInfo(accountIDs: number[]): Promise<ClansAccountInfo> {
    this.setBaseURL();
    const response = await this.httpClient.get<ClansAccountInfo>(
      "/wows/clans/accountinfo/",
      {
        params: {
          application_id: this.getAppid(),
          account_id: accountIDs.join(","),
          fields: "clan_id",
        },
      }
    );
    return response.data;
  }

  async getClansInfo(clanIDs: number[]): Promise<ClansInfo> {
    this.setBaseURL();
    const response = await this.httpClient.get<ClansInfo>("/wows/clans/info/", {
      params: {
        application_id: this.getAppid(),
        clan_id: clanIDs.join(","),
        fields: "tag",
      },
    });
    return response.data;
  }

  async getEncyclopediaInfo(): Promise<EncyclopediaInfo> {
    this.setBaseURL();
    const response = await this.httpClient.get<EncyclopediaInfo>(
      "/wows/encyclopedia/info/",
      {
        params: {
          application_id: this.getAppid(),
          fields: "game_version",
          language: "en",
        },
      }
    );
    return response.data;
  }

  async getEncyclopediaShips(pageNo: number): Promise<EncyclopediaShips> {
    this.setBaseURL();
    const response = await this.httpClient.get<EncyclopediaShips>(
      "/wows/encyclopedia/ships/",
      {
        params: {
          application_id: this.getAppid(),
          fields: [
            "name",
            "tier",
            "type",
            "nation",
            "default_profile.concealment.detect_distance_by_ship",
          ].join(","),
          language: "en",
          page_no: pageNo,
        },
      }
    );
    return response.data;
  }

  async getShipsStats(accountID: number): Promise<ShipsStats> {
    this.setBaseURL();
    const response = await this.httpClient.get<ShipsStats>(
      "/wows/ships/stats/",
      {
        params: {
          application_id: this.getAppid(),
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

  private toBaseUrl(region: string): string {
    const domain: string = region === "na" ? "com" : region;
    return `https://api.worldofwarships.${domain}`;
  }

  private setBaseURL() {
    const userSetting = this.userSettingRepository.read();
    const region = userSetting?.region;
    if (!region) {
      throw ErrorResponseType.notFoundRegion;
    }

    this.httpClient.defaults.baseURL = this.toBaseUrl(region);
  }

  private getAppid(): string {
    const userSetting = this.userSettingRepository.read();
    const appid = userSetting?.appid;
    if (!appid) {
      throw ErrorResponseType.notFoundAppid;
    }

    return appid;
  }
}
