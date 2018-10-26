sap.ui.define([
  "sap/ui/model/ContextBinding"
], function( ContextBinding )
{
  var JSONAPIContextBinding = ContextBinding.extend("§ns§.model.jsonapi.JSONAPIContextBinding",
  {
    constructor: function( model, path, context, params, events ) {
      ContextBinding.apply( this, arguments );
      this.initial = true;
    },


    initialize: function() {
      if ( !this.initial ) return;
      this.initial = false;

      var base = this.oModel.resolve( this.sPath, this.oContext );
      if ( !base ) {
        this.oElementContext = null;
        return;
      }

      var cxt = this.oModel.createBindingContext( this.sPath, this.oContext, this.mParameters, context => {
        if ( context && this.oElementContext && this.oElementContext.isPreliminary() ) {
          this.oElementContext.setPreliminary( false );
          this.oModel._updateContext( this.oElementContext, context.getPath() );
          this._fireChange({ reason: "Context" }, false, true );
        } else if ( !context || context !== this.oElementContext ) {
          this.oElementContext = context;
          this._fireChange({ reason: "Context" }, true );
        }
      });

      if ( cxt ) {
        if ( this.oElementContext !== cxt ) {
          cxt.setPreliminary( true );
          this.oElementContext = cxt;
        }
      }

    }




  });

  return JSONAPIContextBinding;
})
