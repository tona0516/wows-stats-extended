export {};

declare global {
  // eslint-disable-next-line
  interface Array<T> {
    average(): number;
  }
  interface Number {
    halfup(scale: number): string;
    isNotNullOrUndefined(): boolean;
  }
  interface String {
    isNotNullOrUndefined(): boolean;
  }
}

Array.prototype.average = function () {
  let sum = 0,
    size = 0;
  this.forEach((value: number) => {
    if (isFinite(value)) {
      sum += value;
      size += 1;
    }
  });

  return sum / size;
};

Number.prototype.halfup = function (scale: number) {
  return (
    Math.round((this as number) * Math.pow(10, scale)) / Math.pow(10, scale)
  ).toFixed(scale);
};

Number.prototype.isNotNullOrUndefined = function (): boolean {
  return !(this === null || this === undefined);
};

String.prototype.isNotNullOrUndefined = function (): boolean {
  return !(this === null || this === undefined);
};
