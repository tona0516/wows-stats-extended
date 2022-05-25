import { Buffer } from "buffer";
import async from "async";
import { inject, injectable } from "tsyringe";
import "../../common/util.extensions";
import { NumbersURLGenerator } from "../../domain/NumbersURLGenerator";
import { PlayerInfo, ShipInfo, Player } from "../../domain/Player";
import { StatsCalculator } from "../../domain/StatsCalculator";
import { Submarines } from "../../domain/Submarines";
import { AccountInfo } from "../../infrastructure/output/AccountInfo";
import { AccountList } from "../../infrastructure/output/AccountList";
import { BasicShipInfo } from "../../infrastructure/output/BasicShipInfo";
import { ExpectedStats } from "../../infrastructure/output/ExpectedStats";
import { ShipsStats } from "../../infrastructure/output/ShipsStats";
import { TempArenaInfo } from "../../infrastructure/output/TempArenaInfo";
import { UserSetting } from "../../infrastructure/output/UserSetting";
import { BattleStatusValidator } from "../input/BattleStatusValidator";
import { IBasicShipInfoRepository } from "../interface/IBasicShipInfoRepository";
import { ILogger } from "../interface/ILogger";
import { INumbersRepository } from "../interface/INumbersRepository";
import { IUserSettingRepository } from "../interface/IUserSettingRepository";
import { IWargamingRepository } from "../interface/IWargamingRepository";
import { BattleDetail, FormattedPlayer, Team } from "../output/BattleDetail";

