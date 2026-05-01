import { apiClient } from './client'
const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  account_id: string
  created_at: string
  updated_at: string
}

export interface CreateCustomerData {
  name: string
  phone: string
  email?: string
}

export const customersApi = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await apiClient.get('/api/customers')
    return unwrap<Customer[]>(response)
  },

  createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await apiClient.post('/api/customers', data)
    return unwrap<Customer>(response)
  },

  getCustomer: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/api/customers/detail?id=${id}`)
    return unwrap<Customer>(response)
  },
} 
