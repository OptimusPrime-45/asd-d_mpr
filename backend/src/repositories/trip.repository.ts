import { prisma } from '../config/prisma.js';

export class TripRepository {
  async findByIdWithOwner(id: number) {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });
  }

  async getRecentTripsByCompany(
    companyId: number,
    filters?: { vehicleType?: string; status?: string }
  ) {
    return prisma.trip.findMany({
      where: {
        vehicle: {
          company_id: companyId,
          ...(filters?.vehicleType && { type: filters.vehicleType }),
        },
        ...(filters?.status && { trip_status: filters.status as any }),
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 8,
      select: {
        id: true,
        reg_no: true,
        src: true,
        dest: true,
        src_lat: true,
        src_lng: true,
        dest_lat: true,
        dest_lng: true,
        trip_status: true,
        created_at: true,
        start_trip_at: true,
        vehicle: {
          select: {
            vehicle_model: true,
          },
        },
        driver: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }
}
