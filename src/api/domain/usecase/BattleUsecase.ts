import { inject, injectable } from "tsyringe";
import { Buffer } from "buffer";
import crypto from "crypto";
import BattleState from "../model/BattleState";
import BattleDetail, {
  ModifiedPlayerInfo,
  ModifiedPlayerStat,
  ModifiedShipInfo,
  ModifiedShipStats,
  Teams,
  User,
} from "../model/BattleDetail";
import async from "async";
import { Pvp as AccountInfoPvp } from "../../infrastructure/entity/AccountInfo";
import "../../extenstion/util.extensions";
import LoggerInterface from "../repository/LoggerInterface";
import BasicShipInfoRepositoryInterface from "../repository/BasicShipInfoRepositoryInterface";
import LocalStatusRepositoryInterface from "../repository/LocalStatusRepositoryInterface";
import RadarRepositoryInterface from "../repository/RadarRepositoryInterface";
import RemoteStatusRepositoryInterface from "../repository/RemoteStatusRepositoryInterface";
import TempArenaInfo from "../../infrastructure/entity/TempArenaInfo";
import ShipsStats, {
  Data as ShipsStatsData,
  Pvp as ShipsStatsPvp,
} from "../../infrastructure/entity/ShipsStats";
import BasicShipInfo from "../../infrastructure/entity/BasicShipInfo";
import EncyclopediaShips from "../../infrastructure/entity/EncyclopediaShips";

@injectable()
export default class BattleUsecase {
  constructor(
    @inject("Logger") private logger: LoggerInterface,
    @inject("TempArenaInfoRepositoy")
    private localStatusRepository: LocalStatusRepositoryInterface,
    @inject("WargamingRepositpory")
    private remoteStatusRepository: RemoteStatusRepositoryInterface,
    @inject("BasicShipInfoRepository")
    private basicShipInfoRepository: BasicShipInfoRepositoryInterface,
    @inject("RadarRepository") private radarRepository: RadarRepositoryInterface
  ) {}

  getStatus(): BattleState {
    const tempArenaInfo = this.localStatusRepository.get();

    return {
      encodedTempArenaInfo: Buffer.from(tempArenaInfo).toString("base64"),
      hash: crypto
        .createHash("sha256")
        .update(tempArenaInfo, "utf8")
        .digest("hex"),
    };
  }

