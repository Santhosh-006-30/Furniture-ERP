import { db } from '../../lib/db';
import { SalesWorkflowService } from '../sales/sales-workflow.service';
import { logger } from '../../lib/pino';
import { EmailService } from '../../lib/email';

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
}

export interface CustomerOrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
  itemCount: number;
  paymentStatus: string;
  deliveryStatus: string;
  estimatedDelivery: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
}

export interface CustomerOrderDetailView {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
  paymentStatus: string;
  deliveryStatus: string;
  estimatedDelivery: string;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    companyName?: string | null;
    gstNumber?: string | null;
  };
  deliveryAddress: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    gst: number;
    lineTotal: number;
  }>;
  timeline: Array<{
    stage: string;
    completed: boolean;
    timestamp?: string | null;
  }>;
  paymentId?: string | null;
  paymentGateway?: string | null;
  paidAt?: string | null;
  transactionReference?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  dispatchDate?: string | null;
  deliveryDate?: string | null;
  trackingStatus?: string | null;
}

export class CustomerOrderService {
  static async getCustomerOrders(userId: string, options: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const customer = await db.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw new Error('Customer profile not found or linked.');
    }

    const whereClause: any = { customerId: customer.id };
    if (options.search?.trim()) {
      whereClause.orderNumber = { contains: options.search.trim() };
    }
    if (options.status) {
      whereClause.status = options.status;
    }
    if (options.dateFrom || options.dateTo) {
      whereClause.createdAt = {};
      if (options.dateFrom) {
        whereClause.createdAt.gte = new Date(options.dateFrom);
      }
      if (options.dateTo) {
        const end = new Date(options.dateTo);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    const orders = await db.salesOrder.findMany({
      where: whereClause,
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappedOrders = orders.map((order) => {
      const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const shipping = subtotal >= 50000 ? 0 : 500;
      const grandTotal = subtotal + tax + shipping;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        subtotal,
        tax,
        shipping,
        grandTotal,
        itemCount: order.items.length,
        paymentStatus: this.getPaymentStatus(order.status, order.paymentStatus),
        deliveryStatus: this.getDeliveryStatus(order.status),
        estimatedDelivery: this.getEstimatedDelivery(order.status),
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          product: item.product,
        })),
      } satisfies CustomerOrderListItem;
    });

    const filtered = this.applyOrderFilters(mappedOrders, options);
    const totalItems = filtered.length;
    const pageSize = Math.max(1, Number(options.pageSize ?? 8));
    const page = Math.max(1, Number(options.page ?? 1));
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pagedOrders = filtered.slice(startIndex, startIndex + pageSize);

