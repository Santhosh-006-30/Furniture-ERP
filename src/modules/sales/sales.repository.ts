import { db } from '../../lib/db';

export class SalesRepository {
  static async listCustomers() {
    return db.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        salesOrders: {
          select: { id: true, orderNumber: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  static async findCustomerById(id: string) {
    return db.customer.findUnique({
      where: { id },
    });
  }

  static async createCustomer(data: {
    customerCode: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  }) {
    return db.customer.create({
      data: {
        customerCode: data.customerCode,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });
  }

  static async updateCustomer(
    id: string,
    data: Partial<{
      customerCode: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      isActive: boolean;
    }>
  ) {
    return db.customer.update({
      where: { id },
      data,
    });
  }
}