  async getDetail(encodedTempArenaInfo: string): Promise<BattleDetail> {
    // TempArenaInfoに変換できない場合、例外発生する
    const tempArenaInfo = JSON.parse(
      Buffer.from(encodedTempArenaInfo, "base64").toString()
    ) as TempArenaInfo;
    this.logger.debug("tempArenaInfo", JSON.stringify(tempArenaInfo));

    // fetch
    const accountNames = tempArenaInfo.vehicles
      .filter((it) => {
        return !it.name.startsWith(":") && !it.name.endsWith(":") && it.id > 0;
      })
      .map((it) => {
        return it.name;
      });

    this.logger.debug("accountNames", JSON.stringify(accountNames));
    const accountList = await this.remoteStatusRepository.getAccountList(
      accountNames
    );
    this.logger.debug("accountList", JSON.stringify(accountList));

    const accountIDs = accountList.data.map((it) => it.account_id);
    this.logger.debug("accountIDs", JSON.stringify(accountIDs));

    const accountInfoPromise = this.remoteStatusRepository.getAccountInfo(
      accountIDs
    );

    const shipsStatsPromise = this.getShipsStats(accountIDs);

    const clansAccountInfo = await this.remoteStatusRepository.getClansAccountInfo(
      accountIDs
    );

    this.logger.debug("clansAccountInfo", JSON.stringify(clansAccountInfo));

    const clanIDs = Object.values(clansAccountInfo.data)
      .map((it) => it.clan_id)
      .filter((it): it is NonNullable<typeof it> => it != null);

    this.logger.debug("clanIDs", JSON.stringify(clanIDs));

    const clansInfoPromise = this.remoteStatusRepository.getClansInfo(clanIDs);
    const encyclopediaInfo = await this.remoteStatusRepository.getEncyclopediaInfo();

    this.logger.debug("encyclopediaInfo", JSON.stringify(encyclopediaInfo));

    const gameVersion = encyclopediaInfo.data.game_version;
    this.logger.debug("gameVersion", JSON.stringify(gameVersion));

    const basicShipInfo =
      (await this.basicShipInfoRepository.get(gameVersion)) ||
      (await this.fetchBasicShipInfo());
    this.logger.debug("basicShipInfo", JSON.stringify(basicShipInfo));

    this.basicShipInfoRepository.set(basicShipInfo, gameVersion);
    this.basicShipInfoRepository.deleteOld();

    const [accountInfo, clansInfo, shipsStatsMap] = await Promise.all([
      accountInfoPromise,
      clansInfoPromise,
      shipsStatsPromise,
    ]);
    this.logger.debug("accountInfo", JSON.stringify(accountInfo));
    this.logger.debug("clansInfo", JSON.stringify(clansInfo));
    this.logger.debug("shipsStatsMap", JSON.stringify(shipsStatsMap));

    // shape
    const friends: User[] = [];
    const enemies: User[] = [];
    tempArenaInfo.vehicles.forEach((it) => {
      const [nickname, shipID, relation] = [it.name, it.shipId, it.relation];
      const shipInfo = basicShipInfo[shipID];

      const modifiedShipInfo: ModifiedShipInfo = {
        name: shipInfo.name,
        nation: shipInfo.nation,
        tier: shipInfo.tier,
        type: shipInfo.type,
        detectDistance: this.calculateModifiedDetectDistance(shipInfo),
        radarDistance: shipInfo.radar,
      };

      const accountID = accountList.data.find((it) => it.nickname === nickname)
        ?.account_id;

      const user: User = ((): User => {
        if (!accountID) {
          return {
            playerInfo: {
              name: nickname,
            },
            playerStats: {},
            shipInfo: modifiedShipInfo,
            shipStats: {},
          };
        }

        const clanID = clansAccountInfo.data[accountID]?.clan_id;
        const clanTag = clanID ? clansInfo.data[clanID]?.tag : undefined;

        const modifiedPlayerInfo: ModifiedPlayerInfo = {
          name: nickname,
          clan: clanTag,
          isHidden: accountInfo.data[accountID]?.hidden_profile,
        };

        const shipsStatsForPlayer = shipsStatsMap[accountID].data[accountID];

        const shipsStatsForPlayerUsed = shipsStatsForPlayer?.find(
          (it) => it.ship_id === shipID
        );
        const modifiedShipStats = this.calculateShipStats(
          shipInfo,
          shipsStatsForPlayerUsed?.pvp
        );
        const averageTier = this.calculateAverageTier(
          basicShipInfo,
          shipsStatsForPlayer
        );
        const pvpByPlayer = accountInfo.data[accountID]?.statistics?.pvp;
        const modifiedPlayerStat = this.calculatePlayerStats(
          averageTier,
          pvpByPlayer
        );

        return {
          shipInfo: modifiedShipInfo,
          shipStats: modifiedShipStats,
          playerInfo: modifiedPlayerInfo,
          playerStats: modifiedPlayerStat,
        };
      })();

      if (relation == 0 || relation == 1) {
        friends.push(user);
      } else {
        enemies.push(user);
      }
    });

    // sort
    friends
      .sort((a, b) => a.shipInfo.name!.localeCompare(b.shipInfo.name!))
      .sort((a, b) => a.shipInfo.nation!.localeCompare(b.shipInfo.nation!))
      .sort((a, b) =>
        a.shipInfo.tier! > b.shipInfo.tier!
          ? -1
          : a.shipInfo.tier! < b.shipInfo.tier!
          ? 1
          : 0
      )
      .sort((a, b) => a.shipInfo.type!.localeCompare(b.shipInfo.type!));

    enemies
      .sort((a, b) => a.shipInfo.name!.localeCompare(b.shipInfo.name!))
      .sort((a, b) => a.shipInfo.nation!.localeCompare(b.shipInfo.nation!))
      .sort((a, b) =>
        a.shipInfo.tier! > b.shipInfo.tier!
          ? -1
          : a.shipInfo.tier! < b.shipInfo.tier!
          ? 1
          : 0
      )
      .sort((a, b) => a.shipInfo.type!.localeCompare(b.shipInfo.type!));

    const friendAverage: User = {
      shipInfo: {},
      shipStats: {
        battles: friends.map((it) => it.shipStats.battles).average(),
        averageDamage: friends
          .map((it) => it.shipStats.averageDamage)
          .average(),
        averageExperience: friends
          .map((it) => it.shipStats.averageExperience)
          .average(),
        winRate: friends.map((it) => it.shipStats.winRate).average(),
        killDeathRate: friends
          .map((it) => it.shipStats.killDeathRate)
          .average(),
      },
      playerInfo: {},
      playerStats: {
        battles: friends.map((it) => it.playerStats.battles).average(),
        averageDamage: friends
          .map((it) => it.playerStats.averageDamage)
          .average(),
        averageExperience: friends
          .map((it) => it.playerStats.averageExperience)
          .average(),
        winRate: friends.map((it) => it.playerStats.winRate).average(),
        killDeathRate: friends
          .map((it) => it.playerStats.killDeathRate)
          .average(),
      },
    };

    const enemyAverage: User = {
      shipInfo: {},
      shipStats: {
        battles: enemies.map((it) => it.shipStats.battles).average(),
        averageDamage: enemies
          .map((it) => it.shipStats.averageDamage)
          .average(),
        averageExperience: enemies
          .map((it) => it.shipStats.averageExperience)
          .average(),
        winRate: enemies.map((it) => it.shipStats.winRate).average(),
        killDeathRate: enemies
          .map((it) => it.shipStats.killDeathRate)
          .average(),
      },
      playerInfo: {},
      playerStats: {
        battles: enemies.map((it) => it.playerStats.battles).average(),
        averageDamage: enemies
          .map((it) => it.playerStats.averageDamage)
          .average(),
        averageExperience: enemies
          .map((it) => it.playerStats.averageExperience)
          .average(),
        winRate: enemies.map((it) => it.playerStats.winRate).average(),
        killDeathRate: enemies
          .map((it) => it.playerStats.killDeathRate)
          .average(),
      },
    };

    const teams: Teams = {
      friends: friends,
      enemies: enemies,
    };

    const formattedTeams = this.format(teams);
    const battleDetail: BattleDetail = {
      teams: formattedTeams,
    };

    return battleDetail;
  }

