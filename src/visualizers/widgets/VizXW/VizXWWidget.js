/*globals define, WebGMEGlobal*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Sat Dec 10 2022 20:36:09 GMT+0000 (Coordinated Universal Time).
 */

define(["jointjs", "css!./styles/VizXWWidget.css"], function (joint) {
    "use strict";
    var WIDGET_CLASS = "viz-x-w";
    function VizXWWidget(logger, container) {
      this._logger = logger.fork("Widget");
      this._el = container;
      this.nodes = {};
      this._initialize();
      this._logger.debug("ctor finished");
    }
  
    //  reference: https://resources.jointjs.com/tutorial/
    //  reference: https://resources.jointjs.com/docs/jointjs/v2.1/joint.html
    //  reference: https://github.com/austinjhunt/petrinet-webgme-designstudio/blob/main/petri-net/src/visualizers/widgets/SimViz/SimVizWidget.js
    //  This initialize function defines how to render circles in a place of different numbers of marking that the place has.
    //  To make the token circles in the place beautiful, we should define the position of every token circle under the circumstance of different numbers of marking.
    //  I cite his code because the token circles are well-organized using these Cascading Style Sheets.
    VizXWWidget.prototype._initialize = function () {
      var width = this._el.width(),
        height = this._el.height(),
        self = this;
  
      // set widget class
      self._el.addClass(WIDGET_CLASS);
  
      // Create a dummy header
      this._el.append('<h3>MyVisualizer Events:</h3>');
  
      // firstly, create ElementViews and element models to prepare for the whole petriNet's model and view
      // define the apperance of places
      joint.shapes.pn.Place = this.createPlaceShape();
  
      // define how a place will show in the simulator
      joint.shapes.pn.PlaceView = this.createPlaceView();
  
      // define how a transition will show in the simulator
      joint.shapes.pn.TransitionView = this.createWidgetView();
  
      const namespace = joint.shapes;
  
      // use jointjs library to create petriNet model
      self._jointPetriNet = new joint.dia.Graph({}, { cellNamespace: namespace });
  
      self._jointPaper = new joint.dia.Paper({
        el: self._el,
        width: width,
        height: height,
        gridSize: 10,
        model: self._jointPetriNet,
        defaultAnchor: { name: "perpendicular" },
        defaultConnectionPoint: { name: "boundary" },
        cellViewNamespace: namespace,
      });
  
      self._el.on("dblclick", function (event) {
        event.stopPropagation();
        event.preventDefault();
        self.onBackgroundDblClick();
      });
    };
  
    VizXWWidget.prototype.onWidgetContainerResize = function (width, height) {
      this._logger.debug("Widget is resizing...");
    };
  
    VizXWWidget.prototype.initPlaces = function () {
      let self = this;
      // joint.shapes.pn.Place.id => self._webgmePetriNet.places[*].key()
      self._webgmePetriNet.id2place = {};
      for (let _placeId of Object.keys(self._webgmePetriNet.places)) {
        let place = self._webgmePetriNet.places[_placeId];
        let vertex = new joint.shapes.pn.Place({
          position: place.position,
          size: { width: 80, height: 80 },
          attrs: {
            ".label": {
              text: self._webgmePetriNet.places[_placeId].name,
              fill: "black",
            },
            ".root": {
              stroke: "black",
              strokeWidth: 3,
            },
            ".currentMarking > circle": {
              fill: "black",
            },
          },
          currentMarking: place.currentMarking,
        });
        self._jointPetriNet.addCell([vertex]);
        self._webgmePetriNet.places[_placeId].joint = vertex;
        self._webgmePetriNet.id2place[vertex.id] = _placeId;
      }
    };
  
    VizXWWidget.prototype.initTransitions = function () {
      let self = this;
      // joint.shapes.pn.Transition.id => self._webgmePetriNet.transitions[*].key()
      self._webgmePetriNet.id2transition = {};
      for (let _transId of Object.keys(self._webgmePetriNet.transitions)) {
        let transition = self._webgmePetriNet.transitions[_transId];
        let vertex = new joint.shapes.pn.Transition({
          name: transition.name,
          position: transition.position,
          size: { width: 50, height: 50 },
          attrs: this.createCSS(transition.name)
        });
        vertex.addTo(self._jointPetriNet);
        // bind the joint shape to the transition in PetriNet model
        self._webgmePetriNet.transitions[_transId].joint = vertex;
        self._webgmePetriNet.id2transition[vertex.id] = _transId;
      }
    };
  
  
    VizXWWidget.prototype.turnOnEnabledTrans = function () {
      let self = this;
      let enabledTransitions = [];
      Object.keys(self._webgmePetriNet.transitions).forEach((tid) => {
        let transition = self._webgmePetriNet.transitions[tid];
        let fireable = transitionCanBeFired(self, transition.joint);
        transition.joint.set("enabled", fireable);
        if (fireable) {
          enabledTransitions.push(transition);
        }
      });
  
      self._webgmePetriNet.setFireableEvents(enabledTransitions);
      if (enabledTransitions.length === 0 && !self.JUST_NOTIFIED_DEADLOCK) {
        self._client.notifyUser({
          message: "The network meets a deadlock.",
          severity: "info",
        });
        self.JUST_NOTIFIED_DEADLOCK = true;
        setTimeout(() => {
          self.JUST_NOTIFIED_DEADLOCK = false;
        }, 5000);
      }
    };
  
    VizXWWidget.prototype.initializeArcs = function (arcType) {
      let self = this;
      let _isPlaceToTransArc = (arcType === "ArcPlaceToTransition");
      let arcsArray = null;
      if (_isPlaceToTransArc) {
        arcsArray = self._webgmePetriNet.ArcPlaceToTransition;
      } else {
        arcsArray = self._webgmePetriNet.ArcTransitionToPlace;
      }
      arcsArray.forEach((arc) => {
        let src = null;
        let dst = null;
        if (_isPlaceToTransArc) {
          src = self._webgmePetriNet.places[arc.src];
          dst = self._webgmePetriNet.transitions[arc.dst];
        } else {
          src = self._webgmePetriNet.transitions[arc.src];
          dst = self._webgmePetriNet.places[arc.dst];
        }
        src.jointOutArcs = src.jointOutArcs || {};
        let link = createLinkSVG(src.joint, dst.joint, arc.name);
        link.addTo(self._jointPetriNet);
        src.jointOutArcs[arc.id] = link;
      });
    };
  
    // create link between places and transitions
    let createLinkSVG = (a, b, name) => {
      return new joint.shapes.standard.Link({
        source: { id: a.id },
        target: { id: b.id },
        attrs: {
          line: {
            strokeWidth: 1,
          },
          wrapper: {
            cursor: "default",
          },
        },
        labels: [
          {
            position: {
              distance: 0.5,
              offset: 0,
              args: {
                keepGradient: true,
                ensureLegibility: true,
              },
            },
            attrs: {
              text: {
                text: name,
                fontWeight: "bold",
              },
            },
          },
        ],
      });
    };
  
    // State Machine manipulating functions called from the controller
    VizXWWidget.prototype.initNet = function (petriNetDescriptor) {
      const self = this;
      self._webgmePetriNet = petriNetDescriptor;
      self._jointPetriNet.clear();
      self.initPlaces();
      self.initTransitions();
      self.initializeArcs("ArcPlaceToTransition");
      self.initializeArcs("ArcTransitionToPlace");
      self._jointPaper.updateViews();
      self.turnOnEnabledTrans();
    };
  
    VizXWWidget.prototype.destroyNet = function () { };
  
    // if any of the in places has a token number less than 1, transition can not be fired
    let transitionCanBeFired = (self, t, placesBefore = null) => {
      if (!placesBefore) {
        var inbound = self._jointPetriNet.getConnectedLinks(t, {
          inbound: true,
        });
        var placesBefore = inbound.map(function (link) {
          return link.getSourceElement();
        });
      }
      for (let _place of placesBefore) {
        if (_place.get("currentMarking") <= 0) {
          return false;
        }
      }
      return true;
    };
  
    VizXWWidget.prototype.fireEvent = function (transition) {
      let self = this;
      /* reference: https://github.com/clientIO/joint/blob/master/demo/petri%20nets/src/pn.js#L14 */
      self.fireTransition(transition.joint, 1, self);
      setTimeout(() => {
        self.turnOnEnabledTrans();
      }, 1200);
    };
  
  
    VizXWWidget.prototype.fireTransition = function (t, sec, self) {
      let createFlowingToken = function () {
          let TOKEN_COLOR = "#ff0000";
          let TOKEN_RADIUS = 10;
        let _token = joint.V("circle", {
          r: TOKEN_RADIUS,
          fill: TOKEN_COLOR,
        });
        return _token;
        };
        var inbound = self._jointPetriNet.getConnectedLinks(t, { inbound: true });
        var outbound = self._jointPetriNet.getConnectedLinks(t, { outbound: true });
        var sourcePlaces = [];
        var targetPlaces = [];
        for (let _linkIn of inbound) {
          sourcePlaces.push(_linkIn.getSourceElement());
        }
        for (let _linkOut of outbound) {
          targetPlaces.push(_linkOut.getTargetElement());
        }
  
        // fire the transition , change the token num of in/out places
        if (transitionCanBeFired(self, t, sourcePlaces)) {
        sourcePlaces.forEach(function (p) {
          setTimeout(function () {
            p.set("currentMarking", p.get("currentMarking") - 1);
          }, 0);
  
          var links = inbound.filter(function (l) {
            return l.getSourceElement() === p;
          });
  
          // token is sent from the source place to the target place
          links.forEach(function (l) {
            l.findView(self._jointPaper).sendToken(createFlowingToken(), sec * 500);
          });
        });
        setTimeout(function () {
          targetPlaces.forEach(function (p) {
            var links = outbound.filter(function (l) {
              return l.getTargetElement() === p;
            });
  
            links.forEach(function (l) {
  
              l.findView(self._jointPaper).sendToken(
                createFlowingToken(),
                sec * 500,
                function () {
                  p.set("currentMarking", p.get("currentMarking") + 1);
                }
              );
            });
          });
        }, 500
        );
      }
    };
  
    VizXWWidget.prototype.resetNet = function () {
       this.initNet(this._webgmePetriNet);
    };
  
    VizXWWidget.prototype.createWidgetView = function () {
      let _widgetView = joint.dia.ElementView.extend({
        presentationAttributes: joint.dia.ElementView.addPresentationAttributes({
          enabled: ["ENABLED"],
        }),
        initFlag: joint.dia.ElementView.prototype.initFlag.concat(["ENABLED"]),
  
        confirmUpdate: function (...args) {
          let flags = joint.dia.ElementView.prototype.confirmUpdate.call(
            this,
            ...args
          );
          if (this.hasFlag(flags, "ENABLED")) {
            // render the transition
            let rootElement = this.vel.findOne(".root");
            let labelElement = this.vel.findOne(".label");
            let transitionName = this.model.get("name");
            let _enabled = this.model.get("enabled");
            this.setLabelStatus(_enabled, rootElement, labelElement, transitionName);
            this.update();
            flags = this.removeFlag(flags, "ENABLED");
          }
          return flags;
        },
  
        setLabelStatus: function (isEnabled, rootElement, labelElement, transitionName) {
          if (isEnabled) {
            // enable the transition
            labelElement
              .text(`ENABLED: ${transitionName}`)
              .addClass("enabled")
              .removeClass("disabled");
            rootElement.addClass("enabled");
          } else {
            labelElement
              .text(`DISABLED: ${transitionName}`)
              .removeClass("enabled")
              .addClass("disabled");
            rootElement.removeClass("enabled");
          }
        }
      });
      return _widgetView;
    }
  
    VizXWWidget.prototype.createPlaceView = function () {
      let _placeView = joint.dia.ElementView.extend({
        // Make sure that all super class presentation attributes are preserved
        presentationAttributes: joint.dia.ElementView.addPresentationAttributes({
            currentMarking: ["MARKING"],
        }),
        initFlag: joint.dia.ElementView.prototype.initFlag.concat(["MARKING"]),
  
        confirmUpdate: function (...args) {
          let flags = joint.dia.ElementView.prototype.confirmUpdate.call(
            this,
            ...args
          );
          // JointJS API
          if (this.hasFlag(flags, "MARKING")) {
            // Return the first element wrapped in the Vectorizer object matching the selector Return undefined if not such element was found.
            const vMarking = this.vel.findOne(".currentMarking").empty();
            var currentMarking = this.model.get("currentMarking");
            if (!currentMarking) return;
            vMarking.append(joint.V("text").text(`${currentMarking}`));
            this.update();
            flags = this.removeFlag(flags, "MARKING");
          }
          return flags;
        }
      });
      return _placeView;
    }
  
    VizXWWidget.prototype.createPlaceShape = function () {
      let _placeShape = joint.shapes.basic.Generic.define(
        "pn.Place",
        {
          size: { width: 70, height: 70 },
          attrs: this.createGeneralCSS(),
        },
        {
          markup: this.createMarkingCSS()
        }
      );
      return _placeShape;
    }
  
    VizXWWidget.prototype.createMarkingCSS = function () {
      return '<g class="rotatable"><g class="scalable"><circle class="root"/><g class="currentMarking" /></g><text class="label"/></g>';
    }
  
    VizXWWidget.prototype.createGeneralCSS = function () {
      let _attr = {
        ".root": {
          r: 25,
          fill: "#ffffff",
          stroke: "#000000",
          transform: "translate(25, 25)",
        },
        ".label": {
          "text-anchor": "middle",
          "ref-x": 0.5,
          "ref-y": -20,
          ref: ".root",
          fill: "#000000",
          "font-size": 16,
        },
        ".currentMarking > circle": {
          fill: "#000000",
          r: 2,
        },
        ".currentMarking > text": {
          transform: "translate(25, 18)",
          "text-anchor": "middle",
          fill: "#000000",
        },
      };
      return _attr;
    }
  
    VizXWWidget.prototype.createCSS = function (labelText) {
      let _attr = {
        ".label": {
          text: labelText,
          "text-anchor": "middle",
          "ref-x": 0.5,
          "ref-y": -20,
          ref: ".root",
          fontSize: 18,
        },
        ".label.enabled": {
          fill: "green",
          stroke: "green",
        },
        ".label.disabled": {
          fill: "red",
          stroke: "red",
        },
        ".root": {
          fill: "#777777",
          stroke: "#777777",
        },
        ".root.enabled": {
          stroke: "blue",
          fill: "blue",
        },
      }
      return _attr;
    }
    /* * * * * * * * Visualizer event handlers * * * * * * * */
  
    VizXWWidget.prototype.onNodeClick = function (/*id*/) {
      // This currently changes the active node to the given id and
      // this is overridden in the controller.
    };
  
    VizXWWidget.prototype.onBackgroundDblClick = function () {
      this._el.append("<div>Background was double-clicked!!</div>");
    };
  
    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    VizXWWidget.prototype.destroy = function () {};
  
    VizXWWidget.prototype.onActivate = function () {
      this._logger.debug("VizXWWidget has been activated");
    };
  
    VizXWWidget.prototype.onDeactivate = function () {
      this._logger.debug("VizXWWidget has been deactivated");
    };
  
    return VizXWWidget;
  });