# WDeStuP_XW
This repository is intended to finish the mini project for CS 6388-01 Model-Integrated Comp (2022F) of Vanderbilt University. Firstly, I forked the project in git from: https://github.com/kecso/WDeStuP.

## Initialization
The steps to srart-up the studio are as below:
- install [Docker-Desktop](https://www.docker.com/products/docker-desktop).
- clone the repository.
- edit the '.env' file so that the BASE_DIR variable points to the main repository directory.
- use docker commands to build the mongobd container and webgme container:
    - **build** container: `docker-compose build`.
    - **start** container: `docker-compose up -d`.
    - **stop** container: `docker-compose stop`.
    - **enter** container: `docker-compose exec webgme bash`.
    - **clean** container: `docker system prune -f`.
- connect to server at http://localhost:8888.

## Adding the MetaPetriNet seed
The steps of add seed:
- create the MetaPetriNet seed on https://mic.isis.vanderbilt.edu/. The project seed includes the fundamental features of the PetriNet model. Use the Meta Visualizer to cerate the Meta model of PetriNet, and the meta views show as below.
- export the PetriNet meta model via `master > Export branch`. Then create the folder `seeds` within the `src` folder and placed the exported webgmex file in that folder with the name of `seedPetriNet_XW.webgmex`.
- add config in webgme-setup.json under `"components"`:
```
"seeds": {
      "PetriNetProjectSeed": "src/seeds/seedPetriNet_XW"
    }
```
- add config in config.webgme.js:
```
config.seedProjects.basePaths.push("src/seeds");
```
- copy webgme-setup.json: `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`.
- copy webgme-config: `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`.

### METAView
![meta view](img/METAView.png)

### PetriNetView
![petri net view](img/PetriNetView.png)

### ROOTCompositionView
![root composition view](img/ROOTCompositionView.png)

## Adding new visualizer
Follow these steps to add a new visualizer:
- enter the container.
- creare new JS visualizer: `npm run webgme new viz VizXW`. `VizXW` is the new visualizer's name.
Then config code will add in webgme-setup.json under `"components"` automatically:
```
"visualizers": {
      "VizXW": {
        "src": "panels/VizXW/VizXWPanel",
        "title": "VizXW",
        "panel": "src/visualizers/panels/VizXW",
        "secondary": false,
        "widget": "src/visualizers/widgets/VizXW"
      }
    }
```
Also, config code will add in config.webgme.js automatically:
```
var config = require('webgme/config/config.default'),
    validateConfig = require('webgme/config/validator');

config.visualization.panelPaths.push(__dirname + "/../src/visualizers/panels");

config.visualization.visualizerDescriptors.push(
  __dirname + "/../src/visualizers/Visualizers.json"
);

config.requirejsPaths = {
  panels: "./src/visualizers/panels",
  widgets: "./src/visualizers/widgets",
};
```
Finally, folder `visuallizers` will be added under `./src` automatically, which contains `./panels/VizXW/VizXWControl.js`, `./panels/VizXW/VizXWPanel.js`, `./widgets/VizXW/VizXWWidget.js`, `./widgets/VizXW/styles/VizXWWidget.css`, `./widgets/VizXW/styles/VizXWWidget.scss`, `./Visualizers.json`. Plus, These files contain general functions and config. To create customized functions, most adding codes are in `./panels/VizXW/VizXWControl.js` and `./widgets/VizXW/VizXWWidget.js`.
- exit container.
- copy webgme-setup.json: `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`.
- copy webgme-config: `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`.

## Adding new plugin
Follow these steps to add a new plugin:
- enter the container.
- create new JS plugin: `npm run webgme new plugin PetriNetClassifier`. `PetriNetClassifier` is the new plugin's name.
Then config code will add in webgme-setup.json under `"components"` automatically:
```
"plugins": {
      "PetriNetClassifier": {
        "src": "src/plugins/PetriNetClassifier",
        "test": "test/plugins/PetriNetClassifier"
      }
```
Also, config code will add in config.webgme.js automatically:
```
config.plugin.basePaths.push(__dirname + "/../src/plugins");
```
Finally, folder `plugins` will be added under `./src` automatically, which contains `./plugins/PetriNetClassifier/PetriNetClassifier.js`, `./plugins/PetriNetClassifier/metadata.json`. Plus, These files contain general functions and config. To create customized functions, most adding codes are in `./plugins/PetriNetClassifier/PetriNetClassifier.js`.
- exit container.
- copy webgme-setup.json: `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`.
- copy webgme-config: `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`.