  async getShipsStats(
    accountIDs: number[]
  ): Promise<{
    [accountID: string]: ShipsStats;
  }> {
    const shipsStatsMap: { [accountID: string]: ShipsStats } = {};
    await async.eachLimit(accountIDs, 5, (it, next) => {
      void (async () => {
        shipsStatsMap[it] = await this.remoteStatusRepository.getShipsStats(it);
        next();
      })();
    });

    return shipsStatsMap;
  }

  calculateShipStats(
    basicShipInfo: BasicShipInfo,
    pvp?: ShipsStatsPvp
  ): ModifiedShipStats {
    if (!pvp) {
      return {};
    }

    const averageDamage =
      pvp.damage_dealt && pvp.battles
        ? pvp.damage_dealt / pvp.battles
        : undefined;
    const killDeathRate =
      pvp.frags && pvp.battles && pvp.survived_battles
        ? pvp.frags / (pvp.battles - pvp.survived_battles)
        : undefined;
    const averageExperience =
      pvp.xp && pvp.battles ? pvp.xp / pvp.battles : undefined;
    const combatPower =
      averageDamage &&
      killDeathRate &&
      averageExperience &&
      basicShipInfo.tier &&
      basicShipInfo.type
        ? this.calculateCombatPower(
            averageDamage,
            killDeathRate,
            averageExperience,
            basicShipInfo.tier,
            basicShipInfo.type
          )
        : undefined;
    const winRate =
      pvp.wins && pvp.battles ? (pvp.wins / pvp.battles) * 100 : undefined;

    return {
      battles: pvp.battles ?? undefined,
      averageDamage: averageDamage,
      averageExperience: averageExperience,
      winRate: winRate,
      killDeathRate: killDeathRate,
      combatPower: combatPower,
    };
  }

  calculatePlayerStats(
    averageTier?: number,
    pvp?: AccountInfoPvp
  ): ModifiedPlayerStat {
    // TODO一個ずつassertする
    try {
      const averageDamage = pvp!.damage_dealt! / pvp!.battles!;
      const averageExperience = pvp!.xp! / pvp!.battles!;
      const killDeathRate =
        pvp!.frags! / (pvp!.battles! - pvp!.survived_battles!);
      return {
        battles: pvp!.battles!,
        averageDamage: averageDamage,
        averageExperience: averageExperience,
        winRate: (pvp!.wins! / pvp!.battles!) * 100,
        killDeathRate: killDeathRate,
        averageTier: averageTier!,
      };
    } catch (e) {
      return {};
    }
  }

  calculateAverageTier(
    basicShipInfo: { [shipID: number]: BasicShipInfo },
    shipsStatsData?: ShipsStatsData[]
  ): number | undefined {
    let tierSum = 0;
    let battleSum = 0;

    shipsStatsData?.forEach((it) => {
      const shipID = it.ship_id;
      if (!shipID) {
        return;
      }
      const tier = basicShipInfo[shipID]?.tier;
      const battles = it.pvp?.battles;
      if (tier && battles) {
        battleSum += battles;
        tierSum += tier * battles;
      }
    });
    return tierSum / battleSum;
  }

