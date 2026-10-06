import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.roles.findMany({
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = await prisma.roles.findUnique({
      where: { id: parseInt(id as string) },
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const existingRole = await prisma.roles.findUnique({
      where: { role },
    });
    if (existingRole) {
      return res.status(409).json({ success: false, message: 'Role already exists' });
    }
    const newRole = await prisma.roles.create({
      data: { role },
    });

    res.status(201).json({ success: true, data: newRole });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const existingRole = await prisma.roles.findUnique({
      where: { id: parseInt(id as string) },
    });
    if (!existingRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const updatedRole = await prisma.roles.update({
      where: { id: parseInt(id as string) },
      data: { role },
    });
    res.status(200).json({ success: true, data: updatedRole });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existingRole = await prisma.roles.findUnique({
      where: { id: parseInt(id as string) },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existingRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    if (existingRole._count.users > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role as it is assigned to one or more users',
      });
    }

    await prisma.roles.delete({
      where: { id: parseInt(id as string) },
    });
    res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};
