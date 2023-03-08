import { BasicShipInfo } from "../infrastructure/output/BasicShipInfo";

export class UnregisteredShips {
  static getShipInfo(): { [shipID: number]: BasicShipInfo } {
    return {
      3676223216: {
        name: "Napoli B",
        tier: 10,
        type: "Cruiser",
        nation: "italy",
      },
      3666819056: {
        name: "Kearsarge B",
        tier: 9,
        type: "Battleship",
        nation: "usa",
      },
      3667834672: {
        name: "Mainz B",
        tier: 8,
        type: "Cruiser",
        nation: "germany",
      },
      3667899856: {
        name: "Chkalov B",
        tier: 8,
        type: "AirCarrier",
        nation: "ussr",
      },
      3669898960: {
        name: "Shinonome B",
        tier: 6,
        type: "Destroyer",
        nation: "japan",
      },
      3721344976: {
        name: "Renown ’44",
        tier: 7,
        type: "Battleship",
        nation: "uk",
      },
      4076255024: {
        name: "U-190",
        tier: 8,
        type: "Submarine",
        nation: "germany",
      },
      4078352368: {
        name: "Cachalot",
        tier: 6,
        type: "Submarine",
        nation: "usa",
      },
      4078352176: {
        name: "U-69",
        tier: 6,
        type: "Submarine",
        nation: "germany",
      },
      3751196368: {
        name: "I-56",
        tier: 8,
        type: "Submarine",
        nation: "japan",
      },
      3761681872: {
        name: "S-189",
        tier: 8,
        type: "Submarine",
        nation: "ussr",
      },
      4076255216: {
        name: "Salmon",
        tier: 8,
        type: "Submarine",
        nation: "usa",
      },
      4074158064: {
        name: "Balao",
        tier: 10,
        type: "Submarine",
        nation: "usa",
      },
      4074157872: {
        name: "U-2501",
        tier: 10,
        type: "Submarine",
        nation: "germany",
      },
      4076812272: {
        name: "Nebraska",
        tier: 8,
        type: "Battleship",
        nation: "usa",
      },
      4075763696: {
        name: "Delaware",
        tier: 9,
        type: "Battleship",
        nation: "usa",
      },
      4178556624: {
        name: "Sekiryu",
        tier: 11,
        type: "AirCarrier",
        nation: "japan",
      },
      4178523600: {
        name: "Ushakov",
        tier: 11,
        type: "Battleship",
        nation: "ussr",
      },
      3655218992: {
        name: "Z-42",
        tier: 10,
        type: "Destroyer",
        nation: "germanys",
      },
    };
  }
}
