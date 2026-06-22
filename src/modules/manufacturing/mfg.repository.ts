import { db } from '../../lib/db';

export class MfgRepository {
  static async listWorkCenters() {
    return db.workCenter.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findWorkCenterById(id: string) {
    return db.workCenter.findUnique({
      where: { id },
    });
  }

  static async createWorkCenter(data: {
    name: string;
    location?: string;
    capacity: number;
    efficiencyRate?: number;
    hourlyCost: number;
    status?: string;
  }) {
    return db.workCenter.create({
      data: {
        name: data.name,
        location: data.location ?? 'Main Factory',
        capacity: data.capacity,
        efficiencyRate: data.efficiencyRate ?? 1.0,
        hourlyCost: data.hourlyCost,
        status: data.status ?? 'RUNNING',
      },
    });
  }
}
