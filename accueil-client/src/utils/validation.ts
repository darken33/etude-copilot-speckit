import { ConnaissanceClientIn, ValidationError } from '../types/api';

export const validateClient = (client: Partial<ConnaissanceClientIn>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Nom validation
  if (!client.nom || client.nom.length < 2 || client.nom.length > 50) {
    errors.push({
      field: 'nom',
      message: 'Le nom doit contenir entre 2 et 50 caractères'
    });
  } else if (!/^[a-zA-Z ,.'-]+$/.test(client.nom)) {
    errors.push({
      field: 'nom',
      message: 'Le nom ne peut contenir que des lettres, espaces et caractères , . \' -'
    });
  }

  // Prenom validation
  if (!client.prenom || client.prenom.length < 2 || client.prenom.length > 50) {
    errors.push({
      field: 'prenom',
      message: 'Le prénom doit contenir entre 2 et 50 caractères'
    });
  } else if (!/^[a-zA-Z ,.'-]+$/.test(client.prenom)) {
    errors.push({
      field: 'prenom',
      message: 'Le prénom ne peut contenir que des lettres, espaces et caractères , . \' -'
    });
  }

  // Ligne1 validation
  if (!client.ligne1 || client.ligne1.length < 2 || client.ligne1.length > 50) {
    errors.push({
      field: 'ligne1',
      message: 'L\'adresse doit contenir entre 2 et 50 caractères'
    });
  } else if (!/^[a-zA-Z0-9 ,.'-]+$/.test(client.ligne1)) {
    errors.push({
      field: 'ligne1',
      message: 'L\'adresse ne peut contenir que des lettres, chiffres, espaces et caractères , . \' -'
    });
  }

  // Ligne2 validation (optional)
  if (client.ligne2 && (client.ligne2.length < 2 || client.ligne2.length > 50)) {
    errors.push({
      field: 'ligne2',
      message: 'Le complément d\'adresse doit contenir entre 2 et 50 caractères'
    });
  } else if (client.ligne2 && !/^[a-zA-Z0-9 ,.'-]+$/.test(client.ligne2)) {
    errors.push({
      field: 'ligne2',
      message: 'Le complément d\'adresse ne peut contenir que des lettres, chiffres, espaces et caractères , . \' -'
    });
  }

  // Code postal validation
  if (!client.codePostal || client.codePostal.length !== 5) {
    errors.push({
      field: 'codePostal',
      message: 'Le code postal doit contenir exactement 5 caractères'
    });
  } else if (!/^[A-Z0-9]+$/.test(client.codePostal)) {
    errors.push({
      field: 'codePostal',
      message: 'Le code postal ne peut contenir que des lettres majuscules et des chiffres'
    });
  }

  // Ville validation
  if (!client.ville || client.ville.length < 2 || client.ville.length > 50) {
    errors.push({
      field: 'ville',
      message: 'La ville doit contenir entre 2 et 50 caractères'
    });
  } else if (!/^[a-zA-Z ,.'-]+$/.test(client.ville)) {
    errors.push({
      field: 'ville',
      message: 'La ville ne peut contenir que des lettres, espaces et caractères , . \' -'
    });
  }

  // Situation familialle validation
  if (!client.situationFamiliale) {
    errors.push({
  field: 'situationFamiliale',
      message: 'La situation familiale est obligatoire'
    });
  }

  // Nombre enfants validation
  if (client.nombreEnfants === undefined || client.nombreEnfants === null) {
    errors.push({
      field: 'nombreEnfants',
      message: 'Le nombre d\'enfants est obligatoire'
    });
  } else if (client.nombreEnfants < 0 || client.nombreEnfants > 20) {
    errors.push({
      field: 'nombreEnfants',
      message: 'Le nombre d\'enfants doit être entre 0 et 20'
    });
  }

  return errors;
};

export const formatDisplayName = (nom: string, prenom: string): string => {
  return `${prenom} ${nom}`;
};

export const formatAddress = (ligne1: string, ligne2?: string, codePostal?: string, ville?: string): string => {
  const addressParts = [ligne1];
  if (ligne2) addressParts.push(ligne2);
  if (codePostal && ville) addressParts.push(`${codePostal} ${ville}`);
  return addressParts.join(', ');
};

export const formatSituationFamiliale = (situation: string): string => {
  switch (situation) {
    case 'CELIBATAIRE':
      return 'Célibataire';
    case 'MARIE':
      return 'Marié(e)';
    case 'DIVORCE':
      return 'Divorcé(e)';
    case 'VEUF':
      return 'Veuf(ve)';
    case 'PACSE':
      return 'Pacsé(e)';
    default:
      return situation;
  }
};