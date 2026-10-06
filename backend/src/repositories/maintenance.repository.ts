import { prisma } from '../config/prisma.js';
import type { Prisma, Maintenance } from '@prisma/client';

export class MaintenanceRepository {
  async create(data: Prisma.MaintenanceUncheckedCreateInput): Promise<Maintenance> {
    return prisma.maintenance.create({ data });
  }

  async sumMaintenanceCostsByVehicle(reg_no: string): Promise<number> {
    const aggregate = await prisma.maintenance.aggregate({
      where: { reg_no },
      _sum: {
        cost: true,
      },
    });
    return aggregate._sum.cost || 0;
  }

  async findActiveByRegNo(reg_no: string): Promise<Maintenance | null> {
    return prisma.maintenance.findFirst({
      where: {
        reg_no,
        status: {
          not: 'Available', // Assuming anything not 'Available' is active, or we can just fetch the most recent
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  async update(id: number, data: Prisma.MaintenanceUncheckedUpdateInput): Promise<Maintenance> {
    return prisma.maintenance.update({
      where: { id },
      data,
    });
  }

  async findByJiraIssueKey(jira_issue_key: string): Promise<Maintenance | null> {
    return prisma.maintenance.findFirst({
      where: { jira_issue_key },
    });
  }
}
