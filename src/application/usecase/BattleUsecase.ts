import { Buffer } from "buffer";
import async from "async";
import { inject, injectable } from "tsyringe";
import "../../common/util.extensions";
import { BattleStatus } from "../output/BattleStatus";
import { PlayerInfo, ShipInfo, Player } from "../../domain/Player";
import { StatsCalculator } from "../../domain/StatsCalculator";
import { BasicShipInfo } from "../../infrastructure/output/BasicShipInfo";
import { EncyclopediaShips } from "../../infrastructure/output/EncyclopediaShips";
import { ShipsStats } from "../../infrastructure/output/ShipsStats";
import { TempArenaInfo } from "../../infrastructure/output/TempArenaInfo";
import { IBasicShipInfoRepository } from "../interface/IBasicShipInfoRepository";
import { ILogger } from "../interface/ILogger";
import { INumbersRepository } from "../interface/INumbersRepository";
import { IRadarRepository } from "../interface/IRadarRepository";
import { ITempArenaInfoRepository } from "../interface/ITempArenaInfoRepository";
import { IWargamingRepository } from "../interface/IWargamingRepository";
import { BattleDetail, FormattedPlayer, Team } from "../output/BattleDetail";
import { AccountList } from "../../infrastructure/output/AccountList";
import { ClansAccountInfo } from "../../infrastructure/output/ClansAccountInfo";
import { ClansInfo } from "../../infrastructure/output/ClansInfo";
import { AccountInfo } from "../../infrastructure/output/AccountInfo";
import { ExpectedStats } from "../../infrastructure/output/ExpectedStats";
import { NumbersURLGenerator } from "../../domain/NumbersURLGenerator";
import { IUserSettingRepository } from "../interface/IUserSettingRepository";
import { UserSetting } from "../../infrastructure/output/UserSetting";

@injectable()
export class BattleUsecase {
  constructor(
    @inject("Logger") private logger: ILogger,
    @inject("TempArenaInfoRepository")
    private tempArenaInfoRepository: ITempArenaInfoRepository,
    @inject("WargamingRepository")
    private wargamingRepository: IWargamingRepository,
    @inject("BasicShipInfoRepository")
    private basicShipInfoRepository: IBasicShipInfoRepository,
    @inject("RadarRepository")
    private radarRepository: IRadarRepository,
    @inject("NumbersRepository")
    private numbersRepository: INumbersRepository,
    @inject("StatsCalculator") private statsCalculator: StatsCalculator,
    @inject("UserSettingRepository")
    private userSettingRepository: IUserSettingRepository
  ) {}

  getStatus(): BattleStatus | undefined {
    const localStatus = this.tempArenaInfoRepository.get();
    if (!localStatus) {
      return undefined;
    }
    return new BattleStatus(localStatus);
  }

  async getDetail(localStatus: string): Promise<BattleDetail> {
    // TempArenaInfoに変換できない場合、例外発生する
    const tempArenaInfo = JSON.parse(
      Buffer.from(localStatus, "base64").toString()
    ) as TempArenaInfo;
    this.logger.debug("tempArenaInfo", JSON.stringify(tempArenaInfo));

    // fetch
    const fetched = await this.fetch(tempArenaInfo);

    const shaped = this.shape(
      tempArenaInfo,
      fetched.accountInfo,
      fetched.accountList,
      fetched.clansAccountInfo,
      fetched.clansInfo,
      fetched.basicShipInfo,
      fetched.shipsStatsMap,
      fetched.expectedStats,
      fetched.userSetting
    );

    return this.arrange(shaped.friends, shaped.enemies);
  }

