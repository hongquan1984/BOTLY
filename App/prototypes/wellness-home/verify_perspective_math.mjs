import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

export function computeHomography(w, h, p0, p1, p2, p3) {
  const x0 = p0.x, y0 = p0.y;
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;

  let a, b, c, d, e, f, g, h_val;
  if (Math.abs(dx3) < 1e-7 && Math.abs(dy3) < 1e-7) {
    a = x1 - x0;
    b = x3 - x0;
    c = x0;
    d = y1 - y0;
    e = y3 - y0;
    f = y0;
    g = 0;
    h_val = 0;
  } else {
    const det = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(det) < 1e-7) return null;
    g = (dx3 * dy2 - dx2 * dy3) / det;
    h_val = (dx1 * dy3 - dx3 * dy1) / det;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + h_val * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + h_val * y3;
    f = y0;
  }

  return [
    a / w, d / w, 0, g / w,
    b / h, e / h, 0, h_val / h,
    0, 0, 1, 0,
    c, f, 0, 1
  ];
}

// Verification function: maps (u, v) using matrix3d column-major
export function projectPoint(m, u, v) {
  // m is 16 elements column-major:
  // m[0]=m11, m[1]=m12, m[3]=m14
  // m[4]=m21, m[5]=m22, m[7]=m24
  // m[12]=m41, m[13]=m42, m[15]=m44
  const x_prime = m[0] * u + m[4] * v + m[12];
  const y_prime = m[1] * u + m[5] * v + m[13];
  const w_prime = m[3] * u + m[7] * v + m[15];

  return {
    x: x_prime / w_prime,
    y: y_prime / w_prime
  };
}

const w = 400, h = 300;
const p0 = { x: 120, y: 80 };  // TL
const p1 = { x: 420, y: 120 }; // TR
const p2 = { x: 450, y: 380 }; // BR
const p3 = { x: 80, y: 340 };  // BL

const m = computeHomography(w, h, p0, p1, p2, p3);
console.log("Calculated Matrix3D:", m);

// Test mapping the 4 corners:
const mappedTL = projectPoint(m, 0, 0);
const mappedTR = projectPoint(m, w, 0);
const mappedBR = projectPoint(m, w, h);
const mappedBL = projectPoint(m, 0, h);

console.log("Mapped TL (expected", p0, "):", mappedTL);
console.log("Mapped TR (expected", p1, "):", mappedTR);
console.log("Mapped BR (expected", p2, "):", mappedBR);
console.log("Mapped BL (expected", p3, "):", mappedBL);

assert.ok(Math.abs(mappedTL.x - p0.x) < 1e-4 && Math.abs(mappedTL.y - p0.y) < 1e-4, "TL must match");
assert.ok(Math.abs(mappedTR.x - p1.x) < 1e-4 && Math.abs(mappedTR.y - p1.y) < 1e-4, "TR must match");
assert.ok(Math.abs(mappedBR.x - p2.x) < 1e-4 && Math.abs(mappedBR.y - p2.y) < 1e-4, "BR must match");
assert.ok(Math.abs(mappedBL.x - p3.x) < 1e-4 && Math.abs(mappedBL.y - p3.y) < 1e-4, "BL must match");

console.log("MATHEMATICAL HOMOGRAPHY PROJECTIVE VERIFICATION: 100% PERFECT!");
