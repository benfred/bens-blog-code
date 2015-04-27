var K = 1.2;
var LOCK_WEIGHT_SCALE = false;
function createWeightGraph() {
    var weightGraph = d3.select(".weightGraph");

    var w = weightGraph[0][0].offsetWidth,
        h = 20 + w /2, padding = 45;

    function termWeight(t) {
        return t * (K + 1.0) / (K + t)
    }

    var xDomain, yDomain;
    function updateDomains() {
        if (!LOCK_WEIGHT_SCALE) {
            xDomain = [0, (K+1) * 10];
            yDomain = [0, (K+1) * 1.5];
        }
    }
    updateDomains();

    var xScale = d3.scale.linear()
        .domain(xDomain)
        .range([padding, w - padding/2]),

        yScale = d3.scale.linear()
            .domain(yDomain)
            .range([h - padding, 0]),

        xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .ticks(10),

        yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(7);

        var svg = weightGraph.append("svg")
                .attr("width", w)
                .attr("height", h + 50);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + (padding) + ",0)")
            .call(yAxis);

        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", w/2 + 30)
            .attr("y", h - 6)
            .text("Play Count");


        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", 0)
            .attr("x", -w / 5) // todo: examine this
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("Weight");

        var samples = 500;
        var colours = d3.scale.category10();
        
        var asymptote = svg.append("line")
            .attr("x1", xScale(xDomain[0]))
            .attr("x2", xScale(xDomain[1]))
            .attr("y1", yScale(K + 1))
            .attr("y2", yScale(K + 1))
            .attr("stroke", "#CCC")
            .attr("stroke-width", 1);

        function line(f) {
            return d3.svg.line()
                .x(function (d) { return xScale(d); })
                .y(function (d) { return yScale(f(d)); })
                .interpolate("linear")
        }

        var data = d3.range(xDomain[0], xDomain[1], xDomain[1]/samples);

        var functions = [
            termWeight,
            function (d) { return d; },
            Math.sqrt,
            function (d) { return d > 0 ? 1 : 0; } 
        ],

            functionNames = [
                'BM25',
                'Cosine',
                'TFIDF',
                'Set overlap'
            ];

        
        var paths = svg.selectAll("function")
            .data(functions)
            .enter()
            .append("path")
            .attr("stroke", function(d ,i) { return colours(i);})
            .attr("stroke-width", 2)
            .style("stroke-opacity", 0.8)
            .attr("fill", "None")
            .attr("d", function(f) { 
                return line(f)(data); 
            });
        
        var labels = svg.selectAll("labels")
            .data(functions)
            .enter()
            .append("text")
            .style("fill", function(d ,i) { return colours(i);})
            .text(function (d, i) { return functionNames[i]; });

        function changeK(k) {
            K = k;
            updateDomains();
            xScale.domain(xDomain);
            yScale.domain(yDomain);

            data = d3.range(xDomain[0], xDomain[1], xDomain[1]/samples);
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            d3.select(".weightGraphTitle").text("K1 = " + K.toFixed(k > 1 ? 1: 2));
           
            paths.attr("d", function(f) { return line(f)(data); });
            labels
                .text(function (d, i) { return  functionNames[i]; })
                .attr("y", function(f) { return Math.max(yScale(f(xDomain[1])) - 5, 10);})
                .attr("x", function(f) {
                    var lastVisible = data.length - 1;

                    while (lastVisible > 0) {
                        var d = data[lastVisible];
                        var y = yScale(f(d));
                        if (y >= 0) {
                           return Math.min(xScale(d), w - 2*padding); 
                        }
                        lastVisible -= 1;
                    }
                });
        }

        var kScale = d3.scale.log()
            .domain([0.01, 1000])
            .range([padding, w - padding/2])
            .clamp(true);

        var brush = d3.svg.brush()
            .x(kScale)
            .extent([0, 0])
            .on("brush", function() {
                var value = brush.extent()[0];

                if (d3.event.sourceEvent) { // not a programmatic event
                    value = kScale.invert(d3.mouse(this)[0]);
                    brush.extent([value, value]);
                }

                handle.attr("cx", kScale(value));
                label.attr("x", kScale(value));

                if (value > 0) {
                    changeK(value);
                }
            });

        svg.append("g")
            .attr("class", "slideraxis")
            .attr("transform", "translate(0," + (h + 25)  + ")")
            .call(d3.svg.axis()
                .scale(kScale)
                .orient("bottom")
                .tickSize(0)
                .tickPadding(12)
                .tickFormat(kScale.tickFormat(5, function(d) { return d.toString(); }))
             )
          .select(".domain")
          .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "halo");

        var slider = svg.append("g")
            .attr("class", "slider")
            .call(brush);

        slider.selectAll(".extent,.resize")
            .remove();

        slider.select(".background")
            .attr("y", h)
            .attr("height", 50);

        var handle = slider.append("circle")
            .attr("class", "handle")
            .attr("cx",  kScale(K))
            .attr("cy", h + 25)
            .attr("r", 15);

        var label = slider.append("text")
            .attr("text-anchor", "middle")
            .attr("x",  kScale(K))
            .attr("y", h + 4 + 25)
            .text("K1");

        slider
            .call(brush.extent([K, K]))
            .call(brush.event);
}
createWeightGraph();