  private async fetch(
    tempArenaInfo: TempArenaInfo
  ): Promise<{
    accountInfo: AccountInfo;
    accountList: AccountList;
    clansAccountInfo: ClansAccountInfo;
    clansInfo: ClansInfo;
    basicShipInfo: { [shipID: number]: BasicShipInfo };
    shipsStatsMap: { [accountID: string]: ShipsStats };
    expectedStats: ExpectedStats;
    userSetting: UserSetting | undefined;
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

    const accountInfoPromise = this.wargamingRepository.getAccountInfo(
      accountIDs
    );
    const shipsStatsPromise = this.getShipsStats(accountIDs);

    const clansAccountInfo = await this.wargamingRepository.getClansAccountInfo(
      accountIDs
    );
    this.logger.debug("clansAccountInfo", JSON.stringify(clansAccountInfo));

    const clanIDs = Object.values(clansAccountInfo.data)
      .filter((it): it is NonNullable<typeof it> => it != null)
      .map((it) => it.clan_id)
      .filter((it): it is NonNullable<typeof it> => it != null);
    this.logger.debug("clanIDs", JSON.stringify(clanIDs));

    const clansInfoPromise = this.wargamingRepository.getClansInfo(clanIDs);

    const encyclopediaInfo = await this.wargamingRepository.getEncyclopediaInfo();
    this.logger.debug("encyclopediaInfo", JSON.stringify(encyclopediaInfo));

    const gameVersion = encyclopediaInfo.data.game_version;
    this.logger.debug("gameVersion", JSON.stringify(gameVersion));

    const basicShipInfo =
      (await this.basicShipInfoRepository.get(gameVersion)) ||
      (await this.fetchBasicShipInfo());
    await this.basicShipInfoRepository.set(basicShipInfo, gameVersion);
    await this.basicShipInfoRepository.deleteOld();
    this.logger.debug("basicShipInfo", JSON.stringify(basicShipInfo));

    const expectedStats = await this.numbersRepository.get(gameVersion);
    await this.numbersRepository.set(expectedStats, gameVersion);
    await this.numbersRepository.deleteOld();
    this.logger.debug("expectedStats", JSON.stringify(expectedStats));

    const [accountInfo, clansInfo, shipsStatsMap] = await Promise.all([
      accountInfoPromise,
      clansInfoPromise,
      shipsStatsPromise,
    ]);
    this.logger.debug("accountInfo", JSON.stringify(accountInfo));
    this.logger.debug("clansInfo", JSON.stringify(clansInfo));
    this.logger.debug("shipsStatsMap", JSON.stringify(shipsStatsMap));

    const userSetting = this.userSettingRepository.read();

    return {
      accountInfo: accountInfo,
      accountList: accountList,
      clansAccountInfo: clansAccountInfo,
      clansInfo: clansInfo,
      basicShipInfo: basicShipInfo,
      shipsStatsMap: shipsStatsMap,
      expectedStats: expectedStats,
      userSetting: userSetting,
    };
  }

