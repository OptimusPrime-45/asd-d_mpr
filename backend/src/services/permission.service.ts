import { PermissionRepository } from '../repositories/permission.repository.js';

const permissionRepository = new PermissionRepository();

export class PermissionService {
  async getAllPermissions() {
    return permissionRepository.getAllPermissions();
  }

  async updatePermissions(matrix: { role: string; resource: string; access: string }[]) {
    return permissionRepository.updatePermissions(matrix);
  }
}
