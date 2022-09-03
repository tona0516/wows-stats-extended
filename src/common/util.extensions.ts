export {};

declare global {
  // eslint-disable-next-line
  interface Array<T> {
    average(): number;
  }
  interface Number {
    format(scale: number): string;
    isNotNullOrUndefined(): boolean;
  }
  interface String {
    isNotNullOrUndefined(): boolean;
    formatNonFinite(): string;
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

Number.prototype.format = function (scale: number) {
  const value = this as number;

  if (isNaN(value)) {
    return "NaN";
  }

  if (!isFinite(value)) {
    return "Inf";
  }

  return (
    Math.round(value * Math.pow(10, scale)) / Math.pow(10, scale)
  ).toFixed(scale);
};

Number.prototype.isNotNullOrUndefined = function () {
  return !(this === null || this === undefined);
};

String.prototype.isNotNullOrUndefined = function () {
  return !(this === null || this === undefined);
};
