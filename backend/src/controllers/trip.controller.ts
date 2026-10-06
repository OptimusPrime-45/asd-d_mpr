import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

import { TripRepository } from '../repositories/trip.repository.js';

const tripRepository = new TripRepository();

export const getTrips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).user?.companyId;

    const trips = await prisma.trip.findMany({
      where: companyId ? { vehicle: { company_id: companyId } } : undefined,
      include: {
        vehicle: true,
        driver: { include: { user: true } },
      },
      orderBy: { id: 'desc' },
    });
    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
};

export const getRecentTrips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = parseInt(req.params.companyId as string, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ success: false, message: 'Invalid company ID' });
    }

    const { vehicleType, status } = req.query;

    const trips = await tripRepository.getRecentTripsByCompany(companyId, {
      vehicleType: vehicleType as string,
      status: status as string,
    });
    const formattedTrips = trips.map((trip) => ({
      tripId: trip.id,
      regNo: trip.reg_no,
      src: trip.src,
      dest: trip.dest,
      srcLat: trip.src_lat,
      srcLng: trip.src_lng,
      destLat: trip.dest_lat,
      destLng: trip.dest_lng,
      vehicleModel: trip.vehicle.vehicle_model,
      driverName: trip.driver.user.name,
      status: trip.trip_status,
      createdAt: trip.created_at,
      hasStarted: trip.start_trip_at !== null,
    }));

    res.status(200).json({ success: true, data: formattedTrips });
  } catch (error) {
    next(error);
  }
};

export const getTripById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: parseInt(id as string) },
      include: {
        vehicle: true,
        driver: { include: { user: true } },
        expenses: true,
      },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      reg_no,
      driver_id,
      src,
      dest,
      cargo_weight,
      trip_dist,
      src_lat,
      src_lng,
      dest_lat,
      dest_lng,
    } = req.body;
    if (
      !reg_no ||
      !driver_id ||
      !src ||
      !dest ||
      cargo_weight === undefined ||
      trip_dist === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'All trip fields (reg_no, driver_id, src, dest, cargo_weight, trip_dist) are required',
      });
    }

    const newTrip = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicles.findUnique({ where: { reg_no } });
      if (!vehicle) throw new Error('Vehicle not found');
      if (vehicle.status !== 'Available')
        throw new Error(`Vehicle is not available (Current status: ${vehicle.status})`);
      if (cargo_weight > vehicle.load_capacity)
        throw new Error(`Cargo weight exceeds vehicle capacity (${vehicle.load_capacity})`);

      const activeVehicleTrip = await tx.trip.findFirst({
        where: { reg_no, trip_status: { in: ['Draft', 'Dispatched'] } },
      });
      if (activeVehicleTrip)
        throw new Error(
          `Vehicle ${reg_no} is already assigned to active trip #${activeVehicleTrip.id}`
        );

      const driver = await tx.driver.findUnique({ where: { driver_id } });
      if (!driver) throw new Error('Driver not found');
      if (driver.status !== 'Available')
        throw new Error(`Driver is not available (Current status: ${driver.status})`);

      const activeDriverTrip = await tx.trip.findFirst({
        where: { driver_id, trip_status: { in: ['Draft', 'Dispatched'] } },
      });
      if (activeDriverTrip)
        throw new Error(
          `Driver ${driver_id} is already assigned to active trip #${activeDriverTrip.id}`
        );

      const trip = await tx.trip.create({
        data: {
          reg_no,
          driver_id,
          src,
          dest,
          cargo_weight,
          trip_dist,
          trip_status: 'Draft',
          ...(src_lat !== undefined && { src_lat: parseFloat(src_lat) }),
          ...(src_lng !== undefined && { src_lng: parseFloat(src_lng) }),
          ...(dest_lat !== undefined && { dest_lat: parseFloat(dest_lat) }),
          ...(dest_lng !== undefined && { dest_lng: parseFloat(dest_lng) }),
        },
      });
      return trip;
    });

    res.status(201).json({ success: true, data: newTrip });
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes('Vehicle') ||
        error.message.includes('Driver') ||
        error.message.includes('Cargo'))
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateTripStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { trip_status } = req.body;
    if (!trip_status) {
      return res.status(400).json({ success: false, message: 'trip_status is required' });
    }

    const trip = await prisma.trip.findUnique({ where: { id: parseInt(id as string) } });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id: parseInt(id as string) },
        data: { trip_status },
      });
      if (trip_status === 'Dispatched') {
        await tx.vehicles.update({ where: { reg_no: trip.reg_no }, data: { status: 'On_Trip' } });
        await tx.driver.update({
          where: { driver_id: trip.driver_id },
          data: { status: 'On_Trip' },
        });
      } else if (trip_status === 'Completed' || trip_status === 'Cancelled') {
        await tx.vehicles.update({ where: { reg_no: trip.reg_no }, data: { status: 'Available' } });
        await tx.driver.update({
          where: { driver_id: trip.driver_id },
          data: { status: 'Available' },
        });
      }
      return updated;
    });

    res.status(200).json({ success: true, data: updatedTrip });
  } catch (error) {
    next(error);
  }
};
