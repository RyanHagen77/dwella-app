/**
 * Serialize Prisma objects for client components
 * Converts Decimal to number and Date to string
 */

/**
 * Serialize a Connection object for client components
 */
export function serializeConnection<T extends { totalSpent?: unknown }>(
  connection: T
): T & { totalSpent: number | null } {
  return {
    ...connection,
    totalSpent:
      connection.totalSpent && typeof connection.totalSpent === "object"
        ? Number(connection.totalSpent)
        : null,
  };
}

/**
 * Serialize an array of Connection objects
 */
export function serializeConnections<T extends { totalSpent?: unknown }>(
  connections: T[]
): Array<T & { totalSpent: number | null }> {
  return connections.map(serializeConnection);
}

/**
 * Serialize a JobRequest object for client components
 */
export function serializeServiceRequest<
  T extends {
    budgetMin?: unknown;
    budgetMax?: unknown;
    quote?: { totalAmount?: unknown } | null;
  }
>(serviceRequest: T) {
  return {
    ...serviceRequest,
    budgetMin:
      serviceRequest.budgetMin && typeof serviceRequest.budgetMin === "object"
        ? Number(serviceRequest.budgetMin)
        : serviceRequest.budgetMin,
    budgetMax:
      serviceRequest.budgetMax && typeof serviceRequest.budgetMax === "object"
        ? Number(serviceRequest.budgetMax)
        : serviceRequest.budgetMax,
    quote: serviceRequest.quote
      ? {
          ...serviceRequest.quote,
          totalAmount:
            serviceRequest.quote.totalAmount &&
            typeof serviceRequest.quote.totalAmount === "object"
              ? Number(serviceRequest.quote.totalAmount)
              : serviceRequest.quote.totalAmount,
        }
      : null,
  };
}

/**
 * Serialize an array of JobRequest objects
 */
export function serializeServiceRequests<
  T extends {
    budgetMin?: unknown;
    budgetMax?: unknown;
    quote?: { totalAmount?: unknown } | null;
  }
>(serviceRequests: T[]) {
  return serviceRequests.map(serializeServiceRequest);
}

/**
 * Serialize a Quote object for client components
 */
export function serializeQuote<
  T extends {
    totalAmount?: unknown;
    items?: Array<{ unitPrice?: unknown; total?: unknown; qty?: unknown }>;
  }
>(quote: T) {
  return {
    ...quote,
    totalAmount:
      quote.totalAmount && typeof quote.totalAmount === "object"
        ? Number(quote.totalAmount)
        : quote.totalAmount,
    items: quote.items?.map((item) => ({
      ...item,
      qty:
        item.qty && typeof item.qty === "object" ? Number(item.qty) : item.qty,
      unitPrice:
        item.unitPrice && typeof item.unitPrice === "object"
          ? Number(item.unitPrice)
          : item.unitPrice,
      total:
        item.total && typeof item.total === "object"
          ? Number(item.total)
          : item.total,
    })),
  };
}

/**
 * Serialize a WorkRecord object for client components
 */
export function serializeWorkRecord<T extends { cost?: unknown }>(
  workRecord: T
): T & { cost: number | null } {
  return {
    ...workRecord,
    cost:
      workRecord.cost && typeof workRecord.cost === "object"
        ? Number(workRecord.cost)
        : workRecord.cost != null
        ? Number(workRecord.cost)
        : null,
  };
}

/**
 * Serialize an array of WorkRecord objects
 */
export function serializeWorkRecords<T extends { cost?: unknown }>(
  workRecords: T[]
): Array<T & { cost: number | null }> {
  return workRecords.map(serializeWorkRecord);
}

/**
 * Serialize a Home object for client components
 * Handles latitude, longitude, and squareFeet Decimal fields
 */
export function serializeHome<
  T extends {
    latitude?: unknown;
    longitude?: unknown;
    squareFeet?: unknown;
  }
>(home: T) {
  return {
    ...home,
    latitude:
      home.latitude && typeof home.latitude === "object"
        ? Number(home.latitude)
        : home.latitude != null
        ? Number(home.latitude)
        : null,
    longitude:
      home.longitude && typeof home.longitude === "object"
        ? Number(home.longitude)
        : home.longitude != null
        ? Number(home.longitude)
        : null,
    squareFeet:
      home.squareFeet && typeof home.squareFeet === "object"
        ? Number(home.squareFeet)
        : home.squareFeet != null
        ? Number(home.squareFeet)
        : null,
  };
}

/**
 * Generic serializer for any object with Decimal fields
 * Recursively converts all Decimal objects to numbers
 */
export function serializeDecimals<T extends Record<string, unknown>>(
  obj: T
): T {
  const serialized = { ...obj };

  for (const key in serialized) {
    const value = serialized[key];

    // Handle Decimal objects (they have a toNumber method)
    if (value && typeof value === "object" && "toNumber" in value) {
      (serialized[key] as number) = Number(value);
    }
    // Handle Date objects - convert to ISO string
    else if (value instanceof Date) {
      (serialized[key] as string) = value.toISOString() as T[Extract<keyof T, string>] & string;
    }
    // Recursively handle nested objects (but not null)
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      serialized[key] = serializeDecimals(
        value as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      serialized[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? item instanceof Date
            ? item.toISOString()
            : serializeDecimals(item as Record<string, unknown>)
          : item
      ) as T[Extract<keyof T, string>];
    }
  }

  return serialized;
}

/**
 * Serialize BigInt to number (for attachment sizes, etc.)
 */
export function serializeBigInt<T extends { size?: unknown }>(
  obj: T
): T & { size: number | null } {
  return {
    ...obj,
    size:
      obj.size != null
        ? typeof obj.size === "bigint"
          ? Number(obj.size)
          : Number(obj.size)
        : null,
  };
}

/**
 * Serialize an array of objects with BigInt size field
 */
export function serializeBigInts<T extends { size?: unknown }>(
  items: T[]
): Array<T & { size: number | null }> {
  return items.map(serializeBigInt);
}