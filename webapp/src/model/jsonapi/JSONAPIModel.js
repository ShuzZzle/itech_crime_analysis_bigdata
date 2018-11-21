sap.ui.define([
  "sap/ui/model/Model",
  "./JSONAPIContextBinding",
  "./JSONAPIListBinding",
  "./JSONAPIPropertyBinding",
  "./JSONAPIURLBuilder",
], function( Model, ContextBinding, ListBinding, PropertyBinding, URLBuilder )
{
  function nextId()
  {
    return Date.now().toString(16).padStart(16,'0')
         + (nextId.counter++&0xFFFFFFFF).toString(16).padStart(8,'0')
         + (Math.random()*0xFFFF&0xFFFF).toString(16).padStart(4,'0')
         + (Math.random()*0xFFFF&0xFFFF).toString(16).padStart(4,'0');
  }
  nextId.counter = 0;

  var JSONAPIModel = Model.extend("§ns§.model.jsonapi.JSONAPIModel", {

    constructor: function( settings, schema ) {
      Model.apply( this, arguments );
      this.settings = typeof settings === 'string' ? { url: settings, schema: schema || {}, schemaPath: "/schema/" } : settings;
      this.pending = {};
    },

    bindList: function( path, context, sorters, filters, params ) {
      return new ListBinding( this, path, context, sorters, filters, params );
    },

    bindProperty: function( path, context, params ) {
      return new PropertyBinding( this, path, context, params );
    },

    bindContext: function( path, context, params ) {
      return new ContextBinding( this, path, context, params );
    },


    readList: function( path, context, top, skip, sorters, filters, expands, selects ) {
      var url = this.buildRequestUrl( path, context, top, skip, sorters, filters, expands, selects );
      return $.ajax({ method: 'GET', url: url, headers: { 'Content-Type': 'application/vnd.api+json' } }).then( this.processList.bind( this ) );
    },

    readOne: function( path, context, expands, selects ) {
      var url = this.buildRequestUrl( path, context, null, null, null, null, expands, selects );
      return $.ajax({ method: 'GET', url: url, headers: { 'Content-Type': 'application/vnd.api+json' } }).then( this.processElement.bind( this ) );
    },

    createOne: function( path, context, data ) {
      var url = this.buildRequestUrl( path, context );
      return $.ajax({ method: 'POST', url: url, headers: { 'Content-Type': 'application/vnd.api+json' }, data: this.prepareCreate( path, context, data ) }).then( this.processElement.bind( this ) );
    },

    deleteOne: function( path, context ) {
      var url = this.buildRequestUrl( path, context );
      return $.ajax({ method: 'DELETE', url: url, headers: { 'Content-Type': 'application/vnd.api+json' } }).then( () => this.setProperty( path, undefined, context ) );
    },
    updateOne: function( path, context, data ) {
      var url = this.buildRequestUrl( path, context );
      return $.ajax({ method: 'PATCH', url: url, headers: { 'Content-Type': 'application/vnd.api+json' }, data: this.prepareUpdate( path, context, data ) }).then( this.processElement.bind( this ) );
    },

    prepareCreate: function( path, context, data ) {
      var copy = $.extend({}, data);
      Object.keys( copy ).filter( key => key.indexOf('__') === 0 ).forEach( key => delete copy[ key ] );
      delete copy.id;
      return JSON.stringify({
        data: copy
      });
    },

    prepareUpdate: function( path, context, data ) {
      var copy = $.extend({}, data );
      Object.keys( copy ).filter( key => key.indexOf('__') === 0 ).forEach( key => delete copy[ key ] );
      if ( data.relationships ) {
        var newRels = {};
        Object.keys( data.relationships ).forEach( key => {
          newRels[ key ] = { data: data.relationships[ key ] };
        })
        copy.relationships = newRels;
      };
      delete copy.res;
      return JSON.stringify({
        data: copy
      });
    },



    relsToLinks: function( rels ) {
      return Object.keys( rels ).map( key => ({ [key]: { id: rels[ key ].id, type: rels[ key ].type } }) ).reduce( (map,one) => $.extend( map, one ), {});
    },

    getProperty: function( path, context ) {
      return this.getCurrentProperty( path, context );
    },

    setProperty: function( path, value, context ) {
      return this.setCurrentProperty( path, value, context );
    },

    createBindingContext: function( path, context, params, callback, reload ) {
      if ( !callback ) callback = () => null;
      var base = this.resolve( path, context );
      if ( !base ) {
        callback( null );
        return null;
      }
      var canonical = this.resolve( path, context, true );
      if ( !reload ) {
        var cxt = this.getContext( canonical );
        callback( cxt );
        return cxt;
      } else {
        this.getList( path, context ).then( data => {
          var path = this.getPathForType( data.type, data.id );
          var cxt = this.getContext( path );
          callback( cxt );
        })
      }
    },

    migrateBindings: function( path, context, data ) {
      var base = this.resolve( path, context );
      this.aBindings.forEach( binding => {
        if ( path === binding.sPath && !binding.oContext ) {
          binding.sPath = this.getPathForType( data.type, data.id );
          binding.refresh();
        } else if ( context && binding.oContext && context.sPath === binding.oContext.sPath ) {
          binding.oContext.sPath = this.getPathForType( data.type, data.id );
          binding.refresh();
        }
      })
    },

    checkUpdate: function( path, context ) {
      var base = this.resolve( path, context );
      this.aBindings.forEach( binding => { try {
        if ( this.resolve( binding.sPath, binding.oContext ).indexOf( base ) === 0 )
          binding.refresh();
        } catch (e) {}
      });
    },

    processList: function( data ) {
      // var meta  = data.meta;
      var array = data.results.map( this.processElement.bind( this ) );
      // array.meta = meta;
      return array;
    },

    processElement: function( data, id )
    {
      /*if ( data.data ) data = data.data;
      var id   = data.id;
      var type = data.type;
      var meta = data.meta;
      var atts = data.attributes;*/
      var type = 'crimes';
      var atts = data;
      /*var rels = Object.keys( data.relationships ).map( key => ({ key: key, value: this.processList( data.relationships[ key ] ) }) ).reduce( (rels,entry) => {
        rels[ entry.key ] = entry.value;
        return rels;
      }, {});*/
      var result = {
        ...data,
        //relationships: rels,
        id: id,
        type: type,
        //meta: meta,
        res: data
      };
      this.storeElement( type, id, result );
      return result;
    },

    storeElement: function( type, id, result ) {
      var path = this.getPathForType( type, id );
      if ( this.getOriginalProperty( this.getPathForType( type ) ) === undefined )
        this.setOriginalProperty( this.getPathForType( type ), { __list: true } );
      this.setOriginalProperty( path, result );
    },

    storeList: function( type, results ) {
      if ( this.getOriginalProperty( this.getPathForType( type ) ) === undefined )
        this.setOriginalProperty( this.getPathForType( type ), { __list: true } );
      Object.keys( results ).forEach( id => {
        this.storeElement( type, id, results[ id ] );
      });
    },

    buildRequestUrl: function( path, context, top, skip, sorters, filters, expands, selects ) {
      return (new URLBuilder( this, this.resolve( path, context ) ))
        .top( top ).skip( skip ).sort( sorters ).filter( filters )
        .include( expands ).select( selects ).toString();
    },

    createNewId: function( type ) {
      var id = ':new:' + nextId();
      var path = this.getPathForType( type, id );
      this.setCurrentProperty( path, { id: id, __new: true, type: type, attributes: {}, relationships: {} } );
      return id;
    },

    getRequestUrl: function( path ) {
      return this.getBaseUrl() + path;
    },

    getPathForType: function( type, id ) {
      return '/' + type + ( id ? '/' + id : '' );
    },

    getCurrentProperty: function( path, context ) {
      try {
        var pending = this.resolve( path, context ).substr( 1 ).split( '/' ).reduce( (obj, key) => obj[ key ], this.pending );
        return pending === undefined || pending === null ? this.getOriginalProperty( path, context ) : pending;
      } catch ( e ) {
        return this.getOriginalProperty( path, context );
      }
    },

    getOriginalProperty: function( path, context ) {
      try {
        return this.resolve( path, context ).substr( 1 ).split( '/' ).reduce( (obj, key) => obj[ key ], this.oData );
      } catch ( e ) {
        return undefined;
      }
    },

    setOriginalProperty: function( path, data, context, suppressUpdate ) {
      var base   = this.resolve( path, context );
      var parts  = base.substr( 1 ).split( '/' );
      var last   = parts.pop();
      var parent = parts.reduce( (obj,key) => obj[0][ key ] === undefined ? obj[0][ key ] = $.extend(true,{},obj[1][ key ]) : obj[0][ key ], [ this.oData, this.pending ] );
      parent[ last ] = data;
      this.resetProperty( path, context, true );
      if( !suppressUpdate )
        this.checkUpdate( path, context );
    },

    setCurrentProperty: function( path, data, context, suppressUpdate ) {
      var base   = this.resolve( path, context );
      var parts  = base.substr( 1 ).split( '/' );
      var last   = parts.pop();
      var parent = parts.reduce( (obj,key) => obj[ key ] === undefined ? obj[ key ] = {} : obj[ key ], this.pending );
      parent[ last ] = data;
      if( !suppressUpdate )
        this.checkUpdate( path, context );
    },

    resetProperty: function( path, context, suppressUpdate ) {
      var base   = this.resolve( path, context );
      var parts  = base.substr( 1 ).split( '/' );
      var last   = parts.pop();
      try {
        var parent = parts.reduce( (obj, key) => obj[ key ], this.pending );
        delete parent[ last ]
      } catch ( e ) {}
      if( !suppressUpdate )
        this.checkUpdate( path, context );
    },

    getBaseUrl: function() {
      return (this.settings.url || '.').replace(/\/$/, "");
    },

    saveChanges: function( path, context ) {
      var base = this.resolve( path, context ) || '/';
      var toSave = $.extend( {}, this.getCurrentProperty( base ) );
      if ( !toSave.id ) toSave = $.extend( {}, this.getOriginalProperty( base ), toSave );
      if ( toSave.id === undefined )
        return Promise.all( Object.keys( toSave )
          .filter( key => key.indexOf('__') !== 0 )
          .map( key => this.saveChanges( base + '/' + key, toSave[ key ] ) ) );
      else if ( toSave.__new ) {
        var parent = path.substr(0,path.length - toSave.id.length - 1);
        delete (parent.substr(1).split('/').reduce( (root, key) => root[ key ], this.pending ))[toSave.id];
        return this.createOne( path.substr(0,path.length - toSave.id.length - 1), context, toSave ).then( data => {
          this.migrateBindings( path, context, data );
        });
      } else {
        return this.updateOne( path, context, toSave ).then( data => {
          this.migrateBindings( path, context, data );
        });
      }
    },

    cancelChanges: function( path, context ) {
      this.resetProperty( path, context );
    }

  });

  return JSONAPIModel;
});
