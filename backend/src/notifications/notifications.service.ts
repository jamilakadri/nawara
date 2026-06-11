import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return true;
  }

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type ?? null,
        link: data.link ?? null,
        isRead: false,
      },
    });
  }

  /**
   * Send a notification to a single user (fire-and-forget, never blocks the caller).
   */
  async notifyUser(
    userId: string,
    title: string,
    message: string,
    type?: string,
    link?: string,
  ) {
    try {
      await this.create({ userId, title, message, type, link });
    } catch (e) {
      // Don't block main operation on notification failure
      console.warn('Notification creation failed silently:', e);
    }
  }

  /**
   * Send the same notification to multiple users at once.
   * Useful for notifying all HR admins or a group of managers.
   */
  async notifyMultipleUsers(
    userIds: string[],
    title: string,
    message: string,
    type?: string,
    link?: string,
  ) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    await Promise.allSettled(
      uniqueIds.map((uid) => this.notifyUser(uid, title, message, type, link)),
    );
  }

  /**
   * Find all users with the ADMIN role (HR administrators).
   * Returns an array of user IDs.
   */
  async findAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMINRH', isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  /**
   * Find the department manager userId for a given employee.
   * Returns null if no manager is assigned.
   */
  async findEmployeeDepartmentManagerId(
    employeeId: string,
  ): Promise<string | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });
    return employee?.department?.managerId ?? null;
  }
}
