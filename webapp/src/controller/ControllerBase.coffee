sap.ui.define [
  'sap/ui/core/mvc/Controller'
  'sap/ui/core/routing/History'
  'sap/ui/model/json/JSONModel'
  '§nx§/util/UrlParsing'
], (Controller, History, JSONModel, UrlParsing) ->
  urlparsing = new UrlParsing()
  Controller.extend "§ns§.controller.ControllerBase", {
    onInit: ->
      if @getRouteName()
        @getRouter().getRoute( @getRouteName() )
          .attachPatternMatched( @_onPatternMatched.bind( @ ) )
          .attachMatched( @onRouteMatched.bind( @ ) )
      @initModels()
      @

    _onPatternMatched: (evt) ->
      args = evt.getParameter 'arguments'
      route = @getRouteModel()
      args = Object.map( args, urlparsing.parse.bind( urlparsing ) )
      $.extend args, @getRouteDefaults()
      route.setData args
      @onPatternMatched.apply @, arguments


    initModels: ->
      @setModel new JSONModel({}), "route"
      @

    getRouter: ->
      @getOwnerComponent().getRouter()

    getModel: (model) ->
      @getView().getModel model

    setModel: (model, name) ->
      @getView().setModel model, name
      @

    i18n: ->
      rb = @getModel('i18n').getResourceBundle()
      rb.getText.apply rb, arguments

    getRouteName: ->
      undefined

    getRouteDefaults: ->
      {}

    getRouteModel: ->
      @getModel( "route" )

    refreshRoute: ( newData ) ->
      @navTo @getRouteName(), $.extend( {}, @getRouteModel().getData(), newData )
      @

    onPatternMatched: ->
      @

    onRouteMatched: ->
      @

    setRouteParams: (values) ->
      existing = @getRouteModel().getData()
      if typeof values == 'function'
        values = values.call( @, values )
      newvals = Object.map $.extend( {}, existing, values ), urlparsing.serialize.bind( urlparsing )
      @getRouter().navTo @getRouteName() newvals
      @

    navBack: ->
      history = History.getInstance()
      if !history.getPreviousHash()
        @navHome()
      else
        window.history.go( -1 )
      @

    navTo: ->
      router = @getRouter()
      router.navTo.apply router, arguments
      @

    navHome: ->
      @navTo "default"
      @
  }
