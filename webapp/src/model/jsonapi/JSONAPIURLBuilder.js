sap.ui.define([], function()
{
  function JSONAPIURLBuilder( model, path ) {
    this.path = path;
    this.url = model.getRequestUrl( path );
    this.params = {};
  };

  $.extend( JSONAPIURLBuilder.prototype, {

    top: function( top ) {
      if ( !isNaN( +top ) )
        this.params[ 'page[limit]' ] = +top;
      return this;
    },

    skip: function( skip ) {
      if ( !isNaN( +skip ) )
        this.params[ 'page[offset]' ] = +skip;
      return this;
    },

    filter: function( filters ) {
      if ( filters ) {
        var filterStr = this.filterToQuery( filters );
        if ( filterStr ) this.params.filter = filterStr;
      }
      return this;
    },

    filterToQuery: function( filter ) {
      if ( filter && filter.length ) return filter.map( this.filterToQuery.bind( this ) ).filter( str => str ).join( "" ); // Top level filters have AND inferred
      if ( filter.aFilters !== undefined ) { //Multifilter
        if ( !filter.aFilters ) return undefined; // Empty Filters, No relevance
        var filters = filter.aFilters.map( this.filterToQuery.bind( this ) ).filter( str => str );
        if ( !filters || !filters.length ) return undefined;
        if ( filters.length === 1 ) return filters[ 0 ];
        return filter.bAnd ? '(:and,' + filters.join( ',' ) + ')' : '(:or,' + filters.join(',') + ')';
      } else { // Single Filter
        if ( filter.oValue1 === undefined ) return;
        var val1 = this.filterNormalizeValues( filter.oValue1 );
        var val2 = this.filterNormalizeValues( filter.oValue2 );
        switch( filter.sOperator ) {
          case 'All': case 'Any': return undefined;
          case 'BT':              return `(:and,(${filter.sPath},:gte,${val1}),(${filter.sPath},:lt,${val2}))`;
          case 'Contains':        return val1 ? `(${filter.sPath},:regex,\`${this.filterRegex(filter.oValue1)}\`)` : undefined;
          case 'EndsWith':        return val1 ? `(${filter.sPath},:regex,\`${this.filterRegex(filter.oValue1)}$\`)` : undefined;
          case 'StartsWith':      return val1 ? `(${filter.sPath},:regex,\`^${this.filterRegex(filter.oValue1)}\`)` : undefined;
          case 'EQ':              return `(${filter.sPath},:eq,${val1})`;
          case 'NE':              return `(${filter.sPath},:neq,${val1})`;
          case 'GE':              return `(${filter.sPath},:gte,${val1})`;
          case 'GT':              return `(${filter.sPath},:gt,${val1})`;
          case 'LE':              return `(${filter.sPath},:lte,${val1})`;
          case 'LT':              return `(${filter.sPath},:lt,${val1})`;
        }
      }
    },

    filterNormalizeValues: function( val ) {
      if ( typeof val === 'string' ) return val.replace(/`/g,'\\`');
      return val;
    },

    filterRegex: function( val ) {
      return val.replace( /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|`]/g, "\\$&" );
    },

    sort: function( sorters ) {
      if ( sorters ) {
        var sorterStr = sorters.filter( sorter => !sorter.fnComparator ).map( sorter => sorter.bDescending ? '-' + sorter.sPath : sorter.sPath ).join( ',' ) || null;
        if ( sorterStr ) this.params.sort = sorterStr;
      }
      return this;
    },

    include: function( expands ) {
      if ( expands ) {
        var expandStr = expands.join( ',' );
        if ( expandStr ) this.params.include = expandStr;
      }
      return this;
    },

    select: function( selects ) {
      if ( selects ) {
        selects.forEach( select => {
          this.params[ 'fields[' + select +  ']' ] = true;
        });
      }
      return this;
    },

    toString: function() {
      var paramStr = $.param( this.params );
      if ( paramStr ) paramStr = '?' + paramStr;
      return this.url + paramStr;
    }


  });


  return JSONAPIURLBuilder;
}, true);
