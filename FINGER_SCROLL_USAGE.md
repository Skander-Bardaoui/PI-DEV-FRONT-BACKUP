# Comment utiliser le Contrôle par Geste

## Activation

1. **Ouvrir le panneau d'accessibilité**
   - Cliquez sur le bouton d'accessibilité (icône en bas à droite de l'écran)

2. **Activer le contrôle par geste**
   - Dans le panneau, activez l'option "Contrôle par geste" (icône de main)
   - Autorisez l'accès à la caméra quand le navigateur le demande

3. **Utiliser le contrôle**
   - Une fenêtre modale s'ouvre avec les instructions
   - Montrez votre main à la caméra
   - Commencez à utiliser les gestes

## Gestes disponibles

### 🖐️ Index - Contrôle Tout-en-Un
Utilisez uniquement votre **doigt index** pour tout contrôler !

**Curseur:**
- Levez votre **index**
- Le curseur rouge suit votre doigt à l'écran
- Déplacez votre index pour déplacer le curseur

**Défilement automatique:**
- Quand l'index est **en haut** de l'écran → défile vers le haut
- Quand l'index est **en bas** de l'écran → défile vers le bas
- Au **centre** → pas de défilement (zone morte)
- Plus le doigt est loin du centre, plus le défilement est rapide

**Défilement intelligent:**
- Si le curseur est sur la **page principale** → défile la page
- Si le curseur est sur la **sidebar** → défile la sidebar
- Si le curseur est sur un **élément scrollable** (modal, liste) → défile cet élément
- La détection est automatique selon la position du curseur!

### 🤏 Pince - Clic
- Rapprochez votre **pouce** et votre **index**
- Le curseur devient vert quand le pincement est détecté
- Cela effectue un clic sur l'élément sous le curseur

## Modes d'utilisation

### Mode Complet (par défaut)
- Affiche une grande fenêtre avec la caméra et les instructions
- Utile pour la configuration initiale

### Mode Réduit
1. Cliquez sur le bouton **"Réduire"** (icône avec deux flèches)
2. La fenêtre se transforme en petit widget en bas à droite
3. **Le contrôle continue de fonctionner !**
4. Vous pouvez maintenant fermer le panneau d'accessibilité
5. Naviguez normalement sur le site avec les gestes

### Désactivation
- Cliquez sur le **X** pour arrêter complètement
- La caméra s'arrête et le curseur disparaît

## Workflow recommandé

```
1. Ouvrir panneau accessibilité
2. Activer "Contrôle par geste"
3. Autoriser la caméra
4. Vérifier que la détection fonctionne
5. Cliquer sur "Réduire"
6. Fermer le panneau accessibilité
7. Utiliser le site normalement avec les gestes !
```

## Avantages

✅ **Un seul doigt** - Contrôlez tout avec l'index uniquement
✅ **Mains-libres** - Pas besoin de souris ou clavier
✅ **Accessible** - Idéal pour les personnes avec limitations motrices
✅ **Discret** - Mode réduit ne gêne pas la navigation
✅ **Persistant** - Continue de fonctionner même si vous fermez le panneau
✅ **Intuitif** - Gestes naturels et faciles à apprendre
✅ **Intelligent** - Détecte automatiquement quel élément défiler (page, sidebar, modal)

## Utilisation avancée

### Défilement de la sidebar
1. Positionnez le curseur rouge (index) sur la sidebar
2. Déplacez l'index vers le haut/bas → la sidebar défile
3. Le système détecte automatiquement que vous êtes sur la sidebar

### Défilement de modals/popups
1. Ouvrez une modal avec du contenu scrollable
2. Positionnez le curseur rouge sur la modal
3. Déplacez l'index vers le haut/bas → la modal défile
4. Fonctionne avec n'importe quel élément scrollable

### Défilement de la page principale
1. Positionnez le curseur rouge sur le contenu principal
2. Déplacez l'index vers le haut/bas → la page défile
3. C'est le comportement par défaut

### Cliquer sur des éléments
1. Positionnez le curseur rouge sur un bouton/lien
2. Pincez le pouce et l'index ensemble
3. Le curseur devient vert et l'élément est cliqué

## Dépannage

### La caméra ne démarre pas
- Vérifiez les permissions dans votre navigateur
- Assurez-vous qu'aucune autre app n'utilise la caméra

### La main n'est pas détectée
- Améliorez l'éclairage de la pièce
- Rapprochez ou éloignez votre main (30-60 cm idéal)
- Assurez-vous que toute la main est visible

### Le défilement ne fonctionne pas
- Vérifiez que votre index est bien levé
- Éloignez le doigt du centre pour augmenter la vitesse
- La zone morte au centre est normale (pour éviter les défilements accidentels)

### Le clic ne fonctionne pas
- Pincez fermement le pouce et le majeur
- Le curseur doit devenir vert lors du pincement
- Positionnez le curseur sur l'élément avant de pincer

## Notes techniques

- La détection fonctionne en arrière-plan
- La caméra reste active même en mode réduit
- Les éléments vidéo/canvas sont cachés mais fonctionnels
- Le curseur virtuel a la priorité la plus élevée (z-index: 10000)
- Compatible avec tous les navigateurs modernes supportant WebRTC

## Confidentialité

🔒 **Aucune donnée n'est envoyée** - Tout le traitement se fait localement dans votre navigateur
🔒 **Pas d'enregistrement** - La vidéo n'est jamais sauvegardée
🔒 **Contrôle total** - Vous pouvez désactiver à tout moment
