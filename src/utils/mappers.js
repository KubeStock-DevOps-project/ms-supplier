// Mapper for the Supplier model
function toApiSupplier(supplier) {
  if (!supplier) return null;
  return {
    id: supplier.id,
    user_id: supplier.userId,
    company_name: supplier.companyName,
    contact_name: supplier.contactName,
    contact_email: supplier.contactEmail,
    contact_phone: supplier.contactPhone,
    address: supplier.address || null,
    contracts: supplier.contracts || null,
    version: supplier.version,
    created_at: supplier.createdAt,
    updated_at: supplier.updatedAt,
  };
}

// Mapper for the PurchaseOrder model
function toApiPurchaseOrder(po) {
  if (!po) return null;
  return {
    id: po.id,
    supplier_id: po.supplierId,
    reference: po.reference,
    status: po.status,
    items: po.items || [],
    totals: po.totals || null,
    shipping_address: po.shippingAddress || null,
    notes: po.notes,
    version: po.version,
    created_at: po.createdAt,
    updated_at: po.updatedAt,
  };
}

module.exports = {
  toApiSupplier,
  toApiPurchaseOrder,
};