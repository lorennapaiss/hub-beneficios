import { isBefore, parseISO, startOfDay } from "date-fns";
import { PaymentStatus } from "@/types/domain";

export const isOverdue = (dueDate: string, status: PaymentStatus) => {
  if (status === PaymentStatus.PAGO) return false;
  const due = parseISO(dueDate);
  return isBefore(due, startOfDay(new Date()));
};
