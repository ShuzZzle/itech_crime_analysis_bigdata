sap.ui.define ["sap/ui/core/UIComponent"], ( Component ) ->
  Component.extend "§ns§.Component", {
    metadata: {
      manifest: "json"
    }

    init: ->
      Component.prototype.init.apply this, arguments
      that = this
      window.loader._sugar.done ->
        that.getRouter().initialize()

  }
