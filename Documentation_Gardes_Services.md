# Application de Répartition Automatique des Services de Garde Militaires  
## Poste de Police – Points de Garde – Permanences Générales & Spécialisées – Gestion des Exceptions

---

# 1. Objectif Général

Développer une application de bureau permettant de :
- Organiser automatiquement la répartition quotidienne des services de garde.
- Respecter toutes les contraintes militaires : grades, rotation, équité, congés, restrictions médicales, exemptions, **exceptions de service**.
- Gérer un **poste de police central**, plusieurs **points de garde**, les **permanences hiérarchiques**, et les **spécialistes de permanence**.
- Gérer un **module dédié de gestion des exceptions** (malade, congé, mission, détachement, raison de service).
- Appliquer des **règles spécifiques pour les week-ends et les jours fériés**.
- Offrir une **section de règles configurable** pour définir :
  - le nombre de points de garde,
  - la gestion des spécialisations et de leurs permanences.
- Garantir une planification conforme, transparente et modifiable manuellement.
- Fonctionner hors-ligne, avec une base de données locale SQLite (stack recommandée : Tauri + React + SQLite).

---

# 2. Structure Opérationnelle

## 2.1 Poste de Police (Poste Central)

Le poste de police est la structure principale du service de garde.  
Il regroupe :
- **Chef de poste de police** (grade : sergent-chef).
- **Adjoint au chef de poste de police** (grade : sergent).
- **Les soldats en attente/relève** (non en rotation active aux points).

Ces deux postes sont occupés pour **24 heures**.

## 2.2 Points de Garde

Plusieurs points de garde sont répartis sur la base :
- Chaque point est occupé par **3 soldats** par tranche de 24h.
- Les soldats tournent **toutes les 2 heures**, créant **12 rotations**.
- Les 3 soldats affectés sont liés au poste de police pour la relève.

Le **nombre de points de garde actifs** peut être différent :
- en semaine,
- le week-end,
- les jours fériés (voir section Règles de configuration).

## 2.3 Permanence (Hiérarchie)

Certains cadres assurent une permanence générale :
- **Officier ou Sous-Officier de permanence** : par roulement hiérarchique.
- **Adjoint de permanence** : obligatoirement adjudant ou adjudant-chef.

Ces fonctions couvrent également 24h et sont incompatibles avec les gardes.

## 2.4 Spécialistes de Permanence

Les spécialistes assurent une permanence quotidienne, par spécialité :
- Conducteur de permanence.
- Infirmier(e) de permanence.
- Mécanicien de permanence.
- Agent de dépannage / service technique.

Ces fonctions tournent dans leur propre groupe de spécialistes éligibles.  
Le **niveau de couverture** (ex : permanence infirmier obligatoire seulement en semaine ou 7j/7) est configurable par règles.

---

# 3. Règles Métier

## 3.1 Contraintes de Garde

- 3 soldats par point.
- Rotation toutes les 2h (24h → 12 créneaux).
- Aucun soldat ne peut être affecté :
  - À un point ET à la permanence le même jour.
  - À deux points en même temps.
  - À la garde s'il est en congé, mission, détachement, malade ou en exception pour raison de service sur la même période.

## 3.2 Contraintes Hiérarchiques

- Chef poste police = sergent-chef.
- Adjoint chef poste police = sergent.
- Adjoint de permanence = adjudant ou adjudant-chef.
- Les permanences (officier / adjoint) tournent selon l’équité.

## 3.3 Contraintes Médicales

- Restrictions totales : zéro affectation.
- Restrictions partielles : pas de nuit / pas de froid / pas d’effort (paramétrable).
- Toute affectation incompatible doit être automatiquement refusée.

## 3.4 Exceptions de Service

Les **exceptions** correspondent à des indisponibilités ou statuts particuliers :
- Malade (avec ou sans certificat, durée limitée).
- Congé / permission.
- Mission (intérieure ou extérieure).
- Détachement (temporaire vers une autre unité).
- Raison de service (occupation à une autre tâche prioritaire, exercice, inspection, etc.).

Effet sur l’algorithme :
- Un militaire sous exception active est non sélectionnable pour :
  - les gardes,
  - les permanences,
  - les spécialités,
  pour toute la durée de l’exception.
- La priorité des exceptions est supérieure à toute autre règle.

## 3.5 Règles Particulières pour les Week-Ends et Jours Fériés

