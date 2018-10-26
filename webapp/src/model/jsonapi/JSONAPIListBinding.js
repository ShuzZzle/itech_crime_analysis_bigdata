sap.ui.define([
  'sap/ui/model/Context',
  'sap/ui/model/FilterType',
  'sap/ui/model/ListBinding',
  'sap/ui/model/ChangeReason',
  'sap/ui/model/Filter',
  'sap/ui/model/FilterProcessor',
  'sap/ui/model/Sorter',
  'sap/ui/model/SorterProcessor',
  "sap/ui/thirdparty/jquery"
], function( Context, FilterType, ListBinding, ChangeReason, Filter, FilterProcessor, Sorter, SorterProcessor, $ )
{
  function delay( ms ) { return function( result ) { return new Promise( resolve => { setTimeout( resolve.bind( this, result ), ms ); }); }};
  var JSONAPIListBinding = ListBinding.extend("§ns§.model.jsonapi.JSONAPIListBinding",
  {
    constructor: function( model, path, context, sorters, filters, params ) {
      ListBinding.apply( this, arguments );
      this.settings = {
        model:   model,
        path:    path,
        context: context,
        sorters: sorters,
        filters: filters,
        params:  params
      };
      this.loaded   = false;
      this.loading  = false;
      this.contexts = [];
      this.fetch();
    },

    filter: function( filters ) {
      this.settings.filters = filters;
      this.fetch( true );
    },

    refresh: function( force ) {
      this.fetch( true );
      return ListBinding.prototype.refresh.apply( this, arguments );
    },

    sort: function( sorters ) {
      this.settings.sorters = Array.from( arguments );
      this.fetch( true );
    },

    getContexts: function() {
      return this.contexts;
    },

    calculateTop: function() {
      return undefined;
    },

    calculateSkip: function() {
      return undefined;
    },

    fetch: function( force ) {
      if ( force || !this.loaded && !this.loading ) {
        this.suspend();
        this.loading = true;
        this.settings.model.readList(
          this.settings.path,
          this.settings.context,
          this.calculateTop(),
          this.calculateSkip(),
          this.settings.sorters,
          this.settings.filters,
          this.settings.expands,
          this.settings.selects
        ).then( this.fetchComplete.bind( this ) );
      }
    },

    fetchComplete: function( data )
    {
      this.loaded = true;
      this.contexts = data.map( this.createContext.bind( this ) );
      this.resume();
    },

    createContext: function( entry )
    {
      return this.settings.model.getContext( '/' + entry.type + '/' + entry.id );
    },

  });
  return JSONAPIListBinding;
});
