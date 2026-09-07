import { useQuery } from "@tanstack/react-query";
import { financialService } from "../services/financial.service";

export const useSummaryCards = () =>
  useQuery({ queryKey: ["financial", "summary-cards"], queryFn: financialService.getSummaryCards });

export const usePaymentGateways = () =>
  useQuery({ queryKey: ["financial", "payment-gateways"], queryFn: financialService.getPaymentGateways });

export const useSuppliers = () =>
  useQuery({ queryKey: ["financial", "suppliers"], queryFn: financialService.getSuppliers });
