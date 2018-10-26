sap.ui.define([
  'sap/ui/model/Context',
  'sap/ui/model/ChangeReason',
  'sap/ui/model/PropertyBinding'
], function( Context, ChangeReason, PropertyBinding )
{
  var JSONAPIPropertyBinding = PropertyBinding.extend("§ns§.model.jsonapi.JSONAPIPropertyBinding",
  {
    constructor: function( model, path, context, params ) {
      PropertyBinding.apply( this, arguments );
      this.initial = true;
      this.value = this._getValue();
      this.attachChange( () => this.value = this._getValue() );
    },

    getValue: function() {
      return this.value;
    },

    _getValue: function() {
      return this.oModel.getProperty( this.sPath , this.oContext );
    },

    setValue: function( val ) {
      this.oModel.setProperty( this.sPath, val, this.oContext );
      this.refresh();
    },

    refresh: function() {
      this.value = this._getValue();
      var res = PropertyBinding.prototype.refresh.apply( this, arguments );
      this.resume();
      return res;
    }
  });
  return JSONAPIPropertyBinding;
});
