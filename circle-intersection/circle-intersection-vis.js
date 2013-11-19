
function subdivideRectangle(current, output) {
    var w = current.width/2,
        h = current.height/2,
        level = current.level || 0;

    output({ x: current.x,
             y : current.y,
             width : w,
             height: h,
             level : level + 1});

    output({ x: current.x + w,
             y : current.y,
             width : w,
             height: h,
             level : level + 1});

    output({ x: current.x,
             y : current.y + h,
             width : w,
             height: h,
             level : level + 1});

    output({ x: current.x + w,
             y : current.y + h,
             width : w,
             height: h,
             level : level + 1});
}


function rectangleContained(current, circles) {
    var x = current.x, y = current.y, w = current.width, h = current.height;

    var pointValues = [
        circleIntersection.containedInCircles({x:x, y:y} , circles),
        circleIntersection.containedInCircles({x:x+w, y:y} , circles),
        circleIntersection.containedInCircles({x:x, y:y+h} , circles),
        circleIntersection.containedInCircles({x:x+w, y:y+h}, circles)];

    for (var i = 1; i < pointValues.length; ++i) {
        if (pointValues[i] !== pointValues[0]) {
            return 0;
        }
    }

    return pointValues[0] ? 1 : -1;
}

/// This is all basically a horrible mess of poorly written javascript
/// (thats not really worth my time in fixing up since its for a one-off blog
/// post)
function createCircleIntersectionVis(element,
                                     outputElement,
                                     controlElement,
                                     params) {
    params = params || {};
    var circleCount = params.circleCount || 4, 
                      paused = true, 
                      examined = 0, 
                      contained = 0;

    var gridCircles = [{radius: 1, x : 1, y : 1, order : 0}, 
                       {radius: 1, x : 2, y : 1, order : 1},
                       {radius: 1, x : 1, y : 2, order : 2},
                       {radius: 1, x : 2, y : 2, order : 3},
                       {radius: 0.8, x : 2, y : 1.5, order : 4},
                       {radius: 0.8, x : 1, y : 1.5, order : 5},
                       {radius: 0.8, x : 1.5, y : 1, order : 6},
                       {radius: 0.8, x : 1.5, y : 2, order : 7}],

        circles = gridCircles,

        actual = [3.1415926,
                  1.22843296,
                  0.4430346,
                  0.31512337,
                  0.307694248, 
                  0.3003842760,
                  0.2930476032,
                  0.2856736447];

    var active = circles.filter(function (c) { return c.order < circleCount; })
    var bound = circleIntersection.getBoundingRectangle(active);

    var quadQueue = [bound];
    var area = 0, outOfArea = 0;

    var w = Math.min(300, document.documentElement.clientWidth-30);
    var scale = d3.scale.linear()
            .domain([0, 3])
            .range([5, w + 5]),
        widthScale = d3.scale.linear()
            .domain([0, 3])
            .range([0, w]);
    var h = scale(Math.max.apply(null, active.map(function(p) {
        return p.y + p.radius; }
    )));

    var svg = element.append("svg")
                .attr("width", w+10)
                .attr("height", (circleCount > 2 ? scale(3) : scale(2)) + 10);

    var tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "220px")
        .style("height", "20px")
        .style("background", "#333")
        .style("color", "#ddd")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("opacity", 0);

    svg.append("rect")
        .attr("width",  widthScale(bound.width))
        .attr("height", widthScale(bound.height))
        .attr("x", scale(bound.x))
        .attr("y", scale(bound.y))
        .attr("stroke", "#111")
        .attr("stroke-width", 1.0)
        .attr("fill-opacity", 0.0);

    var started = false;

    svg.selectAll("circle")
        .data(circles)
        .enter()
        .append("circle")
        .attr("r", function(d,i) { return d.order < circleCount ?
        widthScale(d.radius) : 0; })
        .attr("cx", function(d) { return scale(d.x); })
        .attr("cy", function(d) { return scale(d.y); })
        .style("stroke-width", 0.5)
        .style("stroke", "blue")
        .style("fill", "blue")
        .style("fill-opacity", function(d,i) { return d.order <
        circleCount ? 0.05 : 0; })
        .on("mousemove", function(d, i) {
            tooltip.style("left", (d3.event.pageX) + "px")     
                   .style("top", (d3.event.pageY - 28) + "px");    
        })
        .on("mouseover", function(d, i) {      
            d3.select(this).style("fill-opacity", d.order < circleCount ? 0.3 : 0);
            tooltip.transition().style("opacity", .8);      
            tooltip.text("center=(" + (d.x-1).toFixed(2) + ", " +
            (d.y-1).toFixed(2) + ") radius=" + d.radius.toFixed(2))
        })                  
        .on("mouseout", function(d, i) {       
            d3.select(this)
                .style("fill-opacity", d.order < circleCount ? 0.05 : 0);
            tooltip.transition().style("opacity", 0);   
        });
    ;
    var points = svg.append("g");

    function reset(c, moving) {
        c = c || circleCount;
        var changing = c != circleCount;
        var growing = c > circleCount;
        var duration = 500;

        // erase all the points + reset stats
        paused = true;
        contained = examined = 0;
        points.data([]).exit().remove();
        points = svg.append("g");

        // if we're adding/removing circles - need to transition
        if (moving || changing) {
            circleCount = c;
            active = circles.filter(function (c) { return c.order < circleCount; })
            bound = circleIntersection.getBoundingRectangle(active);

            var existingHeight = parseInt(svg.attr("height"));
            var height = scale(Math.max.apply(null, active.map(function(p) {
                return p.y + p.radius; }
            )));
            var shrinkSvg = ((height) < (existingHeight - 100)),
                growSvg =   ((height) > (existingHeight));

            if (moving) {
                svg.selectAll("circle").data(circles);
            }

            var selection = svg;
            if (growSvg) {
                selection = selection.transition()
                                .duration(100)
                                .attr("height", height + 10);
            }

            selection.selectAll("circle")
                .transition()
                .duration(duration)
                .attr("cx", function(d,i) { return scale(d.x);})
                .attr("cy", function(d,i) { return scale(d.y);})
                .style("fill-opacity", function(d,i) { return d.order < circleCount ? 0.05 : 0; })
                .attr("r", function(d,i) { return d.order < circleCount ? widthScale(d.radius) : 0; });

            selection.select("rect").transition()
                .duration(duration)
                .attr("width",  Math.ceil(widthScale(bound.width)))
                .attr("height", Math.ceil(widthScale(bound.height)))
                .attr("x", Math.floor(scale(bound.x)))
                .attr("y", Math.floor(scale(bound.y)))
                .each("end", function() {
                    if (shrinkSvg) {
                        svg.transition().attr("height", height + 10);
                    }

                    if (params.variant == "exact") {
                        resetExact();
                    }
                    paused=false;
                });
        } else {
            paused = false;
            if (params.variant == "exact") {
                resetExact();
            }
        }
        quadQueue = [bound];
        area = outOfArea = 0;
    }

    // sample some points + update stats
    function incrementMonteCarlo() {
        if (!paused && (examined < 10000)) {
            for (var i = 0; i < 50; ++i) { 
                var p = circleIntersection.randomPoint(bound);
                var inset = circleIntersection.containedInCircles(p, active);
                if (inset) {
                    contained++;
                }
                
                examined++;
                points.append("circle")
                    .attr("cx" , scale(p.x))
                    .attr("cy", scale(p.y))
                    .attr("r", 0.5)
                    .attr("fill", "white")
                    .transition()
                    .ease("linear")
                    .attr("fill", inset ? "red" : "blue");
            
                var area = bound.width * bound.height * contained/examined,
                    errorRate = 100 * Math.abs(1 - (actual[circleCount-1]/ area));

                outputElement.select(".examined").text(examined);
                outputElement.select(".contained").text(contained);
                outputElement.select(".area").text(area.toFixed(3));
                outputElement.select(".error").text(errorRate.toFixed(3));
            }
        }

        element.transition()
            .duration(50)
            .each("end", incrementMonteCarlo);
    }

    function incrementQuadtree() {
        var duration = 50, maxLevels = 8, level;

        if (!paused && quadQueue.length) {
            for (var j = 0; j < 50; j++) {
                var current = (params.BFS) ? quadQueue.pop() :
                                             quadQueue.splice(0,1)[0];
                level = current.level || 0;
                if (level > maxLevels) {
                    break;
                }

                var h = current.height, w = current.width;
                var inOrOut = rectangleContained(current, active);
                if (level === 0) {
                    inOrOut = 0;
                }

                var colour = 'white', strokeOpacity=0.3;
                if (inOrOut) {
                    if (inOrOut > 0) {
                        colour = "red";
                        area += (w * h);
                    } else {
                        colour = "blue";
                        outOfArea += (w*h);
                    }
                    strokeOpacity=1.0;
                }

                points.append("rect")
                    .attr("width",  widthScale(current.width))
                    .attr("height", widthScale(current.height))
                    .attr("x", scale(current.x))
                    .attr("y", scale(current.y))
                    .attr("stroke", colour)
                    .attr("stroke-width", 0.5)
                    .attr("stroke-opacity", strokeOpacity)
                    .attr("fill-opacity", 0.0);
                if (!inOrOut && (level <= maxLevels)) {
                    subdivideRectangle(current, function(v) { quadQueue.push(v); });
                }       

                examined += 1;
                if ((Math.pow(1.3, level) < j) || (examined >= 10000)) {
                    break;
                }
            }
           
            var uncertain = bound.width * bound.height - area - outOfArea;
            var estimate = area + uncertain / 2;
            var errorRate = 100 * Math.abs(1 - (actual[circleCount-1]/ estimate));

            outputElement.select(".examined").text(examined);
            outputElement.select(".depth").text(Math.min(level, maxLevels));
            outputElement.select(".area").text(estimate.toFixed(3));
            outputElement.select(".error").text(errorRate.toFixed(3));
            outputElement.select(".uncertain").text((uncertain/2).toFixed(3));
        }
        element.transition()
            .duration(duration)
            .each("end", incrementQuadtree);
    }
   
    function resetExact() {
        var stats = {};
        circleIntersection.intersectionArea(active, stats);

        points.selectAll("intersectionpoints")
            .data(stats.intersectionPoints)
            .enter()
            .append("circle")
                .attr("cx", function(p) { return scale(p.x) })
                .attr("cy", function(p) { return scale(p.y) })
                .style("fill", function(p) { return circleIntersection.containedInCircles(p, active) ? "red": "blue"; })
                .attr("r", 3);

        points.selectAll("polygon")
            .data(stats.arcs)
            .enter()
            .append("line")
            .attr("x1", function(d) { return scale(d.p1.x); })
            .attr("y1", function(d) { return scale(d.p1.y); })
            .attr("x2", function(d) { return scale(d.p2.x); })
            .attr("y2", function(d) { return scale(d.p2.y); })
            .attr("stroke", "red")
            .attr("stroke-width", .5);
        
        // there is almost certainly an easier way to do this
        var center = circleIntersection.getCenter(stats.innerPoints);
        for (var i = 0; i < stats.arcs.length; ++i) {
            var arc = stats.arcs[i],
                p1 = arc.p1,
                p2 = arc.p2,
                circle = arc.circle;

            var a1 = Math.atan2(p1.x - circle.x, p1.y - circle.y),
                a2 = Math.atan2(p2.x - circle.x, p2.y - circle.y);
            var samples = 64;

            var angleDiff = (a2-a1);
            if (angleDiff < 0) {
                angleDiff += 2*Math.PI;
            }
                
            var angleDelta = angleDiff / samples;
            for (var j = 0; j < samples; ++j) {
                var midPoint = { x : (j * p1.x + (samples - j) * p2.x) / (samples),
                                 y : (j * p1.y + (samples - j) * p2.y) / (samples)};

                var angle = a2 - angleDelta * j;

                var extended = {        
                    x : circle.x + circle.radius * Math.sin(angle),
                    y : circle.y + circle.radius * Math.cos(angle)
                };
        
                points.append("line")
                    .attr("x1", scale(midPoint.x))
                    .attr("y1", scale(midPoint.y))
                    .attr("x2", scale(extended.x))
                    .attr("y2", scale(extended.y))
                    .attr("stroke", "red")
                    .attr("stroke-width", .5);
            }
        }
            
        // hide the bounding rectangle, cuz we just don't need it
        element.select("rect").style("display", "none");

        // update stats
        outputElement.select(".area").text(stats.area.toFixed(5));
        outputElement.select(".area-polygon").text(stats.polygonArea.toFixed(5));
        outputElement.select(".area-arc").text(stats.arcArea.toFixed(5));
    }
    
    if (params.variant == "montecarlo") {
        incrementMonteCarlo();
    } else if (params.variant == "quadtree") {
        incrementQuadtree();
    } else if (params.variant == "exact") {
        resetExact();
    }

    var pauseIcon = controlElement.select(".pause-button .glyphicon");
    function pause() {
        paused = true;
        controlElement.select(".pause-label").text(" Resume");
        pauseIcon.attr("class", "glyphicon glyphicon-play");
    }

    function resume() {
        paused = false;
        started = true;
        controlElement.select(".pause-label").text(" Pause");
        pauseIcon.attr("class", "glyphicon glyphicon-pause");
    }

    function togglePause() {
        if (paused) {
            resume();
        } else {
            pause();
        }
    }

    function setCircles(c) {
        controlElement.select(".circlelabel").text(c + " Circle" + (c > 1? "s" : ""));
        resume();
        reset(c);
    }

    controlElement.select(".pause-button").on("click",  togglePause);
    controlElement.select(".circle1").on("click", function() { setCircles(1); });
    controlElement.select(".circle2").on("click", function() { setCircles(2); });
    controlElement.select(".circle3").on("click", function() { setCircles(3); });
    controlElement.select(".circle4").on("click", function() { setCircles(4); });
    controlElement.select(".circle5").on("click", function() { setCircles(5); });
    controlElement.select(".circle6").on("click", function() { setCircles(6); });
    controlElement.select(".circle7").on("click", function() { setCircles(7); });
    controlElement.select(".circle8").on("click", function() { setCircles(8); });

    controlElement.select(".layout-grid").on("click", function() { 
        controlElement.select(".layout-grid").attr("disabled", true);
        circles = gridCircles; 
        for (var i = 0; i < circles.length; i++) {
            actual[i] = circleIntersection.intersectionArea(circles.slice(0, i+1));
        }
        resume();
        reset(circleCount, true);
        
    });

    controlElement.select(".layout-random").on("click", function() { 
        controlElement.select(".layout-grid").attr("disabled", null);

        var viewport = {x : 1,   y : 1, height : 1, width : 1},
            center =   {x : 1.5, y : 1.5} ;

        circles = [];
        for (var i = 0; i < 8; ++i) {
            var p = circleIntersection.randomPoint(viewport);
            p.radius = Math.max(Math.random() * 1.2,
                                circleIntersection.distance(p, center) + .2);
            // p.radius = Math.random() + .1
            p.order = i;
            circles.push(p);
            actual[i] = circleIntersection.intersectionArea(circles.slice(0,i+1));
        }

        // sort so that tooltips work on smallest
        circles.sort(function(a,b) { return b.radius - a.radius;});

        resume();
        reset(circleCount, true);
    }); 
}
