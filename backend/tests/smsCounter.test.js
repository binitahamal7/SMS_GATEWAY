import { describe, it, expect } from "vitest";
import { findEncoding, findCost } from "../helpers/smsCounter.js";

describe("findEncoding", () => {
  it("returns GSM-7 for simple English text", () => {
    expect(findEncoding("Hello World")).toBe("GSM-7");
  });

  it("returns Unicode for Nepali text", () => {
    expect(findEncoding("नमस्ते संसार")).toBe("Unicode");
  });
});

describe("find actual cost ( parts ) - GSM-7", () => {
  it("counts exactly 160 characters as part 1", () => {
    expect(findCost("a".repeat(160))).toBe(1);
  });

   it("counts 200 characters message as parts 2", () => {
    expect(findCost("a".repeat(200))).toBe(2);
  });

   it("counts 400 characters message as parts 3", () => {
    expect(findCost("a".repeat(400))).toBe(3);
  });
 
});


describe("find actual cost ( parts ) - Unicode", () => {
  it("counts exaclty 70 characters as part 1", () => {
    expect(findCost("क".repeat(70))).toBe(1);
  });

   it("counts 71 characters message as parts 2", () => {
    expect(findCost("क".repeat(71))).toBe(2);
  });

 
});