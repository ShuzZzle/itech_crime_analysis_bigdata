sap.ui.define [
  '§nx§/controller/ControllerBase'
], (ControllerBase) ->
  ControllerBase.extend '§ns§.controller.Default',
    getRouteName: -> 'default'
    getRouteDefaults: -> {
      today: new Date
    }