  // TODO to private function
  async fetchBasicShipInfo(): Promise<{ [shipID: number]: BasicShipInfo }> {
    // fetch common info
    const pageTotal = (
      await this.remoteStatusRepository.getEncyclopediaShips(1)
    ).meta.page_total;
    const encyclopediaShipsPromises: Promise<EncyclopediaShips>[] = [];
    for (let i = 1; i <= pageTotal; i++) {
      encyclopediaShipsPromises.push(
        this.remoteStatusRepository.getEncyclopediaShips(i)
      );
    }
    const encyclopediaShipsList = await Promise.all(encyclopediaShipsPromises);

    // fetch radar info
    const radarMap = await this.radarRepository.fetch();

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
          radar: radarMap[encyclopediaShip.name!],
        };
      }
    });

    return basicShipInfo;
  }

  calculateModifiedDetectDistance(basicShipInfo: BasicShipInfo): number {
    const CAMOFLAGE = 0.97;
    const COMMANDER = 0.9;
    const module = (shipName: string, tier: number): number => {
      if (shipName === "Gearing") return 0.85;
      if (tier > 7) return 0.9;
      return 1.0;
    };

    return (
      basicShipInfo.detectDistanceByShip! *
      CAMOFLAGE *
      COMMANDER *
      module(basicShipInfo.name!, basicShipInfo.tier!)
    );
  }

  calculateCombatPower(
    averageDamage: number,
    killDeathRate: number,
    averageExperience: number,
    tier: number,
    shipType: string
  ): number {
    const shipTypeCoefficient = (shipType: string) => {
      switch (shipType) {
        case "Battleship":
          return 0.7;
        case "AirCarrier":
          return 0.5;
        default:
          return 1.0;
      }
    };
    return (
      ((averageDamage * killDeathRate * averageExperience) / 800) *
      (1 - 0.03 * tier) *
      shipTypeCoefficient(shipType)
    );
  }

  format(teams: Teams): Teams {
    const friends: User[] = teams.friends.map((it) => {
      const shipStats = it.shipStats;
      const playerStats = it.playerStats;
      const shipInfo = { ...it.shipInfo };
      shipInfo.detectDistance = it.shipInfo.detectDistance?.halfup(1);
      shipInfo.radarDistance = it.shipInfo.radarDistance?.halfup(1);
      return {
        shipInfo: shipInfo,
        shipStats: {
          battles: shipStats.battles?.halfup(0),
          averageDamage: shipStats.averageDamage?.halfup(0),
          averageExperience: shipStats.averageExperience?.halfup(0),
          winRate: shipStats.winRate?.halfup(1),
          killDeathRate: shipStats.killDeathRate?.halfup(1),
          combatPower: shipStats.combatPower?.halfup(0),
        },
        playerInfo: it.playerInfo,
        playerStats: {
          battles: playerStats.battles?.halfup(0),
          averageDamage: playerStats.averageDamage?.halfup(0),
          averageExperience: playerStats.averageExperience?.halfup(0),
          winRate: playerStats.winRate?.halfup(1),
          killDeathRate: playerStats.killDeathRate?.halfup(1),
          averageTier: playerStats.averageTier?.halfup(1),
        },
      };
    });

    const enemies: User[] = teams.enemies.map((it) => {
      const shipStats = it.shipStats;
      const playerStats = it.playerStats;
      const shipInfo = { ...it.shipInfo };
      shipInfo.detectDistance = it.shipInfo.detectDistance?.halfup(1);
      shipInfo.radarDistance = it.shipInfo.radarDistance?.halfup(1);
      return {
        shipInfo: shipInfo,
        shipStats: {
          battles: shipStats.battles?.halfup(0),
          averageDamage: shipStats.averageDamage?.halfup(0),
          averageExperience: shipStats.averageExperience?.halfup(0),
          winRate: shipStats.winRate?.halfup(1),
          killDeathRate: shipStats.killDeathRate?.halfup(1),
          combatPower: shipStats.combatPower?.halfup(0),
        },
        playerInfo: it.playerInfo,
        playerStats: {
          battles: playerStats.battles?.halfup(0),
          averageDamage: playerStats.averageDamage?.halfup(0),
          averageExperience: playerStats.averageExperience?.halfup(0),
          winRate: playerStats.winRate?.halfup(1),
          killDeathRate: playerStats.killDeathRate?.halfup(1),
          averageTier: playerStats.averageTier?.halfup(1),
        },
      };
    });

    return {
      friends: friends,
      enemies: enemies,
    };
  }
}
