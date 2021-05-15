export default interface ClansInfo {
  data: {
    [clanID: number]: Data;
  };
}

interface Data {
  tag: string;
}
