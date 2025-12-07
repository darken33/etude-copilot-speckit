// Types generated from OpenAPI specification

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}


export interface ConnaissanceClient {
  id: string;
  nom: string;
  prenom: string;
  ligne1: string;
  ligne2?: string;
  codePostal: string;
  ville: string;
  situationFamiliale: SituationFamiliale;
  nombreEnfants: number;
}


export interface ConnaissanceClientIn {
  nom: string;
  prenom: string;
  ligne1: string;
  ligne2?: string;
  codePostal: string;
  ville: string;
  situationFamiliale: SituationFamiliale;
  nombreEnfants: number;
}

export interface Adresse {
  ligne1: string;
  ligne2?: string;
  codePostal: string;
  ville: string;
}


export interface Situation {
  situationFamiliale: SituationFamiliale;
  nombreEnfants: number;
}


export enum SituationFamiliale {
  CELIBATAIRE = 'CELIBATAIRE',
  MARIE = 'MARIE',
  DIVORCE = 'DIVORCE',
  VEUF = 'VEUF',
  PACSE = 'PACSE'
}

export type ConnaissanceClients = ConnaissanceClient[];

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiErrorResponse;
}