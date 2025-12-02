// app/stats/[homeId]/service-requests/_types.ts

export type ServiceRequestStatus =
  | "PENDING"
  | "QUOTED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELLED";

export type ServiceRequestForActions = {
  id: string;
  status: ServiceRequestStatus;
  quoteId: string | null;
};