var preloadedData = preloadedData || {};

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
        source: artists.ttAdapter(),
        autoselect: true,
    });
}
