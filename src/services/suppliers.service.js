const { v4: uuidv4 } = require("uuid");
const prisma = require("../../prisma/prisma.js");
const { toApiSupplier, toApiPurchaseOrder } = require("../utils/mappers");

async function createSupplier(body) {
  const supplierId = uuidv4();

  try {
    const newSupplier = await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: body.user_id,
        },
      });

      const supplier = await tx.supplier.create({
        data: {
          id: supplierId,
          userId: body.user_id,
          companyName: body.company_name,
          contactName: body.contact_name,
          contactEmail: body.contact_email,
          contactPhone: body.contact_phone,
          address: body.address || null,
          contracts: body.contracts || null,
          version: 1,
        },
      });

      // --- AUDIT LOG ---
      // Log this creation event
      await tx.auditEntry.create({
        data: {
          id: uuidv4(),
          supplierId: supplierId,
          actor: "system", // In a real app, this would be the logged-in user's ID
          action: "supplier.created",
          details: {
            user_id: body.user_id,
            company_name: body.company_name,
          },
        },
      });
      // --- END AUDIT LOG ---

      return supplier;
    });

    return toApiSupplier(newSupplier);
  } catch (e) {
    if (e.code === "P2002") {
      const err = new Error(
        "A supplier profile already exists for this user_id"
      );
      err.status = 409;
      err.code = "CONFLICT";
      throw err;
    }
    throw e;
  }
}

async function listSuppliers(params) {
  const { page = 1, size = 25 } = params;

  const where = {};

  const [total, suppliers] = await prisma.$transaction([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
  ]);

  return {
    items: suppliers.map(toApiSupplier),
    pagination: {
      page,
      size,
      total,
      next_page: page * size < total ? String(page + 1) : null,
    },
  };
}

async function getSupplierById(supplierId) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId },
  });

  if (!supplier) {
    return null;
  }

  return toApiSupplier(supplier);
}

async function updateSupplier(supplierId, data, ifMatch) {
  const existing = await prisma.supplier.findFirst({
    where: { id: supplierId },
    select: { version: true },
  });

  if (!existing) {
    const err = new Error("Supplier not found");
    err.status = 404;
    throw err;
  }

  if (ifMatch && String(existing.version) !== String(ifMatch)) {
    const err = new Error("Version conflict");
    err.status = 409;
    err.code = "VERSION_CONFLICT";
    throw err;
  }

  const updatedSupplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      companyName: data.company_name,
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      address: data.address,
      contracts: data.contracts,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  // --- AUDIT LOG ---
  // Log this update event
  await prisma.auditEntry.create({
    data: {
      id: uuidv4(),
      supplierId: supplierId,
      actor: "system",
      action: "supplier.profile_updated",
      details: {
        fields_changed: Object.keys(data), // Log which fields were in the payload
      },
    },
  });
  // --- END AUDIT LOG ---

  return toApiSupplier(updatedSupplier);
}

async function getAuditForSupplier(supplierId) {
  // 1. Check if supplier exists
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId },
    select: { id: true },
  });

  if (!supplier) {
    const err = new Error("Supplier not found");
    err.status = 404;
    throw err;
  }

  // 2. Find all audit entries for this supplier
  const entries = await prisma.auditEntry.findMany({
    where: { supplierId: supplierId },
    orderBy: { timestamp: "asc" }, // Show oldest first
  });

  // 3. Return them
  return { entries };
}

async function listPurchaseOrdersForSupplier(supplierId) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId },
    select: { id: true },
  });

  if (!supplier) {
    const err = new Error("Supplier not found");
    err.status = 404;
    throw err;
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      supplierId: supplierId,
      deleted: false,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    items: purchaseOrders.map(toApiPurchaseOrder),
  };
}

async function listAllPurchaseOrders(filters = {}) {
  const where = { deleted: false };
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.supplier_id) {
    where.supplierId = filters.supplier_id;
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return {
    items: purchaseOrders.map(toApiPurchaseOrder),
  };
}

async function getPurchaseOrderById(poId) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, deleted: false },
  });

  if (!po) {
    return null;
  }

  return toApiPurchaseOrder(po);
}

async function updatePurchaseOrderStatus(poId, payload, ifMatch) {
  const existing = await prisma.purchaseOrder.findFirst({
    where: { id: poId, deleted: false },
    select: { version: true, status: true, supplierId: true }, // Get supplierId for audit
  });

  if (!existing) {
    const err = new Error("Purchase Order not found");
    err.status = 404;
    throw err;
  }

  if (ifMatch && String(existing.version) !== String(ifMatch)) {
    const err = new Error("Version conflict");
    err.status = 409;
    err.code = "VERSION_CONFLICT";
    throw err;
  }

  const updatedPO = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      status: payload.status,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  // --- AUDIT LOG ---
  // Log this PO status change
  await prisma.auditEntry.create({
    data: {
      id: uuidv4(),
      supplierId: existing.supplierId, // Attach log to the main supplier
      actor: "system",
      action: "po.status_updated",
      details: {
        po_id: poId,
        old_status: existing.status,
        new_status: payload.status,
        tracking: payload.tracking_number,
      },
    },
  });
  // --- END AUDIT LOG ---

  return toApiPurchaseOrder(updatedPO);
}

async function createPurchaseOrder(body) {
  const poId = uuidv4();

  // 1. Check if the supplier exists
  const supplier = await prisma.supplier.findFirst({
    where: { id: body.supplier_id },
    select: { id: true },
  });

  if (!supplier) {
    const err = new Error("Supplier not found");
    err.status = 404; // 404 Not Found
    err.code = "NOT_FOUND";
    throw err;
  }

  // 2. Create the Purchase Order
  const newPO = await prisma.purchaseOrder.create({
    data: {
      id: poId,
      supplierId: body.supplier_id,
      reference: body.reference || null,
      status: body.status || "ISSUED", // Default to "ISSUED"
      items: body.items || [],
      totals: body.totals || {},
      shippingAddress: body.shipping_address || null,
      notes: body.notes || null,
      version: 1,
    },
  });

  // 3. Create an audit log for this
  await prisma.auditEntry.create({
    data: {
      id: uuidv4(),
      supplierId: body.supplier_id, // Link the log to the supplier
      actor: "system",
      action: "po.created",
      details: {
        po_id: poId,
        reference: body.reference,
        status: newPO.status,
      },
    },
  });

  // 4. Return the new PO
  return toApiPurchaseOrder(newPO);
}

module.exports = {
  createSupplier,
  listSuppliers,
  getSupplierById,
  updateSupplier,
  getAuditForSupplier,
  createPurchaseOrder,
  listPurchaseOrdersForSupplier,
  listAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
};