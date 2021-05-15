import crypto from "crypto";

export class BattleStatus {
  localStatus: string;
  hash: string;

  constructor(localStatus: string) {
    this.localStatus = Buffer.from(localStatus).toString("base64");
    this.hash = crypto
      .createHash("sha256")
      .update(localStatus, "utf8")
      .digest("hex");
  }
}
