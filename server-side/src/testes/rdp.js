import simplify from "simplify-js";

const points = [
  { x: 72.9746317, y: 26.2507467 },
  { x: 72.9746617, y: 26.2507617 },
  { x: 72.9746883, y: 26.250775 },
  { x: 72.97472,   y: 26.25079 },
  { x: 72.974755,  y: 26.2508 },
  { x: 72.9747917, y: 26.2508117 },
  { x: 72.9748267, y: 26.2508083 },
  { x: 72.974855,  y: 26.2508133 },
  { x: 72.9748683, y: 26.2508217 },
  { x: 72.9748667, y: 26.2508417 },
  { x: 72.9748483, y: 26.25087 },
  { x: 72.974825,  y: 26.250905 },
  { x: 72.974805,  y: 26.25095 },
  { x: 72.9747867, y: 26.2509983 },
  { x: 72.974765,  y: 26.2510517 },
  { x: 72.974735,  y: 26.2511083 },
  { x: 72.9747083, y: 26.2511683 },
  { x: 72.9746833, y: 26.2512317 },
  { x: 72.9746583, y: 26.25129 },
  { x: 72.9746317, y: 26.2513517 },
  { x: 72.9746067, y: 26.2514117 },
  { x: 72.9745817, y: 26.2514717 },
  { x: 72.9745633, y: 26.251525 },
  { x: 72.97454,   y: 26.251575 },
  { x: 72.9745283, y: 26.25162 },
  { x: 72.9745183, y: 26.25165 },
  { x: 72.974515,  y: 26.25168 },
  { x: 72.9745317, y: 26.2517017 },
  { x: 72.9745467, y: 26.2517233 },
  { x: 72.974565,  y: 26.2517417 },
  { x: 72.97458,   y: 26.251755 },
  { x: 72.974585,  y: 26.2517633 }
];

console.log("Original points:", points.length);
// Try different tolerance levels
const simplifiedLow = simplify(points, 0.00001, true); // keeps more detail
const simplifiedMid = simplify(points, 0.0001, true);  // moderate
const simplifiedHigh = simplify(points, 0.001, true);  // very aggressive

const route=simplifiedLow;
console.log("Route points:", route);

console.log("Low tolerance:", simplifiedLow.length, "points");
console.log("Mid tolerance:", simplifiedMid.length, "points");
console.log("High tolerance:", simplifiedHigh.length, "points");