Les week-ends et jours fériés peuvent avoir des règles spécifiques, par exemple :
- Réduction du **nombre de points de garde actifs** (certains points fermés ou en veille).
- Changement de la **priorité des permanences spécialisées** (ex : infirmier obligatoire 7j/7, mécanicien seulement en semaine).
- Répartition différente des gardes (ex : éviter de charger les mêmes militaires tous les week-ends).

L’application doit permettre :
- de marquer des dates comme **jours fériés** dans un calendrier,
- de définir des **profils de service** :
  - Profil “Semaine”
  - Profil “Week-end”
  - Profil “Jour férié”

Chaque profil définit :
- le nombre de points de garde actifs,
- les rôles de permanence actifs,
- les spécialisations à couvrir.

## 3.6 Équité & Rotation

L’algorithme applique l’équité sur :
- Nombre de gardes effectuées.
- Nombre de permanences effectuées.
- Dernière date de service.
- Grade pour éviter surcharge des jeunes soldats.
- Répartition sur les week-ends et jours fériés (éviter toujours les mêmes).

---

# 4. Architecture Fonctionnelle

## 4.1 Modules Principaux

1. **Gestion du Personnel**
   - Grades, unités, spécialités.
   - Contraintes médicales.
   - Exemptions permanentes.
   - Informations de base pour l’algorithme.

2. **Gestion des Exceptions**
   - Saisie et suivi des absences et statuts :
     - Malade
     - Congé / permission
     - Mission
     - Détachement
     - Raison de service
   - Périodes (date début / date fin).
   - Impact automatique sur la disponibilité.

3. **Configuration des Postes**
   - Définition du poste de police.
   - Définition des points de garde.
   - Profilage par type de jour (semaine / week-end / férié).
   - Paramètres des rotations (toutes les 2h).

4. **Module « Règles de Configuration »**  ← NOUVEAU
   - Gestion des **profils de service** (semaine, week-end, férié).
   - Définition du **nombre de points de garde** actifs par profil.
   - Gestion des **spécialisations** :
     - quelles spécialités sont nécessaires quel jour (ex : conducteur tous les jours, mécanicien seulement en semaine),
     - nombre minimum de spécialistes à couvrir.
   - Paramétrage de la logique d’équité (week-end / fériés).

5. **Moteur d’Affectation**
   - Prise en compte du type de jour (semaine / week-end / férié).
   - Prise en compte des exceptions avant tout calcul.
   - Affectation des permanences hiérarchiques.
   - Affectation des permanences spécialisées.
   - Affectation des points de garde selon le profil du jour.
   - Génération automatique des rotations.

6. **Planning & Visualisation**
   - Vue journalière, hebdomadaire, mensuelle.
   - Vue détaillée par point ou poste.
   - Mise en évidence des jours fériés / week-ends.

7. **Historique & Statistiques**
   - Historique des gardes & permanences.
   - Suivi de l’équité (incluant week-ends / fériés).
   - Rapports par militaire.

8. **Sécurité & Administration**
   - Rôles utilisateurs.
   - Journalisation des modifications.
   - Sauvegardes.

---

## 4.2 Module « Gestion des Exceptions »

### 4.2.1 Objectifs

- Centraliser toutes les informations d’**indisponibilité** et de **statut spécial** des militaires.
- Empêcher leur sélection par le moteur d’affectation pendant la période concernée.
- Garder une traçabilité (qui a créé l’exception, motif, justificatif éventuel).

### 4.2.2 Types d’Exceptions

- **Malade**  
- **Congé / Permission**  
- **Mission**  
- **Détachement**  
- **Raison de service**

(voir version précédente pour le détail des champs et règles de priorité)

---

## 4.3 Module « Règles de Configuration des Points de Garde et Spécialisations »

### 4.3.1 Objectifs

- Donner de la **flexibilité** à l’unité pour adapter :
  - le **nombre de points de garde**,
  - les **spécialisations requises**,
  - selon le type de jour (semaine, week-end, férié),
  sans modifier le code de l’application.

### 4.3.2 Profils de Service

Créer une entité `ProfilService` :

- `id`
- `type_jour` : SEMAINE / WEEK_END / FERIE
- `description`

Pour chaque `ProfilService`, l’administrateur peut définir :

- Nombre de **points de garde actifs**.
- Liste des **points activés/désactivés**.
- Liste des **rôles de permanence** obligatoires.
- Liste des **spécialités de permanence** obligatoires.

### 4.3.3 Gestion des Spécialisations

