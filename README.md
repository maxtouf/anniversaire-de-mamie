# YGGtorrent Regex Generator pour Autobrr

Une application web complète pour générer des expressions régulières (regex) compatibles avec Autobrr, spécialement optimisée pour le tracker YGGtorrent.

## Fonctionnalités

- **Génération de regex automatique** : Création d'expressions régulières optimisées pour différents types de contenus YGGtorrent
- **Support multi-contenus** : Animation Série, Documentaire, Émission TV, Film, Sport, Série TV, Presse, Application Smartphone
- **Filtres avancés** : Qualité, langue, source, codec, audio, groupe de release, saison/épisode, année
- **Prévisualisation en temps réel** : Visualisation instantanée des regex générées
- **Test des patterns** : Validation avec des exemples réels de noms de torrents YGGtorrent
- **Export pour Autobrr** : Configuration directement compatible avec Autobrr

## Comment utiliser l'application

1. Ouvrez `index.html` dans un navigateur web moderne
2. Sélectionnez le type de contenu (Série, Film, Documentaire, etc.)
3. Configurez les critères de filtrage selon vos besoins
4. Visualisez la regex générée en temps réel
5. Testez la regex avec des exemples de noms de torrents
6. Exportez la configuration pour l'utiliser dans Autobrr

## Base de données des patterns

L'application inclut une base de données complète des formats de nommage courants sur YGGtorrent, permettant une génération précise des expressions régulières pour chaque type de contenu.

## Exemples de regex générées

### Série TV en 1080p FRENCH
```regex
^.*\.S\d{2}E\d{2}\..*FRENCH.*1080p.*$
```

### Film BluRay 1080p
```regex
^.*\.(19|20)\d{2}\..*[Bb]lu[Rr]ay.*1080p.*$
```

### Animation VOSTFR 
```regex
^.*\.S\d{2}E\d{2}\..*VOSTFR.*1080p.*$
```

## Technologies utilisées

- HTML5
- CSS3 (avec variables CSS et flexbox/grid)
- JavaScript vanilla (ES6+)
- Font Awesome pour les icônes
- Stockage local (localStorage) pour la persistance des configurations

## Développement

Cette application est développée avec des technologies web standard, sans dépendances externes ni frameworks. Elle peut être facilement modifiée et étendue selon vos besoins.

Pour contribuer au projet :

1. Clonez ce dépôt
2. Ouvrez les fichiers dans votre éditeur préféré
3. Testez vos modifications en ouvrant `index.html` dans un navigateur
4. Soumettez une pull request avec vos améliorations

## Auteur

Créé avec ❤️ pour optimiser l'utilisation d'Autobrr avec YGGtorrent.