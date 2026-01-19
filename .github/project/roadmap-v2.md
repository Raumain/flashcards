# 🗺️ MedFlash V2 - Feuille de Route

## Vue d'Ensemble

**Version**: 2.0.0  
**Objectif**: Transformer MedFlash en plateforme d'apprentissage complète  
**Durée estimée**: 4-6 semaines

---

## Phases de Développement

### Phase 1: Infrastructure (Semaine 1)
> Mise en place de la base technique

| ID | Tâche | Priorité | Complexité | Dépendances | Agent |
|----|-------|----------|------------|-------------|-------|
| 1.1 | Configuration PostgreSQL + Docker | Critique | 3/10 | - | database-agent |
| 1.2 | Installation Drizzle ORM | Critique | 4/10 | 1.1 | database-agent |
| 1.3 | Création schéma base de données | Critique | 5/10 | 1.2 | database-agent |
| 1.4 | Migrations initiales | Critique | 3/10 | 1.3 | database-agent |
| 1.5 | Installation better-auth | Critique | 4/10 | 1.2 | auth-agent |
| 1.6 | Configuration OAuth Google | Critique | 5/10 | 1.5 | auth-agent |

**Livrables Phase 1:**
- [ ] Docker Compose avec PostgreSQL fonctionnel
- [ ] Schéma Drizzle complet avec migrations
- [ ] Connexion DB testée

---

### Phase 2: Authentification (Semaine 1-2)
> Système de connexion complet

| ID | Tâche | Priorité | Complexité | Dépendances | Agent |
|----|-------|----------|------------|-------------|-------|
| 2.1 | Endpoint API auth better-auth | Critique | 4/10 | 1.6 | auth-agent |
| 2.2 | Page d'inscription | Critique | 5/10 | 2.1 | frontend-agent |
| 2.3 | Page de connexion | Critique | 5/10 | 2.1 | frontend-agent |
| 2.4 | Boutons OAuth (Google) | Critique | 4/10 | 2.3 | auth-agent |
| 2.5 | Middleware protection routes | Critique | 5/10 | 2.1 | auth-agent |
| 2.6 | Composant UserMenu | Haute | 3/10 | 2.1 | frontend-agent |
| 2.7 | Page paramètres compte | Moyenne | 4/10 | 2.6 | frontend-agent |

**Livrables Phase 2:**
- [ ] Inscription/Connexion fonctionnels
- [ ] OAuth Google opérationnel
- [ ] Routes protégées
- [ ] Déconnexion

---

### Phase 3: Persistance Flashcards (Semaine 2)
> Sauvegarde des flashcards générées

| ID | Tâche | Priorité | Complexité | Dépendances | Agent |
|----|-------|----------|------------|-------------|-------|
| 3.1 | Server function: saveFlashcards | Critique | 5/10 | 1.4, 2.5 | backend-agent |
| 3.2 | Extraction thématique par IA | Critique | 6/10 | 3.1 | backend-agent |
| 3.3 | Server function: getThematics | Critique | 4/10 | 3.1 | backend-agent |
| 3.4 | Server function: getFlashcardsByThematic | Critique | 4/10 | 3.3 | backend-agent |
| 3.5 | Modification génération pour sauvegarder | Critique | 5/10 | 3.1 | backend-agent |
| 3.6 | Server function: deleteFlashcard | Moyenne | 3/10 | 3.4 | backend-agent |
| 3.7 | Server function: deleteThematic | Moyenne | 4/10 | 3.6 | backend-agent |

**Livrables Phase 3:**
- [ ] Flashcards sauvegardées en DB après génération
- [ ] Thématiques extraites automatiquement
- [ ] CRUD complet flashcards/thématiques

---

### Phase 4: Espace Personnel (Semaine 2-3)
> Interface utilisateur principale

| ID | Tâche | Priorité | Complexité | Dépendances | Agent |
|----|-------|----------|------------|-------------|-------|
| 4.1 | Layout dashboard (Navbar, Sidebar) | Critique | 5/10 | 2.5 | frontend-agent |
| 4.2 | Route /dashboard | Critique | 4/10 | 4.1 | frontend-agent |
| 4.3 | Composant ThematicCard | Haute | 4/10 | 4.2 | frontend-agent |
| 4.4 | Route /dashboard/flashcards | Haute | 5/10 | 4.3, 3.3 | frontend-agent |
| 4.5 | Route /dashboard/flashcards/:id | Haute | 5/10 | 4.4, 3.4 | frontend-agent |
| 4.6 | Composant FlashcardGrid amélioré | Haute | 4/10 | 4.5 | frontend-agent |
| 4.7 | Actions supprimer flashcard/thématique | Moyenne | 4/10 | 4.6, 3.6, 3.7 | frontend-agent |

**Livrables Phase 4:**
- [ ] Dashboard avec navigation
- [ ] Liste des thématiques avec flashcards
- [ ] Gestion (suppression) des contenus

---

### Phase 5: Mode Étude (Semaine 3-4)
> Fonctionnalité swipe pour révision

| ID | Tâche | Priorité | Complexité | Dépendances | Agent |
|----|-------|----------|------------|-------------|-------|
| 5.1 | Route /study sélection thématiques | Critique | 5/10 | 4.4 | study-agent |
| 5.2 | Composant TopicSelector | Critique | 5/10 | 5.1 | study-agent |
| 5.3 | Composant SwipeableCard (Framer Motion) | Critique | 8/10 | 5.2 | study-agent |
| 5.4 | Route /study/session | Critique | 6/10 | 5.3 | study-agent |
| 5.5 | Server function: recordStudyResult | Critique | 4/10 | 5.4 | study-agent |
| 5.6 | Composant StudyProgress | Haute | 4/10 | 5.5 | study-agent |
| 5.7 | Écran fin de session + résumé | Haute | 5/10 | 5.6 | study-agent |

