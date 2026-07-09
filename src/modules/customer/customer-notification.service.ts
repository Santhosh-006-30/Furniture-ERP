import { db } from '../../lib/db';

export interface CustomerNotificationListOptions {
  filter?: 'all' | 'unread' | 'read';
  search?: string;
  page?: number;
  pageSize?: number;
}

export class CustomerNotificationService {
  static async getNotifications(customerId: string, options: CustomerNotificationListOptions = {}) {
    const customer = await this.getCustomer(customerId);
    if (!customer?.userId) {
      return {
        notifications: [],
        pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
        unreadCount: 0,
      };
    }

    const pageSize = Math.max(1, Number(options.pageSize ?? 10));
    const page = Math.max(1, Number(options.page ?? 1));
    const filter = options.filter ?? 'all';
    const search = (options.search || '').trim();

    const where: any = { userId: customer.userId };
    if (filter === 'unread') {
      where.isRead = false;
    } else if (filter === 'read') {
      where.isRead = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
      ];
    }

    const [notifications, totalItems] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map((notification) => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
      unreadCount: await this.getUnreadCount(customerId),
    };
  }

  static async markRead(notificationId: string, customerId: string) {
    const customer = await this.getCustomer(customerId);
    if (!customer?.userId) {
      throw new Error('Customer profile not found.');
    }

    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId: customer.userId },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied.');
    }

    return db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  static async markAllRead(customerId: string) {
    const customer = await this.getCustomer(customerId);
    if (!customer?.userId) {
      throw new Error('Customer profile not found.');
    }

    return db.notification.updateMany({
      where: { userId: customer.userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async deleteNotification(notificationId: string, customerId: string) {
    const customer = await this.getCustomer(customerId);
    if (!customer?.userId) {
      throw new Error('Customer profile not found.');
    }

    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId: customer.userId },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied.');
    }

    return db.notification.delete({ where: { id: notificationId } });
  }

  static async getUnreadCount(customerId: string) {
    const customer = await this.getCustomer(customerId);
    if (!customer?.userId) {
      return 0;
    }

    return db.notification.count({
      where: { userId: customer.userId, isRead: false },
    });
  }

  static async createNotificationForCustomer(
    customerId: string,
    payload: { title: string; message: string; type: string; referenceId?: string | null; referenceType?: string | null }
  ) {
    const customer = await this.getCustomer(customerId);
    if (!customer?.userId) {
      return null;
    }

    return db.notification.create({
      data: {
        userId: customer.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        referenceId: payload.referenceId || null,
        referenceType: payload.referenceType || null,
      },
    });
  }

  private static async getCustomer(customerId: string) {
    return db.customer.findUnique({ where: { id: customerId } });
  }
}
