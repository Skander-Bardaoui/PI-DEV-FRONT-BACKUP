# Guide d'Accessibilité

## Vue d'ensemble

Ce site web intègre un système d'accessibilité complet pour garantir une expérience utilisateur optimale pour tous, y compris les personnes en situation de handicap.

## Fonctionnalités d'Accessibilité

### 1. **Panneau d'Accessibilité**
Un bouton flottant (icône œil) en bas à droite de l'écran permet d'ouvrir le panneau d'accessibilité avec les options suivantes :

#### Taille du texte
- Ajustez la taille du texte de 12px à 24px
- Boutons + et - pour un contrôle facile
- Paramètre sauvegardé localement

#### Modes de contraste
- **Normal** : Contraste standard
- **Élevé** : Augmente le contraste de 50% pour une meilleure lisibilité
- **Sombre** : Mode sombre complet avec fond noir et texte blanc

#### Hauteur de ligne
- Ajustez l'espacement entre les lignes de 1.0 à 2.5
- Améliore la lisibilité pour les personnes dyslexiques

#### Espacement des lettres
- Ajustez l'espacement entre les caractères de 0 à 5px
- Facilite la lecture pour certains troubles visuels

#### Taille du curseur
- **Normal** : Curseur système standard
- **Grand** : Curseur 32x32px
- **Très grand** : Curseur 48x48px
- Utile pour les personnes ayant des difficultés de vision ou de motricité

#### Options supplémentaires
- **Police dyslexie** : Active la police OpenDyslexic, spécialement conçue pour les personnes dyslexiques
- **Surligner les liens** : Met en évidence tous les liens avec un fond jaune et texte en gras
- **Réduire les animations** : Désactive ou réduit considérablement toutes les animations pour éviter les distractions ou le mal des transports

### 2. **Navigation au clavier**

#### Lien "Aller au contenu principal"
- Appuyez sur Tab dès l'arrivée sur la page
- Permet de sauter directement au contenu principal
- Évite de naviguer à travers tous les éléments de navigation

#### Indicateurs de focus visibles
- Tous les éléments interactifs ont un contour bleu de 3px lors de la navigation au clavier
- Facilite le suivi de la position actuelle

#### Navigation complète au clavier
- Tous les menus déroulants sont accessibles au clavier
- Tab : Avancer
- Shift + Tab : Reculer
- Entrée/Espace : Activer
- Échap : Fermer les menus/modales

### 3. **Lecteurs d'écran**

Le site est optimisé pour les lecteurs d'écran avec :
- Attributs ARIA appropriés sur tous les composants interactifs
- Labels descriptifs pour tous les boutons et liens
- Rôles sémantiques (navigation, main, dialog, etc.)
- Annonces des changements d'état dynamiques
- Textes alternatifs pour toutes les images

### 4. **Standards WCAG 2.1**

Le site vise la conformité WCAG 2.1 niveau AA :
- Contraste de couleur minimum de 4.5:1 pour le texte normal
- Contraste de couleur minimum de 3:1 pour le texte large
- Taille minimale des cibles tactiles : 44x44px
- Pas de contenu clignotant plus de 3 fois par seconde
- Contenu lisible et compréhensible

### 5. **Responsive et Mobile**

- Interface adaptative pour tous les appareils
- Tailles de touche appropriées pour mobile (minimum 44x44px)
- Zoom jusqu'à 200% sans perte de fonctionnalité
- Orientation portrait et paysage supportées

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| Tab | Naviguer vers l'élément suivant |
| Shift + Tab | Naviguer vers l'élément précédent |
| Entrée | Activer un lien ou bouton |
| Espace | Activer un bouton ou case à cocher |
| Échap | Fermer un menu ou modal |
| Flèches | Naviguer dans les menus déroulants |

## Persistance des paramètres

Tous les paramètres d'accessibilité sont sauvegardés dans le localStorage du navigateur et persistent entre les sessions.

## Support des technologies d'assistance

Le site est testé et compatible avec :
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS, iOS)
- TalkBack (Android)
- Navigateurs : Chrome, Firefox, Safari, Edge

## Signaler un problème d'accessibilité

Si vous rencontrez des difficultés d'accessibilité, veuillez nous contacter :
- Email : accessibility@novaentra.com
- Nous nous engageons à répondre dans les 48 heures

## Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

## Mises à jour futures

Nous travaillons continuellement à améliorer l'accessibilité avec :
- Support de la synthèse vocale intégrée
- Guide de lecture ligne par ligne
- Personnalisation des couleurs
- Mode de lecture simplifiée
