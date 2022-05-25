import { BasicShipInfo } from "../infrastructure/output/BasicShipInfo";

export class Submarines {
  static getShipInfo(): { [shipID: number]: BasicShipInfo } {
    return {
      4183209968: {
        name: "Cachalot",
        tier: 6,
        type: "Submarine",
        nation: "usa",
      },
      4181112816: {
        name: "Salmon",
        tier: 8,
        type: "Submarine",
        nation: "usa",
      },
      4179015664: {
        name: "Balao",
        tier: 10,
        type: "Submarine",
        nation: "usa",
      },
      4183209776: {
        name: "U-69",
        tier: 6,
        type: "Submarine",
        nation: "germany",
      },
      4181112624: {
        name: "U-190",
        tier: 8,
        type: "Submarine",
        nation: "germany",
      },
      4179015472: {
        name: "U-2501",
        tier: 10,
        type: "Submarine",
        nation: "germany",
      },
    };
  }
}
