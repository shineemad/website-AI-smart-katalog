import { BadRequestException } from "@nestjs/common";
import { buildProductFilter, validateImage } from "./products.service";

describe("buildProductFilter", () => {
  it("kosong bila tanpa query", () => {
    expect(buildProductFilter({})).toEqual({});
  });

  it("filter category case-insensitive exact", () => {
    expect(buildProductFilter({ category: "laptop" })).toEqual({
      category: { $regex: "^laptop$", $options: "i" },
    });
  });

  it("filter rentang harga", () => {
    expect(buildProductFilter({ minPrice: 1000, maxPrice: 5000 })).toEqual({
      price: { $gte: 1000, $lte: 5000 },
    });
  });

  it("hanya maxPrice", () => {
    expect(buildProductFilter({ maxPrice: 5000 })).toEqual({
      price: { $lte: 5000 },
    });
  });
});

describe("validateImage", () => {
  const file = (mimetype: string, size: number) =>
    ({ mimetype, size }) as Express.Multer.File;

  it("lolos tanpa file", () => {
    expect(() => validateImage(undefined)).not.toThrow();
  });

  it("lolos untuk png < 5MB", () => {
    expect(() => validateImage(file("image/png", 1024))).not.toThrow();
  });

  it("tolak tipe selain png/jpeg", () => {
    expect(() => validateImage(file("image/gif", 1024))).toThrow(
      BadRequestException,
    );
  });

  it("tolak file > 5MB", () => {
    expect(() => validateImage(file("image/jpeg", 6 * 1024 * 1024))).toThrow(
      BadRequestException,
    );
  });
});
