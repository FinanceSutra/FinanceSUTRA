import * as schema from "@shared/schema";

// Create a mock db object for development
console.log("Using mock database for development");

// Create a mock pool
const mockPool = {
  query: async () => ({ rows: [] }),
  connect: async () => ({}),
  end: async () => {},
};

// Create a mock drizzle db object
export const db = {
  select: () => ({
    from: () => ({
      where: () => [],
      orderBy: () => [],
      limit: () => [],
    }),
  }),
  insert: () => ({
    values: () => ({
      returning: () => [],
      onConflictDoUpdate: () => ({ returning: () => [] }),
    }),
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () => [],
      }),
    }),
  }),
  delete: () => ({
    where: () => [],
  }),
};

export const pool = mockPool;
