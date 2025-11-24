const request = require("supertest");
const { mockDeep } = require("jest-mock-extended");
const app = require("../src/app");
const prisma = require("../prisma/prisma");

// Mock the Prisma client
jest.mock("../prisma/prisma", () => mockDeep());

describe("Supplier API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /suppliers", () => {
    it("should create a new supplier successfully (201)", async () => {
      const payload = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        company_name: "Test Company",
        contact_name: "John Doe",
        contact_email: "john@example.com",
        contact_phone: "1234567890",
      };

      // Mock transaction result
      prisma.$transaction.mockResolvedValue({
        id: "supplier-uuid",
        userId: payload.user_id,
        companyName: payload.company_name,
        contactName: payload.contact_name,
        contactEmail: payload.contact_email,
        contactPhone: payload.contact_phone,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post("/suppliers").send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id", "supplier-uuid");
      expect(res.body.company_name).toBe(payload.company_name);
    });

    it("should return 409 if supplier already exists", async () => {
      const payload = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        company_name: "Test Company",
      };

      const error = new Error("Unique constraint failed");
      error.code = "P2002";
      prisma.$transaction.mockRejectedValue(error);

      const res = await request(app).post("/suppliers").send(payload);

      expect(res.statusCode).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
    });
  });

  describe("GET /suppliers", () => {
    it("should return a list of suppliers (200)", async () => {
      prisma.$transaction.mockResolvedValue([
        1, // total count
        [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            companyName: "Supplier 1",
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ]);

      const res = await request(app).get("/suppliers");

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe("GET /suppliers/:id", () => {
    it("should return a supplier by ID (200)", async () => {
      prisma.supplier.findFirst.mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174000",
        companyName: "Supplier 1",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).get(
        "/suppliers/123e4567-e89b-12d3-a456-426614174000"
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should return 404 if supplier not found", async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      const res = await request(app).get(
        "/suppliers/123e4567-e89b-12d3-a456-426614174000"
      );

      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /suppliers/:id", () => {
    it("should update a supplier successfully (200)", async () => {
      prisma.supplier.findFirst.mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: 1,
      });

      prisma.supplier.update.mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174000",
        companyName: "Updated Name",
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .patch("/suppliers/123e4567-e89b-12d3-a456-426614174000")
        .send({ company_name: "Updated Name" });

      expect(res.statusCode).toBe(200);
      expect(res.body.company_name).toBe("Updated Name");
    });

    it("should return 404 if supplier to update not found", async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .patch("/suppliers/123e4567-e89b-12d3-a456-426614174000")
        .send({ company_name: "Updated Name" });

      expect(res.statusCode).toBe(404);
    });

    it("should return 409 on version conflict", async () => {
      prisma.supplier.findFirst.mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: 2, // Current version is 2
      });

      const res = await request(app)
        .patch("/suppliers/123e4567-e89b-12d3-a456-426614174000")
        .set("If-Match", "1") // Client thinks version is 1
        .send({ company_name: "Updated Name" });

      expect(res.statusCode).toBe(409);
      expect(res.body.code).toBe("VERSION_CONFLICT");
    });
  });
});
