// src/api/goods-receipts.api.ts
import { CreateGoodsReceiptDto, GoodsReceipt } from '@/types';
import axiosInstance from './axiosInstance';


const poBase = (businessId: string, poId: string) =>
  `/businesses/${businessId}/supplier-pos/${poId}`;

const grBase = (businessId: string) =>
  `/businesses/${businessId}/goods-receipts`;

export const createGoodsReceipt = async (
  businessId: string,
  poId: string,
  dto: CreateGoodsReceiptDto,
): Promise<GoodsReceipt> => {
  const { data } = await axiosInstance.post(
    `${poBase(businessId, poId)}/goods-receipt`,
    dto,
  );
  return data;
};

export const getGoodsReceiptsByPO = async (
  businessId: string,
  poId: string,
): Promise<GoodsReceipt[]> => {
  const { data } = await axiosInstance.get(
    `${poBase(businessId, poId)}/goods-receipts`,
  );
  return data;
};

export const getGoodsReceipt = async (
  businessId: string,
  id: string,
): Promise<GoodsReceipt> => {
  const { data } = await axiosInstance.get(`${grBase(businessId)}/${id}`);
  return data;
};