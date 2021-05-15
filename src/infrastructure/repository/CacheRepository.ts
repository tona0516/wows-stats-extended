import storage from "node-persist";
import { inject, injectable } from "tsyringe";
import { ILogger } from "../../application/interface/ILogger";

@injectable()
export class CacheRepository<T> {
  constructor(@inject("Logger") private logger: ILogger) {
    void storage.init();
  }

  async set(data: T, prefix: string, gameVersion: string): Promise<void> {
    const cacheName = `${prefix}_${gameVersion}`;
    await storage.setItem(cacheName, data);
  }

  async get(prefix: string, gameVersion: string): Promise<T | null> {
    const cacheName = `${prefix}_${gameVersion}`;
    return (await storage.getItem(cacheName)) as T | null;
  }

  async deleteOld(prefix: string): Promise<void> {
    const keys = (await storage.keys())
      .filter((it) => it.startsWith(prefix))
      .sort();
    keys.splice(-1, 1);
    keys.forEach((it) => {
      void (async () => {
        await storage.removeItem(it);
      })();
    });
  }
}