**Livrables Phase 5:**
- [ ] Sélection des thématiques à étudier
- [ ] Swipe gauche/droite fonctionnel
- [ ] Enregistrement des résultats
- [ ] Résumé de session

---

### Phase 6: Mode Révision (Semaine 4)
> Révision intelligente des erreurs

| ID | Tâche | Priorité | Complexité | Dépendances | Agent |
|----|-------|----------|------------|-------------|-------|
| 6.1 | Server function: getRevisionCards | Critique | 5/10 | 5.5 | study-agent |
| 6.2 | Route /revision configuration | Haute | 4/10 | 6.1 | study-agent |
| 6.3 | Sélecteur seuil d'erreurs | Haute | 3/10 | 6.2 | study-agent |
| 6.4 | Route /revision/session | Haute | 4/10 | 6.3, 5.3 | study-agent |
| 6.5 | Indicateur priorité révision | Moyenne | 4/10 | 6.4 | study-agent |

**Livrables Phase 6:**
- [ ] Sélection automatique cartes difficiles
- [ ] Configuration du seuil personnalisable
- [ ] Session révision fonctionnelle

---

### Phase 7: Dashboard Métriques (Semaine 4-5)
> Visualisation des progrès

| ID | Tâche | Priorité | Complexité | Dépendances | Agent |
|----|-------|----------|------------|-------------|-------|
| 7.1 | Server function: getDashboardMetrics | Critique | 6/10 | 5.5 | dashboard-agent |
| 7.2 | Composant StatsCards (KPIs) | Haute | 4/10 | 7.1 | dashboard-agent |
| 7.3 | Installation Recharts | Haute | 2/10 | - | dashboard-agent |
| 7.4 | Composant ProgressChart (courbe) | Haute | 6/10 | 7.3, 7.1 | dashboard-agent |
| 7.5 | Composant ThematicPieChart | Haute | 5/10 | 7.4 | dashboard-agent |
| 7.6 | Composant DifficultyBars | Moyenne | 5/10 | 7.5 | dashboard-agent |
| 7.7 | Composant StudyHeatmap | Moyenne | 7/10 | 7.6 | dashboard-agent |
| 7.8 | Server function: getDifficultCards | Moyenne | 4/10 | 7.1 | dashboard-agent |
| 7.9 | Liste top 10 cartes difficiles | Moyenne | 4/10 | 7.8 | dashboard-agent |

**Livrables Phase 7:**
- [ ] KPIs en temps réel
- [ ] Graphiques interactifs
- [ ] Visualisation des patterns d'étude

---

### Phase 8: Finalisation (Semaine 5-6)
> Polish et tests

| ID | Tâche | Priorité | Complexité | Dépendances | Agent |
|----|-------|----------|------------|-------------|-------|
| 8.1 | Tests E2E authentification | Haute | 5/10 | 2.* | qa-agent |
| 8.2 | Tests E2E mode étude | Haute | 5/10 | 5.* | qa-agent |
| 8.3 | Tests unitaires métriques | Moyenne | 4/10 | 7.* | qa-agent |
| 8.4 | Optimisation performances | Moyenne | 5/10 | 8.1-8.3 | backend-agent |
| 8.5 | Responsive mobile complet | Haute | 6/10 | 8.1-8.3 | frontend-agent |
| 8.6 | Accessibilité WCAG AA | Haute | 5/10 | 8.5 | frontend-agent |
| 8.7 | Documentation utilisateur | Moyenne | 3/10 | 8.* | qa-agent |
| 8.8 | Mise à jour Docker prod | Critique | 4/10 | 8.* | database-agent |

**Livrables Phase 8:**
- [ ] Application testée et stable
- [ ] Responsive sur tous devices
- [ ] Accessible
- [ ] Prête pour production

---

## Récapitulatif des Dépendances

```
Phase 1 (Infrastructure)
    │
    ├──▶ Phase 2 (Auth)
    │        │
    │        └──▶ Phase 4 (Espace Personnel)
    │                    │
    └──▶ Phase 3 (Persistance) ──▶ Phase 5 (Mode Étude)
                                        │
                                        ├──▶ Phase 6 (Révision)
                                        │
                                        └──▶ Phase 7 (Dashboard)
                                                    │
                                                    └──▶ Phase 8 (Finalisation)
```

---

## Agents Assignés

| Agent | Responsabilités |
|-------|-----------------|
| **database-agent** | PostgreSQL, Drizzle, migrations, schéma |
| **auth-agent** | better-auth, OAuth, sessions, protection routes |
| **backend-agent** | Server functions, API, génération, persistance |
| **frontend-agent** | UI/UX, composants, routes, styling |
| **study-agent** | Modes étude/révision, swipe, sessions |
| **dashboard-agent** | Métriques, graphiques, visualisations |
| **qa-agent** | Tests, qualité, accessibilité, documentation |

---

## Critères de Succès V2

### Fonctionnels
- ✅ Inscription/Connexion avec Google
- ✅ Flashcards persistées et groupées par thématique
- ✅ Mode étude avec swipe
- ✅ Mode révision intelligent
- ✅ Dashboard avec métriques visuelles

### Non-Fonctionnels
- ✅ Temps de chargement < 2s
- ✅ 100% responsive
- ✅ WCAG AA compliant
- ✅ Zéro erreur console en production
- ✅ Sessions sécurisées (httpOnly, secure)

---

## Changelog

| Date | Version | Description |
|------|---------|-------------|
| 2026-01-19 | 2.0.0 | Création roadmap V2 |
