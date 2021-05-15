export default interface ClansAccountInfo {
  data: {
    [accountID: number]: Data;
  };
}

interface Data {
  clan_id?: number;
}
