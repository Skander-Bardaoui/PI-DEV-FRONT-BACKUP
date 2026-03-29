# Guide du Contrôle par Geste (Finger Scroll)

## Vue d'ensemble

Le contrôle par geste permet aux utilisateurs de naviguer dans l'application en utilisant des gestes de la main détectés par la caméra, offrant une expérience mains-libres accessible.

## Fonctionnalités

### 1. Défilement par Index
- Levez votre **doigt index** devant la caméra
- Déplacez-le **vers le haut** pour défiler vers le haut
- Déplacez-le **vers le bas** pour défiler vers le bas
- La vitesse de défilement s'adapte à la distance du doigt par rapport au centre

### 2. Curseur Virtuel
- Le **majeur** contrôle un curseur rouge à l'écran
- Déplacez votre majeur pour déplacer le curseur
- Le curseur suit les mouvements de votre main en temps réel

### 3. Geste de Clic (Pincement)
- Rapprochez votre **pouce** et votre **majeur** pour effectuer un clic
- Le curseur devient vert lors du pincement
- Fonctionne sur tous les boutons, liens et éléments cliquables

## Comment activer

1. Ouvrez le panneau d'accessibilité (bouton en bas à droite)
2. Activez l'option **"Contrôle par geste"**
3. Autorisez l'accès à la caméra lorsque demandé
4. Montrez votre main à la caméra

## Modes d'affichage

### Mode Complet
- Affiche la vidéo de la caméra avec les instructions
- Visualisation des points de repère de la main
- Informations de statut en temps réel

### Mode Réduit
- Cliquez sur le bouton **Réduire** pour minimiser la fenêtre
- Une petite fenêtre flottante apparaît en bas à droite
- La détection continue de fonctionner en arrière-plan
- Vous pouvez naviguer normalement sur le site avec le contrôle par geste actif

### Fermeture
- Cliquez sur le **X** pour désactiver complètement le contrôle par geste
- La caméra s'arrête et le curseur virtuel disparaît

## Technologies utilisées

- **MediaPipe Hands**: Détection et suivi des mains en temps réel
- **Camera Utils**: Gestion de la caméra
- **Canvas API**: Visualisation des points de repère de la main

## Configuration requise

- Navigateur moderne avec support WebRTC
- Caméra fonctionnelle
- Connexion Internet (pour charger les bibliothèques MediaPipe)
- Bon éclairage pour une meilleure détection

## Conseils d'utilisation

- Assurez-vous d'avoir un bon éclairage
- Gardez votre main à une distance confortable de la caméra (30-60 cm)
- Évitez les arrière-plans complexes
- Faites des mouvements lents et délibérés pour un meilleur contrôle
- Utilisez le mode réduit pour une navigation discrète

## Accessibilité

Cette fonctionnalité est particulièrement utile pour:
- Les utilisateurs ayant des difficultés motrices
- La navigation mains-libres
- Les présentations et démonstrations
- Les environnements où l'utilisation de la souris est difficile
- Les personnes avec des limitations physiques temporaires ou permanentes

## Dépannage

### La caméra ne démarre pas
- Vérifiez les permissions de la caméra dans votre navigateur
- Assurez-vous qu'aucune autre application n'utilise la caméra

### La main n'est pas détectée
- Améliorez l'éclairage
- Rapprochez ou éloignez votre main de la caméra
- Assurez-vous que toute votre main est visible

### Le défilement est trop rapide/lent
- Ajustez la distance de votre doigt par rapport au centre
- Les mouvements plus proches du centre sont plus lents
- Les mouvements plus éloignés sont plus rapides

### Le clic ne fonctionne pas
- Assurez-vous de bien pincer le pouce et le majeur ensemble
- Le curseur doit devenir vert lors du pincement
- Positionnez le curseur rouge sur l'élément avant de pincer

## Fichiers concernés

- `src/components/FingerScrollControl.tsx`: Composant principal
- `src/context/AccessibilityContext.tsx`: Gestion de l'état
- `src/components/AccessibilityPanel.tsx`: Interface utilisateur
- `finger-scroll-v2.html`: Démo originale (référence)
- `FINGER_SCROLL_GUIDE.md`: Ce guide
