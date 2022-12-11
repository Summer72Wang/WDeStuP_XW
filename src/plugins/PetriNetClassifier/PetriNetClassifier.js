/*globals define*/
/*eslint-env node, browser*/

/**
 * Generated by PluginGenerator 2.20.5 from webgme on Sat Dec 10 2022 20:40:20 GMT+0000 (Coordinated Universal Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    "plugin/PluginConfig",
    "text!./metadata.json",
    "plugin/PluginBase",
  ], function (PluginConfig, pluginMetadata, PluginBase) {
    "use strict";
  
    pluginMetadata = JSON.parse(pluginMetadata);
  
    /**
     * Initializes a new instance of PetriNetClassifier.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin PetriNetClassifier.
     * @constructor
     */
    function PetriNetClassifier() {
      // Call base class' constructor.
      PluginBase.call(this);
      this.pluginMetadata = pluginMetadata;
    }
  
    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructure etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    PetriNetClassifier.metadata = pluginMetadata;
  
    // Prototypical inheritance from PluginBase.
    PetriNetClassifier.prototype = Object.create(PluginBase.prototype);
    PetriNetClassifier.prototype.constructor = PetriNetClassifier;
  
    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(Error|null, plugin.PluginResult)} callback - the result callback
     */
    PetriNetClassifier.prototype.main = function (callback) {
      // Use this to access core, project, result, logger etc from PluginBase.
      const self = this;
      // Using the coreAPI to make changes.
      const nodeObject = self.activeNode;
  
      self.core.loadOwnSubTree(self.activeNode, (error, nodes) => {
        self.transitions = [];
        let _transitionNodes = [];
        self.places = [];
        let _placeNodes = [];
        for (let _node of nodes) {
          if (self.getMetaName(_node) === "Transition") {
            _transitionNodes.push(_node);
          } else if (self.getMetaName(_node) === "Place") {
            _placeNodes.push(_node);
          }
        }
        for (let _trans of _transitionNodes) {
          let _transObj = {
            id: self.core.getPath(_trans),
            node: _trans
          }
          self.transitions.push(_transObj);
        }
        for (let _plac of _placeNodes) {
          let _placObj = {
            id: self.core.getPath(_plac),
            node: _plac
          }
          self.places.push(_placObj);
        }
  
        self.PlaceToTransArc = self.getArcs("PlaceToTransArc", nodes);
        self.TransToPlaceArc = self.getArcs("TransToPlaceArc", nodes);
        self.place2TransInMap = self.getPlace2TransInMap();
        self.place2TransOutMap = self.getPlace2TransOutMap();
        let isMG = self.isMarkedGraph();
        let isSM = self.isStateMachine();
        let isWN = self.isWorkflowNet();
        let isFC = self.isFreeChoicePetriNet();
        if (isMG || isSM || isWN || isFC) {
          if (isMG) {
            self.sendNotification({
              message: "Result: Marked Graph",
            });
          }
          if (isSM) {
            self.sendNotification({
              message: "Result: State Machine",
            });
          }
          if (isWN) {
            self.sendNotification({
              message: "Result: Workflow Net",
            });
          }
          if (isFC) {
            self.sendNotification({
              message: "Result: Free Choice Petri Net",
            });
          }
        } else {
          self.sendNotification({
            message: "Result: Not a specific kind of Petri Net",
          });
        }
  
      });
    };
  
    PetriNetClassifier.prototype.isFreeChoicePetriNet = function () {
      let self = this;
      // if the intersection of the inplaces sets of two transitions are not empty, then the two transitions should be the same (or in short, each transition has its own unique set if inplaces )
      // maintain a set of inplaces, traverse all the transitions, when it meets a new inplace, check if it exists in the inplace set, if so, return false
      // after the traverse, return true
      let _inplaceSet = [];
      for (let _tran of self.transitions) {
        let _tranId = _tran.id;
        for (let _place of Object.keys(self.place2TransOutMap)) {
          if (self.place2TransInMap[_place][_tranId]) {
            self.logger.info(_place);
            if (_inplaceSet.includes(_place)) {
              return false;
            } else {
              _inplaceSet.push(_place);
            }
          }
        }
      }
  
      return true;
    }
  
    PetriNetClassifier.prototype.isWorkflowNet = function () {
      let self = this;
      // petri net is a workflow net if it has exactly one source place s where *s = ∅, one sink place o where o* = ∅, and every x ∈ P ∪ T is on a path from s to o
      let _sourceNum = 0;
      let _sinkNum = 0;
      let _sourceId = "";
      let _sinkId = "";
      for (let _place of self.places) {
        let _placeId = _place.id;
        let _intran = 0;
        let _outtran = 0;
        for (let _tran of Object.keys(self.place2TransOutMap[_placeId])) {
          if (self.place2TransOutMap[_placeId][_tran]) {
            _outtran += 1;
          }
        }
        for (let _tran2 of Object.keys(self.place2TransOutMap[_placeId])) {
          if (self.place2TransInMap[_placeId][_tran2]) {
            _intran += 1;
          }
        }
        if (_intran > 0 && _outtran <= 0) {
          _sinkNum += 1;
          _sinkId = _placeId;
        }
        if (_intran <= 0 && _outtran > 0) {
          _sourceNum += 1;
          _sourceId = _placeId;
        }
        if (_sinkNum > 1 || _sourceNum > 1) {
          return false;
        }
      }
      let _placeNum = (self.places).length;
      // should do bfs/dfs from source to sink to see if every node is on path
      // we can count the number of nodes in path, and compare it with _placeNum
      return true;
    };
  
    PetriNetClassifier.prototype.isMarkedGraph = function () {
      let self = this;
      // a petri net is a marked graph if every place has exactly one out transition and one in transition.
      for (let _place of self.places) {
        let _placeId = _place.id;
        let _intran = 0;
        let _outtran = 0;
        for (let _tran of Object.keys(self.place2TransOutMap[_placeId])) {
          if (self.place2TransOutMap[_placeId][_tran]) {
            _outtran += 1;
          }
        }
        for (let _tran2 of Object.keys(self.place2TransOutMap[_placeId])) {
          if (self.place2TransInMap[_placeId][_tran2]) {
            _intran += 1;
          }
        }
        if (_outtran == 1 && _intran == 1) {
  
        } else {
          return false;
        }
      }
      return true;
    }
  
  
  
    PetriNetClassifier.prototype.isStateMachine = function () {
      let self = this;
      // a petri net is a state machine if every transition has exactly one inplace and one outplace .
      for (let _tran of self.transitions) {
        let _tranId = _tran.id;
        let _inplace = 0;
        let _outplace = 0;
        for (let _place of Object.keys(self.place2TransOutMap)) {
          if (self.place2TransOutMap[_place][_tranId]) {
            _outplace += 1;
          }
        }
        for (let _place2 of Object.keys(self.place2TransOutMap)) {
          if (self.place2TransInMap[_place2][_tranId]) {
            _inplace += 1;
          }
        }
        if (_outplace == 1 && _inplace == 1) {
  
        } else {
          return false;
        }
      }
      return true;
    }
  
    /* From this line to the end of file, reference: https://github.com/austinjhunt/petrinet-webgme-designstudio*/
    // These functuions are to fetch data from the Petri Net.
    // The data should be used to help the classification.
  
    PetriNetClassifier.prototype.getMetaName = function (node) {
      let self = this;
      return self.core.getAttribute(self.core.getMetaType(node), "name");
    };
  
    PetriNetClassifier.prototype.getArcs = function (metaName, nodes) {
      let self = this;
      let arcs = [];
      nodes.forEach((node) => {
        if (self.getMetaName(node) === metaName) {
          arcs.push({
            src: self.core.getPointerPath(node, "src"),
            dst: self.core.getPointerPath(node, "dst"),
          });
        }
      });
      return arcs;
    };
  
    PetriNetClassifier.prototype.getOutFlowFromPlaceToTransition = function (placeId, transitionId) {
      const _isQualify = (arc) => {
        return arc.src === placeId && arc.dst === transitionId;
      }
      return this.PlaceToTransArc.some(_isQualify);
    };
  
    PetriNetClassifier.prototype.getInFlowToPlaceFromTransition = function (placeId, transitionId) {
      const _isQualify = (arc) => {
        return arc.src === transitionId && arc.dst === placeId;
      }
      return this.TransToPlaceArc.some(_isQualify);
    };
  
    PetriNetClassifier.prototype.getPlace2TransOutMap = function () {
      let self = this;
      let place2TransOutMap = {};
      self.places
        .map((p) => p.id)
        .forEach((pid, useless1) => {
          place2TransOutMap[pid] = {};
          self.transitions
            .map((t) => t.id)
            .forEach((tid, useless2) => {
              place2TransOutMap[pid][tid] = self.getOutFlowFromPlaceToTransition(pid, tid);
            });
        });
      return place2TransOutMap;
    };
  
    PetriNetClassifier.prototype.getPlace2TransInMap = function () {
      let self = this;
      let place2TransInMap = {};
      self.places
        .map((p) => p.id)
        .forEach((pid, useless1) => {
          place2TransInMap[pid] = {};
          self.transitions
            .map((t) => t.id)
            .forEach((tid, useless2) => {
              place2TransInMap[pid][tid] = self.getInFlowToPlaceFromTransition(pid, tid);
            });
        });
      return place2TransInMap;
    };
  
    return PetriNetClassifier;
  });