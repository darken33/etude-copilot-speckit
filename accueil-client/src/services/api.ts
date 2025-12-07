import axios, { AxiosResponse } from 'axios';
import {
  ConnaissanceClient,
  ConnaissanceClientIn,
  ConnaissanceClients,
  Adresse,
  Situation,
  ApiErrorResponse
} from '../types/api';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class ConnaissanceClientAPI {
  // Get all clients
  static async getConnaissanceClients(): Promise<ConnaissanceClients> {
    try {
      const response: AxiosResponse<ConnaissanceClients> = await apiClient.get(
        '/v1/connaissance-clients'
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Get client by ID
  static async getConnaissanceClient(id: string): Promise<ConnaissanceClient> {
    try {
      const response: AxiosResponse<ConnaissanceClient> = await apiClient.get(
        `/v1/connaissance-clients/${id}`
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Create client
  static async saveConnaissanceClient(
    client: ConnaissanceClientIn
  ): Promise<ConnaissanceClient> {
    try {
      const response: AxiosResponse<ConnaissanceClient> = await apiClient.post(
        '/v1/connaissance-clients',
        client
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Update client (modification globale)
  static async updateConnaissanceClient(
    id: string,
    client: ConnaissanceClientIn
  ): Promise<ConnaissanceClient> {
    try {
      const response: AxiosResponse<ConnaissanceClient> = await apiClient.put(
        `/v1/connaissance-clients/${id}`,
        client
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Delete client
  static async deleteConnaissanceClient(id: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/connaissance-clients/${id}`);
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Update client address
  static async changerAdresse(
    id: string,
    adresse: Adresse
  ): Promise<ConnaissanceClient> {
    try {
      const response: AxiosResponse<ConnaissanceClient> = await apiClient.put(
        `/v1/connaissance-clients/${id}/adresse`,
        adresse
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Update client situation
  static async changerSituation(
    id: string,
    situation: Situation
  ): Promise<ConnaissanceClient> {
    try {
      const response: AxiosResponse<ConnaissanceClient> = await apiClient.put(
        `/v1/connaissance-clients/${id}/situation`,
        situation
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  private static handleApiError(error: any): Error {
    if (error.response?.data) {
      const apiError: ApiErrorResponse = error.response.data;
      return new Error(apiError.message || apiError.error);
    }
    return new Error(error.message || 'Une erreur inattendue est survenue');
  }
}