    return {
      orders: pagedOrders,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  static async getCustomerOrderById(userId: string, orderId: string): Promise<CustomerOrderDetailView> {
    const customer = await db.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw new Error('Customer profile not found or linked.');
    }

    const order = await db.salesOrder.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
      },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found or access denied.');
    }

    const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const shipping = subtotal >= 50000 ? 0 : 500;
    const grandTotal = subtotal + tax + shipping;

    const procurementRequests = await db.procurementRequest.findMany({
      where: { sourceDocument: `SO-${order.id}` },
      select: { manufacturingOrderId: true, createdAt: true, status: true },
    });

    const manufacturingOrderIds = procurementRequests
      .map((request) => request.manufacturingOrderId)
      .filter((id): id is string => Boolean(id));

    const manufacturingOrders = manufacturingOrderIds.length
      ? await db.manufacturingOrder.findMany({
          where: { id: { in: manufacturingOrderIds } },
          select: { id: true, status: true, createdAt: true, moNumber: true },
        })
      : [];

    const auditLogs = await db.auditLog.findMany({
      where: {
        entity: { contains: order.orderNumber },
      },
      orderBy: { timestamp: 'asc' },
      take: 20,
    });

    const timeline = this.buildTimeline(order, auditLogs, manufacturingOrders);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      subtotal,
      tax,
      shipping,
      grandTotal,
      paymentStatus: this.getPaymentStatus(order.status, order.paymentStatus),
      deliveryStatus: this.getDeliveryStatus(order.status),
      estimatedDelivery: this.getEstimatedDelivery(order.status),
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        companyName: customer.companyName,
        gstNumber: customer.gstNumber,
      },
      deliveryAddress: customer.address || 'To be confirmed',
      paymentMethod: order.paymentGateway || 'To be confirmed',
      items: order.items.map((item) => ({
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
      timeline,
      paymentId: order.paymentId,
      paymentGateway: order.paymentGateway,
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      transactionReference: order.transactionReference,
      trackingNumber: order.trackingNumber,
      courierName: order.courierName,
      trackingUrl: order.trackingUrl,
      dispatchDate: order.dispatchDate ? order.dispatchDate.toISOString() : null,
      deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString() : null,
      trackingStatus: order.trackingStatus,
    } satisfies CustomerOrderDetailView;
  }

  static async cancelCustomerOrder(userId: string, orderId: string) {
    const customer = await db.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw new Error('Customer profile not found or linked.');
    }

    const order = await db.salesOrder.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
      },
    });

    if (!order) {
      throw new Error('Order not found or access denied.');
    }

    if (order.status !== 'DRAFT') {
      throw new Error('Only draft orders can be cancelled.');
    }

    const cancelledOrder = await SalesWorkflowService.cancelOrder(order.id, customer.name || 'Customer');
    return {
      orderId: cancelledOrder.id,
      orderNumber: cancelledOrder.orderNumber,
      status: cancelledOrder.status,
    };
  }

  private static applyOrderFilters(orders: CustomerOrderListItem[], options: { search?: string; status?: string; dateFrom?: string; dateTo?: string; sort?: string }) {
    const query = (options.search || '').trim().toLowerCase();
    let filtered = orders.filter((order) => {
      const matchesSearch = !query || order.orderNumber.toLowerCase().includes(query);
      const matchesStatus = !options.status || order.status === options.status;
      const createdAt = new Date(order.createdAt);
      const matchesDateFrom = !options.dateFrom || createdAt >= new Date(options.dateFrom);
      const matchesDateTo = !options.dateTo || createdAt <= new Date(`${options.dateTo}T23:59:59.999Z`);
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    filtered = filtered.sort((a, b) => {
      switch (options.sort) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest_amount':
          return b.grandTotal - a.grandTotal;
        case 'lowest_amount':
          return a.grandTotal - b.grandTotal;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }

  private static getPaymentStatus(status: string, dbPaymentStatus?: string | null) {
    if (dbPaymentStatus === 'PAID') return 'PAID';
    if (dbPaymentStatus === 'FAILED') return 'FAILED';
    switch (status) {
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return dbPaymentStatus || 'PENDING';
    }
  }

  private static getDeliveryStatus(status: string) {
    switch (status) {
      case 'DRAFT':
        return 'Order placed';
      case 'CONFIRMED':
        return 'Order confirmed';
      case 'PARTIALLY_DELIVERED':
        return 'Partially dispatched';
      case 'FULLY_DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'In progress';
    }
  }

  private static getEstimatedDelivery(status: string) {
    if (status === 'CANCELLED') return 'Cancelled';
    if (status === 'DRAFT') return 'Pending confirmation';
    if (status === 'CONFIRMED') return '3-7 business days';
    if (status === 'PARTIALLY_DELIVERED' || status === 'FULLY_DELIVERED') return 'Delivered';
    return '3-7 business days';
  }

  private static buildTimeline(order: any, auditLogs: Array<{ action: string; timestamp: Date }>, manufacturingOrders: Array<{ status: string; createdAt: Date }>) {
    const firstAudit = auditLogs[0]?.timestamp ?? order.createdAt;
    const confirmedAudit = auditLogs.find((log) => ['CONFIRM_SALES_ORDER', 'UPDATE_SALES_STATUS'].includes(log.action));
    const manufacturingAudit = auditLogs.find((log) => log.action.includes('MANUFACTUR'));

    const hasManufacturing = manufacturingOrders.length > 0 || ['CONFIRMED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED'].includes(order.status);
    const isReady = order.status === 'FULLY_DELIVERED' || order.status === 'PARTIALLY_DELIVERED' || manufacturingOrders.some((item) => item.status === 'DONE');
    const isDispatched = order.status === 'PARTIALLY_DELIVERED' || order.status === 'FULLY_DELIVERED';
    const isDelivered = order.status === 'FULLY_DELIVERED';

    return [
      { stage: 'Order Placed', completed: true, timestamp: firstAudit?.toISOString?.() ?? null },
      { stage: 'Order Confirmed', completed: ['CONFIRMED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED'].includes(order.status), timestamp: confirmedAudit?.timestamp?.toISOString?.() ?? null },
      { stage: 'Manufacturing', completed: hasManufacturing, timestamp: manufacturingAudit?.timestamp?.toISOString?.() ?? null },
      { stage: 'Ready for Dispatch', completed: isReady, timestamp: null },
      { stage: 'Dispatched', completed: isDispatched, timestamp: order.dispatchDate?.toISOString?.() ?? null },
      { stage: 'Delivered', completed: isDelivered, timestamp: order.deliveryDate?.toISOString?.() ?? null },
    ];
  }

  /**
   * Validates cart and creates a draft Sales Order.
   */
  static async checkout(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    couponCode?: string,
    loyaltyPointsUsed?: number
  ): Promise<CheckoutResult & { pointsEarned: number }> {
    // 1. Validate Customer
    const customer = await db.customer.findUnique({
      where: { userId },
    });
    if (!customer) {
      throw new Error('Customer profile not found or linked.');
    }
    if (!customer.isActive) {
      throw new Error('Your customer account is deactivated. Please contact operations.');
    }

    // 2. Validate Cart Empty State
    if (!items || items.length === 0) {
      throw new Error('Shopping cart is empty.');
    }

    const normalizedItems = items.map((item) => ({
      productId: item.productId?.trim(),
      quantity: Number(item.quantity),
    }));

    if (normalizedItems.some((item) => !item.productId)) {
      throw new Error('Every cart item needs a valid product reference.');
    }

    // Check for duplicate products in cart submission
    const productIds = normalizedItems.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new Error('Duplicate items detected in shopping cart payload.');
    }

    const validatedItems = [];
    let subtotal = 0;

    // Loop and validate each item in database
    for (const item of normalizedItems) {
      // 3. Validate quantites are positive and non-zero
      if (!Number.isFinite(item.quantity)) {
        throw new Error('Item quantity must be a valid number.');
      }
      if (item.quantity <= 0) {
        throw new Error('Item quantity must be greater than zero.');
      }
      if (!Number.isInteger(item.quantity)) {
        throw new Error('Item quantity must be a whole integer.');
      }
      if (item.quantity > 50) {
        throw new Error('Each order line is limited to 50 units.');
      }

      // Fetch product details directly from database to prevent price tampering
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product SKU is invalid.`);
      }

      // Validate product category (finished goods only)
      if (product.category !== 'FINISHED_GOOD') {
        throw new Error(`Product ${product.name} is not available for purchase.`);
      }

      const freeQty = Math.max(0, product.stockQty - product.reservedQty);
      if (freeQty < item.quantity && product.procurementStrategy === 'MTS') {
        throw new Error(`Insufficient stock for ${product.name}. Please reduce quantity or contact operations.`);
      }

      const linePrice = product.sellingPrice;
      subtotal += linePrice * item.quantity;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: linePrice,
      });
    }

    // 5. Apply Coupon Discount if provided
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
      if (coupon && coupon.isActive) {
        const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
        const underLimit = coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit;
        if (!isExpired && underLimit && subtotal >= coupon.minimumOrder) {
          if (coupon.discountType === 'PERCENT') {
            couponDiscount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maximumDiscount) couponDiscount = Math.min(couponDiscount, coupon.maximumDiscount);
          } else {
            couponDiscount = coupon.discountValue;
          }
          couponDiscount = Math.min(couponDiscount, subtotal);

          // Increment coupon usage
          await db.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
    }

    // 6. Apply Loyalty Discount if provided
    let loyaltyDiscount = 0;
    const pointsUsed = loyaltyPointsUsed ? Math.min(loyaltyPointsUsed, customer.loyaltyPoints) : 0;
    if (pointsUsed > 0) {
      loyaltyDiscount = pointsUsed; // 1 point = ₹1
      // Deduct loyalty points and increment redeemed
      await db.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyPoints: { decrement: pointsUsed },
          redeemedPoints: { increment: pointsUsed },
        },
      });
    }

    const netSubtotal = Math.max(0, subtotal - couponDiscount - loyaltyDiscount);

    // 7. Calculate GST (18%) on net subtotal
    const gstRate = 0.18;
    const tax = Math.round(netSubtotal * gstRate * 100) / 100;

    // 8. Calculate Shipping (₹0 if subtotal >= 50,000, else ₹500)
    const shipping = subtotal >= 50000 ? 0 : 500;

    // 9. Calculate Grand Total
    const grandTotal = Math.max(0, netSubtotal + tax + shipping);

    // 10. Create Draft Sales Order using the workflow service
    const order = await SalesWorkflowService.createOrder({
      customerId: customer.id,
      items: validatedItems,
    });

    // Update order with coupon and loyalty details
    await db.salesOrder.update({
      where: { id: order.id },
      data: {
        couponCode: couponCode || null,
        couponDiscount,
        loyaltyPointsUsed: pointsUsed,
        loyaltyDiscount,
      },
    });

    // 11. Generate Notification for internal admins
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
    });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'New Customer Sales Order',
          message: `Customer ${customer.name} has submitted Sales Order draft ${order.orderNumber} for review.`,
          type: 'SALES_ORDER_DRAFT',
          referenceId: order.id,
          referenceType: 'SalesOrder',
        },
      });
    }

    // Send email order confirmation to customer
    const orderCreatedEmailHtml = EmailService.getOrderConfirmationTemplate(order.orderNumber, grandTotal);
    await EmailService.send({
      to: customer.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: orderCreatedEmailHtml,
      userId: customer.userId,
      notificationTitle: 'Order Placed',
      notificationMessage: `Your order ${order.orderNumber} for ₹${grandTotal.toLocaleString()} has been placed and is under review.`,
      referenceId: order.id,
      referenceType: 'SalesOrder',
    });

    logger.info({ orderId: order.id, customerId: customer.id }, 'Customer checkout complete. Draft Sales Order registered.');

    // 12. Award loyalty points: 1 point per ₹100 spent (based on net subtotal)
    const pointsEarned = Math.floor(netSubtotal / 100);
    if (pointsEarned > 0) {
      await db.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyPoints: { increment: pointsEarned },
          lifetimePoints: { increment: pointsEarned },
        },
      });
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      subtotal,
      tax,
      shipping,
      grandTotal,
      pointsEarned,
    };
  }
}
