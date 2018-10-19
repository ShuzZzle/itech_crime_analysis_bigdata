sap.ui.define [

], () ->
  UrlParsing = ( rules ) ->
    @rules = rules || [
      { # Empty String -> Undefined
        parseRule: (str) -> str == ""
        parser: -> undefined
        serializeRule: (o) -> !o?
        serializer: -> ""
      }
      { # Dates to Iso String
        parseRule: /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])[T ]?(?:(2[0-3]|[01][0-9]):([0-5][0-9])(?::([0-5][0-9]))?(.[0-9]+)?)?(Z)?$/
        parser: (str) -> new Date(str)
        serializeRule: (o) -> o and o instanceof Date
        serializer: (date) -> date.toISOString()
      }
      { # :key=value objects
        parseRule: /^(:[a-zA-Z0-9]+=[^:]*)+$/
        parser: (str) ->
          obj = {}
          that = this
          parts = str.split( ':' )
          parts.shift()
          parts.forEach (part) ->
            split = part.split '='
            key = split.shift()
            val = split.join('=');
            obj[ key ] = that.parse( val )
          obj
        serializeRule: (o) -> o and Object.every o, (val, key) -> /^[A-Za-z0-9]+$/.test( key ) and typeof val == 'string' and /^[^:]*$/.test( val )
        serializer: (obj) ->
          Object.values( Object.map( obj, (val, key) -> ':' + key + '=' + val ) ).join ''
      }
    ]
    @

  $.extend UrlParsing.prototype,
    parse: (arg) ->
      that = @
      result = try
          JSON.parse( decodeURIComponent arg )
        catch error
          decodeURIComponent arg
      @rules.find (pair) ->
        rule  = pair.parseRule
        parse = pair.parser
        if rule and ( rule.test and rule.test arg ) or ( rule.call and rule.call that, arg )
          result = parse.call that, arg
      result

    serialize: (obj) ->
      result = if typeof obj == "string" then obj else JSON.stringify obj
      result ?= ""
      that = @
      @rules.find (pair) ->
        rule      = pair.serializeRule
        serialize = pair.serializer
        if rule and rule.call and rule.call that, obj
          result = serialize.call that, obj
      @hashEscape result

    hashEscape: (str) ->
      str.replace( /[\/\?\&\%\!\\]/g, (x) -> encodeURIComponent x )

  UrlParsing
, true
