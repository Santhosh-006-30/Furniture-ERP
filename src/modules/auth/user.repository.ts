import { db } from '../../lib/db';

export class UserRepository {
  static async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
    });
  }

  static async findById(id: string) {
    return db.user.findUnique({
      where: { id },
    });
  }

  static async create(data: { email: string; passwordHash: string; name: string; role?: string; approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
    return db.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role || 'SALES',
        approvalStatus: data.approvalStatus || 'APPROVED',
      },
    });
  }

  static async update(
    id: string,
    data: { role?: string; isActive?: boolean; name?: string; permissions?: string; approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' }
  ) {
    return db.user.update({
      where: { id },
      data,
    });
  }

  static async listAll() {
    return db.user.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async delete(id: string) {
    return db.user.delete({
      where: { id },
    });
  }
}
