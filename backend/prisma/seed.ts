import {
  PrismaClient,
  DriverStatus,
  VehicleStatus,
  RoleType,
  TripStatus,
  ServiceType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('seeding db');

  // Clear existing non-upsertable tables to ensure idempotency
  await prisma.expenses.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.fuel_Logs.deleteMany({});
  await prisma.trip.deleteMany({});

  // 1. Company
  const company = await prisma.companies.upsert({
    where: { id: 1 },
    update: {
      name: 'Gandhinagar Depot GJ4',
      currency: 'INR (Rs)',
      distance_unit: 'Kilometers',
    },
    create: {
      name: 'Gandhinagar Depot GJ4',
      currency: 'INR (Rs)',
      distance_unit: 'Kilometers',
    },
  });
  console.log(`created/fetched Company: ${company.name}`);

  // 2. Roles
  const rolesList = [
    'ADMIN',
    'DRIVER',
    'FLEET_MANAGER',
    'DISPATCHER',
    'SAFETY_OFFICER',
    'FINANCIAL_ANALYST',
  ] as RoleType[];
  for (const r of rolesList) {
    await prisma.roles.upsert({
      where: { role: r },
      update: {},
      create: { role: r },
    });
  }
  console.log(`created/fetched Roles`);

  const adminRole = await prisma.roles.findUnique({ where: { role: 'ADMIN' } });
  const driverRole = await prisma.roles.findUnique({ where: { role: 'DRIVER' } });
  const fleetManagerRole = await prisma.roles.findUnique({ where: { role: 'FLEET_MANAGER' } });
  const dispatcherRole = await prisma.roles.findUnique({ where: { role: 'DISPATCHER' } });
  const safetyOfficerRole = await prisma.roles.findUnique({ where: { role: 'SAFETY_OFFICER' } });
  const financialAnalystRole = await prisma.roles.findUnique({
    where: { role: 'FINANCIAL_ANALYST' },
  });

  // 2.5 Role Permissions
  await prisma.rolePermissions.deleteMany({});
  const defaultPermissions = [
    // ADMIN
    { role: 'ADMIN', resource: 'FLEET', access: 'WRITE' },
    { role: 'ADMIN', resource: 'DRIVERS', access: 'WRITE' },
    { role: 'ADMIN', resource: 'TRIPS', access: 'WRITE' },
    { role: 'ADMIN', resource: 'FUEL_EXPENSE', access: 'WRITE' },
    { role: 'ADMIN', resource: 'ANALYTICS', access: 'WRITE' },

    // FLEET_MANAGER
    { role: 'FLEET_MANAGER', resource: 'FLEET', access: 'WRITE' },
    { role: 'FLEET_MANAGER', resource: 'DRIVERS', access: 'WRITE' },
    { role: 'FLEET_MANAGER', resource: 'TRIPS', access: 'NONE' },
    { role: 'FLEET_MANAGER', resource: 'FUEL_EXPENSE', access: 'NONE' },
    { role: 'FLEET_MANAGER', resource: 'ANALYTICS', access: 'WRITE' },

    // DISPATCHER
    { role: 'DISPATCHER', resource: 'FLEET', access: 'READ' },
    { role: 'DISPATCHER', resource: 'DRIVERS', access: 'NONE' },
    { role: 'DISPATCHER', resource: 'TRIPS', access: 'WRITE' },
    { role: 'DISPATCHER', resource: 'FUEL_EXPENSE', access: 'NONE' },
    { role: 'DISPATCHER', resource: 'ANALYTICS', access: 'NONE' },

    // SAFETY_OFFICER
    { role: 'SAFETY_OFFICER', resource: 'FLEET', access: 'NONE' },
    { role: 'SAFETY_OFFICER', resource: 'DRIVERS', access: 'WRITE' },
    { role: 'SAFETY_OFFICER', resource: 'TRIPS', access: 'READ' },
    { role: 'SAFETY_OFFICER', resource: 'FUEL_EXPENSE', access: 'NONE' },
    { role: 'SAFETY_OFFICER', resource: 'ANALYTICS', access: 'NONE' },

    // FINANCIAL_ANALYST
    { role: 'FINANCIAL_ANALYST', resource: 'FLEET', access: 'READ' },
    { role: 'FINANCIAL_ANALYST', resource: 'DRIVERS', access: 'NONE' },
    { role: 'FINANCIAL_ANALYST', resource: 'TRIPS', access: 'NONE' },
    { role: 'FINANCIAL_ANALYST', resource: 'FUEL_EXPENSE', access: 'WRITE' },
    { role: 'FINANCIAL_ANALYST', resource: 'ANALYTICS', access: 'WRITE' },

    // DRIVER
    { role: 'DRIVER', resource: 'FLEET', access: 'NONE' },
    { role: 'DRIVER', resource: 'DRIVERS', access: 'NONE' },
    { role: 'DRIVER', resource: 'TRIPS', access: 'NONE' },
    { role: 'DRIVER', resource: 'FUEL_EXPENSE', access: 'NONE' },
    { role: 'DRIVER', resource: 'ANALYTICS', access: 'NONE' },
  ];

  for (const perm of defaultPermissions) {
    const roleRecord = await prisma.roles.findUnique({ where: { role: perm.role as RoleType } });
    if (roleRecord) {
      await prisma.rolePermissions.create({
        data: {
          role_id: roleRecord.id,
          resource: perm.resource,
          access: perm.access,
        },
      });
    }
  }
  console.log('seeded role permissions');

  // 3. Users with hashed passwords
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  // Admin user
  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@transitops.com' },
    update: { password: adminHash },
    create: {
      company_id: company.id,
      role_id: adminRole!.id,
      name: 'Admin User',
      email: 'admin@transitops.com',
      password: adminHash,
    },
  });
  console.log(`created/fetched Admin: ${adminUser.name}`);

  // Fleet Manager user
  const managerUser = await prisma.users.upsert({
    where: { email: 'manager@transitops.com' },
    update: { password: passwordHash },
    create: {
      company_id: company.id,
      role_id: fleetManagerRole!.id,
      name: 'Fleet Manager',
      email: 'manager@transitops.com',
      password: passwordHash,
    },
  });
  console.log(`created/fetched Fleet Manager: ${managerUser.name}`);

  // Safety Officer user
  const safetyUser = await prisma.users.upsert({
    where: { email: 'safety@transitops.com' },
    update: { password: passwordHash },
    create: {
      company_id: company.id,
      role_id: safetyOfficerRole!.id,
      name: 'Safety Officer',
      email: 'safety@transitops.com',
      password: passwordHash,
    },
  });
  console.log(`created/fetched Safety Officer: ${safetyUser.name}`);

  // Financial Analyst user
  const financeUser = await prisma.users.upsert({
    where: { email: 'finance@transitops.com' },
    update: { password: passwordHash },
    create: {
      company_id: company.id,
      role_id: financialAnalystRole!.id,
      name: 'Financial Analyst',
      email: 'finance@transitops.com',
      password: passwordHash,
    },
  });
  console.log(`created/fetched Financial Analyst: ${financeUser.name}`);

  // Dispatcher user
  const dispatcherUser = await prisma.users.upsert({
    where: { email: 'dispatcher@transitops.com' },
    update: { password: passwordHash },
    create: {
      company_id: company.id,
      role_id: dispatcherRole!.id,
      name: 'Dispatcher User',
      email: 'dispatcher@transitops.com',
      password: passwordHash,
    },
  });
  console.log(`created/fetched Dispatcher: ${dispatcherUser.name}`);

  // Driver User 1 (Alex)
  const driverUser1 = await prisma.users.upsert({
    where: { email: 'alex@fleetops.com' },
    update: { password: passwordHash },
    create: {
      company_id: company.id,
      role_id: driverRole!.id,
      name: 'Alex',
      email: 'alex@fleetops.com',
      password: passwordHash,
    },
  });
  console.log(`created/fetched Driver User 1: ${driverUser1.name}`);

  // Driver User 2 (John Doe)
  const driverUser2 = await prisma.users.upsert({
    where: { email: 'john@fleetops.com' },
    update: { password: passwordHash },
    create: {
      company_id: company.id,
      role_id: driverRole!.id,
      name: 'John Doe',
      email: 'john@fleetops.com',
      password: passwordHash,
    },
  });
  console.log(`created/fetched Driver User 2: ${driverUser2.name}`);

  // Driver User 3 (Jane Smith)
  const driverUser3 = await prisma.users.upsert({
    where: { email: 'jane@fleetops.com' },
    update: { password: passwordHash },
    create: {
      company_id: company.id,
      role_id: driverRole!.id,
      name: 'Jane Smith',
      email: 'jane@fleetops.com',
      password: passwordHash,
    },
  });
  console.log(`created/fetched Driver User 3: ${driverUser3.name}`);

  // 4. Drivers
  // Alex (Available)
  const driver1 = await prisma.driver.upsert({
    where: { driver_id: driverUser1.id },
    update: { status: DriverStatus.Available },
    create: {
      license_no: 'DL-ALEX12345',
      driver_id: driverUser1.id,
      status: DriverStatus.Available,
      safety_score: 98.5,
      license_type: 'Commercial',
      expiry_date: new Date('2029-12-31'),
    },
  });
  console.log(`created/fetched Driver 1 (ID: ${driver1.driver_id})`);

  // John Doe (Available)
  const driver2 = await prisma.driver.upsert({
    where: { driver_id: driverUser2.id },
    update: { status: DriverStatus.Available },
    create: {
      license_no: 'DL-987654321',
      driver_id: driverUser2.id,
      status: DriverStatus.Available,
      safety_score: 92.0,
      license_type: 'Commercial Class A',
      expiry_date: new Date('2028-06-15'),
    },
  });
  console.log(`created/fetched Driver 2 (ID: ${driver2.driver_id})`);

  // Jane Smith (On_Trip)
  const driver3 = await prisma.driver.upsert({
    where: { driver_id: driverUser3.id },
    update: { status: DriverStatus.On_Trip },
    create: {
      license_no: 'DL-555555555',
      driver_id: driverUser3.id,
      status: DriverStatus.On_Trip,
      safety_score: 96.2,
      license_type: 'Commercial Class B',
      expiry_date: new Date('2030-01-01'),
    },
  });
  console.log(`created/fetched Driver 3 (ID: ${driver3.driver_id})`);
  // 5. Vehicles
  // VAN-05 (Available)
  const vehicle1 = await prisma.vehicles.upsert({
    where: { reg_no: 'VAN-05' },
    update: { status: VehicleStatus.Available, company_id: company.id },
    create: {
      reg_no: 'VAN-05',
      company_id: company.id,
      vehicle_model: 'Ford Transit',
      type: 'Van',
      load_capacity: 1500,
      odometer_reading: 15000,
      cost: 45000,
      status: VehicleStatus.Available,
    },
  });
  console.log(`created/fetched vehicle 1 (Reg No: ${vehicle1.reg_no})`);

  // TRUCK-01 (Available)
  const vehicle2 = await prisma.vehicles.upsert({
    where: { reg_no: 'TRUCK-01' },
    update: { status: VehicleStatus.Available, company_id: company.id },
    create: {
      reg_no: 'TRUCK-01',
      company_id: company.id,
      vehicle_model: 'Volvo FH16',
      type: 'Heavy Truck',
      load_capacity: 25000,
      odometer_reading: 120000,
      cost: 150000,
      status: VehicleStatus.Available,
    },
  });
  console.log(`created/fetched vehicle 2 (Reg No: ${vehicle2.reg_no})`);

  // TRUCK-02 (On_Trip)
  const vehicle3 = await prisma.vehicles.upsert({
    where: { reg_no: 'TRUCK-02' },
    update: { status: VehicleStatus.On_Trip, company_id: company.id },
    create: {
      reg_no: 'TRUCK-02',
      company_id: company.id,
      vehicle_model: 'Scania R500',
      type: 'Heavy Truck',
      load_capacity: 20000,
      odometer_reading: 85000,
      cost: 130000,
      status: VehicleStatus.On_Trip,
    },
  });
  console.log(`created/fetched vehicle 3 (Reg No: ${vehicle3.reg_no})`);

  // VAN-06 (In_Shop)
  const vehicle4 = await prisma.vehicles.upsert({
    where: { reg_no: 'VAN-06' },
    update: { status: VehicleStatus.In_Shop, company_id: company.id },
    create: {
      reg_no: 'VAN-06',
      company_id: company.id,
      vehicle_model: 'Mercedes Sprinter',
      type: 'Van',
      load_capacity: 2000,
      odometer_reading: 45000,
      cost: 55000,
      status: VehicleStatus.In_Shop,
    },
  });
  console.log(`created/fetched vehicle 4 (Reg No: ${vehicle4.reg_no})`);

  // TRUCK-03 (Retired)
  const vehicle5 = await prisma.vehicles.upsert({
    where: { reg_no: 'TRUCK-03' },
    update: { status: VehicleStatus.Retired, company_id: company.id },
    create: {
      reg_no: 'TRUCK-03',
      company_id: company.id,
      vehicle_model: 'Isuzu NPR',
      type: 'Light Truck',
      load_capacity: 5000,
      odometer_reading: 320000,
      cost: 35000,
      status: VehicleStatus.Retired,
    },
  });
  console.log(`created/fetched vehicle 5 (Reg No: ${vehicle5.reg_no})`);

  // 6. Trips
  // Trip 1 (Completed by Alex on VAN-05) - North
  const trip1 = await prisma.trip.create({
    data: {
      reg_no: vehicle1.reg_no,
      driver_id: driver1.driver_id,
      src: 'Delhi',
      dest: 'Jaipur',
      cargo_weight: 400,
      trip_dist: 268,
      trip_status: TripStatus.Completed,
      created_at: new Date(Date.now() - 86400000 * 30 * 4), // 4 months ago
      start_trip_at: new Date(Date.now() - 86400000 * 30 * 4),
    },
  });
  console.log(`created Trip 1 (ID: ${trip1.id}, Status: ${trip1.trip_status})`);

  // Trip 2 (Completed by John Doe on TRUCK-01) - West
  const trip2 = await prisma.trip.create({
    data: {
      reg_no: vehicle2.reg_no,
      driver_id: driver2.driver_id,
      src: 'Mumbai',
      dest: 'Pune',
      cargo_weight: 18000,
      trip_dist: 148,
      trip_status: TripStatus.Completed,
      created_at: new Date(Date.now() - 86400000 * 30 * 3), // 3 months ago
      start_trip_at: new Date(Date.now() - 86400000 * 30 * 3),
    },
  });
  console.log(`created Trip 2 (ID: ${trip2.id}, Status: ${trip2.trip_status})`);

  // Trip 3 (Dispatched/On Trip by Jane Smith on TRUCK-02) - South
  const trip3 = await prisma.trip.create({
    data: {
      reg_no: vehicle3.reg_no,
      driver_id: driver3.driver_id,
      src: 'Bengaluru',
      dest: 'Chennai',
      cargo_weight: 15000,
      trip_dist: 348,
      trip_status: TripStatus.Dispatched,
      created_at: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      start_trip_at: new Date(Date.now() - 3600000 * 4),
    },
  });
  console.log(`created Trip 3 (ID: ${trip3.id}, Status: ${trip3.trip_status})`);

  // Trip 4 (Draft/Pending by John Doe on TRUCK-01) - East
  const trip4 = await prisma.trip.create({
    data: {
      reg_no: vehicle2.reg_no,
      driver_id: driver2.driver_id,
      src: 'Kolkata',
      dest: 'Guwahati',
      cargo_weight: 12000,
      trip_dist: 980,
      trip_status: TripStatus.Draft,
      created_at: new Date(),
    },
  });
  console.log(`created Trip 4 (ID: ${trip4.id}, Status: ${trip4.trip_status})`);

  // Trip 5 (Dispatched/On Trip by Alex on VAN-05) - Central
  const trip5 = await prisma.trip.create({
    data: {
      reg_no: vehicle1.reg_no,
      driver_id: driver1.driver_id,
      src: 'Nagpur',
      dest: 'Bhopal',
      cargo_weight: 800,
      trip_dist: 350,
      trip_status: TripStatus.Dispatched,
      created_at: new Date(),
      start_trip_at: new Date(),
    },
  });
  console.log(`created Trip 5 (ID: ${trip5.id}, Status: ${trip5.trip_status})`);

  // Additional completed trips for monthly analytics variety
  const trip6 = await prisma.trip.create({
    data: {
      reg_no: vehicle1.reg_no,
      driver_id: driver1.driver_id,
      src: 'Delhi',
      dest: 'Agra',
      cargo_weight: 500,
      trip_dist: 230,
      trip_status: TripStatus.Completed,
      created_at: new Date(Date.now() - 86400000 * 30 * 6), // 6 months ago
      start_trip_at: new Date(Date.now() - 86400000 * 30 * 6),
    },
  });

  const trip7 = await prisma.trip.create({
    data: {
      reg_no: vehicle2.reg_no,
      driver_id: driver2.driver_id,
      src: 'Mumbai',
      dest: 'Surat',
      cargo_weight: 20000,
      trip_dist: 280,
      trip_status: TripStatus.Completed,
      created_at: new Date(Date.now() - 86400000 * 30 * 5), // 5 months ago
      start_trip_at: new Date(Date.now() - 86400000 * 30 * 5),
    },
  });

  const trip8 = await prisma.trip.create({
    data: {
      reg_no: vehicle3.reg_no,
      driver_id: driver3.driver_id,
      src: 'Bengaluru',
      dest: 'Mysore',
      cargo_weight: 12000,
      trip_dist: 145,
      trip_status: TripStatus.Completed,
      created_at: new Date(Date.now() - 86400000 * 30 * 2), // 2 months ago
      start_trip_at: new Date(Date.now() - 86400000 * 30 * 2),
    },
  });

  const trip9 = await prisma.trip.create({
    data: {
      reg_no: vehicle1.reg_no,
      driver_id: driver1.driver_id,
      src: 'Delhi',
      dest: 'Chandigarh',
      cargo_weight: 600,
      trip_dist: 250,
      trip_status: TripStatus.Completed,
      created_at: new Date(Date.now() - 86400000 * 30 * 1), // 1 month ago
      start_trip_at: new Date(Date.now() - 86400000 * 30 * 1),
    },
  });
  console.log('created extra completed trips for analytics');

  // --- Reconcile vehicle & driver statuses with active trips ---
  // Trip 3: TRUCK-02 / Jane Smith → Dispatched
  //   already seeded correctly above (TRUCK-02 = On_Trip, Jane = On_Trip)

  // Trip 4: TRUCK-01 / John Doe → Draft (vehicle is reserved, not available)
  await prisma.vehicles.update({
    where: { reg_no: 'TRUCK-01' },
    data: { status: VehicleStatus.On_Trip },
  });
  await prisma.driver.update({
    where: { driver_id: driver2.driver_id },
    data: { status: DriverStatus.On_Trip },
  });

  // Trip 5: VAN-05 / Alex → Dispatched
  await prisma.vehicles.update({
    where: { reg_no: 'VAN-05' },
    data: { status: VehicleStatus.On_Trip },
  });
  await prisma.driver.update({
    where: { driver_id: driver1.driver_id },
    data: { status: DriverStatus.On_Trip },
  });

  console.log('reconciled vehicle & driver statuses with active trips');

  // 7. Fuel Logs
  // Fuel Logs for VAN-05
  await prisma.fuel_Logs.createMany({
    data: [
      {
        reg_no: vehicle1.reg_no,
        date: new Date(Date.now() - 86400000 * 2),
        litres: 45,
        fuel_cost: 90.0,
      },
      {
        reg_no: vehicle1.reg_no,
        date: new Date(Date.now() - 86400000 * 6),
        litres: 50,
        fuel_cost: 100.0,
      },
    ],
  });
  // Fuel Logs for TRUCK-01
  await prisma.fuel_Logs.createMany({
    data: [
      {
        reg_no: vehicle2.reg_no,
        date: new Date(Date.now() - 86400000 * 5),
        litres: 220,
        fuel_cost: 440.0,
      },
      {
        reg_no: vehicle2.reg_no,
        date: new Date(Date.now() - 86400000 * 12),
        litres: 210,
        fuel_cost: 410.0,
      },
    ],
  });
  // Fuel Logs for TRUCK-02
  await prisma.fuel_Logs.createMany({
    data: [
      {
        reg_no: vehicle3.reg_no,
        date: new Date(Date.now() - 3600000 * 3),
        litres: 150,
        fuel_cost: 300.0,
      },
    ],
  });
  console.log('created Fuel Logs');

  // 8. Expenses (trip-related)
  // Expenses for Trip 1 (Completed)
  await prisma.expenses.create({
    data: {
      trip_id: trip1.id,
      reg_no: vehicle1.reg_no,
      maintenance: 50.0,
      toll: 25.0,
      others: 15.0,
    },
  });
  // Expenses for Trip 2 (Completed)
  await prisma.expenses.create({
    data: {
      trip_id: trip2.id,
      reg_no: vehicle2.reg_no,
      maintenance: 120.0,
      toll: 45.0,
      others: 30.0,
    },
  });
  console.log('created Expenses');

  // 9. Maintenances
  // Maintenance for VAN-06 (In Shop)
  await prisma.maintenance.create({
    data: {
      reg_no: vehicle4.reg_no,
      service_type: ServiceType.Routine_Service,
      cost: 250.0,
      date: new Date(Date.now() - 86400000 * 1), // yesterday
      status: 'In Progress',
    },
  });
  // Maintenance for VAN-05 (Completed)
  await prisma.maintenance.create({
    data: {
      reg_no: vehicle1.reg_no,
      service_type: ServiceType.Oil_Change,
      cost: 80.0,
      date: new Date(Date.now() - 86400000 * 10),
      status: 'Completed',
    },
  });
  // Maintenance for TRUCK-01 (Completed)
  await prisma.maintenance.create({
    data: {
      reg_no: vehicle2.reg_no,
      service_type: ServiceType.Tire_Replacement,
      cost: 600.0,
      date: new Date(Date.now() - 86400000 * 30),
      status: 'Completed',
    },
  });
  console.log('created Maintenance logs');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
