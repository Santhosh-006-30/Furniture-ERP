import { db } from '../../lib/db';
import { SalesWorkflowService } from '../sales/sales-workflow.service';
import { logger } from '../../lib/pino';

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
}

export class CustomerOrderService {
  /**
   * Validates cart and creates a draft Sales Order.
   */
  static async checkout(userId: string, items: Array<{ productId: string; quantity: number }>): Promise<CheckoutResult> {
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

    // Check for duplicate products in cart submission
    const productIds = items.map(item => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new Error('Duplicate items detected in shopping cart payload.');
    }

    const validatedItems = [];
    let subtotal = 0;

    // Loop and validate each item in database
    for (const item of items) {
      // 3. Validate quantites are positive and non-zero
      if (item.quantity <= 0) {
        throw new Error('Item quantity must be greater than zero.');
      }
      if (!Number.isInteger(item.quantity)) {
        throw new Error('Item quantity must be a whole integer.');
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

      // 4. Validate stock/availability warning (non-blocking for DRAFT, but we can compute warnings)
      const freeQty = Math.max(0, product.stockQty - product.reservedQty);
      
      // Calculate subtotal line
      const linePrice = product.sellingPrice;
      subtotal += linePrice * item.quantity;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: linePrice,
      });
    }

    // 5. Calculate GST (18%)
    const gstRate = 0.18;
    const tax = Math.round(subtotal * gstRate * 100) / 100;

    // 6. Calculate Shipping (₹0 if subtotal >= 50,000, else ₹500)
    const shipping = subtotal >= 50000 ? 0 : 500;

    // 7. Calculate Grand Total
    const grandTotal = subtotal + tax + shipping;

    // 8. Create Draft Sales Order using the workflow service
    // Since createOrder writes in a transaction, let's invoke it directly.
    const order = await SalesWorkflowService.createOrder({
      customerId: customer.id,
      items: validatedItems,
    });

    // 9. Generate Notification for internal admins
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

    logger.info({ orderId: order.id, customerId: customer.id }, 'Customer checkout complete. Draft Sales Order registered.');

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      subtotal,
      tax,
      shipping,
      grandTotal,
    };
  }
}
