/**
 * UI5LoaderOptions
 * @typedef                   {Object} UI5LoaderOptions
 * @property                  {String} url The url of the sap ui core libraries
 * @property                {String[]} libs The libraries to preload
 * @property                  {String} theme The theme to load
 * @property                  {String} preload The mode of loading the script (Can be "async" or "sync")
 * @property                  {String} compatVersion Does Something I don't know, defaults to 'edge'
 * @property                  {String} bindingSyntax How Binding Syntax should be interpreted.
 * @property {Object.<string, string>} resourceRoots The resource location mappings
 * @property              {UI5Spinner} spinner The spinner to show while page is loading
 */

/**
 * UI5Spinner
 * @typedef                   {Object} UI5Spinner
 * @property                {function} start The function that starts / generates the spinner
 * @property                {function} stop  The function that ends / destroys the spinner
 * @property                  {string} state the state to wait for to hide the spinner. can be jquery, ui5, components or app
 */

(function( global ){
  "use strict";
  var DefaultSpinner = function( options )
  {
    this.options = options || {};
    this.options.dots  || (this.options.dots = 10);
    this.options.state || (this.options.state = "app");
    this.options.bg    || (this.options.bg = "rgb(236,240,241)");
    this.options.fg    || (this.options.fg = "#222");

    this.state = this.options.state;


  };

  DefaultSpinner.prototype.generateCss = function()
  {
    var dots  = this.options.dots;
    var bg    = this.options.bg;
    var fg    = this.options.fg;

    var css = ".mrdDefaultSpinner{position:fixed;left:0;top:0;bottom:0;right:0;background-color:"+bg+";z-index:10000;}.mrdDefaultSpinner>div{width:100px;height:100px;position:absolute;left:50%;top:50%;transform: translateX(-50%) translateY(-50%);animation: mrdRotatePreloader 2s infinite ease-in;}@keyframes mrdRotatePreloader {0%   { transform: translateX(-50%) translateY(-50%) rotateZ(0deg); }100% { transform: translateX(-50%) translateY(-50%) rotateZ(-360deg); }}.mrdDefaultSpinner>div>div{position:absolute;width: 100%; height: 100%;opacity: 0;}.mrdDefaultSpinner>div>div:before{content:\"\";position:absolute;left:50%;top:0;width: 10%; height: 10%;background-color:"+fg+";transform: translateX(-50%);border-radius: 50%;}";
    for ( var i = 0; i < dots; ++i )
      css += '.mrdDefaultSpinner>div>div:nth-child('+i+'){transform: rotateZ('+((360/dots)*i)+'deg);animation: mrdRotateCircle'+i+' 2s infinite linear;z-index: '+ (dots - i) +';}@keyframes mrdRotateCircle'+i+'{'+(50/dots)*i+'%{ opacity: 0; }'+(50/dots)*i+0.0001+'%{ opacity: 1; transform: rotateZ('+( 0 - (360/dots)*(i) )+
      'deg); }'+(50/dots)*i+2+'%{ transform: rotateZ('+( 0 - (360/dots)*i )+'deg); }'+52+(50/dots)*i+'%{ transform: rotateZ('+( 0 - (360/dots)*i )+'deg); }100%{ opacity: 1; transform: rotateZ('+( 0 - (360/dots) * (dots-1) )+'deg); }}';
    return css;
  };

  DefaultSpinner.prototype.start = function()
  {
    if ( this.ref )
    {
      $( this.ref ).fadeIn();
      return;
    }
    var mkDiv = function(){ return document.createElement( 'div' ); };
    var div = this.ref = mkDiv();
    var style = this.style = document.createElement( 'style' );
    style.innerHTML = this.generateCss();
    var loader = mkDiv();
    var dots = this.options.dots;
    for ( var i = 0; i < dots; ++i )
      loader.appendChild( mkDiv() );
    div.appendChild( loader );
    div.classList.add( 'mrdDefaultSpinner' );
    document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );
    if ( !document.body )
    {
      document.addEventListener( 'DOMContentLoaded', function () {
        document.body.appendChild( div );
      });
    }
    else
      document.body.appendChild( div );
  };

  DefaultSpinner.prototype.stop = function() {
    var ref = this.ref;
    setTimeout( function() {
      $( ref ).fadeOut();
    }, 500 );
  };

  DefaultSpinner.prototype.toggle = function( value ){
    $( this.ref ).fadeToggle( value );
  };

  DefaultSpinner.prototype.destroy = function()
  {
    $( this.ref ).remove();
    delete this.ref;
  };

  var NullSpinner = function()
  {};

  NullSpinner.prototype.start = function(){};
  NullSpinner.prototype.stop = function(){};

  /**
   * Loader for UI5 libraries+
   * @param {UI5LoaderOptions} options The settings for the UI5 instance
   * @constructor
   * @public
   * @alias UI5Loader
   */
  function UI5Loader( options )
  {
    this.options = options || {};
    this._listeners = {};
    this.populateOptions();
  }

  /**
   * Register event handlers for given events
   * @param  {Object.<string,function>|string} eventMap   The map of eventId event handler pairs or an eventId if a handler is provided
   * @param                         {function} [handler]  An Event Handler if eventMap is an eventId
   * @chainable
   */
  UI5Loader.prototype.on = function( eventMap, handler )
  {
    if ( handler )
    {
      var map = {};
      map[ eventMap ] = handler;
      return this.on( map );
    }
    for ( var event in eventMap )
      if ( !this._listeners[ event ] )
        this._listeners[ event ] = [ eventMap[ event ] ];
      else
        this._listeners[ event ].push( eventMap[ event ] );
    return this;
  };

  /**
   * Fires all event handlers for a given event.
   * @param {string} eventName  The name of the event
   * @param    {any} parameters The parameters to call the event handlers with
   * @chainable
   */
  UI5Loader.prototype.fire = function( eventName, parameters )
  {
    this._listeners[ eventName ] && this._listeners[ eventName ].forEach( (function( listener ) {
      listener.call( this, parameters );
    }).bind(this));
    return this;
  };

  /**
   * Populate not provided options
   * @private
   */
  UI5Loader.prototype.populateOptions = function()
  {
    var options = this.options;
    options.url           = options.url           || "https://openui5.hana.ondemand.com/resources/sap-ui-core.js";
    options.libs          = options.libs          || [ "sap.m" ];
    options.theme         = options.theme         || "sap_belize";
    options.preload       = options.preload       || "async";
    options.compatVersion = options.compatVersion || "edge";
    options.bindingSyntax = options.bindingSyntax || "complex";
    options.resourceRoots = options.resourceRoots || {};
    options.spinner       = options.spinner       || new DefaultSpinner();
    this.spinner          = options.spinner;
  };

  /**
   * Inserts the Script tag into the HTML document
   * @return {Promise} Resolves when the script is loaded, throws on error.
   */
  UI5Loader.prototype.load = function()
  {
    return new Promise( this.constructScriptTag.bind( this ) );
  };

  /**
   * Inserts the Script tag into the HTML document
   * @return {Promise} Resolves when the script is loaded and jQuery document ready event is fired.
   */
  UI5Loader.prototype.loadJQuery = function()
  {
    var loader = this;
    return this.load().then(function(){ return new Promise(function( resolve, reject ) {
      $(function(){ loader.fire( 'jQueryLoad', $ ); if ( loader.options.spinner.state === 'jquery' ) loader.options.spinner.stop(); resolve( $ ); });
    });});
  };

  /**
   * Inserts the Script tag into the HTML document
   * @return {Promise} Resolves when teh script is loaded and sap ui code init event is fired.
   */
  UI5Loader.prototype.loadUI5 = function()
  {
    var loader = this;
    return this.loadJQuery().then(function(){ return new Promise(function( resolve, reject ) {
      sap.ui.getCore().attachInit(function(){ loader.fire( 'ui5Load', $ ); if ( loader.options.spinner.state === 'ui5' ) loader.options.spinner.stop(); resolve( sap.ui.getCore() ); });
    });});
  };

  /**
   * Loads UI5 and the provided UI5 Components
   * @param {...String} args The components to load
   * @return {Promise} Resolves to an array of the loaded components.
   */
  UI5Loader.prototype.loadComponents = function()
  {
    var components = Array.from( arguments );
    var loader = this;
    return this.loadUI5().then(function(){ return new Promise(function( resolve, reject ) {
      sap.ui.define.call( sap.ui, components, function() {
        loader.fire( 'componentLoad', components, arguments );
        resolve( arguments );
        if ( loader.options.spinner.state === 'components' ) loader.options.spinner.stop();
      });
    });});
  };

  UI5Loader.prototype.loadApp = function( componentNS, shellOpts )
  {
    shellOpts = shellOpts || {};
    return this.loadComponents( 'sap/m/Shell', 'sap/ui/core/ComponentContainer' ).then( function( args ){
      var Shell = args[ 0 ];
      var ComponentContainer = args[ 1 ];
      return new Promise(function( resolve, reject ){
      shellOpts.app = new ComponentContainer({ name: componentNS, async: false, handleValidation: true });
      new Shell( shellOpts ).placeAt( 'content' );
      resolve( shellOpts.app );
      if ( loader.options.spinner.state === 'app' ) {
        var idInterval = setInterval(function(){
          if (shellOpts.app.getComponent())
          {
            clearInterval(idInterval);
            loader.options.spinner.stop();
          }
        },500);
      }
    });});
  };

  /**
   * Construct the Script tag and embed it in the HTML document
   * @param {function} resolve The Promise Resolve function
   * @param {function} reject  The Promise Reject function
   */
  UI5Loader.prototype.constructScriptTag = function( resolve, reject )
  {
    var options = this.options;
    var spinner = options.spinner;

    spinner.start();

    var tag;
    // Make sure script tag is only inserted once.
    if ( tag = document.getElementById( "sap-ui-bootstrap" ) !== null )
    {
      resolve( this );
      return;
    }
    tag = document.createElement( "script" );

    tag.setAttribute(                       "src", options.url                              );
    tag.setAttribute(          "data-sap-ui-libs", options.libs.join( ',' )                 );
    tag.setAttribute(         "data-sap-ui-theme", options.theme                            );
    tag.setAttribute(       "data-sap-ui-preload", options.preload                          );
    tag.setAttribute( "data-sap-ui-compatVersion", options.compatVersion                    );
    tag.setAttribute( "data-sap-ui-bindingSyntax", options.bindingSyntax                    );
    tag.setAttribute( "data-sap-ui-resourceRoots", JSON.stringify( options.resourceRoots )  );
    tag.setAttribute(                        "id", "sap-ui-bootstrap"                       );
    tag.setAttribute(                     "async", "1"                                      );

    tag.onload = tag.onreadystatechange = (function( _, error )
    {
      if ( error || !tag.readyState || /loaded|complete/.test( tag.readyState ) )
      {
        tag.onload = tag.onreadystatechange = null;
        tag = undefined;
        this.fire( 'load', tag, error );
        if ( !error ) resolve( this );
        else reject( error );
      }
    }).bind( this );
    this.fire( 'tagInsert', tag );
    document.getElementsByTagName( 'head' )[ 0 ].appendChild( tag );
  };

  UI5Loader.DefaultSpinner = DefaultSpinner;
  UI5Loader.NullSpinner = NullSpinner;

  global.UI5Loader = UI5Loader;
})(new Function("return this")());
