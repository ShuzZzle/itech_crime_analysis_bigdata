sap.ui.define [
  '§nx§/controller/ControllerBase'
  'sap/viz/ui5/data/FlattenedDataset'
  'sap/viz/ui5/controls/common/feeds/FeedItem'
  'sap/ui/model/Filter'
  'sap/viz/ui5/controls/common/feeds/AnalysisObject'
  'sap/viz/ui5/controls/VizFrame'
    'sap/suite/ui/commons/ChartContainerContent'
], (ControllerBase, FlattenedDataset, FeedItem, Filter, AnalysisObject, VizFrame, ChartContainerContent) ->
  ControllerBase.extend '§ns§.controller.Default',

    getRouteName: -> 'default'
    getRouteDefaults: -> {
      today: new Date
    }
    onInit: ->
      ControllerBase.prototype.onInit.apply this, arguments
      @initCharts()

    initCharts: ->
      @dimensionChange()

    dimensionChange: ->
      dimension = @byId( "dimension" ).getSelectedKey()
      #grouping  = @byId( "grouping" ).getSelectedKey()
      container = @byId "chartContainer"
      #filters   = @buildFilters()
      container.destroyContent()
      switch dimension
        when "year" then @buildYearCharts()
        when "area" then @buildAreaCharts()
        when "type" then @buildTypeCharts()

    buildYearCharts: ->
      dataset = new FlattenedDataset({
        dimensions: [{
          name: "Year"
          value: "{year}"
        }],
        measures: [{
          name: "Count"
          value: "count"
        }],
        data: { path: '/crimes' }
      })
      feedCount  = new FeedItem({ uid: "primaryValues", type: "Measure",   values: ["Count"] })
      feedLabels = new FeedItem({ uid: "axisLabels",    type: "Dimension", values: ["Year"] })
      chart = new VizFrame({
        height: "700px",
        width: "100%",
        uiConfig: {
          applicationSet: "fiori"
        }
      })
      chart.setDataset( dataset ).addFeed( feedCount.clone() ).addFeed( feedLabels.clone() )
      @byId("chartContainer").addContent(new ChartContainerContent({
        content: chart
      }))

    buildAreaCharts: ->
      dataset = new FlattenedDataset({
        dimensions: [{
          name: "Year"
          value: "{year}"
        },{
          name: "District",
          value: "{district}"
        }],
        measures: [{
          name: "Count"
          value: "count"
        }],
        data: { path: '/crimes' }
      })
      vizopts = {
        height: "700px",
        width: "100%",
        uiConfig: {
          applicationSet: "fiori"
        }
      }
      feedCount  = new FeedItem({ uid: "primaryValues", type: "Measure",   values: ["Count"] })
      feedLabels = new FeedItem({ uid: "axisLabels",    type: "Dimension", values: ["Year","District"] })
      container = @byId "chartContainer"
      charts = [
        new VizFrame(vizopts).setDataset( dataset.clone() ).addFeed( feedCount.clone() ).addFeed( feedLabels.clone() )
        new VizFrame(vizopts).setDataset( dataset.clone() ).addFeed( feedCount.clone() ).addFeed( feedLabels.clone() )
        new VizFrame(vizopts).setDataset( dataset.clone() ).addFeed( feedCount.clone() ).addFeed( feedLabels.clone() )
      ].map( (chart) -> new ChartContainerContent({ content: chart }) ).forEach( (content) ->
        container.addContent( content )
      )

    buildTypeCharts: ->
      dataset = new FlattenedDataset({
        dimensions: [{
          name: "Year"
          value: "{year}"
        },{
          name: "Type",
          value: "{primary_type}"
        }],
        measures: [{
          name: "Count"
          value: "count"
        }],
        data: { path: '/crimes' }
      })
      vizopts = {
        height: "700px",
        width: "100%",
        uiConfig: {
          applicationSet: "fiori"
        }
      }
      feedCount  = new FeedItem({ uid: "primaryValues", type: "Measure",   values: ["Count"] })
      feedLabels = new FeedItem({ uid: "axisLabels",    type: "Dimension", values: ["Year","Type"] })
      container = @byId "chartContainer"
      charts = [
        new VizFrame(vizopts).setDataset( dataset.clone() ).addFeed( feedCount.clone() ).addFeed( feedLabels.clone() )
        new VizFrame(vizopts).setDataset( dataset.clone() ).addFeed( feedCount.clone() ).addFeed( feedLabels.clone() )
        new VizFrame(vizopts).setDataset( dataset.clone() ).addFeed( feedCount.clone() ).addFeed( feedLabels.clone() )
      ].map( (chart) -> new ChartContainerContent({ content: chart }) ).forEach( (content) ->
        container.addContent( content )
      )

    constraintsChange: ->
      filters = @buildFilters()
      container = @byId "chartContainer"

    buildFilters: ->
      filters = []
      # Range (month, year)
      range = @byId "range"
      start = range.getDateValue()
      if start
        end = new Date( range.getSecondDateValue() or start )
        end.setMonth( end.getMonth() + 1 )
        filters.push( new Filter( "date", "BT", start, end ) )

      # Domestic (all,domestic,nondomestic)
      domestic = @byId( "domestic" ).getSelectedKey();
      filters.push( new Filter( "domestic", "EQ", true ) ) if domestic == "domestic"
      filters.push( new Filter( "domestic", "EQ", false ) ) if domestic == "nondomestic"

      filters
