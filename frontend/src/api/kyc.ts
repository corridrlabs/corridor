import { apiClient } from './client'

export type KYCDocumentPayload =
  | FormData
  | {
      documents: Array<{
        document_type?: string
        file_name?: string
        mime_type?: string
        size_bytes?: number
        url?: string
        source_url?: string
        link?: string
      }>
      notes?: string
    }

export const submitKYC = async (payload: KYCDocumentPayload) => {
  if (payload instanceof FormData) {
    const { data } = await apiClient.post('/api/kyc/submit', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  }

  const { data } = await apiClient.post('/api/kyc/submit', payload)
  return data
}

export const listKYC = async () => {
  const { data } = await apiClient.get('/api/kyc/list')
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.items)) return data.items
  return []
}

export const reviewKYC = async (submissionId: string, payload: { status: string; notes?: string }) => {
  const { data } = await apiClient.post(`/api/kyc/review/?id=${submissionId}`, payload)
  return data
}

export const downloadKYCDocument = async (documentId: string) => {
  const response = await apiClient.get('/api/kyc/documents', {
    params: { id: documentId },
    responseType: 'blob',
  })
  return response.data as Blob
}
