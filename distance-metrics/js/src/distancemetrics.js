var API_HOST = 'http://distancemetrics.benfrederickson.com.s3-website-us-east-1.amazonaws.com/';

var setList = new similarArtistList(".overlaplist",
                                   "Kanye West",
                                    "overlap");

$('.overlaplist .overlap').on('click', function() {
    $(".set-method").text("Overlap")
    setList.setMetric('overlap');
});

$('.overlaplist .jaccard').on('click', function() {
    $(".set-method").text("Jaccard")
    setList.setMetric('jaccard');
});

$('.overlaplist .ochiai').on('click', function() {
    $(".set-method").text("Ochiai")
    setList.setMetric('ochiai');
});

var cosineList = new similarArtistList(".cosinelist",
                                       "Radiohead",
                                       "cosine",
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

$('.twitter-typeahead').attr("style", "position: relative");

// TODO: set metrics/default artist here
var slopegraph = ArtistSlopeGraph();
$('#smoothed_slopegraph').on('click', function() {
    slopegraph.setLeftMetric("cosine");
    slopegraph.setRightMetric("smoothed_cosine");
    slopegraph.setArtist("Radiohead");
    return false;
});

$('#jaccard_slopegraph').on('click', function() {
    slopegraph.setLeftMetric("overlap");
    slopegraph.setRightMetric("jaccard");
    slopegraph.setArtist("Kanye West");
    return true;
});

$('.twitter-typeahead').attr("style", "position: relative");
