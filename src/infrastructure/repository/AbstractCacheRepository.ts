import { injectable } from "inversify";
import storage from "node-persist";

@injectable()
export abstract class AbstractCacheRepository<T> {
  protected abstract prefix: string;

  constructor() {
    void storage.init();
  }

  async get(gameVersion: string): Promise<T | undefined> {
    return (await storage.getItem(`${this.prefix}_${gameVersion}`)) as
      | T
      | undefined;
  }

  async set(data: T, gameVersion: string): Promise<void> {
    await storage.setItem(`${this.prefix}_${gameVersion}`, data);
  }

  async deleteWithoutLatest(): Promise<void> {
    const caches = (await storage.keys())
      .filter((it) => it.startsWith(this.prefix))
      .sort();

    caches.splice(-1, 1);
    caches.forEach((it) => {
      void (async () => {
        await storage.removeItem(it);
      })();
    });
  }
}
