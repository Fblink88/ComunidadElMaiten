import apiClient from './client'

export const seedData = async () => {
    const response = await apiClient.post('/api/admin/seed-data')
    return response.data
}

export const clearData = async () => {
    const response = await apiClient.post('/api/admin/clear-data')
    return response.data
}
