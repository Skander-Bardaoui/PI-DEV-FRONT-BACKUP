// src/api/quotes.ts
import axiosInstance from './axiosInstance';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  Quote,
  QuotesQueryParams,
  PaginatedQuotes,
} from '@/types/quote';

const base = (businessId: string) => `/businesses/${businessId}/quotes`;

export const getQuotes = async (
  businessId: string,
  params?: QuotesQueryParams,
): Promise<PaginatedQuotes> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getQuote = async (
  businessId: string,
  id: string,
): Promise<Quote> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};

export const createQuote = async (
  businessId: string,
  dto: CreateQuoteDto,
): Promise<Quote> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updateQuote = async (
  businessId: string,
  id: string,
  dto: UpdateQuoteDto,
): Promise<Quote> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const sendQuote = async (
  businessId: string,
  id: string,
): Promise<Quote> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/send`);
  return data;
};

export const acceptQuote = async (
  businessId: string,
  id: string,
): Promise<Quote> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/accept`);
  return data;
};

export const rejectQuote = async (
  businessId: string,
  id: string,
): Promise<Quote> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/reject`);
  return data;
};

export const expireQuote = async (
  businessId: string,
  id: string,
): Promise<Quote> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/expire`);
  return data;
};

export const convertQuote = async (
  businessId: string,
  id: string,
): Promise<Quote> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/convert`);
  return data;
};

export const convertQuoteToInvoice = async (
  businessId: string,
  id: string,
): Promise<any> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/convert-to-invoice`);
  return data;
};

export const convertQuoteToOrder = async (
  businessId: string,
  id: string,
): Promise<any> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/convert-to-order`);
  return data;
};

export const deleteQuote = async (
  businessId: string,
  id: string,
): Promise<void> => {
  await axiosInstance.delete(`${base(businessId)}/${id}`);
};
