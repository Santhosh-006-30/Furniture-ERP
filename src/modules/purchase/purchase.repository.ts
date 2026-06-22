import { db } from '../../lib/db';

export class PurchaseRepository {
  static async listVendors() {
    return db.vendor.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findVendorById(id: string) {
    return db.vendor.findUnique({
      where: { id },
    });
  }

  static async createVendor(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    rating?: number;
    leadTimeDays?: number;
  }) {
    return db.vendor.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        rating: data.rating ?? 5.0,
        leadTimeDays: data.leadTimeDays ?? 3,
      },
    });
  }
}
