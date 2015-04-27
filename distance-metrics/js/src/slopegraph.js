function slopeGraph() {
    var width = 800,
        left = 200,
        right = 600,
        padding = 15,
        duration = 1000,
        textSize = "12px";

    var yScale = function(rank) { 
        if (rank == 0) {
            return -15;
        }
    
        return padding + 128 * Math.log(rank); 
    }

    function chart(selection) {
        selection.each(function(data) { 
            var maxRank = Math.max.apply(null, 
                                         data.map(function (d) { 
                                         return Math.max(d.left.rank, d.right.rank); }));
            var height = padding + yScale(maxRank),
                offscreen = height + padding;

            var svg = d3.select(this).selectAll("svg").data([data]);

            svg.enter().append("svg");

            svg.transition('slopegraph').duration(duration)
               .attr("width", width)
               .attr("height", height);

            nodes = svg.selectAll("g")
                .data(data, function(d) { return d.label; });

            var newNodes = nodes.enter()
                .append("g");

            // create new nodes
            newNodes.append("text")
                .attr("class", "lefttext")
                .attr("x", left)
                .attr("y", offscreen)
                .attr("dy", ".35em")
                .style("font-size", textSize)
                .attr("text-anchor", "end")
                .style("fill", "#1f77b4");

            newNodes.append("text")
                .attr("class", "righttext")
                .attr("x", right)
                .attr("y", offscreen)
                .attr("dy", ".35em")
                .style("font-size", textSize)
                .style("fill", "black")
                .style("fill", "#ff7f0e");

            newNodes.append("line")
                .attr("x1", left + padding)
                .attr("x2", right - padding)
                .attr("y1", offscreen)
                .attr("y2", offscreen)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", .4)
    
            // update existing
            update = nodes.transition('slopegraph').duration(duration)
            update.select(".lefttext")
                .style("font-size", textSize)
                .attr("x", left)
                .attr("y", function(d) { return yScale(d.left.rank); })
                .text(function(d) { return d.label + " - #" + d.left.rank; })

            update.select(".righttext")
                .style("font-size", textSize)
                .attr("y", function(d) { return yScale(d.right.rank); })
                .attr("x", right)
                .text(function(d) { return "#" + d.right.rank + " - " + d.label; })

            update.select("line")
                .attr("x1", left + padding/2)
                .attr("x2", right - padding/2)
                .attr("y1", function(d) { return yScale(d.left.rank); })
                .attr("y2", function(d) { return yScale(d.right.rank); });
    
            // destroy old
            remove = nodes.exit().transition('slopegraph').duration(duration).remove();
            remove.select(".lefttext")
                .attr("y", offscreen)
            remove.select(".righttext")
                .attr("y", offscreen)
            remove.select("line")
                .attr("y1", offscreen)
                .attr("y2", offscreen);
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.padding = function(_) {
        if (!arguments.length) return padding;
        padding = _;
        return chart;
    };
    chart.duration = function(_) {
        if (!arguments.length) return duration;
        duration = _;
        return chart;
    };

    chart.title = function(_) {
        if (!arguments.length) return title;
        title = _;
        return chart;
    };

    chart.left = function(_) {
        if (!arguments.length) return left;
        left = _;
        return chart;
    };

    chart.right = function(_) {
        if (!arguments.length) return right;
        right = _;
        return chart;
    };

    chart.textSize = function(_) {
        if (!arguments.length) return textSize;
        textSize = _;
        return chart;
    }

    return chart;
}
// slopegraph
function ArtistSlopeGraph() {
    var leftMetric = 'jaccard', 
        rightMetric = 'bm25',
        artist = 'The Beatles';


    function joinLists(left, right, minrank) {
        var ret = [];
        minrank = minrank || 5;
        for (var i = 0; i < left.length; ++i) {
            var other = null;
            var label = left[i].artist;
            for (var j = 0; j < right.length; ++j) {
                if (label == right[j].artist) {
                    other = right[j];
                    break;
                }
            }
            if (other === null) {
                continue;
            }

            if ((other.rank <= minrank) ||
                (left[i].rank <= minrank)) {
                ret.push({"left": left[i],
                          "right": other,
                          "label": label});
            }
        }
        return ret;
    }

    function setArtistData(new_artist, data) {
        artist = new_artist;
        var data = joinLists(data[leftMetric], data[rightMetric], 7);
        var width = d3.select(".slopegraph .graph")[0][0].offsetWidth;
        var left = Math.min(.4 * width, Math.max(width/4, 144));
        var left = Math.min(width/3., 200);
        var textSize = left < 150 ? "10px" : "12px"

        d3.select(".slopegraph .title").text(artist);
        d3.select(".slopegraph .subtitle").text(getDisplayMetric(leftMetric) 
                                               + " versus " +
                                               getDisplayMetric(rightMetric));

        d3.select(".lleft").style("width", left + "px");
        d3.select(".rright").style("width", left + "px");
        d3.select(".twitter-typeahead").style("width", (width - 2 * left) +"px");
        d3.selectAll(".dropdown-menu").style("width", left +"px");

        var chart = slopeGraph();
        chart.width(width)
            .duration(1000)
            .left(left)
            .right(width - left)
            .textSize(textSize);

        d3.select(".slopegraph .graph")
            .datum(data)
            .call(chart);

        d3.select(".slopegraph .graph").selectAll("g")
            .on("click", function(d) { 
                setArtist(d.label);
            })
            .on("mouseover", function(d, i) {
                var selection = d3.select(this).transition("tooltip");
                selection.selectAll("text")
                    .style("font-size", "16px");

                selection.select("line")
                    .attr("stroke-width", 2)
                    .attr("stroke-opacity", 1)
            })
            .on("mouseout", function(d, i) {
                var selection = d3.select(this).transition("tooltip");
                selection.select("line")
                    .attr("stroke-width", 1)
                    .attr("stroke-opacity", .4)
                selection.selectAll("text")
                    .style("font-size", textSize);
            });
    }


    function setArtist(new_artist) {
        new_artist = new_artist || artist;

        if (new_artist in preloadedData) {
            console.log("using preloaded data for " + new_artist);
            setArtistData(new_artist, preloadedData[new_artist]);
        } else {
            console.log("loading ata for " + new_artist);
            var a = new_artist.toLowerCase();
            var url = API_HOST + a + ".json";
            $.ajax({url:url,
                error : function(response, error) {
                    console.log("error fetching "  + new_artist + ":" + error);
                    console.log(response);
                },
                success : function(data) {
                    setArtistData(new_artist, data);
                }
            });
        }
    }
    setArtist(artist);


    var metrics = ['overlap', 'jaccard', 'cosine', 'smoothed_cosine', 'tfidf', 'bm25'];

    function setLeftMetric(d) {
        leftMetric = d;
        $(".left .method").text(getDisplayMetric(d));
    }

    function setRightMetric(d) {
        rightMetric = d;
        $(".right .method").text(getDisplayMetric(d));
    }
    d3.select(".left .metrics").selectAll("li")
        .data(metrics)
        .enter()
        .append("li")
        .append("a")
        .attr("class", function (d) {return d; })
        .text(getDisplayMetric)
        .on("click", function(d) { setLeftMetric(d); setArtist(artist); });

    d3.select(".right .metrics").selectAll("li")
        .data(metrics)
        .enter()
        .append("li")
        .append("a")
        .attr("class", function (d) {return d; })
        .text(getDisplayMetric)
        .on("click", function(d) { setRightMetric(d); setArtist(artist); });

    bindArtistTypeahead('.slopegraph', setArtist);
    
    return {'setRightMetric' : setRightMetric,
            'setLeftMetric' : setLeftMetric,
            'setArtist' : setArtist,    
            'getArtist' : function() { return artist; }}
}
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

