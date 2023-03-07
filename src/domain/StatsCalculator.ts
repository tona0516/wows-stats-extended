import { injectable } from "tsyringe";
import { Pvp as AccountInfoPvp } from "../infrastructure/output/AccountInfo";
import { BasicShipInfo } from "../infrastructure/output/BasicShipInfo";
import { ExpectedValues } from "../infrastructure/output/ExpectedStats";
import {
  Data as ShipsStatsData,
  Pvp as ShipsStatsPvp,
} from "../infrastructure/output/ShipsStats";

import { Player, PlayerStats, ShipStats } from "./Player";

@injectable()
export class StatsCalculator {
  calculateShipStats(
    basicShipInfo: BasicShipInfo,
    expectedValues?: ExpectedValues,
    pvp?: ShipsStatsPvp
  ): ShipStats {
    if (!pvp) {
      return {};
    }

    const averageDamage =
      pvp.damage_dealt?.isNotNullOrUndefined() &&
      pvp.battles?.isNotNullOrUndefined()
        ? pvp.damage_dealt / pvp.battles
        : undefined;
    const averageExperience =
      pvp.xp?.isNotNullOrUndefined() && pvp.battles?.isNotNullOrUndefined()
        ? pvp.xp / pvp.battles
        : undefined;
    const winRate =
      pvp.wins?.isNotNullOrUndefined() && pvp.battles?.isNotNullOrUndefined()
        ? (pvp.wins / pvp.battles) * 100
        : undefined;
    const killDeathRate =
      pvp.frags?.isNotNullOrUndefined() &&
      pvp.battles?.isNotNullOrUndefined() &&
      pvp.survived_battles?.isNotNullOrUndefined()
        ? pvp.frags / (pvp.battles - pvp.survived_battles)
        : undefined;
    const combatPower =
      averageDamage?.isNotNullOrUndefined() &&
      killDeathRate?.isNotNullOrUndefined() &&
      averageExperience?.isNotNullOrUndefined() &&
      basicShipInfo.tier?.isNotNullOrUndefined() &&
      basicShipInfo.type?.isNotNullOrUndefined()
        ? this.calculateCombatPower(
            averageDamage,
            killDeathRate,
            averageExperience,
            basicShipInfo.tier,
            basicShipInfo.type
          )
        : undefined;

    const averageFrags =
      pvp.frags?.isNotNullOrUndefined() && pvp.battles?.isNotNullOrUndefined()
        ? pvp.frags / pvp.battles
        : undefined;

    const personalRating =
      averageDamage?.isNotNullOrUndefined() &&
      averageFrags?.isNotNullOrUndefined() &&
      winRate?.isNotNullOrUndefined() &&
      expectedValues !== null &&
      expectedValues !== undefined
        ? this.calculatePersonalRating(
            {
              damage: averageDamage,
              frags: averageFrags,
              wins: winRate,
            },
            {
              damage: expectedValues.average_damage_dealt,
              frags: expectedValues.average_frags,
              wins: expectedValues.win_rate,
            }
          )
        : undefined;

    return {
      battles: pvp.battles,
      averageDamage: averageDamage,
      averageExperience: averageExperience,
      winRate: winRate,
      killDeathRate: killDeathRate,
      combatPower: combatPower,
      personalRating: personalRating,
    };
  }

  calculatePlayerStats(averageTier: number, pvp?: AccountInfoPvp): PlayerStats {
    if (!pvp) {
      return {};
    }

    const averageDamage =
      pvp.damage_dealt?.isNotNullOrUndefined() &&
      pvp.battles?.isNotNullOrUndefined()
        ? pvp.damage_dealt / pvp.battles
        : undefined;
    const killDeathRate =
      pvp.frags?.isNotNullOrUndefined() &&
      pvp.battles?.isNotNullOrUndefined() &&
      pvp.survived_battles?.isNotNullOrUndefined()
        ? pvp.frags / (pvp.battles - pvp.survived_battles)
        : undefined;
    const averageExperience =
      pvp.xp?.isNotNullOrUndefined() && pvp.battles?.isNotNullOrUndefined()
        ? pvp.xp / pvp.battles
        : undefined;
    const winRate =
      pvp.wins?.isNotNullOrUndefined() && pvp.battles?.isNotNullOrUndefined()
        ? (pvp.wins / pvp.battles) * 100
        : undefined;

    return {
      battles: pvp.battles,
      averageDamage: averageDamage,
      averageExperience: averageExperience,
      winRate: winRate,
      killDeathRate: killDeathRate,
      averageTier: averageTier,
    };
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

  calculatePersonalRating(
    actual: { damage: number; frags: number; wins: number },
    expected: { damage: number; frags: number; wins: number }
  ): number {
    const ratio = {
      damage: actual.damage / expected.damage,
      frags: actual.frags / expected.frags,
      wins: actual.wins / expected.wins,
    };

    const normalized = {
      damage: Math.max(0, (ratio.damage - 0.4) / (1 - 0.4)),
      frags: Math.max(0, (ratio.frags - 0.1) / (1 - 0.1)),
      wins: Math.max(0, (ratio.wins - 0.7) / (1 - 0.7)),
    };

    return (
      700 * normalized.damage + 300 * normalized.frags + 150 * normalized.wins
    );
  }

  calculateAverageTier(
    basicShipInfo: { [shipID: number]: BasicShipInfo },
    shipsStatsData?: ShipsStatsData[]
  ): number {
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

  calculateTeamAverage(team: Player[]): Player {
    return {
      shipInfo: {},
      shipStats: {
        battles: team.map((it) => it.shipStats.battles).average(),
        averageDamage: team.map((it) => it.shipStats.averageDamage).average(),
        averageExperience: team
          .map((it) => it.shipStats.averageExperience)
          .average(),
        winRate: team.map((it) => it.shipStats.winRate).average(),
        killDeathRate: team.map((it) => it.shipStats.killDeathRate).average(),
        combatPower: team.map((it) => it.shipStats.combatPower).average(),
        personalRating: team.map((it) => it.shipStats.personalRating).average(),
      },
      playerInfo: {},
      playerStats: {
        battles: team.map((it) => it.playerStats.battles).average(),
        averageDamage: team.map((it) => it.playerStats.averageDamage).average(),
        averageExperience: team
          .map((it) => it.playerStats.averageExperience)
          .average(),
        winRate: team.map((it) => it.playerStats.winRate).average(),
        killDeathRate: team.map((it) => it.playerStats.killDeathRate).average(),
        averageTier: team.map((it) => it.playerStats.averageTier).average(),
      },
    };
  }
}
