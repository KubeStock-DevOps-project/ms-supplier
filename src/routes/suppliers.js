const express = require("express");
const suppliersService = require("../services/suppliers.service"); // Import your service

const router = express.Router();

// --- Supplier Routes ---

// POST /suppliers
router.post("/suppliers", async (req, res, next) => {
  try {
    const newSupplier = await suppliersService.createSupplier(req.body);
    // Respond with 201 Created
    return res.status(201).json(newSupplier);
  } catch (e) {
    next(e); // Pass errors (like 409 Conflict) to the error handler
  }
});

// GET /suppliers
router.get("/suppliers", async (req, res, next) => {
  try {
    const params = {
      page: Math.max(1, parseInt(req.query.page || "1", 10)),
      size: Math.max(1, Math.min(200, parseInt(req.query.size || "25", 10))),
    };
    const result = await suppliersService.listSuppliers(params);
    return res.json(result);
  } catch (e) {
    next(e);
  }
});

// GET /suppliers/{supplierId}
router.get("/suppliers/:supplierId", async (req, res, next) => {
  try {
    // We will implement this function in the service file next
    const supplier = await suppliersService.getSupplierById(
      req.params.supplierId
    );
    if (!supplier) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Supplier not found" });
    }
    return res.json(supplier);
  } catch (e) {
    next(e); // Pass errors to your central error handler
  }
});

// PATCH /suppliers/{supplierId}
router.patch("/suppliers/:supplierId", async (req, res, next) => {
  try {
    const ifMatch = req.header("If-Match");
    const supplier = await suppliersService.updateSupplier(
      req.params.supplierId,
      req.body || {},
      ifMatch
    );
    return res.json(supplier);
  } catch (e) {
    next(e);
  }
});

// GET /suppliers/{supplierId}/audit
router.get("/suppliers/:supplierId/audit", async (req, res, next) => {
  try {
    const result = await suppliersService.getAuditForSupplier(
      req.params.supplierId
    );
    return res.json(result);
  } catch (e) {
    next(e);
  }
});

// --- Purchase Order Routes ---

// GET /purchase-orders (Admin route)
router.get("/purchase-orders", async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      supplier_id: req.query.supplier_id,
    };
    const result = await suppliersService.listAllPurchaseOrders(filters);
    return res.json(result);
  } catch (e) {
    next(e);
  }
});

// POST /purchase-orders
router.post("/purchase-orders", async (req, res, next) => {
  try {
    const newPO = await suppliersService.createPurchaseOrder(req.body);
    // Respond with 201 Created
    return res.status(201).json(newPO);
  } catch (e) {
    next(e); // Pass errors (like 404 Not Found) to the error handler
  }
});

// GET /suppliers/{supplierId}/purchase-orders (Supplier-specific route)
router.get("/suppliers/:supplierId/purchase-orders", async (req, res, next) => {
  try {
    const result = await suppliersService.listPurchaseOrdersForSupplier(
      req.params.supplierId
    );
    return res.json(result);
  } catch (e) {
    next(e);
  }
});

// GET /purchase-orders/{poId}
router.get("/purchase-orders/:poId", async (req, res, next) => {
  try {
    const po = await suppliersService.getPurchaseOrderById(req.params.poId);
    if (!po) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Purchase Order not found" });
    }
    return res.json(po);
  } catch (e) {
    next(e);
  }
});

// PATCH /purchase-orders/{poId}
router.patch("/purchase-orders/:poId", async (req, res, next) => {
  try {
    const ifMatch = req.header("If-Match");
    const po = await suppliersService.updatePurchaseOrderStatus(
      req.params.poId,
      req.body || {},
      ifMatch
    );
    return res.json(po);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
