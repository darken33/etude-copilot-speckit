# Revue de code

## Contexte de la revue

### Informations diverses

| Projet             |
|--------------------|
| Numéro Suivi       |
| Source / Branche   |
| Spécifications     |
| Développeur(s)     |
| Reviewer           |
| Date Revue de code |

---

## Revue

### Structure du projet

| item | ❌/⚠️/✅ | remarque |
|------|---------|----------|
| [Organisation](#organisation) | | |
| [Branches / Tags](#branches--tags) | | |
| [Commits](#commits) | | |

### Architecture technique

| item | ❌/⚠️/✅ | remarque |
|------|---------|----------|
| [Modularité de l'application](#modularite-de-lapplication) | | |
| [Séparation en couches](#separation-en-couches) | | |
| [Structuration des packages](#structuration-des-packages) | | |
| [Indépendance des objets entre couches](#independance-des-objets-entre-couches) | | |
| [Gestion des dépendances dans l'application](#gestion-des-dependances-dans-lapplication) | | |

### Qualité du code

| item | ❌/⚠️/✅ | remarque |
|------|---------|----------|
| **Qualité globale du code** |||
| [Clarté du code](#clarte-du-code) | | |
| [Nommage des classes, méthodes, variables](#nommage-des-classes-methodes-variables) | | |
| [Utilisation / nommage des constantes](#utilisation--nommage-des-constantes) | | |
| [Structuration du code](#structuration-du-code) | | |
| [Utilisation propre de l'héritage, interfaces](#utilisation-propre-de-lheritage-interfaces) | | |
| **Qualité de la JavaDoc** |||
| [Description claire de l'objectif de la méthode / classe](#description-claire-de-lobjectif-de-la-methode-classe) | | |
| [Description des paramètres](#description-des-parametres) | | |
| [Description du résultat envoyé](#description-du-resultat-envoye) | | |
| [Description des exceptions envoyées](#description-des-exceptions-envoyees) | | |
| **Qualité des logs** |||
| [Système de log mutualisé](#systeme-de-log-mutualise) | | |
| [Qualité des messages](#qualite-des-messages) | | |
| **Exceptions** |||
| [Gestion des exceptions](#gestion-des-exceptions) | | |
| [Log des exceptions](#log-des-exceptions) | | |
| **Autres** |||
| [Complexité algorithmique](#complexite-algorithmique) | | |
| [Qualité des commentaires](#qualite-des-commentaires) | | |
| [Longueur moyenne des classes / méthodes](#longueur-moyenne-des-classes-methodes) | | |
| [Utilisation d'abstraction / interface pour découplage](#utilisation-dabstractioninterface-pour-decouplage) | | |
| [Traitement du code généré](#traitement-du-code-genere) | | |

### DAO

| item | ❌/⚠️/✅ | remarque |
|------|---------|----------|
| [Structure DAO](#structure-dao) | | |
| [Transactions](#transactions) | | |
| [Accès aux objets](#acces-aux-objets) | | |
| [Requêtage](#requetage) | | |

### Les Tests

| item | ❌/⚠️/✅ | remarque |
|------|---------|----------|
| [Présence / Qualité de TUAs](#presence--qualite-de-tuas) | | |
| [Présence / Qualité de TIAs](#presence--qualite-de-tias) | | |
| [Testabilité de l'application](#testabilite-de-lapplication) | | |

### Packaging / Livraison

| item | ❌/⚠️/✅ | remarque |
|------|---------|----------|
| [Conformité du livrable aux bonnes pratiques](#conformite-du-livrable-aux-bonnes-pratiques) | | |
| [Modification du livrable après livraison](#modification-du-livrable-apres-livraison) | | |
| [Cycle de vie des modules pour livraison](#cycle-de-vie-des-modules-pour-livraison) | | |
| [Chemins en dur](#chemins-en-dur) | | |
| [Librairies de tests packagées dans le livrable final](#librairies-de-tests-packagees-dans-le-livrable-final) | | |
| [Dépendances vers librairies inconnues](#dependances-vers-librairies-inconnues) | | |

### Performance

| item | ❌/⚠️/✅ | remarque |
|------|---------|----------|
| [Base de données](#base-de-donnees) | | |
| [Cache](#cache) | | |
| [Mapping Objet-Objet](#mapping-objet-objet) | | |
| [Web Service](#web-service) | | |

### Sécurité

| item | ❌/⚠️/✅ | remarque |
|------|---------|----------|
| **[OWASP](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist)** |||
| [Input Validation](#input-validation) | | |
| [Output Encoding](#output-encoding) | | |
| [Authentication and Password Management](#authentication-and-password-management) | | |
| [Session Management](#session-management) | | |
| [Access Control](#access-control) | | |
| [Cryptographic Practices](#cryptographic-practices) | | |
| [Error Handling and Logging](#error-handling-and-logging) | | |
| [Communication Security](#communication-security) | | |
| [System Configuration](#system-configuration) | | |
| [Database Security](#database-security) | | |
| [File Management](#file-management) | | |
| [Memory Management](#memory-management) | | |
| [General Coding Practices](#general-coding-practices) | | |

---

## Détails des items analysés

### Organisation

#### Structure du projet sous Maven
- Vérifier que le fichier `pom.xml` fait bien référence à un `pom` parent; ce mécanisme est à privilégier pour gérer les dépendances via le gestionnaire de dépendances (balise `dependencyManagement`); l'idéal serait un `BOM` (Bill Of Materials)
- Vérifier que le fichier `pom.xml` est bien structuré; que celui-ci est découpé en sections bien distinctes et dans un ordre logique :
  - description de l'artéfact (balises `groupId`, `artifactId`, `version`, ...)
  - déclaration de propriétés contenant par exemple les versions des dépendances (`<properties>...</properties>`)
  - déclaration des dépendances de compilation et de tests (`<dependencies><dependency>...</dependency>...</dependencies>`)
  - déclaration des plugins (`<plugins> <plugin>...</plugin>...</plugins>`)
  - déclaration facultative des profils (`<profiles><profile>...</profile>...</profiles>`)
- Vérifier que le fichier `pom.xml` hérite d'un `pom` parent dont la version est finalisée; il n'est pas recommandé de faire référence à un `pom` parent en version `SNAPSHOT`
- Documenter la configuration de plugins non standards de la communauté `Maven` (plugins autres que ceux référencés par [Maven - Available Plugins](https://maven.apache.org/plugins/))

#### Gestion des dépendances
- Dans le cas d'un gestionnaire de dépendances (balise `dependencyManagement`), il faut vérifier que les dépendances déclarées dans la balise `dependencies` ne spécifient pas de versions; si tel est le cas, la version (quelle soit inférieure ou supérieure) doit être justifiée par un commentaire qui explique ce choix
- Vérifier qu'il n'existe pas de dépendances inutiles; il n'est pas nécessaire de déclarer des dépendances qui sont tirées de manière transitive par une autre dépendance. Par exemple si le projet utilise la dépendance `org.slf4j:slf4j-log4j12`, il est inutile de déclarer la dépendance `log4j:log4j`
- De manière générale, ajouter une déclaration de la version des librairies dans la balise `properties`. Ceci permet de centraliser en un seul endroit les versions de chaque librairie dans le fichier `pom.xml` et ainsi d’éviter une répétition lorsque la librairie recquiert plusieurs dépendances

> **Astuce** : Pour aide à trouver les dépendances transitives, vous pouvez utiliser la commande `mvn dependency:tree` ([Maven – Display project dependency](https://www.mkyong.com/maven/maven-display-project-dependency/)) ou bien la représentation du fichier `pom.xml` dans la vue _Dependency Hierarchy_ de l'IDE `Eclipse`

> **Exemple d'utilisation d'une propriété portant la version de la librairie `OpenFeign`**
```xml
<build>
  ...
  <properties>
    <org.springframework.security.version>4.2.11.RELEASE</org.springframework.security.version>
  </properties>
  ...
  <dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-web</artifactId>
    <version>${org.springframework.security.version}</version>
  </dependency>
  <dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-config</artifactId>
    <version>${org.springframework.security.version}</version>
  </dependency>
```

### Branches / Tags

#### Nommage des branches
- Vérifier qu'il existe une stratégie de "Branching" avec un principe de nommage des branches sous `Git` afin de distinguer les branches de développement, de fonctionnalités, de corrections de bugs, ...
- Par exemple, le nommage des branches dont les préfixes commencent par _feature/_, _release/_ ou _bugfix/_ est une bonne pratique

#### Gestion des branches
- Même si chaque développeur peut potentiellement travailler seul sur une fonctionnalité (par exemple `feature/myFeature`), il est recommandé de "pusher" sa branche sur le serveur distant
- Privilégier l'utilisation de "Merge Requests" afin d'intégrer plus facilement les modifications sur la branche de travail; il sera ainsi plus facile de retirer la fonctionnalité le cas échéant
- Vérifier que les branches qui ont servies pour le développement de fonctionnalités ont bien été supprimées sur le serveur distant une fois que les fonctionnalités aient été "Mergées"

> **Astuce** : Voir l'article [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/) qui présente une stratégie de "Branching" basée sur `GitFlow`

#### Gestion des tags
- Vérifier que les tags sont bien effectués et que ceux-ci suivent une logique de nommage

### Commits

#### Commits
- La fréquence des commits "pushés" sur le serveur distant doit être > 1 commit/jour.  C'est une bonne pratique de récupérer les modifications en début de journée et de commiter ses travaux en fin de journée; même si il s'agit d'une branche de type `feature` sur laquelle un seul développeur travaille.
- Les fichiers issus de la génération automatique du code ne doivent jamais être commités côté `Git`; ceux-ci doivent obligatoirement être régénérés de manière automatique au moment de la phase de compilation du projet ou durant d'autres phases identifiées (package, build, ...)
- Vérifier que le nombre de fichiers modifiés dans un commit n'est pas conséquent; il est conseillé d'effectuer plusieurs "petits" commits n'impactant pas trop de fichiers à la fois.  Un retour arrière (avec un `git revert`) sera plus facile à gérer si besoin.
- Identifier des mauvaises pratiques sur l'utilisation de `Git` comme des `git rebase` ou l'utilisation du "cherry-picking"; privilégier l'utilisation de "Merge Requests" pour une meilleure maîtrise de l'intégration.

> **Astuce** : Voir article [Git merge et git rebase: les éternels incompris](http://blog.fclement.info/git-merge-et-git-rebase-les-eternels-incompris) pour débattre sur `git merge` vs. `git rebase` 

#### Message des commits
- Les messages des commits doivent être assez explicites; essayer dans la mesure du possible d'y inclure un préfixe pour indiquer la nature de la modification (exemple `[FIX]` pour une correction ou `[Feature/MyFeature]` pour une fonctionnalité, ...); tout ceci pour une meilleure maintenabilité du projet.

#### Fichier .gitignore
- La présence d'un fichier `.gitignore` est obligatoire à la racine du projet
- Les éléments suivants doivent être présents dans le fichier : `.settings`, `target`, `testReports`, `.classpath`, `.project`
  - un fichier comme `.project` peut contenir des références à des répertoires sur le poste de développement; les chemins sont différents si on récupère le projet sous `Linux` ou `Windows`
  - il n'est pas nécessaire de commiter les répertoires comme par exemple `target` car celui-ci est régénéré à chaque build

### Modularité de l'application
- L’application a-t-elle été conçue de façon modulaire (common, dao, dto, entity, model, service, web) ?
- Est-ce-que chaque module a un rôle bien défini ?
- Existe-t-il des dépendances circulaires ?

> **Astuce** : Pour détecter des dépendances circulaires dans l'IDE `Eclipse`, il est possible de paramétrer le projet via les propriétés du projet et la section _Java compiler -> Building_; cocher la case _Enable project specific settings_ puis sélectionner le niveau _Error_ sur la section _Circular dependencies_

### Séparation en couches
- Existe-t-il une séparation logique ou technique en couches de l'application ou dans les modules ?
- Les différentes couches sont bien définies dans l'application ?
  - des erreurs de conception sont souvent detectées ici et ne respectent pas l'isolation des couches
  - vérifier qu'il n'y a pas de cassure entre les couches :
    - par exemple l'utilisation directe d'un `DAO` ou d'un `EntityManager` directement depuis la couche `Présentation` alors qu'il existe une couche `Service`
    - autre exemple sur l'utilisation de la couche `Service` depuis un `DAO`; ce n'est pas une bonne pratique d'avoir recours à une logique métier sur la couche la plus basse (gestion des données d'une Base De Données)

### Structuration des packages
- La structure des packages est-elle clairement définie ou l'organisation des packages est-elle confuse ?
  - la structure des packages doit respecter une suite logique dans les noms (`bean`, `constants`, `exception`, `impl`, ...)
  - les classes contenues dans un package doivent respecter la classification et le nom du package
    - par exemple dans un package `com.acme.constants`, on ne doit trouver que des classes définissant des constantes
    - dans un package `com.acme.entity`, on ne doit trouver que des classes de type `Entity` ou des classes abstraites relatives à la modélisation des données
- Les noms des packages doivent respecter la règle de nommage détectée par [Sonar](https://rules.sonarsource.com/java/type/Code%20Smell/RSPEC-120)
- Eviter d'importer l'intégralité d'un package dans une classe (par exemple, le code `import javax.persistence.*;` est interdit)

### Indépendance des objets entre couches
- Pour isoler les couches entre elles, l'utilisation d'interfaces ou d'APIs sont fortement conseillées pour séparer les couches
- Les objets qui transitent doivent être indépendants entres les couches de l'application; de simples POJOs sont à encourager

### Gestion des dépendances dans l'application
- L'application doit utiliser un moyen standard de gestion et d'injection de dépendances
  - par l'intermédiaire du framework `Spring` (annotations `@Autowired`, `@Service`, `@Component`)
  - par l'utilisation de la `JSR-330` avec les annotations `CDI` (`@Inject`, `@Named`)
- Vérifier que les beans injectés sont bien des interfaces et non des implémentations; cette règle doit être respectée pour avoir une application facilement testable (permet de mettre en place des `Mocks`)
- Privilégier la configuration des beans par annotations (`@Configuration`) plutôt que par fichiers `XML`

> **Note** : Pour une application utilisant `Spring`; il est à noter qu'une classe abstraite ne doit pas comporter d'annotation `@Component`, même si ses attributs utilisent `@Autowired` pour l'injection, seules les classes qui étendent la classe abstraite ont besoin d'utiliser l'annotation `@Component`

### Clarté du code
- Le code est-il clair et lisible ?
  - un code aéré est beaucoup plus facile à maintenir qu'un "gros bloc"
- Existe-t-il une configuration d'un style de format pour le développement `Java` sous l'IDE (`Eclipse` ou `IntelliJ IDEA`) ?
  - l'utilisation d'un style de formatage pour le code `Java` est à encourager; cela permet d'uniformiser l'écriture et la lecture du code

### Nommage des classes, méthodes, variables
#### Les classes
- Est-ce-que le nommage des classes suit une logique ? Cette logique est-elle respectée ?
  - le respect d'un nommage des classes permet très vite de comprendre la nature de la classe; de manière générale, on devrait trouver :
    - des classes définissant des constantes avec un suffixe `Constants` ou `Constantes` (par exemple `MyCustomConstants.java`),
    - des exceptions avec un suffixe `Exception` (par exemple `MyCustomException.java`)
    - des interfaces avec un préfixe `I` (par exemple `ICustomService.java` pour une interface d'un service)
    - des implémentations avec un suffixe `Impl` (par exemple `MyCustomServiceImpl.java` pour une implémentation d'un service)
    - des classes abstraites contenant le mot clé `Abstract` (par exemple `MyAbstractService.java`); voir [Règle Sonar](https://rules.sonarsource.com/java/type/Code%20Smell/RSPEC-118)
    - des classes de type `DTO` avec le suffixe `DTO` (par exemple `MyDataDTO.java`) ou des classes de type `Entité` avec le suffixe `Entity` (facultatif)
    - etc...
  - les classes doivent respecter la règle de nommage détectée par [Sonar](https://rules.sonarsource.com/java/RSPEC-101)

#### Les méthodes
- Les noms des méthodes doivent respecter la règle de nommage détectée par [Sonar](https://rules.sonarsource.com/java/RSPEC-100)
- Vérifier que les méthodes ne comportent pas un nombre important de paramètres : voir [Règle Sonar](https://rules.sonarsource.com/java/RSPEC-107)
  - lorsque le nombre dépasse 6 paramètres lors de l'appel, utiliser plutôt un seul paramètre sous la forme d'un `POJO` (avec les _getters/setters_)
  - de cette manière, le système sera plus maintenable et plus robuste aux changements car l'interface ne sera pas modifiée
- Vérifier si il n'existe pas de méthodes privées non utilisées : voir [Règle Sonar](https://rules.sonarsource.com/java/RSPEC-1144)
- Il arrive que certaines méthodes n'aient pas la bonne visibilité :
  - réduire la visibilité de `public` en `private` ou `protected`
  - si la méthode se trouve dans une classe d'implémentation et que sa visibilité doit être `public`, cela indique une mauvaise conception; cette méthode doit être déclarée au niveau de l'interface

#### Les variables
- Les variables doivent respecter la règle de nommage détectée par [Sonar](https://rules.sonarsource.com/java/RSPEC-117)
- Par un souci de lisibilité du code, ne pas déclarer plusieurs variables sur une même ligne : voir [Règle Sonar](https://rules.sonarsource.com/java/RSPEC-1659)

### Utilisation / nommage des constantes
- Une bonne pratique consiste à classer les constantes dans des classes dédiées :
  - en utilisant un suffixe comme `Constantes` ou `Constants`
  - la classe peut être `final`; elle doit obligatoirement avoir un constructeur privé pour éviter l'instanciation avec le mot clé `new`
- Les constantes doivent respecter la règle de nommage détectée par [Sonar](https://rules.sonarsource.com/java/RSPEC-115)

> **Exemple de déclaration d'une classe de constantes**
```java
public final class MyCustomConstants {

    public static final String MY_FIRST_CONSTANT = "myFistValue";

    public static final String MY_SECOND_CONSTANT = "mySecondValue";

    private MyCustomConstants() {
        // private constructor to avoid instanciation
    }
    
}
```

### Structuration du code
- Le code est-il bien structuré ?
  - les classes Java sont clairement identifiables (rôle exclusivement technique, classe utilitaire, logique métier, ...)
  - l'écriture du code respecte un ordre prédéfini (déclaration des dépendances, des attributs, déclaration des méthodes publiques puis privées)

### Utilisation propre de l'héritage, interfaces
- Vérifier que les interfaces sont bien utilisées pour séparer les couches et pas les implémentations; que l'injection des dépendances est utilisée sur l'interface via les annotations (`@Autowired` ou  `@Inject`)
- Vérifier que l'annotation `@Override` n'est pas oubliée; ceci est utile pour deux raisons :
  - cela entraîne un avertissement du compilateur si la méthode annotée ne remplace rien, comme dans le cas d'une faute de frappe
  - cela améliore la lisibilité du code source rendant évident le fait que les méthodes soient surchargées
- Attention à l'utilisation de `super`; surcharger une méthode en appelant la méthode de la super-classe est inutile et trompeur : voir [Règle Sonar](https://rules.sonarsource.com/java/type/Code%20Smell/RSPEC-1185)

> **Note** : Pour rappel, il n’est pas nécessaire d’utiliser la visibilité `public` sur les méthodes des interfaces car par définition toutes les méthodes des interfaces sont publiques.

### Description claire de l'objectif de la méthode / classe
- La documentation JavaDoc doit être bien documentée sur les classes et les interfaces
- La JavaDoc des méthodes privées n’est pas obligatoire mais c’est un plus. Priorité au code public (interfaces, ...)
- Essayer d’utiliser une seule langue dans la JavaDoc (mélange de français et d'anglais); les parties techniques (classes utilitaires ou issues d'un framework) peuvent rester en anglais
- La JavaDoc d'une classe utilitaire doit être accompagnée d'exemples de code Java pour montrer comment utiliser les méthodes statiques

### Description des paramètres
- Un effort doit être effectué sur l’alimentation de la JavaDoc pour les paramètres; surtout sur les parties fonctionnelles (interfaces, services) :
  - de la documentation du style `@param interval the interval` ou `@param filter the filter` ne sont pas suffisants pour comprendre le fonctionnel

### Description du résultat envoyé
- Même remarques que pour les paramètres des méthodes
- Expliquer les différents cas de retours du résultat, surtout si celui-ci peut être `null`

### Description des exceptions envoyées
- La JavaDoc sur les exceptions est généralement baclée voir inexistante, cela se résume souvent par `@throws MonException si erreur`; ceci n'est pas suffisant :
  - les raisons de la levée d'une exception doit être explicite car celle-ci peut être soit technique, soit applicative
  - il faut documenter pour décrire les différents cas d'exceptions qui peuvent être remontés par l'interface

### Système de log mutualisé
- L'application utilise-t-elle un système standard de logs mutualisé ?
  - API standardisée somme SLF4J
  - un système de logs comme Log4J ou Logback
- Le système de logs est-il bien configuré ?
  - configuration par fichier XML ou properties
  - déclaration correcte des Appenders (dans la console de l'IDE ou bien sous la forme de journalisation utilisant le mécanisme de RollingFileAppender)
  - déclaration correcte des Loggers avec le bon niveau de traces suivants les environnements (autoriser le niveau DEBUG uniquement pour des environnements hors production)
- Faire la chasse aux `System.out.print*` ou `e.printStackTrace();` dans le code même si c'est utilisé dans les tests : voir [Règle Sonar](https://rules.sonarsource.com/java/RSPEC-1148)

### Qualité des messages
Pour la qualification de cette section, s'imaginer que le client remonte une anomalie de production et que la seule information fournie pour l'analyse est un gros fichier de logs de l'application.

- Est-ce que les messages dans les logs de l'application permettent facilement d'identifier la source du problème ?
  - les messages de log doivent être clairs et expliquent la cause de l'erreur en y incluant l'exception
  - ne pas tracer uniquement que l'exception
  - l'utilisation d'un simple message ou de `e.printStackTrace()` est interdit
- Est-ce que le niveau en trace DEBUG est utilisé pour le développement ?
- Est-ce que le niveau utilisé dans la trace est approprié ?
  - si le niveau WARN est par exemple utilisé lors d'un `catch(Exception)`, il faut le justifier par un commentaire. Le niveau ERROR est dans ce cas plus adapté.

### Gestion des exceptions
- L'application utilise un mécanisme pour la gestion d'exceptions qui permet de faire la différence par sujet technique / logique / métier selon le type de problème rencontrée.
- Le fait d'encapsuler les exceptions dans d'autres types d'exceptions pour minimiser l'adhérence entre couches sera positivement valorisé.
- Eviter l'utilisation du `try {...} catch(Exception e) {...} }`; ce n'est pas une bonne pratique; cette utilisation est tolérée sur l'appel d'un code _Legacy_ dont on ne maîtrise pas les sources
- Ne pas effectuer de `throw new Exception(...)` sur des exceptions génériques mais privilégier l'utilisation d'exceptions spécifiques : voir [Règle Sonar](https://rules.sonarsource.com/java/RSPEC-112)
- Valorisation de l'utilisation d'un mécanisme de gestion global (minimiser les try-catch)

### Log des exceptions
- Le logging des exceptions devrait toujours apporter un message et l'exception.

### Complexité algorithmique
- Mesurer la complexité globale des algorithmes de l'application. [voir article](https://blog.sonarsource.com/cognitive-complexity-because-testability-understandability) ainsi que [ce document PDF](https://www.sonarsource.com/docs/CognitiveComplexity.pdf)
- Partir des éléments remontés par Sonar : voir [Règle Sonar](https://rules.sonarsource.com/java/RSPEC-3776)

### Qualité des commentaires
- Les commentaires sont-ils suffisamment clairs et pertinents pour comprendre le but et le pour quoi du code de l'application ?
- Dans l'idéal le code doit expliquer le "comment" et les commentaires le "pourquoi".

### Longueur moyenne des classes/méthodes
- méthodes 150 ~ 200 commence à être trop.
- classe < 1000 lignes

### Utilisation d'abstraction/interface pour découplage
- Vérifier que les interfaces sont largement utilisées en lieu et place des implémentations; notamment sur les injections des dépendances

### Traitement du code généré
- le code généré est-il modifié après génération ?
- le code généré est-il généré une seule fois et ajouté au code ?
- le moyen de génération de code est automatisé et déclenché lors de l'étape de livraison ?

> **Note** : le code généré est globalement configuré via des plugins Maven; par exemple `org.jvnet.jaxb2:maven-jaxb2-plugin` pour la génération du code Java à partir de fichiers XSD (mapping XML <-> Java).

### Structure DAO
- La couche métier est-elle clairement identifiée et structurée dans le code de l'application ?
- Valoriser l'utiliation d'un module spécifique.
- Valoriser la séparation par services métier / technique en accord avec l'ensemble de l'application.

### Transactions
- Les transactions devraient être traitées d'une façon standard via un framework et non manuellement dans le code.
- Valoriser la mise en place du mécanise de gestion des transactions.

> **Note** : la gestion des transactions est traitée généralement par un framework comme Spring; soit en utilisant les annotations `@Transactional`, soit via une configuration par AOP. Voir [La gestion des transactions sous le framework Spring](https://docs.spring.io/spring/docs/4.2.x/spring-framework-reference/html/transaction.html)

### Accès aux objets
- Le moyen d'accéder aux données devrait dans l'idéal s'appuyer sur un framework standard type JPA par déclaration d'entités (via l'annotation `@Entity`)
- Valoriser la mise en place du système d'accès aux données :
  - mise en place du design pattern DAO
  - l'utilisation de Spring-Data-JPA couplé avec Hibernate serait un plus
- Vérifier que les objets persistés implémentent bien les méthodes `equals` et `hashCode` :
  - il est important d'implémenter sur une entité les méthodes `equals` et `hashCode` pour définir une clé fonctionnelle de l'objet persisté; cette clé permet à Hibernate sur un objet détaché de savoir si cette instance existe ou non dans le base de données
  - c'est également indispensable en Java lorsque ces instances sont manipulées dans un Set (liste d'éléments sans doublons)
  - voir la documentation Hibernate à ce sujet : [Implementing equals() and hashCode()](https://docs.jboss.org/hibernate/core/4.0/manual/en-US/html/persistent-classes.html#persistent-classes-equalshashcode)

### Requêtage
- Valoriser l'utilisation des `Prepared Statements` Vs. la construction dynamique des requêtes via la concaténation des paramètres reçus directement de l'appelant.
- Privilégier l'utilisation de framworks pour construire les requêtes SQL comme :
  - le JPQL ou HQL avec Hibernate et l'utilisation d'annotations comme `@Query`, `@NamedQuery`, ...
  - le framework jOOQ qui par le biais de son API "fluent" permet d'avoir une meilleure maintenabilité et lisibilité du code source : voir [Great Reasons for Using jOOQ](https://www.jooq.org/)

### Présence / Qualité de TUAs
- L'application contient-elle de tests unitaires automatisés ?
- Qualité globale des TUAs
  - vérifier que les tests concernant des cas passants et non-passants
  - privilégier l'utilisation de librairies comme Mockito ou PowerMock pour pouvoir isoler les couches et permettre ainsi de se focaliser sur la partie à tester

### Présence / Qualité de TIAs
- L'application contient-elle des tests d'intégration automatisés ?
- Qualité globale des TIAs.

### Testabilité de l'application
- Le code de l'application est facilement testable
- Vérification du respect des design patterns comme : Modularité, Single Responsibility Principle, IOC, ...
- Valoriser l'utilisation du mécanisme Given / When / Then

### Conformité du livrable aux bonnes pratiques
- externalisation des fichiers dépendants de l'environnement
- génération d'UN seul livrable valable pour TOUS les environnements
- simplicité de la configuration de maven (suivi des normes & préconisations de maven)

### Modification du livrable après livraison
- Le livrable fourni est-il modifié après la livraison ?

### Cycle de vie des modules pour livraison
- Si la structure de l'application consiste en plusieurs modules (en termes maven) vérifier le moyen de livraison des différents modules.
- Si le cycle de vie des modules est lié le moyen de livraison automatique devrait être capable de livrer tous les modules au même temps.

### Chemins en dur
- Éviter l'utilisation de chemins en dur dans le code

### Librairies de tests packagées dans le livrable final
- Les librairies de tests ne devraient jamais être packagées dans le livrable final

### Dépendances vers librairies inconnues
- Certaines dépendances sont des librairies tiers non publiques dont nous n'avons pas les sources ou des librairies publiques dont la version n'est pas connue.

### Base de données
- Maîtriser le nombre de requêtes SQL exécutés par un DAO.
- Utiliser des index.
- Éviter les recherches de type like commençant par un %.
- Lorsque la pagination n’est pas utilisée, toujours limiter le nombre de résultats remontés par une requête.

### Cache
- L’utilisation du cache Hibernate ou d’un cache applicatif doit être motivée.
- Les gains doivent pouvoir être mesurés.
- L’application doit fonctionner lorsque le cache est désactivé.

### Mapping Objet-Objet
- L’introduction d’une couche de mapping n’est pas un choix à prendre à la légère.
- Utiliser un framework pour faciliter sa mise en œuvre n’est pas non plus évident [voir un Benchmark](https://github.com/arey/java-object-mapper-benchmark)

### Web Service
- Limiter le nombre d’appel de WS.
- Utilisation de timeout faible.

### Input Validation

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Input_Validation)

- Procédez à la validation des Input cote serveur
- Valider toutes les données provenant de sources non fiables (bases de données, flux de fichiers, etc.)
- Il devrait y avoir une routine centralisée de validation des Input pour l'application
- Tous les échecs de validation doivent entraîner le rejet des Input
- Valider toutes les données fournies par le client avant le traitement, y compris tous les paramètres, les URL et le contenu de l'en-tête HTTP.
- Valider les types de données attendus
- Valider la plage de données
- Valider la longueur des données
- Validez toutes les entrées par rapport à une liste "blanche" de caractères autorisés, dans la mesure du possible

### Output Encoding

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Output_Encoding)

### Authentication and Password Management

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Authentication_and_Password_Management)

TODO

### Session Management

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Session_Management)

TODO

### Access Control

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Access_Control)

TODO

### Cryptographic Practices

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Cryptographic_Practices)

TODO

### Error Handling and Logging

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Error_Handling_and_Logging)

TODO

### Communication Security

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Communication_Security)

TODO

### System Configuration

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#System_Configuration)

TODO

### Database Security

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Database_Security)

TODO

### File Management

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#File_Management)

TODO

### Memory Management

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#Memory_Management)

TODO

### General Coding Practices

Liste complète [ici](https://www.owasp.org/index.php/OWASP_Secure_Coding_Practices_Checklist#General_Coding_Practices)

TODO
