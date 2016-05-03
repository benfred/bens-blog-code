var preloadedData = preloadedData || {};
var minAutocompleteUsers = minAutocompleteUsers || 10;

var AUTOCOMPLETE_HOST = 'http://musicautocomplete.benfrederickson.com.s3-website-us-east-1.amazonaws.com/';

// initialize typeahead logic
var artists = new Bloodhound({
    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.value); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    limit: 5,
    prefetch : {
        url : '/images/distancemetrics/top10k.json',
    },
    remote: { 
        url : AUTOCOMPLETE_HOST,
        replace : function (url, query) { 
            return url + query.toLowerCase() + ".json";
        }
    },
    dupDetector : function(a, b) {
        return a.value == b.value;
    }
});
artists.initialize();

function bindArtistTypeahead(selector, callback) {
    $(selector + ' .typeahead').on('typeahead:autocompleted', function(object, datum) {
        callback(datum.value);
    });

    $(selector + ' .typeahead').on('typeahead:selected', function(object, datum) {
        callback(datum.value);
    });

    $(selector + ' .typeahead').typeahead(
    {
        autoselect : true,
    },
    {                                
        name: 'artists',
        displayKey: 'value',
//        source: artists.ttAdapter(),
        source: function(query, cb) {
            artists.get(query, function(suggestions) {
                cb(suggestions.filter(function(x) {return x.users > minAutocompleteUsers;}));
            });
        },
        autoselect: true,
    });
}
