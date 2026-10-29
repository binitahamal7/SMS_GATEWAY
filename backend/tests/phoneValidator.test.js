import { describe, it, expect } from "vitest";
import { phoneValidator } from "../helpers/phoneValidator.js";

describe("test for valid-numbers", () => {
  it("accepts 10 digits phone number starting with 97", () => {
    expect(phoneValidator("9734567999")).toBe("9734567999");
  });

  it("accepts 10 digits phone number starting with 98", () => {
    expect(phoneValidator("9834567999")).toBe("9834567999");
  });

  it("removes the +977 prefix", () => {
    expect(phoneValidator("+9779734567899")).toBe("9734567899");
  });
  it("removes the 977 prefix", () => {
    expect(phoneValidator("9779734567999")).toBe("9734567999");
  });

  it("trims the extra spaces around the number ", () => {
    expect(phoneValidator(" 9834567999 ")).toBe("9834567999");
  });
});


describe("test for invalid-numbers", () => {
  it("don't accepts 10 digits phone number that does'nt start with 97 or 98", () => {
    expect(phoneValidator("9434567999")).toBe(false);
  });

  it("don't accepts number with only 9 digits", () => {
    expect(phoneValidator("983456799")).toBe(false);
  });

  it("don't accepts number more than 10 digits", () => {
    expect(phoneValidator("98345689394394799")).toBe(false);
  });
});
