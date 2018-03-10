var API_HOST = 'https://s3.amazonaws.com/distancemetrics.benfrederickson.com/';

var tooltip = d3.select("body").append("div")
    .attr("class", "venntooltip");

function getDisplayMetric(metricName) {
    var displayMetrics = {
        'tfidf' : 'TFIDF',
        'smoothed_cosine' : 'Smoothed Cosine',
        'bm25' : 'BM25',
        'lsi' : 'LSA',
        'implicitals' : 'Implicit ALS'
    };
    var displayMetric = displayMetrics[metricName];
    if (displayMetric == null) {
        displayMetric = metricName[0].toUpperCase() + metricName.slice(1);
    }
    return displayMetric
}


function similarArtistList(selector, 
                           initialArtist, 
                           initialMetric) {
    var div = d3.select(selector);
    var list = this;

    var includeAll = false;
    var artistName = initialArtist;
    var metricName = initialMetric;
    var vennDiagram = venn.VennDiagram().fontSize("12px"), sets = null, overlaps = null;

    this.setMetric = function(metric) {
        metricName = metric;
        setArtist(artistName);
    }

    var setArtist = this.setArtist = function(artist, clear) {
        if (clear) {
            $(selector + ' .typeahead').val('');
        }

        var a = artist.toLowerCase();
        var url = API_HOST + a + ".json";

        if (artist in preloadedData) {
            console.log("using preloaded data for " + artist);
            data = preloadedData[artist];
            artistName = artist;
            setTable(data, false);
            setVenn(data[metricName + '-venn']);

        } else {
            console.log("loading data for " + artist);
            $.ajax({url:url, 
                error : function(response, error) {
                    console.log("error fetching "  + artist + ":" + error);
                    console.log(response);
                },
                success : function(data) {
                    artistName = artist;
                    setTable(data, false);
                    setVenn(data[metricName + '-venn']);
                }
            });
        }
    };
        
    setArtist(artistName);


    $("form").submit(function() {
        return false;
    });

    bindArtistTypeahead(selector, setArtist);

    function setVenn(vennData) {
        var w = div.select(".artistlist")[0][0].offsetWidth;
            h = Math.min(w * .75, 300);
    
        vennDiagram.width(w)
                   .height(h);

        var strokeOpacity = 0;

        div.select(".venn").datum(vennData).call(vennDiagram);
        div.selectAll("path")
            .style("stroke-opacity", strokeOpacity)
            .style("stroke", "#fff")
            .style("stroke-width", 0)

        div.selectAll("g")
            .on("click", function(d) {
                if (d.sets.length == 1) {
                    setArtist(d.sets[0]);
                    tooltip.transition().style("opacity", 0);
                }
            })
            .on("mousemove", function() {
                tooltip.style("left", (d3.event.pageX) + "px")
                       .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseover", function(d, i) {
                // need to sort div's so that Z order is correct
                div.selectAll("g").sort(function (a, b) {
                    // highest order set intersections first
                    if (a.sets.length != b.sets.length) {
                        return a.sets.length - b.sets.length;
                    }
                    
                    // current element is highest inside its order
                    if ((a == d) || (b == d)) {
                        return (a == d) ? 1 : -1;
                    }
                    
                    // finally by size
                    return b.size - a.size;
                });

                tooltip.transition().duration(400).style("opacity", .9);
                tooltip.text(d.size + " users");

                var selection =
                d3.select(this).transition("tooltip").duration(400);
                selection.select("path")
                    .style("stroke-width", 3)
                    .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
                    .style("stroke-opacity", 1);
    
            })
            .on("mouseout", function(d, i) {
                tooltip.transition().duration(400).style("opacity", 0);
                var selection =
                d3.select(this).transition("tooltip").duration(400);
                selection.select("path")
                    .style("stroke-width", 0)
                    .style("fill-opacity", d.sets.length == 1 ? .25 : .0)
                    .style("stroke-opacity", strokeOpacity);
            })
    }

    function setTable(artist) {
        var related = artist[metricName];
        if (!related) {
            console.log("failed to get related for " + metricName);
            return;
        }

        if (includeAll) {
            related = related.slice(0, 10);
        } else {
            related = related.slice(0, 5);
        }
        
        var displayMetric = getDisplayMetric(metricName);

        div.select(".artistlist table").data([]).exit().remove();
        div.select(".resultstitle h4").data([]).exit().remove();
        div.select(".resultstitle").append("h4").text("Similar to '" + artistName
        + "' by " + displayMetric + ":");

        var table = div.select(".artistlist").append("table")
            .attr("class", "table table-striped table-hover")
            .attr("style", "table-layout:fixed");
            
        var header = table.append("thead").append("tr");
        header.append("th").text("Artist");
        header.append("th").text(displayMetric);

        var body = table.append("tbody");
        var rows = body.selectAll("tr").data(related)
            .enter().append("tr")
            .on("click", function(d, i) {
                return setArtist(d['artist'], true);
            });

        rows.append("td")
            .append("a")
            .text(function (d) { return d['artist']; })
            .attr("style", "color:black");

        rows.append("td")
            .text(function (d) { 
                return d['score'] > 1 ? d['score'] :  d['score'].toPrecision(3); 
            });

        var footerRow = table.append("tfoot").append("tr");
        

        footerRow.append("td").append("a")
            .text(includeAll ? "less ..." : "more ...");

        footerRow.append("td");
        footerRow.on("click", function() {
            includeAll = !includeAll;
            setTable(artist); 
        });
    };
};
