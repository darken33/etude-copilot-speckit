import { useState, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { ConnaissanceClient, ConnaissanceClientIn, SituationFamiliale } from '../types/api';
import { ConnaissanceClientAPI } from '../services/api';
import { validateClient } from '../utils/validation';

interface UseClientFormOptions {
  client?: ConnaissanceClient;
  onSave: () => void;
}

interface UseClientFormReturn {
  form: UseFormReturn<ConnaissanceClientIn>;
  loading: boolean;
  error: string | null;
  validationErrors: string[];
  onSubmit: (data: ConnaissanceClientIn) => Promise<void>;
  handleUpdateAddress: () => Promise<void>;
  handleUpdateSituation: () => Promise<void>;
  getSubmitButtonText: () => string;
}

/**
 * Hook personnalisé pour la gestion de la logique métier du formulaire client.
 * Sépare la logique métier (API calls, validation, state management) de la présentation.
 */
export const useClientForm = ({ client, onSave }: UseClientFormOptions): UseClientFormReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<ConnaissanceClientIn>({
    defaultValues: getDefaultValues(client)
  });

  const { reset, watch } = form;
  const watchedValues = watch();

  // Réinitialiser le formulaire quand le client change
  useEffect(() => {
    if (client) {
      reset(getDefaultValues(client));
    }
  }, [client, reset]);

  /**
   * Génère les valeurs par défaut du formulaire selon le mode (création/modification)
   */
  function getDefaultValues(client?: ConnaissanceClient): ConnaissanceClientIn {
    return client ? {
      nom: client.nom,
      prenom: client.prenom,
      ligne1: client.ligne1,
      ligne2: client.ligne2 || '',
      codePostal: client.codePostal,
      ville: client.ville,
      situationFamiliale: client.situationFamiliale,
      nombreEnfants: client.nombreEnfants
    } : {
      nom: '',
      prenom: '',
      ligne1: '',
      ligne2: '',
      codePostal: '',
      ville: '',
      situationFamiliale: SituationFamiliale.CELIBATAIRE,
      nombreEnfants: 0
    };
  }

  /**
   * Prépare les données client en excluant les champs vides optionnels
   */
  function prepareClientData(data: ConnaissanceClientIn): ConnaissanceClientIn {
    const clientData = { ...data };
    // Supprimer ligne2 si vide (champ optionnel)
    if (!clientData.ligne2 || clientData.ligne2.trim() === '') {
      delete clientData.ligne2;
    }
    return clientData;
  }

  /**
   * Gère les erreurs API et les transforme en messages utilisateur
   */
  function handleError(err: unknown, defaultMessage: string): void {
    if (err && typeof err === 'object' && 'message' in err) {
      const apiError = err as { message: string; error?: unknown };
      const errorDetail = apiError.error 
        ? typeof apiError.error === 'string' 
          ? apiError.error 
          : JSON.stringify(apiError.error)
        : '';
      setError(`${apiError.message}${errorDetail ? ' (' + errorDetail + ')' : ''}`);
    } else {
      setError(err instanceof Error ? err.message : defaultMessage);
    }
  }

  /**
   * Soumet le formulaire (création ou modification globale)
   */
  const onSubmit = async (data: ConnaissanceClientIn): Promise<void> => {
    setError(null);
    setValidationErrors([]);

    // Validation côté client
    const clientValidationErrors = validateClient(data);
    if (clientValidationErrors.length > 0) {
      setValidationErrors(clientValidationErrors.map(err => err.message));
      return;
    }

    try {
      setLoading(true);
      const clientData = prepareClientData(data);
      
      if (client) {
        // Modification globale via PUT
        await ConnaissanceClientAPI.updateConnaissanceClient(client.id, clientData);
      } else {
        // Création via POST
        await ConnaissanceClientAPI.saveConnaissanceClient(clientData);
      }
      
      onSave();
    } catch (err) {
      handleError(err, 'Erreur lors de la sauvegarde du client');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour uniquement l'adresse du client (modification partielle)
   */
  const handleUpdateAddress = async (): Promise<void> => {
    if (!client) return;
    
    try {
      setLoading(true);
      const addressData: any = {
        ligne1: watchedValues.ligne1,
        codePostal: watchedValues.codePostal,
        ville: watchedValues.ville
      };
      
      // N'envoyer ligne2 que s'il n'est pas vide
      if (watchedValues.ligne2 && watchedValues.ligne2.trim() !== '') {
        addressData.ligne2 = watchedValues.ligne2;
      }
      
      await ConnaissanceClientAPI.changerAdresse(client.id, addressData);
      onSave();
    } catch (err) {
      handleError(err, 'Erreur lors de la mise à jour de l\'adresse');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour uniquement la situation familiale du client (modification partielle)
   */
  const handleUpdateSituation = async (): Promise<void> => {
    if (!client) return;
    
    try {
      setLoading(true);
      const situationData = {
        situationFamiliale: watchedValues.situationFamiliale,
        nombreEnfants: watchedValues.nombreEnfants
      };
      
      await ConnaissanceClientAPI.changerSituation(client.id, situationData);
      onSave();
    } catch (err) {
      handleError(err, 'Erreur lors de la mise à jour de la situation');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retourne le texte du bouton submit selon l'état de chargement
   */
  const getSubmitButtonText = (): string => {
    if (loading) return 'Sauvegarde...';
    return 'Créer';
  };

  return {
    form,
    loading,
    error,
    validationErrors,
    onSubmit,
    handleUpdateAddress,
    handleUpdateSituation,
    getSubmitButtonText
  };
};
