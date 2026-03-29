# Guide du Mode Sombre

## Améliorations apportées

Le mode sombre a été complètement revu pour offrir une expérience visuelle professionnelle et confortable.

### Palette de couleurs

#### Fond
- **Principal**: `#1a1a1a` - Gris très foncé (au lieu de noir pur #000)
- **Cartes/Panneaux**: `#2d2d2d` - Gris foncé pour la différenciation
- **Éléments interactifs**: `#3d3d3d` - Gris moyen pour les hover states

#### Texte
- **Principal**: `#e5e5e5` - Blanc cassé (plus doux que #fff)
- **Secondaire**: `#b0b0b0` - Gris clair pour le texte moins important
- **Tertiaire**: `#808080` - Gris moyen pour les placeholders

#### Bordures
- **Principales**: `#404040` - Gris moyen
- **Secondaires**: `#2d2d2d` - Gris foncé pour les séparations subtiles

#### Couleurs d'accent (préservées)
- **Indigo**: `#4f46e5` - Couleur primaire maintenue
- **Liens**: `#818cf8` - Bleu clair pour la lisibilité
- **Actif**: `#312e81` - Indigo foncé pour les états actifs

### Composants spécifiques

#### Sidebar
- **Fond**: `#1f1f1f` - Légèrement plus foncé que le contenu principal
- **Items de navigation**: 
  - Normal: `#b0b0b0`
  - Hover: `#e5e5e5` sur fond `#2d2d2d`
  - Actif: `#c7d2fe` sur fond `#312e81`
- **Avatar utilisateur**: Conserve la couleur indigo `#4f46e5`

#### Header
- **Fond**: `#1f1f1f` - Cohérent avec la sidebar
- **Barre de recherche**: `#2d2d2d` avec bordure `#404040`
- **Icônes**: `#b0b0b0` avec hover `#e5e5e5`

#### Panneau d'accessibilité
- **Fond**: `#2d2d2d` - Toujours lisible
- **Boutons**: `#3d3d3d` avec hover `#4d4d4d`
- **Header**: Conserve l'indigo pour la reconnaissance

### Avantages du nouveau mode sombre

1. **Réduction de la fatigue oculaire**
   - Pas de noir pur qui crée trop de contraste
   - Blanc cassé au lieu de blanc pur

2. **Hiérarchie visuelle claire**
   - Différents niveaux de gris pour la profondeur
   - Les éléments importants restent visibles

3. **Cohérence des couleurs**
   - Les couleurs primaires (indigo) sont préservées
   - Reconnaissance facile des éléments interactifs

4. **Accessibilité**
   - Contraste suffisant (WCAG AA compliant)
   - Lisibilité optimale pour tous les utilisateurs

5. **Professionnalisme**
   - Apparence moderne et soignée
   - Transitions douces entre les états

### Comment activer

1. Cliquez sur le bouton d'accessibilité (icône œil) en bas à droite
2. Dans la section "Contraste", sélectionnez "Sombre"
3. Le paramètre est sauvegardé automatiquement

### Désactivation

1. Ouvrez le panneau d'accessibilité
2. Sélectionnez "Normal" dans la section Contraste
3. Ou cliquez sur "Réinitialiser" pour revenir aux paramètres par défaut

### Compatibilité

Le mode sombre fonctionne sur :
- Tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Desktop et mobile
- Avec tous les autres paramètres d'accessibilité

### Notes techniques

Les styles du mode sombre sont appliqués via l'attribut `data-contrast="dark"` sur l'élément racine HTML, permettant une application ciblée et performante des styles sans affecter les performances.

Les classes CSS spécifiques (`.sidebar-container`, `.sidebar-nav-item`, etc.) permettent un contrôle précis du style de chaque composant en mode sombre.
