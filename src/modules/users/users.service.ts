import { UserRepository } from '../auth/user.repository';

export class UsersService {
  static async listUsers() {
    const users = await UserRepository.listAll();
    return users.filter((user) => user.role !== 'CUSTOMER');
  }

  static async updateUser(
    id: string,
    data: { role?: string; isActive?: boolean; name?: string; permissions?: string; approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' }
  ) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return UserRepository.update(id, data);
  }
}
