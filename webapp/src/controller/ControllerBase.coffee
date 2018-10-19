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

    _onPatternMatched: (evt) ->
      args = evt.getParameter 'arguments'
      route = @getModel "route"
      args = Object.map( args, urlparsing.parse.bind( urlparsing ) )
      $.extend args, @getRouteDefaults()
      route.setData args
      @onPatternMatched.apply @, arguments


    initModels: ->
      @setModel new JSONModel({}), "route"

    getRouter: ->
      @getOwnerComponent().getRouter()

    getModel: (model) ->
      @getView().getModel model

    setModel: (model, name) ->
      @getView().setModel model, name

    i18n: ->
      rb = @getModel('i18n').getResourceBundle()
      rb.getText.apply rb, arguments

    byId: ->
      @getView().byId.apply @getView(), arguments

    getRouteName: ->
      undefined

    getRouteDefaults: ->
      {}

    onPatternMatched: ->
      undefined

    onRouteMatched: ->
      undefined

    setRouteParams: (values) ->
      existing = @getModel( "route" ).getData()
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

    navTo: ->
      router = @getRouter()
      router.navTo.apply router, arguments

    navHome: ->
      @getRouter().navTo "default"
  }
