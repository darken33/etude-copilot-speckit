import { validateClient, formatDisplayName, formatAddress, formatSituationFamiliale } from '../utils/validation';
import { SituationFamiliale } from '../types/api';

describe('Validation Utils', () => {
  describe('validateClient', () => {
    it('should return no errors for valid client data', () => {
      const validClient = {
        nom: 'Dupont',
        prenom: 'Jean',
        ligne1: '123 rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
  situationFamiliale: SituationFamiliale.MARIE,
        nombreEnfants: 2
      };

      const errors = validateClient(validClient);
      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid nom', () => {
      const invalidClient = {
        nom: 'A', // Too short
        prenom: 'Jean',
        ligne1: '123 rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.MARIE,
        nombreEnfants: 2
      };

      const errors = validateClient(invalidClient);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('nom');
    });

    it('should return error for invalid code postal', () => {
      const invalidClient = {
        nom: 'Dupont',
        prenom: 'Jean',
        ligne1: '123 rue de la Paix',
        codePostal: '123', // Too short
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.MARIE,
        nombreEnfants: 2
      };

      const errors = validateClient(invalidClient);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('codePostal');
    });
  });

  describe('formatDisplayName', () => {
    it('should format display name correctly', () => {
      const result = formatDisplayName('Dupont', 'Jean');
      expect(result).toBe('Jean Dupont');
    });
  });

  describe('formatAddress', () => {
    it('should format address with all components', () => {
      const result = formatAddress('123 rue de la Paix', 'Apt 4B', '75001', 'Paris');
      expect(result).toBe('123 rue de la Paix, Apt 4B, 75001 Paris');
    });

    it('should format address without ligne2', () => {
      const result = formatAddress('123 rue de la Paix', undefined, '75001', 'Paris');
      expect(result).toBe('123 rue de la Paix, 75001 Paris');
    });
  });

  describe('formatSituationFamiliale', () => {
    it('should format CELIBATAIRE correctly', () => {
      const result = formatSituationFamiliale('CELIBATAIRE');
      expect(result).toBe('Célibataire');
    });

    it('should format MARIE correctly', () => {
      const result = formatSituationFamiliale('MARIE');
      expect(result).toBe('Marié(e)');
    });

    it('should format DIVORCE correctly', () => {
      const result = formatSituationFamiliale('DIVORCE');
      expect(result).toBe('Divorcé(e)');
    });

    it('should format VEUF correctly', () => {
      const result = formatSituationFamiliale('VEUF');
      expect(result).toBe('Veuf(ve)');
    });

    it('should format PACSE correctly', () => {
      const result = formatSituationFamiliale('PACSE');
      expect(result).toBe('Pacsé(e)');
    });

    it('should return original value for unknown situation', () => {
      const result = formatSituationFamiliale('UNKNOWN');
      expect(result).toBe('UNKNOWN');
    });
  });

  describe('validateClient with new enum values', () => {
    it('should accept DIVORCE situation', () => {
      const validClient = {
        nom: 'Dupont',
        prenom: 'Marie',
        ligne1: '123 rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.DIVORCE,
        nombreEnfants: 2
      };

      const errors = validateClient(validClient);
      expect(errors).toHaveLength(0);
    });

    it('should accept VEUF situation', () => {
      const validClient = {
        nom: 'Martin',
        prenom: 'Jean',
        ligne1: '456 avenue Victor Hugo',
        codePostal: '69001',
        ville: 'Lyon',
        situationFamiliale: SituationFamiliale.VEUF,
        nombreEnfants: 1
      };

      const errors = validateClient(validClient);
      expect(errors).toHaveLength(0);
    });

    it('should accept PACSE situation', () => {
      const validClient = {
        nom: 'Bernard',
        prenom: 'Sophie',
        ligne1: '789 boulevard de la Republique',
        codePostal: '13001',
        ville: 'Marseille',
        situationFamiliale: SituationFamiliale.PACSE,
        nombreEnfants: 0
      };

      const errors = validateClient(validClient);
      expect(errors).toHaveLength(0);
    });
  });
});