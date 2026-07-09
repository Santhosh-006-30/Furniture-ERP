import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '../../lib/db';
import { signToken } from '../../lib/jwt';
import { logger } from '../../lib/pino';

export class CustomerAuthController {
  static async register(req: Request) {
    try {
      const body = await req.json();
      const { email, password, name, phone, address, companyName, gstNumber } = body;

      if (!email || !password || !name) {
        return NextResponse.json(
          { error: 'Email, password, and name are required' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }

      // Create User and Customer in transaction
      const result = await db.$transaction(async (tx) => {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        // 1. Create User with role CUSTOMER and PENDING approval
        const user = await tx.user.create({
          data: {
            email,
            passwordHash: hash,
            name,
            role: 'CUSTOMER',
            approvalStatus: 'PENDING',
          },
        });

        // Generate customerCode sequentially
        const count = await tx.customer.count();
        const customerCode = `CUST-${String(count + 1).padStart(3, '0')}`;

        // 2. Create linked Customer record
        const customer = await tx.customer.create({
          data: {
            customerCode,
            name,
            email,
            phone: phone || null,
            address: address || null,
            companyName: companyName || null,
            gstNumber: gstNumber || null,
            userId: user.id,
          },
        });

        // 3. Create Notification for admins
        const admins = await tx.user.findMany({
          where: { role: 'ADMIN' },
        });
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              title: 'New User Registration',
              message: `${user.name} is waiting for approval.`,
              type: 'USER_REGISTRATION',
            },
          });
        }

        return { user, customer };
      });

      logger.info({ email }, 'New customer profile registered successfully');
      return NextResponse.json({ success: true, userId: result.user.id });
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Customer registration failed');
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 400 }
      );
    }
  }

  static async login(req: Request) {
    try {
      const { email, password } = await req.json();

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
      }

      if (user.role !== 'CUSTOMER') {
        return NextResponse.json({ error: 'Access denied: not a customer account' }, { status: 403 });
      }

      if (!user.isActive) {
        return NextResponse.json({ error: 'Account deactivated. Please contact administrator.' }, { status: 400 });
      }

      if (user.approvalStatus !== 'APPROVED') {
        return NextResponse.json({ error: 'Your account is awaiting administrator approval.' }, { status: 400 });
      }

      const matched = bcrypt.compareSync(password, user.passwordHash);
      if (!matched) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
      }

      const token = await signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      logger.info({ email }, 'Customer successfully authenticated');
      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      });
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Customer login failed');
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 400 }
      );
    }
  }

  static async forgotPassword(req: Request) {
    try {
      const { email, newPassword } = await req.json();

      if (!email || !newPassword) {
        return NextResponse.json(
          { error: 'Email and new password are required' },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user || user.role !== 'CUSTOMER') {
        return NextResponse.json(
          { error: 'Customer account not found' },
          { status: 400 }
        );
      }

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(newPassword, salt);

      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      });

      logger.info({ email }, 'Customer password reset successful');
      return NextResponse.json({ success: true, message: 'Password reset successful.' });
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Customer forgot password failed');
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 400 }
      );
    }
  }
}
