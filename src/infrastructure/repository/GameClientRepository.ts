import fs from "fs";
import path from "path";
import { injectable } from "tsyringe";

@injectable()
export class GameClientRepository {
  isInstallPath(value: string): boolean {
    const replaysPath = path.join(value, "replays");
    return fs.existsSync(replaysPath) && fs.statSync(replaysPath).isDirectory();
  }
}