  private shape(
    tempArenaInfo: TempArenaInfo,
    accountInfo: AccountInfo,
    accountList: AccountList,
    clansAccountInfo: ClansAccountInfo,
    clansInfo: ClansInfo,
    basicShipInfo: { [shipID: number]: BasicShipInfo },
    shipsStatsMap: { [accountID: string]: ShipsStats },
    expectedStats: ExpectedStats,
    userSetting: UserSetting | undefined
  ): { friends: Player[]; enemies: Player[] } {
    const friends: Player[] = [];
    const enemies: Player[] = [];
    tempArenaInfo.vehicles.forEach((it) => {
      this.logger.debug("vehicles", JSON.stringify(it));

      const [nickname, shipID, relation] = [it.name, it.shipId, it.relation];
      const shipInfo = basicShipInfo[shipID];
      if (!shipInfo) {
        return;
      }

      this.logger.debug("shipInfo", JSON.stringify(shipInfo));

      const modifiedShipInfo: ShipInfo = {
        name: shipInfo.name,
        nation: shipInfo.nation,
        tier: shipInfo.tier,
        type: shipInfo.type,
        statsURL: NumbersURLGenerator.genetateShipPageURL(
          userSetting?.region,
          shipID.toString(),
          shipInfo.name
        ),
      };

      this.logger.debug("modifiedShipInfo", JSON.stringify(modifiedShipInfo));

      const accountID = accountList.data.find((it) => it.nickname === nickname)
        ?.account_id;

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

        const clanID = clansAccountInfo.data[accountID]?.clan_id;
        const clanTag = clanID ? clansInfo.data[clanID]?.tag : undefined;

        const modifiedPlayerInfo: PlayerInfo = {
          name: nickname,
          clan: clanTag,
          isHidden: accountInfo.data[accountID]?.hidden_profile,
          statsURL: NumbersURLGenerator.genetatePlayerPageURL(
            userSetting?.region,
            accountID.toString(),
            nickname
          ),
        };

        const shipsStatsForPlayer = shipsStatsMap[accountID].data[accountID];

        const shipsStatsForPlayerUsed = shipsStatsForPlayer?.find(
          (it) => it.ship_id === shipID
        );
        const modifiedShipStats = this.statsCalculator.calculateShipStats(
          shipInfo,
          expectedStats.data[shipID],
          shipsStatsForPlayerUsed?.pvp
        );
        const averageTier = this.statsCalculator.calculateAverageTier(
          basicShipInfo,
          shipsStatsForPlayer
        );
        const pvpByPlayer = accountInfo.data[accountID]?.statistics?.pvp;
        const modifiedPlayerStats = this.statsCalculator.calculatePlayerStats(
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

    this.logger.debug("friends", JSON.stringify(friends));
    this.logger.debug("enemies", JSON.stringify(enemies));

    return {
      friends: friends,
      enemies: enemies,
    };
  }

  private arrange(friends: Player[], enemies: Player[]): BattleDetail {
    const teams: Team[] = [];

    teams.push({
      users: this.sorted(friends).map((it) => this.format(it)),
      average: this.format(this.statsCalculator.calculateTeamAverage(friends)),
    });
    teams.push({
      users: this.sorted(enemies).map((it) => this.format(it)),
      average: this.format(this.statsCalculator.calculateTeamAverage(enemies)),
    });

    return {
      teams: teams,
    };
  }

  private async getShipsStats(
    accountIDs: number[]
  ): Promise<{
    [accountID: string]: ShipsStats;
  }> {
    const shipsStatsMap: { [accountID: string]: ShipsStats } = {};
    await async.eachLimit(accountIDs, 5, (it, next) => {
      void (async () => {
        shipsStatsMap[it] = await this.wargamingRepository.getShipsStats(it);
        next();
      })();
    });

    return shipsStatsMap;
  }

  private async fetchBasicShipInfo(): Promise<{
    [shipID: number]: BasicShipInfo;
  }> {
    // fetch common info
    const pageTotal = (await this.wargamingRepository.getEncyclopediaShips(1))
      .meta.page_total;
    const encyclopediaShipsPromises: Promise<EncyclopediaShips>[] = [];
    for (let i = 1; i <= pageTotal; i++) {
      encyclopediaShipsPromises.push(
        this.wargamingRepository.getEncyclopediaShips(i)
      );
    }
    const encyclopediaShipsList = await Promise.all(encyclopediaShipsPromises);

    // fetch radar info
    // const radarMap = await this.radarRepository.fetch();

    const basicShipInfo: { [shipID: number]: BasicShipInfo } = {};
    encyclopediaShipsList.forEach((it) => {
      for (const shipID in it.data) {
        const encyclopediaShip = it.data[shipID];
        basicShipInfo[shipID] = {
          name: encyclopediaShip.name,
          tier: encyclopediaShip.tier,
          type: encyclopediaShip.type,
          nation: encyclopediaShip.nation,
          detectDistanceByShip:
            encyclopediaShip.default_profile?.concealment
              ?.detect_distance_by_ship,
          // radar: radarMap[encyclopediaShip.name!],
        };
      }
    });

    return basicShipInfo;
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
