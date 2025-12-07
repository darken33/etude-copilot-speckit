import React from 'react';
import { SituationFamiliale } from '../types/api';
import { formatDisplayName } from '../utils/validation';
import { useClientForm } from '../hooks/useClientForm';
import type { ConnaissanceClient } from '../types/api';
import './ClientForm.css';

interface ClientFormProps {
  client?: ConnaissanceClient;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Composant de formulaire pour la création et modification de clients.
 * La logique métier est externalisée dans le hook useClientForm.
 * Ce composant se concentre uniquement sur la présentation.
 */
export const ClientForm: React.FC<ClientFormProps> = ({ client, onSave, onCancel }) => {
  // Extraction de toute la logique métier dans un hook personnalisé
  const {
    form,
    loading,
    error,
    validationErrors,
    onSubmit,
    handleUpdateAddress,
    handleUpdateSituation,
    getSubmitButtonText
  } = useClientForm({ client, onSave });

  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <div className="client-form">
      <div className="client-form-header">
        <h2>{client ? `Modifier ${formatDisplayName(client.nom, client.prenom)}` : 'Nouveau Client'}</h2>
        <button onClick={onCancel} className="close-btn">×</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>Erreurs de validation :</h4>
          <ul>
            {validationErrors.map((err, index) => (
              <li key={`error-${index}-${err.substring(0, 10)}`}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="client-form-content">
        <div className="form-section">
          <h3>Informations personnelles</h3>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="nom">Nom *</label>
              <input
                id="nom"
                type="text"
                {...register('nom', {
                  required: 'Le nom est obligatoire',
                  minLength: { value: 2, message: 'Le nom doit contenir au moins 2 caractères' },
                  maxLength: { value: 50, message: 'Le nom ne peut pas dépasser 50 caractères' },
                  pattern: {
                    value: /^[a-zA-Z ,.'-]+$/,
                    message: 'Le nom ne peut contenir que des lettres et les caractères , . \' -'
                  }
                })}
                className={errors.nom ? 'error' : ''}
              />
              {errors.nom && <span className="field-error">{errors.nom.message}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="prenom">Prénom *</label>
              <input
                id="prenom"
                type="text"
                {...register('prenom', {
                  required: 'Le prénom est obligatoire',
                  minLength: { value: 2, message: 'Le prénom doit contenir au moins 2 caractères' },
                  maxLength: { value: 50, message: 'Le prénom ne peut pas dépasser 50 caractères' },
                  pattern: {
                    value: /^[a-zA-Z ,.'-]+$/,
                    message: 'Le prénom ne peut contenir que des lettres et les caractères , . \' -'
                  }
                })}
                className={errors.prenom ? 'error' : ''}
              />
              {errors.prenom && <span className="field-error">{errors.prenom.message}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Adresse</h3>
            {client && (
              <button
                type="button"
                onClick={handleUpdateAddress}
                className="update-section-btn"
                disabled={loading}
              >
                Mettre à jour l'adresse
              </button>
            )}
          </div>
          
          <div className="form-field">
            <label htmlFor="ligne1">Adresse *</label>
            <input
              id="ligne1"
              type="text"
              {...register('ligne1', {
                required: 'L\'adresse est obligatoire',
                minLength: { value: 2, message: 'L\'adresse doit contenir au moins 2 caractères' },
                maxLength: { value: 50, message: 'L\'adresse ne peut pas dépasser 50 caractères' },
                pattern: {
                  value: /^[a-zA-Z0-9 ,.'-]+$/,
                  message: 'L\'adresse ne peut contenir que des lettres, chiffres et les caractères , . \' -'
                }
              })}
              className={errors.ligne1 ? 'error' : ''}
            />
            {errors.ligne1 && <span className="field-error">{errors.ligne1.message}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="ligne2">Complément d'adresse</label>
            <input
              id="ligne2"
              type="text"
              {...register('ligne2', {
                maxLength: { value: 50, message: 'Le complément d\'adresse ne peut pas dépasser 50 caractères' },
                pattern: {
                  value: /^[a-zA-Z0-9 ,.'-]*$/,
                  message: 'Le complément d\'adresse ne peut contenir que des lettres, chiffres et les caractères , . \' -'
                }
              })}
              className={errors.ligne2 ? 'error' : ''}
            />
            {errors.ligne2 && <span className="field-error">{errors.ligne2.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="codePostal">Code postal *</label>
              <input
                id="codePostal"
                type="text"
                {...register('codePostal', {
                  required: 'Le code postal est obligatoire',
                  minLength: { value: 5, message: 'Le code postal doit contenir 5 caractères' },
                  maxLength: { value: 5, message: 'Le code postal doit contenir 5 caractères' },
                  pattern: {
                    value: /^[A-Z0-9]+$/,
                    message: 'Le code postal ne peut contenir que des lettres majuscules et des chiffres'
                  }
                })}
                className={errors.codePostal ? 'error' : ''}
              />
              {errors.codePostal && <span className="field-error">{errors.codePostal.message}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="ville">Ville *</label>
              <input
                id="ville"
                type="text"
                {...register('ville', {
                  required: 'La ville est obligatoire',
                  minLength: { value: 2, message: 'La ville doit contenir au moins 2 caractères' },
                  maxLength: { value: 50, message: 'La ville ne peut pas dépasser 50 caractères' },
                  pattern: {
                    value: /^[a-zA-Z ,.'-]+$/,
                    message: 'La ville ne peut contenir que des lettres et les caractères , . \' -'
                  }
                })}
                className={errors.ville ? 'error' : ''}
              />
              {errors.ville && <span className="field-error">{errors.ville.message}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Situation familiale</h3>
            {client && (
              <button
                type="button"
                onClick={handleUpdateSituation}
                className="update-section-btn"
                disabled={loading}
              >
                Mettre à jour la situation
              </button>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="situationFamiliale">Situation familiale *</label>
              <select
                id="situationFamiliale"
                {...register('situationFamiliale', {
                  required: 'La situation familiale est obligatoire'
                })}
                className={errors.situationFamiliale ? 'error' : ''}
              >
                <option value={SituationFamiliale.CELIBATAIRE}>Célibataire</option>
                <option value={SituationFamiliale.MARIE}>Marié(e)</option>
                <option value={SituationFamiliale.DIVORCE}>Divorcé(e)</option>
                <option value={SituationFamiliale.VEUF}>Veuf(ve)</option>
                <option value={SituationFamiliale.PACSE}>Pacsé(e)</option>
              </select>
              {errors.situationFamiliale && <span className="field-error">{errors.situationFamiliale.message}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="nombreEnfants">Nombre d'enfants *</label>
              <input
                id="nombreEnfants"
                type="number"
                min="0"
                max="20"
                {...register('nombreEnfants', {
                  required: 'Le nombre d\'enfants est obligatoire',
                  min: { value: 0, message: 'Le nombre d\'enfants ne peut pas être négatif' },
                  max: { value: 20, message: 'Le nombre d\'enfants ne peut pas dépasser 20' },
                  valueAsNumber: true
                })}
                className={errors.nombreEnfants ? 'error' : ''}
              />
              {errors.nombreEnfants && <span className="field-error">{errors.nombreEnfants.message}</span>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="save-btn">
            {client ? 'Modifier' : getSubmitButtonText()}
          </button>
        </div>
      </form>
    </div>
  );
};