@injectable()
export class GetBattleDetailUsecase {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("WargamingRepository")
    private wargamingRepository: IWargamingRepository,
    @inject("BasicShipInfoRepository")
    private basicShipInfoRepository: IBasicShipInfoRepository,
    @inject("NumbersRepository")
    private numbersRepository: INumbersRepository,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository,
    @inject("BattleStatusValidator")
    private battleStatusValidator: BattleStatusValidator
  ) {}

  private static getMaxParallels(): number {
    return 5;
  }

  // eslint-disable-next-line
  async invoke(body: any): Promise<BattleDetail> {
    const result = await this.battleStatusValidator.validate(body);
    if (result.isFailure()) {
      throw result.value;
    }

    const tempArenaInfo = JSON.parse(
      Buffer.from(result.value.localStatus, "base64").toString()
    ) as TempArenaInfo;
    this.logger.debug("tempArenaInfo", JSON.stringify(tempArenaInfo));

    const fetchedData = await this.fetch(tempArenaInfo);

    return this.makeBattleDetail(tempArenaInfo, fetchedData);
  }

  private async fetch(tempArenaInfo: TempArenaInfo): Promise<FetchedData> {
    const accounts = await this.fetchAccount(tempArenaInfo);
    const accountIDs = accounts.accountIDs;
    const accountList = accounts.accountList;

    const accountInfoPromise =
      this.wargamingRepository.getAccountInfo(accountIDs);
    const shipsStatsPromise = this.fetchShipsStats(accountIDs);
    const clansTagMapPromise = this.fetchClanTagMap(accountIDs);
    const nonStatsDataPromise = this.fetchNonStatsData();

    const [accountInfo, clanTagMap, shipsStatsMap, nonStatsData] =
      await Promise.all([
        accountInfoPromise,
        clansTagMapPromise,
        shipsStatsPromise,
        nonStatsDataPromise,
      ]);

    const userSetting = this.userSettingRepository.read();

    return {
      accountInfo: accountInfo,
      accountList: accountList,
      clanTagMap: clanTagMap,
      basicShipInfoMap: nonStatsData.basicShipInfo,
      shipsStatsMap: shipsStatsMap,
      expectedStats: nonStatsData.expectedStats,
      userSetting: userSetting,
    };
  }

  private async fetchAccount(tempArenaInfo: TempArenaInfo): Promise<{
    accountIDs: number[];
    accountList: AccountList;
  }> {
    const accountNames = tempArenaInfo.vehicles
      .filter((it) => {
        return !it.name.startsWith(":") && !it.name.endsWith(":") && it.id > 0;
      })
      .map((it) => {
        return it.name;
      });
    this.logger.debug("accountNames", JSON.stringify(accountNames));

    const accountList = await this.wargamingRepository.getAccountList(
      accountNames
    );
    this.logger.debug("accountList", JSON.stringify(accountList));

    const accountIDs = accountList.data.map((it) => it.account_id);
    this.logger.debug("accountIDs", JSON.stringify(accountIDs));

    return {
      accountIDs,
      accountList,
    };
  }

  private async fetchClanTagMap(
    accountIDs: number[]
  ): Promise<{ [accountId: number]: string }> {
    const clansAccountInfo = await this.wargamingRepository.getClansAccountInfo(
      accountIDs
    );
    this.logger.debug("clansAccountInfo", JSON.stringify(clansAccountInfo));

    const clanIDs = Object.values(clansAccountInfo.data)
      .filter((it): it is NonNullable<typeof it> => it != null)
      .map((it) => it.clan_id)
      .filter((it): it is NonNullable<typeof it> => it != null);
    this.logger.debug("clanIDs", JSON.stringify(clanIDs));

    const clansInfo = await this.wargamingRepository.getClansInfo(clanIDs);

    const clanTagMap: { [accountId: number]: string } = [];
    accountIDs.forEach((it) => {
      const clanID = clansAccountInfo.data[it]?.clan_id;
      const clanTag = clanID ? clansInfo.data[clanID]?.tag : undefined;
      if (clanTag) {
        clanTagMap[it] = clanTag;
      }
    });

    return clanTagMap;
  }

  private async fetchNonStatsData(): Promise<{
    basicShipInfo: { [shipID: number]: BasicShipInfo };
    expectedStats: ExpectedStats;
  }> {
    const encyclopediaInfo =
      await this.wargamingRepository.getEncyclopediaInfo();
    this.logger.debug("encyclopediaInfo", JSON.stringify(encyclopediaInfo));

    const gameVersion = encyclopediaInfo.data.game_version;
    this.logger.debug("gameVersion", JSON.stringify(gameVersion));

    const getBasicShipInfoPromise = this.getBasicShipInfo(gameVersion);
    const getExpectedStatsPromise = this.getExpectedStats(gameVersion);

    const [basicShipInfo, expectedStats] = await Promise.all([
      getBasicShipInfoPromise,
      getExpectedStatsPromise,
    ]);

    // workaround: No submarines information in API. No submarines details, no games played with submarines
    const submarineBasicShipInfo = Submarines.getShipInfo();
    for (const key in submarineBasicShipInfo) {
      basicShipInfo[key] = submarineBasicShipInfo[key];
    }

    return {
      basicShipInfo,
      expectedStats,
    };
  }

  private async getBasicShipInfo(
    gameVersion: string
  ): Promise<{ [shipID: number]: BasicShipInfo }> {
    const basicShipInfo = await this.basicShipInfoRepository.get(gameVersion);
    await this.basicShipInfoRepository.set(basicShipInfo, gameVersion);
    await this.basicShipInfoRepository.deleteOld();
    this.logger.debug("basicShipInfo", JSON.stringify(basicShipInfo));

    return basicShipInfo;
  }

  private async getExpectedStats(gameVersion: string): Promise<ExpectedStats> {
    const expectedStats = await this.numbersRepository.get(gameVersion);
    await this.numbersRepository.set(expectedStats, gameVersion);
    await this.numbersRepository.deleteOld();
    this.logger.debug("expectedStats", JSON.stringify(expectedStats));

    return expectedStats;
  }

  private makeBattleDetail(
    tempArenaInfo: TempArenaInfo,
    fetchedData: FetchedData
  ): BattleDetail {
    const friends: Player[] = [];
    const enemies: Player[] = [];
    const statsCalculator = new StatsCalculator();

    tempArenaInfo.vehicles.forEach((it) => {
      this.logger.debug("vehicles", JSON.stringify(it));

      const [nickname, shipID, relation] = [it.name, it.shipId, it.relation];
      const shipInfo = fetchedData.basicShipInfoMap[shipID];

      this.logger.debug("shipInfo", JSON.stringify(shipInfo));

      const modifiedShipInfo: ShipInfo = ((): ShipInfo => {
        if (!shipInfo) {
          return {};
        }

        return {
          name: shipInfo.name,
          nation: shipInfo.nation,
          tier: shipInfo.tier,
          type: shipInfo.type,
          statsURL: NumbersURLGenerator.genetateShipPageURL(
            fetchedData.userSetting?.region,
            shipID.toString(),
            shipInfo.name
          ),
        };
      })();

      this.logger.debug("modifiedShipInfo", JSON.stringify(modifiedShipInfo));

      const accountID = fetchedData.accountList.data.find(
        (it) => it.nickname === nickname
      )?.account_id;

      const user: Player = ((): Player => {
        if (!accountID) {
          return {
            shipInfo: modifiedShipInfo,
            shipStats: {},
            playerInfo: {
              name: nickname,
            },
            playerStats: {},
          };
        }

        const modifiedPlayerInfo: PlayerInfo = {
          name: nickname,
          clan: fetchedData.clanTagMap[accountID],
          isHidden: fetchedData.accountInfo.data[accountID]?.hidden_profile,
          statsURL: NumbersURLGenerator.genetatePlayerPageURL(
            fetchedData.userSetting?.region,
            accountID.toString(),
            nickname
          ),
        };

        const shipsStatsForPlayer =
          fetchedData.shipsStatsMap[accountID].data[accountID];

        const shipsStatsForPlayerUsed = shipsStatsForPlayer?.find(
          (it) => it.ship_id === shipID
        );
        const modifiedShipStats = statsCalculator.calculateShipStats(
          shipInfo,
          fetchedData.expectedStats.data[shipID],
          shipsStatsForPlayerUsed?.pvp
        );
        const averageTier = statsCalculator.calculateAverageTier(
          fetchedData.basicShipInfoMap,
          shipsStatsForPlayer
        );
        const pvpByPlayer =
          fetchedData.accountInfo.data[accountID]?.statistics?.pvp;
        const modifiedPlayerStats = statsCalculator.calculatePlayerStats(
          averageTier,
          pvpByPlayer
        );

        return {
          shipInfo: modifiedShipInfo,
          shipStats: modifiedShipStats,
          playerInfo: modifiedPlayerInfo,
          playerStats: modifiedPlayerStats,
        };
      })();

      this.logger.debug("modifiedUser", JSON.stringify(user));

      relation == 0 || relation == 1 ? friends.push(user) : enemies.push(user);
    });

    const teams: Team[] = [];
    teams.push({
      users: this.sorted(friends).map((it) => this.format(it)),
      average: this.format(statsCalculator.calculateTeamAverage(friends)),
    });
    teams.push({
      users: this.sorted(enemies).map((it) => this.format(it)),
      average: this.format(statsCalculator.calculateTeamAverage(enemies)),
    });

    return {
      teams: teams,
    };
  }

  private async fetchShipsStats(accountIDs: number[]): Promise<{
    [accountID: string]: ShipsStats;
  }> {
    const shipsStatsMap: { [accountID: string]: ShipsStats } = {};
    await async.eachLimit(
      accountIDs,
      GetBattleDetailUsecase.getMaxParallels(),
      (it, next) => {
        void (async () => {
          shipsStatsMap[it] = await this.wargamingRepository.getShipsStats(it);
          next();
        })();
      }
    );

    return shipsStatsMap;
  }

  private sorted(team: Player[]): Player[] {
    const sorted = team.slice().sort((first, second) => {
      const firstShip = first.shipInfo;
      const secondShip = second.shipInfo;

      // compare ship type
      if (firstShip.type && secondShip.type) {
        const typeCompare = firstShip.type.localeCompare(secondShip.type);
        if (typeCompare !== 0) return typeCompare;
      }

      // compare ship tier
      if (firstShip.tier && secondShip.tier) {
        if (firstShip.tier > secondShip.tier) return -1;
        if (firstShip.tier < secondShip.tier) return 1;
      }

      // compare ship nation
      if (firstShip.nation && secondShip.nation) {
        const nationCompare = firstShip.nation.localeCompare(secondShip.nation);
        if (nationCompare !== 0) return nationCompare;
      }

      // compare ship name
      if (firstShip.name && secondShip.name) {
        const nameCompare = firstShip.name.localeCompare(secondShip.name);
        if (nameCompare !== 0) return nameCompare;
      }

      if (firstShip) {
        return 1;
      }

      if (secondShip) {
        return -1;
      }

      return 0;
    });

    return sorted;
  }

  private format(user: Player): FormattedPlayer {
    const shipInfo = user.shipInfo;
    const shipStats = user.shipStats;
    const playerInfo = user.playerInfo;
    const playerStats = user.playerStats;

    return {
      shipInfo: {
        name: shipInfo.name,
        nation: shipInfo.nation,
        tier: shipInfo.tier?.toFixed(),
        type: shipInfo.type,
        statsURL: shipInfo.statsURL,
      },
      shipStats: {
        battles: shipStats.battles?.halfup(0),
        averageDamage: shipStats.averageDamage?.halfup(0),
        averageExperience: shipStats.averageExperience?.halfup(0),
        winRate: shipStats.winRate?.halfup(1),
        killDeathRate: shipStats.killDeathRate?.halfup(1),
        combatPower: shipStats.combatPower?.halfup(0),
        personalRating: shipStats.personalRating?.halfup(0),
      },
      playerInfo: {
        name: playerInfo.name,
        clan: playerInfo.clan,
        isHidden: playerInfo.isHidden,
        statsURL: playerInfo.statsURL,
      },
      playerStats: {
        battles: playerStats.battles?.halfup(0),
        averageDamage: playerStats.averageDamage?.halfup(0),
        averageExperience: playerStats.averageExperience?.halfup(0),
        winRate: playerStats.winRate?.halfup(1),
        killDeathRate: playerStats.killDeathRate?.halfup(1),
        averageTier: playerStats.averageTier?.halfup(1),
      },
    };
  }
}

interface FetchedData {
  accountInfo: AccountInfo;
  accountList: AccountList;
  clanTagMap: { [accountID: number]: string };
  basicShipInfoMap: { [shipID: number]: BasicShipInfo };
  shipsStatsMap: { [accountID: string]: ShipsStats };
  expectedStats: ExpectedStats;
  userSetting: UserSetting | undefined;
}
