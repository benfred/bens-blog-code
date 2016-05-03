var API_HOST = 'http://matrixfactorization.benfrederickson.com.s3-website-us-east-1.amazonaws.com/';

var cosineList = new similarArtistList(".cosinelist",
                                       "Arcade Fire",
                                       "lsi",
                                       true);

$('.cosinelist .cosine').on('click', function() {
    $(".cosine-method").text("Cosine")
    cosineList.setMetric('cosine');
});

$('.cosinelist .tfidf').on('click', function() {
    $(".cosine-method").text("TFIDF")
    cosineList.setMetric('tfidf');
});

$('.cosinelist .smoothed_cosine').on('click', function() {
    $(".cosine-method").text("Smoothed Cosine")
    cosineList.setMetric('smoothed_cosine');
});
$('.cosinelist .bm25').on('click', function() {
    $(".cosine-method").text("BM25")
    cosineList.setMetric('bm25');
});

$('.cosinelist .lsi').on('click', function() {
    $(".cosine-method").text("LSA")
    cosineList.setMetric('lsi');
});
$('.cosinelist .implicitals').on('click', function() {
    $(".cosine-method").text("Implicit ALS")
    cosineList.setMetric('implicitals');
});


$('.twitter-typeahead').attr("style", "position: relative");

var slopegraph = ArtistSlopeGraph("lsi", "implicitals", "Bob Dylan",
                                  ["lsi", "implicitals",  "divider",
                                    'overlap', 'jaccard', 'ochiai', 'cosine',
                                  'smoothed_cosine', 'tfidf', 'bm25']);

$('.twitter-typeahead').attr("style", "position: relative");

