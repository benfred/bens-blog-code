var angleData = [{x: 2, y : 8, dragging : false, label : "Kanye West"},
                 {x: 14, y : 1, dragging : false, label : "Coldplay"},
                 {x: 1, y : 7, dragging : false, label : "Jay Z"}];

function createAngleGraph() {
    var element = d3.select(".cosinegraph");

    var w = element[0][0].offsetWidth
        h = 20 + w /2, padding = 35;

    var xScale = d3.scale.linear()
        .domain([0, 20])
        .range([padding, w - padding/2]),

        yScale = d3.scale.linear()
            .domain([0, 10])
            .range([h - padding, 5]),

        xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .ticks(10),

        yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(7);

    var svg = element.append("svg")
                .attr("width", w)
                .attr("height", h);

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
            .attr("x", w/2 + 55)
            .attr("y", h - 6)
            .text("Play Count for User 'B'");

        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", 0)
            .attr("x", -w / 6.6) // todo: examine this
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("Play Count for User 'A'");

        var colours = d3.scale.category10();

        function l2norm(p) {
            return Math.sqrt(p.x * p.x + p.y * p.y)
        }

        var norms = angleData.map(l2norm);

        var radiusA = xScale(.75 *  Math.min(norms[0], norms[1])) - xScale(0);
        var arcA = d3.svg.arc()
            .innerRadius(radiusA-1)
            .outerRadius(radiusA)
            .startAngle(Math.atan2(angleData[0].x, angleData[0].y))
            .endAngle(Math.atan2(angleData[1].x, angleData[1].y));
        var arcPathA = svg.append("path")
            .attr("d", arcA)
            .attr("stroke", "#CCC")
            .attr("fill", "#CCC")
            .attr("transform", "translate(" + xScale(0) + "," + yScale(0) + ")");

        var radiusB = xScale(.75 *  Math.min(norms[0], norms[2])) - xScale(0);
        var arcB = d3.svg.arc()
            .innerRadius(radiusB-1)
            .outerRadius(radiusB)
            .startAngle(Math.atan2(angleData[0].x, angleData[0].y))
            .endAngle(Math.atan2(angleData[2].x, angleData[2].y));
        var arcPathB = svg.append("path")
            .attr("d", arcB)
            .attr("stroke", "#CCC")
            .attr("fill", "#CCC")
            .attr("transform", "translate(" + xScale(0) + "," + yScale(0) + ")");

        var drag = d3.behavior.drag()
            .on("dragstart", function(d) {
                d.dragging = true;
                lines.attr("stroke-width", function(d, i) { return d.dragging ? 5  : 3 })
                text.attr("font-weight", function(d, i) { return d.dragging ? "bold" : "normal";});
            })
            .on("dragend", function(d) {
                d.dragging = false;
                lines.attr("stroke-width", function(d, i) { return d.dragging ? 5  : 3 })
                text.attr("font-weight", function(d, i) { return d.dragging ? "bold" : "normal";});
            })

            .on("drag", function(d){
                d.x = Math.min(Math.max(xScale.invert(d3.event.x), 0), 20);
                d.y = Math.min(Math.max(yScale.invert(d3.event.y), 0), 10);

                var norms = angleData.map(l2norm);
                var radiusA = xScale(.75 *  Math.min(norms[0], norms[1])) - xScale(0);
                var radiusB = xScale(.75 *  Math.min(norms[0], norms[2])) - xScale(0);
                arcA.innerRadius(radiusA-1)
                   .outerRadius(radiusA)
                   .startAngle(Math.atan2(angleData[0].x, angleData[0].y))
                   .endAngle(Math.atan2(angleData[1].x, angleData[1].y));
                arcPathA.attr("d", arcA);

                arcB.innerRadius(radiusB-1)
                   .outerRadius(radiusB)
                   .startAngle(Math.atan2(angleData[0].x, angleData[0].y))
                   .endAngle(Math.atan2(angleData[2].x, angleData[2].y));
                arcPathB.attr("d", arcB);

                target.attr("cx", function(d) { return xScale(d.x); })
                      .attr("cy", function(d) { return yScale(d.y); });

                lines.attr("x2", function(d) { return xScale(d.x); })
                    .attr("y2", function(d) { return yScale(d.y); });
                
                text.attr("x", function(d) { return xScale(d.x); })
                    .attr("y", function(d) { return yScale(d.y) - 15; });
            });
        var markers = svg.selectAll("markers")
            .data(angleData)
            .enter().append("marker")
            .attr("id", function(d, i) { return "arrow-" + i; })
            .attr("fill", function(d, i) { return colours(i); })
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 0)
            .attr("refY", 5)
            .attr("markerUnits", "strokeWidth")
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto");
            markers.append("path")
                .attr("d", "M 0 0 L 10 5 L 0 10 z");

        var lines = svg.selectAll("lines")
           .data(angleData)
            .enter().append("line")
            .attr("marker-end", function(d,i ) { return "url(#arrow-" + i + ")"; })
            .attr("stroke", function(d, i) { return colours(i);} )
            .attr("stroke-width", 3)
            .attr("x1", xScale(0))
            .attr("y1", yScale(0))
            .attr("x2", function(d) { return xScale(d.x); })
            .attr("y2", function(d) { return yScale(d.y); })
            .call(drag);

        var text = svg.selectAll("labels")
            .data(angleData)
            .enter().append("text")
               .attr("x", function(d) { return xScale(d.x); })
               .attr("y", function(d) { return yScale(d.y) - 15; })
               .attr("text-anchor", "middle")
               .style("fill", function(d, i) { return colours(i); })
               .text(function(d) { return d.label; });
        var target = svg.selectAll("empty")
            .data(angleData)
            .enter().append("circle")
            .attr("r", 20)
            .style("fill", "rgba(255,255,255,0.0)")
            .style("stroke-width", "0")
            .attr("cx", function(d) { return xScale(d.x); })
            .attr("cy", function(d) { return yScale(d.y); })
            .call(drag);
}

createAngleGraph();

d3.select(window).on('resize', function() {
    d3.select(".weightGraph svg").data([]).exit().remove();
    d3.select(".cosinegraph svg").data([]).exit().remove();
    slopegraph.setArtist();
    requestAnimationFrame(function() {
        createAngleGraph();
        createWeightGraph();
    });
});