- Définir les spécialités utilisées par l’unité (conducteur, infirmier, mécanicien, dépannage, autres).
- Pour chaque spécialité et profil de jour (semaine, week-end, férié) :
  - Indiquer si la spécialité est :
    - Obligatoire,
    - Optionnelle,
    - Non utilisée.
  - Indiquer un éventuel **nombre minimum** de spécialistes par jour.

Exemples :
- Conducteur : obligatoire tous les jours.
- Infirmier : obligatoire tous les jours.
- Mécanicien : obligatoire seulement du lundi au vendredi.
- Dépannage : obligatoire en semaine, optionnel le week-end.

---

# 5. Modèle de Données (Base SQLite)

## 5.1 Table `Personnel`
| Champ | Type | Description |
|-------|--------|--------------|
| id | int | Identifiant |
| nom | text | Nom complet |
| grade | text | Grade militaire |
| specialites | text | Conducteur / Infirmier / Mécanicien / Dépannage / ... |
| disponibilite_defaut | text | Disponible / Indisponible (structurelle) |
| contrainte_medicale | text | Restriction partielle ou totale |
| exemption_permanente | bool | Exemption définitive de garde/permanence |
| historique_services | json | Garde / permanence réalisés |

## 5.2 Table `Exceptions`
| Champ | Type | Description |
|-------|--------|-------------|
| id | int | Identifiant |
| militaire_id | int | Référence à `Personnel.id` |
| type_exception | text | MALade / CONGE / MISSION / DETACHEMENT / RAISON_SERVICE |
| date_debut | date | Début de l’exception |
| date_fin | date | Fin de l’exception (incluse) |
| priorite | int | Priorité numérique |
| commentaire | text | Détails, référence d’ordre, etc. |
| cree_par | text | Utilisateur ayant saisi |
| date_creation | datetime | Date de saisie |

## 5.3 Table `Calendrier`
| Champ | Type | Description |
|-------|--------|-------------|
| date | date | Jour |
| type_jour | text | SEMAINE / WEEK_END / FERIE |

## 5.4 Table `ProfilService`
| Champ | Type | Description |
|-------|--------|-------------|
| id | int | Identifiant |
| type_jour | text | SEMAINE / WEEK_END / FERIE |
| description | text | Libellé |

## 5.5 Table `ProfilPointsGarde`
Associe un profil à une liste de points actifs.

| Champ | Type |
|-------|--------|
| id | int |
| profil_service_id | int |
| point_id | int |
| actif | bool |

## 5.6 Table `ProfilSpecialites`
Associe un profil à des règles de spécialité.

| Champ | Type |
|-------|--------|
| id | int |
| profil_service_id | int |
| specialite | text |
| obligatoire | bool |
| min_par_jour | int |

## 5.7 Table `LieuxService`
| Champ | Type | Description |
|--------|----------|---------|
| id | int |
| type_lieu | POSTE_POLICE / POINT_GARDE |
| nom | text |
| actif | bool |

## 5.8 Table `RolesJournee`
| Rôle | Description | Grade minimum |
|------|-------------|----------------|
| CHEF_POSTE_POLICE | Chef poste police | Sergent-chef |
| ADJ_POSTE_POLICE | Adjoint poste police | Sergent |
| OFF_PERM | Officier/Sous-Officier de permanence | (paramétrable) |
| ADJ_PERM | Adjudant / Adjudant-chef | Adjudant |
| CONDUCT_PERM | Conducteur de permanence | Spécialité conducteur |
| INF_PERM | Infirmier de permanence | Spécialité infirmier |
| MEC_PERM | Mécanicien de permanence | Spécialité mécanicien |
| DEP_PERM | Dépannage technique | Spécialité dépannage |

## 5.9 Table `AffectationsJournee`
| Champ | Type |
|-------|---------|
| id | int |
| date | date |
| role_journee_id | int |
| lieu_service_id | int (nullable) |
| militaire_id | int |
| statut | généré / modifié / validé |

## 5.10 Table `AffectationsPoints`
| Champ | Type |
|-------|---------|
| id | int |
| date | date |
| point_id | int |
| militaire_id | int |

## 5.11 Table `Rotations`
| Champ | Type |
|--------|-------|
| id | int |
| affectation_point_id | int |
| debut | datetime |
| fin | datetime |

---

# 6. Algorithme d’Affectation (Résumé)

## 6.1 Étape 0 — Détermination du Type de Jour

Pour la date D :
1. Consulter la table `Calendrier` pour déterminer `type_jour` : SEMAINE / WEEK_END / FERIE.
2. Charger le `ProfilService` correspondant.
3. Déterminer :
   - les points de garde actifs,
   - les spécialités à couvrir,
   - les rôles de permanence obligatoires.

