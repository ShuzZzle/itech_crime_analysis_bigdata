sap.ui.define [
  "sap/ui/core/UIComponent"
  "§nx§/model/jsonapi/JSONAPIModel"
], ( Component, JSONAPIModel ) ->
  Component.extend "§ns§.Component", {
    metadata: {
      manifest: "json"
    }

    init: ->
      Component.prototype.init.apply this, arguments
      that = this
      @initModels()
      window.loader._sugar.done ->
        that.getRouter().initialize()

    initModels: ->
      @setModel( window.m = new JSONAPIModel( './api' ) ) # XXX Global for testing

  }
