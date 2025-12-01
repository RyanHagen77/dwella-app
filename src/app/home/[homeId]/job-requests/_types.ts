// app/stats/[homeId]/job-requests/_types.ts

export type JobRequestStatus =
  | "PENDING"
  | "QUOTED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELLED";

export type JobRequestForActions = {
  id: string;
  status: JobRequestStatus;
  quoteId: string | null;
};