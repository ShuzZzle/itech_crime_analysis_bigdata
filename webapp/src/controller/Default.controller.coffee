sap.ui.define [
  '§nx§/controller/ControllerBase'
  'sap/viz/ui5/data/FlattenedDataset'
  'sap/viz/ui5/controls/common/feeds/FeedItem'
  'sap/ui/model/Filter'
  'sap/viz/ui5/controls/common/feeds/AnalysisObject'
  'sap/viz/ui5/controls/VizFrame'
  'sap/suite/ui/commons/ChartContainerContent'
  'sap/ui/model/json/JSONModel'
  'sap/viz/ui5/controls/Popover'
], (ControllerBase, FlattenedDataset, FeedItem, Filter, AnalysisObject, VizFrame, ChartContainerContent, JSONModel, Popover) ->
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
      model = new JSONModel({ crimes: [] });
      $.ajax({ method: 'GET', url: '/api/crimes/?group=year', headers: { 'Content-Type': 'application/json' } }).then( (data) ->
        model.setData({ crimes: data });
      );
      dataset = new FlattenedDataset({
        dimensions: [{
          name: "Year"
          value: "{year}"
        }],
        measures: [{
          name: "Count"
          value: "{count}"
        }],
        data: { path: '/crimes' }
      })
      dataset.setModel( model );
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
      @afterChartRender()


    buildAreaCharts: ->
      model = new JSONModel({ crimes: [] });
      $.ajax({ method: 'GET', url: '/api/crimes/?group=year,district', headers: { 'Content-Type': 'application/json' } }).then( (data) ->
        model.setData({ crimes: data });
      );
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
          value: "{count}"
        }],
        data: { path: '/crimes' }
      })
      dataset.setModel( model );
      vizopts = {
        height: "700px",
        width: "100%",
        uiConfig: {
          applicationSet: "fiori"
        }
      }
      container = @byId "chartContainer"
      charts = [
        @setFeeds(new VizFrame(vizopts),[
          ['primaryValues', 'Count', true]
          ['color',         'District']
          ['axisLabels',    'Year']
        ]).setDataset( dataset.clone() ).setVizType('line')
        @setFeeds(new VizFrame(vizopts),[
          ['color',         'Count', true]
          ['categoryAxis',  'Year']
          ['categoryAxis2', 'District']
        ]).setDataset( dataset.clone() ).setVizType('heatmap')
        @setFeeds(new VizFrame(vizopts),[
          ['primaryValues', 'Count', true]
          ['color',         'Year']
          ['axisLabels',    'District']
        ]).setDataset( dataset.clone() ).setVizType('stacked_bar')
      ].map( (chart) -> new ChartContainerContent({ content: chart, icon: "sap-icon://"+chart.getVizType().replace('_','-')+'-chart' }) ).forEach( (content) ->
        container.addContent( content )
      )
      @afterChartRender()

    buildTypeCharts: ->
      model = new JSONModel({ crimes: [] });
      $.ajax({ method: 'GET', url: '/api/crimes/?group=year,primary_type', headers: { 'Content-Type': 'application/json' } }).then( (data) ->
        model.setData({ crimes: data });
      );
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
          value: "{count}"
        }],
        data: { path: '/crimes' }
      })
      dataset.setModel( model );
      vizopts = {
        height: "700px",
        width: "100%",
        uiConfig: {
          applicationSet: "fiori"
        },

      }
      container = @byId "chartContainer"
      charts = [
        @setFeeds(new VizFrame(vizopts),[
          ['primaryValues', 'Count', true]
          ['color',         'Type']
          ['axisLabels',    'Year']
        ]).setDataset( dataset.clone() ).setVizType('line')
        @setFeeds(new VizFrame(vizopts),[
          ['color',         'Count', true]
          ['categoryAxis',  'Year']
          ['categoryAxis2', 'Type']
        ]).setDataset( dataset.clone() ).setVizType('heatmap')
        @setFeeds(new VizFrame(vizopts),[
          ['primaryValues', 'Count', true]
          ['color',         'Year']
          ['axisLabels',    'Type']
        ]).setDataset( dataset.clone() ).setVizType('stacked_bar')
      ].map( (chart) -> new ChartContainerContent({ content: chart, icon: "sap-icon://"+chart.getVizType().replace('_','-')+'-chart' }) ).forEach( (content) ->
        container.addContent( content )
      )
      @afterChartRender()

    setFeeds: (chart, feeds) ->
      feeds.forEach((feed)->
        chart.addFeed( new FeedItem({ uid: feed[0], values: [feed[1]], type: if feed[2] then 'Measure' else 'Dimension' }));
      )
      chart

    constraintsChange: ->
      filters = @buildFilters()
      container = @byId "chartContainer"

    contentChange: (evt) ->
      id = evt.getParameter "selectedItemId"
      @byId("vizPopover").connect( sap.ui.getCore().byId( id ).getVizUid() );

    afterChartRender: ->
      popover = @byId("vizPopover")
      container = @byId("chartContainer");
      setTimeout(->
        popover.connect( container.getContent()[0].getContent().getVizUid() );
      ,0)

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
