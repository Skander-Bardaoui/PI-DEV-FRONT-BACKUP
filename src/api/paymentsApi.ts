import axiosInstance from "./axiosInstance";

// ─── API ─────────────────────────────────────────────────────────────────────
export const paymentsApi = {
  findAll: (businessId: string, params?: any) =>
    axiosInstance.get(`/businesses/${businessId}/supplier-payments`, { params }).then(r => r.data),
  create: (businessId: string, dto: any) =>
    axiosInstance.post(`/businesses/${businessId}/supplier-payments`, dto).then(r => r.data),
};