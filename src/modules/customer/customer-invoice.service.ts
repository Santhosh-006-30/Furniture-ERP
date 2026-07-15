import { db } from '../../lib/db';
import { logger } from '../../lib/pino';
import { EmailService } from '../../lib/email';

export interface CustomerInvoiceItemView {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gst: number;
  lineTotal: number;
}

export interface CustomerInvoiceViewModel {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerCompany?: string | null;
  customerAddress?: string | null;
  billingAddress: string;
  shippingAddress: string;
  gstNumber?: string | null;
  subtotal: number;
  gst: number;
  shipping: number;
  discount: number;
  grandTotal: number;
  paymentStatus: string;
  paymentStatusBadge: string;
  status: string;
  items: CustomerInvoiceItemView[];
  paymentId?: string | null;
  paymentGateway?: string | null;
  paidAt?: string | null;
  transactionReference?: string | null;
}

export class CustomerInvoiceService {
  static async getCustomerInvoices(userId: string, options: { search?: string; sort?: string; page?: number; pageSize?: number } = {}) {
    const customer = await db.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw new Error('Customer profile not found or linked.');
    }

    const eligibleOrderIds = await this.getEligibleOrderIds(customer.id);
    if (!eligibleOrderIds.length) {
      return { invoices: [], pagination: { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 } };
    }

