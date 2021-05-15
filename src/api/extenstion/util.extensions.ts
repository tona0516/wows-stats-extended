export {};

declare global {
  interface Array<T> {
    average(): number;
  }
  interface Number {
    halfup(scale: number): number;
  }
}

Array.prototype.average = function () {
  let sum = 0,
    size = 0;
  this.forEach((value) => {
    if (typeof value === "number") {
      sum += value;
      size += 1;
    }
  });

  return sum / size;
};

Number.prototype.halfup = function (scale: number) {
  return (
    Math.round((this as number) * Math.pow(10, scale)) / Math.pow(10, scale)
  );
};
