import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { authenticateRequest } from '../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'SALES', 'PURCHASE', 'MANUFACTURING', 'INVENTORY']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'sales';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    let data: any[] = [];
    let columns: string[] = [];

    switch (type) {
      case 'sales': {
        const orders = await db.salesOrder.findMany({
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          include: { customer: { select: { name: true, email: true } }, items: true },
          orderBy: { createdAt: 'desc' },
        });
        columns = ['Order Number', 'Customer', 'Status', 'Items', 'Subtotal', 'Payment Status', 'Date'];
        data = orders.map((o) => ({
          'Order Number': o.orderNumber,
          'Customer': o.customer.name,
          'Status': o.status,
          'Items': o.items.length,
          'Subtotal': o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toFixed(2),
          'Payment Status': o.paymentStatus || 'PENDING',
          'Date': o.createdAt.toISOString().split('T')[0],
        }));
        break;
      }
      case 'purchase': {
        const orders = await db.purchaseOrder.findMany({
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          include: { vendor: { select: { name: true } }, items: true },
          orderBy: { createdAt: 'desc' },
        });
        columns = ['Order Number', 'Vendor', 'Status', 'Items', 'Total Value', 'Date'];
        data = orders.map((o) => ({
          'Order Number': o.orderNumber,
          'Vendor': o.vendor.name,
          'Status': o.status,
          'Items': o.items.length,
          'Total Value': o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toFixed(2),
          'Date': o.createdAt.toISOString().split('T')[0],
        }));
        break;
      }
      case 'manufacturing': {
        const orders = await db.manufacturingOrder.findMany({
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          include: { product: { select: { name: true, sku: true } } },
          orderBy: { createdAt: 'desc' },
        });
        columns = ['MO Number', 'Product', 'SKU', 'Quantity', 'Status', 'Date'];
        data = orders.map((o) => ({
          'MO Number': o.moNumber,
          'Product': o.product.name,
          'SKU': o.product.sku,
          'Quantity': o.quantity,
          'Status': o.status,
          'Date': o.createdAt.toISOString().split('T')[0],
        }));
        break;
      }
      case 'inventory': {
        const products = await db.product.findMany({
          orderBy: { stockQty: 'asc' },
        });
        columns = ['SKU', 'Name', 'Category', 'Stock Qty', 'Reserved Qty', 'Reorder Level', 'Cost Price', 'Selling Price', 'Inventory Value'];
        data = products.map((p) => ({
          'SKU': p.sku,
          'Name': p.name,
          'Category': p.category,
          'Stock Qty': p.stockQty,
          'Reserved Qty': p.reservedQty,
          'Reorder Level': p.reorderLevel,
          'Cost Price': p.costPrice.toFixed(2),
          'Selling Price': p.sellingPrice.toFixed(2),
          'Inventory Value': (p.costPrice * p.stockQty).toFixed(2),
        }));
        break;
      }
      case 'customers': {
        const customers = await db.customer.findMany({
          include: {
            salesOrders: { include: { items: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        columns = ['Code', 'Name', 'Email', 'Phone', 'Total Orders', 'Total Revenue', 'Points', 'Active', 'Joined'];
        data = customers.map((c) => {
          const revenue = c.salesOrders
            .filter((o) => o.status === 'FULLY_DELIVERED')
            .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), 0);
          return {
            'Code': c.customerCode,
            'Name': c.name,
            'Email': c.email,
            'Phone': c.phone || '',
            'Total Orders': c.salesOrders.length,
            'Total Revenue': revenue.toFixed(2),
            'Points': c.loyaltyPoints,
            'Active': c.isActive ? 'Yes' : 'No',
            'Joined': c.createdAt.toISOString().split('T')[0],
          };
        });
        break;
      }
      case 'returns': {
        const returns = await db.returnRequest.findMany({
          where: Object.keys(dateFilter).length > 0 ? { requestedAt: dateFilter } : {},
          include: {
            customer: { select: { name: true, email: true } },
            salesOrder: { select: { orderNumber: true } },
          },
          orderBy: { requestedAt: 'desc' },
        });
        columns = ['Return Number', 'Order', 'Customer', 'Reason', 'Status', 'Refund Amount', 'Requested At'];
        data = returns.map((r) => ({
          'Return Number': r.returnNumber,
          'Order': r.salesOrder.orderNumber,
          'Customer': r.customer.name,
          'Reason': r.reason,
          'Status': r.status,
          'Refund Amount': r.refundAmount?.toFixed(2) || '',
          'Requested At': r.requestedAt.toISOString().split('T')[0],
        }));
        break;
      }
      case 'revenue': {
        const orders = await db.salesOrder.findMany({
          where: { status: 'FULLY_DELIVERED', ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) },
          include: { items: true, customer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
        columns = ['Order Number', 'Customer', 'Subtotal', 'GST (18%)', 'Total', 'Payment Status', 'Date'];
        data = orders.map((o) => {
          const sub = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
          const gst = sub * 0.18;
          return {
            'Order Number': o.orderNumber,
            'Customer': o.customer.name,
            'Subtotal': sub.toFixed(2),
            'GST (18%)': gst.toFixed(2),
            'Total': (sub + gst).toFixed(2),
            'Payment Status': o.paymentStatus || 'PENDING',
            'Date': o.createdAt.toISOString().split('T')[0],
          };
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    const format = searchParams.get('format') || 'json';

    if (format === 'csv') {
      const csv = [
        columns.join(','),
        ...data.map((row) => columns.map((col) => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ type, columns, data, count: data.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
