# Nia-Mind — « Le vrai sans le masque »

Plateforme numérique d'écoute, de réflexion, de bien-être et d'expression personnelle conçue avec **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL + RLS)** et **Vercel**.

---

## 1. Identité & Direction Artistique

- **Nom officiel** : Nia-Mind
- **Slogan officiel exact** : « Le vrai sans le masque »
- **Signature de l'onglet Histoires** : « Chaque histoire mérite d’être entendue. »
- **Palette de couleurs centralisée** :
  - Orange principal : `#F97316` | Orange profond : `#EA580C`
  - Bordeaux secondaire : `#7F1D3F` | Bordeaux foncé : `#57152D`
  - Gris foncé : `#374151` | Gris intermédiaire : `#6B7280` | Gris clair : `#E5E7EB`
  - Fond clair : `#FFF9F5` | Blanc : `#FFFFFF`
  - Fond sombre : `#111318` | Surface sombre : `#1B1D24` | Bordures sombres : `#343741` | Texte clair en mode sombre : `#F5F5F5`
- **Motion Design & Accessibilité** :
  - Glitch numérique subtil de marque (séparation chromatique Orange `#F97316` & Bordeaux `#7F1D3F`) sur le logo, le slogan et certains titres éditoriaux uniquement (jamais sur les questionnaires, résultats de bien-être, messages ou alertes).
  - Bannière horizontale défilante : « Écoute », « Franchise », « Réflexion », « Bien-être », « Authenticité ».
  - Respect natif de `prefers-reduced-motion` et commutateur dédié dans les préférences.

---

## 2. Architecture des Pages & Onglets Implémentés

### Site public (`/`)
- `/` — Accueil à forte identité (Hero, slogan officiel, composition visuelle éditoriale, bannière défilante, 6 cartes d'action, aperçu des histoires publiques, conseils éditoriaux, section confidentialité RLS, CTA et pied de page complet).
- `/ressources` — Nos ressources d'aide vérifiées (filtrables par pays : `BF`, `FR`, `SN`, `CI`, `BE`, `CA`, `INT`).
- `/conseils` — Conseils éditoriaux et pistes d'introspection.
- `/histoires` — Bibliothèque publique d'histoires anonymes approuvées et explicitement autorisées par leurs auteurs.
- `/a-propos` — Manifeste et engagements éthiques.
- `/connexion` & `/inscription` — Authentification et sélecteur rapide de comptes de démonstration RLS.

### Espace personnel (`/espace/*`)
- `/espace/tableau-de-bord` — Tableau de bord personnel.
- `/espace/assistant` — Assistant Nia-Mind connecté à la fonction serveur `/api/assistant`.
- `/espace/ecoute` — Demander une écoute humaine (formulaire privé + suivi sur les 5 statuts).
- `/espace/bien-etre` — Mon bien-être (4 sous-onglets : **Mon humeur**, **Stress et sommeil**, **Questionnaires OMS-5 vérifiés**, **Progression 7j / 30j / période personnalisée**).
- `/espace/journal` — Mon journal personnel strictement privé (amorces d'écriture, brouillons, recherche, modification, suppression avec confirmation).
- `/espace/conseils-du-jour` — Conseils du jour et modale dédiée.
- `/espace/histoires` — Parcours complet en 8 étapes et 10 statuts avec comparaison de version et autorisation explicite de publication.
- `/espace/profil` & `/espace/confidentialite` — Gestion du profil, thème clair/sombre, sessions actives, mot de passe, consentements RGPD, export JSON et suppression de compte.

### Espace administrateur (`/admin/*` — protégé par contrôle de rôle serveur)
- `/admin/vue-ensemble` — Indicateurs & Panneau de vérification d'isolation RLS Utilisateur A / B en temps réel.
- `/admin/utilisateurs` — Gestion des utilisateurs et rôles (`user`, `listener`, `admin`).
- `/admin/ecoute` — Traitement des demandes d'écoute humaine.
- `/admin/histoires-recues` — Modération des histoires, proposition de version anonymisée et demande d'autorisation explicite à l'auteur.
- `/admin/histoires-publiees` — Gestion des histoires publiées, dépublication et archivage.
- `/admin/conseils` — Gestion des conseils éditoriaux.
- `/admin/questionnaires` — Référentiel des questionnaires vérifiés (OMS-5).
- `/admin/ressources` — Configuration des ressources d'aide par pays.
- `/admin/parametres` — État technique Supabase / Vercel et demandes RGPD.
- `/admin/audit` — Journaux d'audit sans données sensibles en clair.

---

## 3. Commandes de Développement, Tests et Build

```bash
# Installer les dépendances
npm install

# Vérifier le typage TypeScript (lint)
npm run lint

# Exécuter les tests automatisés (Sécurité RLS, Histoires, Assistant IA)
npm test

# Construire le bundle de production
npm run build

# Lancer le serveur de développement
npm run dev
```
