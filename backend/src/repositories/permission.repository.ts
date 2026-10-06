import { prisma } from '../config/prisma.js';

export class PermissionRepository {
  async getAllPermissions() {
    return prisma.rolePermissions.findMany({
      include: {
        role: true,
      },
    });
  }

  async updatePermissions(matrix: { role: string; resource: string; access: string }[]) {
    return prisma.$transaction(async (tx) => {
      for (const item of matrix) {
        const roleRecord = await tx.roles.findUnique({
          where: { role: item.role as any },
        });

        if (roleRecord) {
          await tx.rolePermissions.upsert({
            where: {
              role_id_resource: {
                role_id: roleRecord.id,
                resource: item.resource,
              },
            },
            update: {
              access: item.access,
            },
            create: {
              role_id: roleRecord.id,
              resource: item.resource,
              access: item.access,
            },
          });
        }
      }
    });
  }
}