## 6.2 Étape 0 bis — Prise en Compte des Exceptions

Pour la date D :
1. Charger toutes les entrées de la table `Exceptions` dont `date_debut <= D <= date_fin`.
2. Marquer les militaires comme **indisponibles**.
3. Exclure ces militaires des affectations.

## 6.3 Étape 1 — Permanence Générale

Sélection selon le profil du jour (si activée), en respectant équité & disponibilité.

## 6.4 Étape 2 — Spécialistes de Permanence

Pour chaque spécialité définie comme **obligatoire** dans le profil :
1. Filtrer les militaires spécialisés, disponibles.
2. Appliquer l’équité.
3. Affecter et enregistrer.

## 6.5 Étape 3 — Poste de Police

- Sélectionner chef poste police (sergent-chef).
- Sélectionner adjoint (sergent).

## 6.6 Étape 4 — Points de Garde

Pour chaque point défini comme actif dans le `ProfilService` :
1. Filtrer les soldats/caporaux disponibles.
2. Appliquer l’équité.
3. Sélectionner **3 militaires**.
4. Enregistrer dans `AffectationsPoints`.
5. Générer **12 rotations** de 2h dans `Rotations`.

---

# 7. Interface Utilisateur

## 7.1 Tableau de Bord

- Statut effectifs disponibles.
- Militaires sous exception (par type).
- Type de jour (semaine / week-end / férié).
- Alertes : manque de gradés, points non couverts, spécialités non pourvues.

## 7.2 Écran « Organisation Journalière »

- Indication visuelle du type de jour (couleur, icône).
- Bloc Poste de Police (chef, adjoint).
- Bloc Permanence (officier, adjoint, spécialistes).
- Bloc Points de Garde (liste des points actifs + 3 soldats).
- Bouton « voir rotations 2h » pour chaque point.

## 7.3 Écran « Gestion du Personnel »

- Fiche militaire complète (grade, spécialités, historique).
- Gestion des contraintes médicales et exemptions.

## 7.4 Écran « Gestion des Exceptions »

- Liste des exceptions filtrable.
- Formulaire de saisie.
- Historique par militaire.

## 7.5 Écran « Règles & Configuration »

- Gestion des jours fériés (calendrier).
- Gestion des profils de service (semaine / week-end / férié).
- Configuration des points de garde par profil.
- Configuration des spécialités par profil.

## 7.6 Export / Impression

- PDF du service du jour (avec mention du type de jour).
- Planning hebdomadaire / mensuel.
- Fiche service par militaire.

---

# 8. Paramètres Configurables

- Nombre de points de garde (par profil de jour).
- Durée des rotations (par défaut 2h).
- Grade minimum des rôles.
- Règles d’équité (fréquence minimale/maximale, gestion week-ends/fériés).
- Liste des types d’exceptions activées.
- Priorité des types d’exceptions.
- Spécialités et leur caractère obligatoire selon le type de jour.

---

# 9. Sécurité & Rôles Utilisateurs

- Administrateur : accès total (personnel, exceptions, règles, paramètres).
- Officier : validation planning, gestion des exceptions et règles pour son unité.
- Sous-officier : consultation planning, saisie limitée (ex : malade).
- Gestionnaire : saisie du personnel, des absences et des exceptions.

---

# 10. Technologies Recommandées

- **Frontend :** React  
- **Backend :** Tauri (Rust)  
- **Base de données :** SQLite  
- **Export :** PDFKit, ExcelJS  
- **Architecture :** Composants modulaires + services métier séparés

---

# 11. Extensions Futures

- Mode mobile (Android/iOS avec Capacitor).
- Synchronisation réseau optionnelle.
- Gestion des rondes (tracking avec QR code).
- Journal d’incidents.
- Intégration RFID ou carte militaire.
- Workflow de validation des exceptions et des règles.

---

# 12. Conclusion

Ce document définit une base complète permettant de :
- Modéliser la réalité militaire du poste de police, des points de garde et des permanences.
- Gérer finement les **exceptions** (malade, congé, mission, détachement, raison de service).
- Prendre en compte des **règles spécifiques pour les week-ends et les jours fériés**.
- Configurer dynamiquement le **nombre de points de garde** et les **spécialisations**.
- Automatiser la répartition quotidienne selon des règles strictes et transparentes.
- Structurer un développement modulaire Tauri + React + SQLite.

