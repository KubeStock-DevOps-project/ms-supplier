const request = require("supertest");
const app = require("../app");
const suppliersService = require("../services/suppliers.service");

// Mock the suppliers service
jest.mock("../services/suppliers.service");

describe("Integration Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /suppliers", () => {
    it("should return a list of suppliers", async () => {
      const mockSuppliers = {
        data: [{ id: 1, name: "Test Supplier" }],
        meta: { page: 1, size: 25 },
      };
      suppliersService.listSuppliers.mockResolvedValue(mockSuppliers);

      const res = await request(app).get("/suppliers");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockSuppliers);
      expect(suppliersService.listSuppliers).toHaveBeenCalledTimes(1);
    });

    it("should handle errors gracefully", async () => {
      suppliersService.listSuppliers.mockRejectedValue(
        new Error("Database error")
      );

      const res = await request(app).get("/suppliers");

      // Assuming your error handler returns 500 for unknown errors
      expect(res.statusCode).toBe(500);
    });
  });

  describe("POST /suppliers", () => {
    it("should create a new supplier", async () => {
      const newSupplier = { name: "New Supplier", email: "test@example.com" };
      const createdSupplier = { id: 1, ...newSupplier };
      suppliersService.createSupplier.mockResolvedValue(createdSupplier);

      const res = await request(app).post("/suppliers").send(newSupplier);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(createdSupplier);
      expect(suppliersService.createSupplier).toHaveBeenCalledWith(newSupplier);
    });
  });
});
