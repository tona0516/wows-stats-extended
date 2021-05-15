export class Region {
  static na = "na";
  static eu = "eu";
  static ru = "ru";
  static asia = "asia";

  static getAll(): string[] {
    return [Region.na, Region.eu, Region.ru, Region.asia];
  }
}
