import { renderHook, act, waitFor } from '@testing-library/react';
import { useClientForm } from '../useClientForm';
import { ConnaissanceClientAPI } from '../../services/api';
import { SituationFamiliale } from '../../types/api';
import type { ConnaissanceClient } from '../../types/api';

// Mock du service API
jest.mock('../../services/api');

const mockConnaissanceClientAPI = ConnaissanceClientAPI as jest.Mocked<typeof ConnaissanceClientAPI>;

describe('useClientForm', () => {
  const mockOnSave = jest.fn();

  const mockClient: ConnaissanceClient = {
    id: '123',
    nom: 'Dupont',
    prenom: 'Jean',
    ligne1: '123 rue Test',
    ligne2: 'Apt 4',
    codePostal: '75001',
    ville: 'Paris',
    situationFamiliale: SituationFamiliale.MARIE,
    nombreEnfants: 2
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values for new client', () => {
      const { result } = renderHook(() => useClientForm({ onSave: mockOnSave }));

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.validationErrors).toEqual([]);
      
      const defaultValues = result.current.form.getValues();
      expect(defaultValues.nom).toBe('');
      expect(defaultValues.prenom).toBe('');
      expect(defaultValues.situationFamiliale).toBe(SituationFamiliale.CELIBATAIRE);
      expect(defaultValues.nombreEnfants).toBe(0);
    });

    it('should initialize with client data for edit mode', () => {
      const { result } = renderHook(() => 
        useClientForm({ client: mockClient, onSave: mockOnSave })
      );

      const formValues = result.current.form.getValues();
      expect(formValues.nom).toBe('Dupont');
      expect(formValues.prenom).toBe('Jean');
      expect(formValues.ligne1).toBe('123 rue Test');
      expect(formValues.ligne2).toBe('Apt 4');
      expect(formValues.codePostal).toBe('75001');
      expect(formValues.ville).toBe('Paris');
      expect(formValues.situationFamiliale).toBe(SituationFamiliale.MARIE);
      expect(formValues.nombreEnfants).toBe(2);
    });
  });

  describe('Form Submission - New Client', () => {
    it('should create new client successfully', async () => {
      mockConnaissanceClientAPI.saveConnaissanceClient.mockResolvedValueOnce(mockClient);

      const { result } = renderHook(() => useClientForm({ onSave: mockOnSave }));

      const formData = {
        nom: 'Dupont',
        prenom: 'Jean',
        ligne1: '123 rue Test',
        ligne2: '',
        codePostal: '75001',
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.CELIBATAIRE,
        nombreEnfants: 0
      };

      await act(async () => {
        await result.current.onSubmit(formData);
      });

      await waitFor(() => {
        expect(mockConnaissanceClientAPI.saveConnaissanceClient).toHaveBeenCalledWith({
          nom: 'Dupont',
          prenom: 'Jean',
          ligne1: '123 rue Test',
          // ligne2 should be removed (empty)
          codePostal: '75001',
          ville: 'Paris',
          situationFamiliale: SituationFamiliale.CELIBATAIRE,
          nombreEnfants: 0
        });
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle validation errors', async () => {
      const { result } = renderHook(() => useClientForm({ onSave: mockOnSave }));

      const invalidData = {
        nom: 'A', // Too short
        prenom: 'Jean',
        ligne1: '123 rue Test',
        ligne2: '',
        codePostal: '75001',
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.CELIBATAIRE,
        nombreEnfants: 0
      };

      await act(async () => {
        await result.current.onSubmit(invalidData);
      });

      expect(result.current.validationErrors.length).toBeGreaterThan(0);
      expect(mockConnaissanceClientAPI.saveConnaissanceClient).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const apiError = {
        message: 'Erreur serveur',
        error: 'Internal Server Error'
      };
      mockConnaissanceClientAPI.saveConnaissanceClient.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useClientForm({ onSave: mockOnSave }));

      const formData = {
        nom: 'Dupont',
        prenom: 'Jean',
        ligne1: '123 rue Test',
        ligne2: '',
        codePostal: '75001',
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.CELIBATAIRE,
        nombreEnfants: 0
      };

      await act(async () => {
        await result.current.onSubmit(formData);
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Erreur serveur');
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission - Update Client', () => {
    it('should update existing client successfully', async () => {
      mockConnaissanceClientAPI.updateConnaissanceClient.mockResolvedValueOnce(mockClient);

      const { result } = renderHook(() => 
        useClientForm({ client: mockClient, onSave: mockOnSave })
      );

      const updatedData = {
        nom: 'Dupont',
        prenom: 'Marie',
        ligne1: '456 avenue Nouveau',
        ligne2: '',
        codePostal: '75002',
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.DIVORCE,
        nombreEnfants: 1
      };

      await act(async () => {
        await result.current.onSubmit(updatedData);
      });

      await waitFor(() => {
        expect(mockConnaissanceClientAPI.updateConnaissanceClient).toHaveBeenCalledWith(
          '123',
          expect.objectContaining({
            nom: 'Dupont',
            prenom: 'Marie',
            situationFamiliale: SituationFamiliale.DIVORCE,
            nombreEnfants: 1
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Partial Updates', () => {
    it('should update address only', async () => {
      mockConnaissanceClientAPI.changerAdresse.mockResolvedValueOnce(mockClient);

      const { result } = renderHook(() => 
        useClientForm({ client: mockClient, onSave: mockOnSave })
      );

      // Simuler le changement des valeurs du formulaire
      act(() => {
        result.current.form.setValue('ligne1', '789 rue Nouvelle');
        result.current.form.setValue('codePostal', '69001');
        result.current.form.setValue('ville', 'Lyon');
      });

      await act(async () => {
        await result.current.handleUpdateAddress();
      });

      await waitFor(() => {
        expect(mockConnaissanceClientAPI.changerAdresse).toHaveBeenCalledWith(
          '123',
          expect.objectContaining({
            ligne1: '789 rue Nouvelle',
            codePostal: '69001',
            ville: 'Lyon'
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should update situation only', async () => {
      mockConnaissanceClientAPI.changerSituation.mockResolvedValueOnce(mockClient);

      const { result } = renderHook(() => 
        useClientForm({ client: mockClient, onSave: mockOnSave })
      );

      // Simuler le changement des valeurs du formulaire
      act(() => {
        result.current.form.setValue('situationFamiliale', SituationFamiliale.VEUF);
        result.current.form.setValue('nombreEnfants', 3);
      });

      await act(async () => {
        await result.current.handleUpdateSituation();
      });

      await waitFor(() => {
        expect(mockConnaissanceClientAPI.changerSituation).toHaveBeenCalledWith(
          '123',
          {
            situationFamiliale: SituationFamiliale.VEUF,
            nombreEnfants: 3
          }
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should not call update methods when no client exists', async () => {
      const { result } = renderHook(() => useClientForm({ onSave: mockOnSave }));

      await act(async () => {
        await result.current.handleUpdateAddress();
        await result.current.handleUpdateSituation();
      });

      expect(mockConnaissanceClientAPI.changerAdresse).not.toHaveBeenCalled();
      expect(mockConnaissanceClientAPI.changerSituation).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should set loading state during submission', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockConnaissanceClientAPI.saveConnaissanceClient.mockReturnValueOnce(promise as any);

      const { result } = renderHook(() => useClientForm({ onSave: mockOnSave }));

      const formData = {
        nom: 'Dupont',
        prenom: 'Jean',
        ligne1: '123 rue Test',
        ligne2: '',
        codePostal: '75001',
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.CELIBATAIRE,
        nombreEnfants: 0
      };

      act(() => {
        result.current.onSubmit(formData);
      });

      // Loading should be true during API call
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(mockClient);
      });

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Button Text', () => {
    it('should return correct button text when not loading', () => {
      const { result } = renderHook(() => useClientForm({ onSave: mockOnSave }));
      expect(result.current.getSubmitButtonText()).toBe('Créer');
    });

    it('should return loading text when loading', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockConnaissanceClientAPI.saveConnaissanceClient.mockReturnValueOnce(promise as any);

      const { result } = renderHook(() => useClientForm({ onSave: mockOnSave }));

      const formData = {
        nom: 'Dupont',
        prenom: 'Jean',
        ligne1: '123 rue Test',
        ligne2: '',
        codePostal: '75001',
        ville: 'Paris',
        situationFamiliale: SituationFamiliale.CELIBATAIRE,
        nombreEnfants: 0
      };

      act(() => {
        result.current.onSubmit(formData);
      });

      expect(result.current.getSubmitButtonText()).toBe('Sauvegarde...');

      await act(async () => {
        resolvePromise!(mockClient);
      });
    });
  });
});
