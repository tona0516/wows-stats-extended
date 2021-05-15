import fs from "fs";
import path from "path";
import { injectable } from "tsyringe";
import { IGameClientRepository } from "../../application/interface/IGameClientRepository";

@injectable()
export class GameClientRepository implements IGameClientRepository {
  isInstallPath(value: string): boolean {
    const replaysPath = path.join(value, "replays");
    return fs.existsSync(replaysPath) && fs.statSync(replaysPath).isDirectory();
  }
}