    const orders = await db.salesOrder.findMany({
      where: { id: { in: eligibleOrderIds }, customerId: customer.id },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const invoices = [] as CustomerInvoiceViewModel[];
    for (const order of orders) {
      const invoice = await this.ensureInvoiceForOrder(customer, order);
      if (invoice) {
        invoices.push(invoice);
      }
    }

    let filtered = invoices.filter((invoice) => {
      const query = (options.search || '').trim().toLowerCase();
      if (!query) return true;
      return invoice.invoiceNumber.toLowerCase().includes(query) || invoice.orderNumber.toLowerCase().includes(query);
    });

    filtered = filtered.sort((a, b) => {
      switch (options.sort) {
        case 'oldest':
          return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
        case 'lowest_amount':
          return a.grandTotal - b.grandTotal;
        case 'highest_amount':
          return b.grandTotal - a.grandTotal;
        case 'newest':
        default:
          return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
      }
    });

    const pageSize = Math.max(1, Number(options.pageSize ?? 8));
    const page = Math.max(1, Number(options.page ?? 1));
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;

    return {
      invoices: filtered.slice(startIndex, startIndex + pageSize),
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  static async getCustomerInvoiceById(userId: string, orderId: string) {
    const customer = await db.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw new Error('Customer profile not found or linked.');
    }

    const order = await db.salesOrder.findFirst({
      where: { id: orderId, customerId: customer.id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new Error('Invoice not found or access denied.');
    }

    const invoice = await this.ensureInvoiceForOrder(customer, order);
    if (!invoice) {
      throw new Error('Invoice is not available for this order yet.');
    }

    return invoice;
  }

  private static async getEligibleOrderIds(customerId: string) {
    const deliveredOrders = await db.salesOrder.findMany({
      where: { customerId, status: 'FULLY_DELIVERED' },
      select: { id: true },
    });

    const paidOrders = await db.salesOrder.findMany({
      where: { customerId, paymentStatus: 'PAID' },
      select: { id: true },
    });

    const invoiceGeneratedLogs = await db.auditLog.findMany({
      where: { action: 'GENERATE_INVOICE' },
      select: { entity: true },
    });

    const orderNumbers = invoiceGeneratedLogs
      .map((log) => log.entity?.replace('SalesOrder:', '') || '')
      .filter(Boolean);

    const markedOrders = orderNumbers.length
      ? await db.salesOrder.findMany({
          where: { customerId, orderNumber: { in: orderNumbers } },
          select: { id: true },
        })
      : [];

    return Array.from(new Set([
      ...deliveredOrders.map((order) => order.id),
      ...paidOrders.map((order) => order.id),
      ...markedOrders.map((order) => order.id)
    ]));
  }

  private static async ensureInvoiceForOrder(customer: any, order: any) {
    const isEligible = order.status === 'FULLY_DELIVERED' || order.paymentStatus === 'PAID' || (await this.hasInvoiceGenerationLog(order.orderNumber));
    if (!isEligible) {
      return null;
    }

    const existingInvoiceLog = await db.auditLog.findFirst({
      where: { action: 'GENERATE_INVOICE', entity: `SalesOrder:${order.orderNumber}` },
    });

    const invoiceNumber = existingInvoiceLog?.newValues
      ? JSON.parse(existingInvoiceLog.newValues).invoiceNumber
      : await this.createInvoiceNumber();

    if (!existingInvoiceLog) {
      const generatedInvoiceNumber = await this.createInvoiceNumber();
      await db.auditLog.create({
        data: {
          userId: customer.userId,
          userName: customer.name,
          action: 'GENERATE_INVOICE',
          entity: `SalesOrder:${order.orderNumber}`,
          oldValues: JSON.stringify({ status: order.status }),
          newValues: JSON.stringify({ invoiceNumber: generatedInvoiceNumber }),
        },
      });

      if (customer.userId) {
        const subtotal = order.items.reduce((acc: number, item: any) => {
          const price = item.product?.sellingPrice ?? item.unitPrice ?? 0;
          return acc + price * item.quantity;
        }, 0);
        const gstRate = 0.18;
        const tax = Math.round(subtotal * gstRate * 100) / 100;
        const shipping = subtotal >= 50000 ? 0 : 500;
        const grandTotal = subtotal + tax + shipping;

        const emailHtml = EmailService.getInvoiceGeneratedTemplate(generatedInvoiceNumber, order.orderNumber, grandTotal);
        await EmailService.send({
          to: customer.email,
          subject: `Invoice Issued - ${generatedInvoiceNumber}`,
          html: emailHtml,
          userId: customer.userId,
          notificationTitle: 'Invoice Generated',
          notificationMessage: `Invoice ${generatedInvoiceNumber} is ready for order ${order.orderNumber}.`,
          referenceId: order.id,
          referenceType: 'SalesOrder',
        });
      }

      logger.info({ orderId: order.id, invoiceNumber: generatedInvoiceNumber }, 'Invoice generated for customer order');
    }

    const invoiceView = this.buildInvoiceViewModel(customer, order, invoiceNumber);
    return invoiceView;
  }

  private static async hasInvoiceGenerationLog(orderNumber: string) {
    const log = await db.auditLog.findFirst({
      where: { action: 'GENERATE_INVOICE', entity: `SalesOrder:${orderNumber}` },
    });
    return Boolean(log);
  }

  private static async createInvoiceNumber() {
    const count = await db.auditLog.count({ where: { action: 'GENERATE_INVOICE' } });
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  private static buildInvoiceViewModel(customer: any, order: any, invoiceNumber: string) {
    const subtotal = order.items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const discount = 0;
    const gst = Math.round(subtotal * 0.18 * 100) / 100;
    const shipping = subtotal >= 50000 ? 0 : 500;
    const grandTotal = subtotal + gst + shipping - discount;
    const paymentStatus = order.paymentStatus === 'PAID' || order.status === 'FULLY_DELIVERED' ? 'PAID' : 'UNPAID';

    return {
      id: order.id,
      invoiceNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceDate: order.createdAt.toISOString(),
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerCompany: customer.companyName,
      customerAddress: customer.address,
      billingAddress: customer.address || 'To be confirmed',
      shippingAddress: customer.address || 'To be confirmed',
      gstNumber: customer.gstNumber,
      subtotal,
      gst,
      shipping,
      discount,
      grandTotal,
      paymentStatus,
      paymentStatusBadge: paymentStatus,
      status: order.status,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        gst: Math.round(item.unitPrice * item.quantity * 0.18 * 100) / 100,
        lineTotal: Math.round((item.unitPrice * item.quantity + item.unitPrice * item.quantity * 0.18) * 100) / 100,
      })),
      paymentId: order.paymentId,
      paymentGateway: order.paymentGateway,
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      transactionReference: order.transactionReference,
    } satisfies CustomerInvoiceViewModel;
  }
}
