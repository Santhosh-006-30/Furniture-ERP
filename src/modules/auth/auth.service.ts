import bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository';
import { signToken } from '../../lib/jwt';
import { db } from '../../lib/db';

export class AuthService {
  static async register(email: string, password: string, name: string, role?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error('Email already registered');
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const user = await UserRepository.create({
      email: normalizedEmail,
      passwordHash: hash,
      name,
      role,
      approvalStatus: 'PENDING',
    });

    // Notify ADMINs
    try {
      const admins = await db.user.findMany({
        where: { role: 'ADMIN' },
      });
      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            title: 'New User Registration',
            message: `${user.name} is waiting for approval.`,
            type: 'USER_REGISTRATION',
          },
        });
      }
    } catch (err) {
      // non-blocking
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }

  static async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account deactivated. Please contact administrator.');
    }

    if (user.approvalStatus !== 'APPROVED') {
      throw new Error('Your account is awaiting administrator approval.');
    }

    const matched = bcrypt.compareSync(password, user.passwordHash);
    if (!matched) {
      throw new Error('Invalid email or password');
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }
}
