import { db } from '../../lib/db';

export class SalesRepository {
  static async listCustomers() {
    return db.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        salesOrders: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
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
    companyName?: string;
    gstNumber?: string;
    isActive?: boolean;
  }) {
    return db.customer.create({
      data: {
        customerCode: data.customerCode,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        companyName: data.companyName,
        gstNumber: data.gstNumber,
        isActive: data.isActive ?? true,
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
      companyName: string;
      gstNumber: string;
      isActive: boolean;
    }>
  ) {
    return db.customer.update({
      where: { id },
      data,
    });
  }
}
