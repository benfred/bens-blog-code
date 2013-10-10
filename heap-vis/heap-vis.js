function reheap(heap, compare, swap) {
    var parent = 0, end = heap.length, child = 1;
    compare = compare || function(a,b) { return a < b; };
    swap = swap || function(a,b) { };

    // recurse down the minheap, swapping entries as needed to
    // keep the heap property
    while (child < end) {
        // get the index of the smallest child node
        var right = child + 1;
        if ((right < end) && (compare(heap[right], heap[child]))) {
            child = right;
        }
    
        // if the parent is less than both children, we're done here
        if (compare(heap[parent], heap[child])) break;
           
        // otherwise swap, and restore heap property on child node
        var temp = heap[child];
        heap[child] = heap[parent];
        heap[parent] = temp;
        swap(parent, child);
        parent = child;
        child = 2 * parent + 1;
    }
}

// builds up the display positions of a balanced binary tree
function getTreePositions(levels, pos, spacing) {
    var ret = [],
        width = Math.pow(2, levels-1) * spacing.x;

    for (var level = 0; level < levels; level++) {
        var items = Math.pow(2, level),
            interval = width / items,
            y = pos.y + spacing.y * level,
            x = pos.x + (interval - width) / 2;

        for (var offset = 0; offset < items; offset++) {
            var i = items + offset - 1;
            ret[i] = {x: x + offset * interval, y: y};
            ret[i].parent = i ? Math.floor((i - 1)/2) : i;
        }
    }

    return ret;
};

function createHeapVis(element) {
    console.log("creating");
    var colours = d3.scale.linear().domain([0, 100]).range(["#1f77b4", "#ff7f0e"]);
    var current, count, pending, heap, items, points = [], paused= false, levels=3, speed=800;

    function resetState() {
        var pointSize = 33;
        radius = function(p) { return Math.sqrt(p.value) + 6; }

        // if running on a phone, make things a little smaller
        if (document.documentElement.clientWidth < 1024) {
            radius = function(p) { return Math.sqrt(p.value)/2 + 7; };
            pointSize = 25;
            element.selectAll(".heap31").attr("style", "display:none");
        }

        var w = Math.min(848, document.documentElement.clientWidth-30),
            h = pointSize * (levels + 1);

        var svg = element.select(".heap-viz").append("svg");
        svg.attr("width", w)
           .attr("height", h);

        svg.append("rect")
            .attr("width", pointSize)
            .attr("height", pointSize*2)
            .attr("x", (w-pointSize)/2)
            .attr("fill", "#F9F9F9")
            .attr("stroke", "#CCC")
            .attr("stroke-width", 1)
            .attr("y", 0);

        current = -3;
        count = 128;
        pending = [];
        heap  = getTreePositions(levels, 
                                 {x:w/2, y: 1.5 * pointSize},
                                 {x:1.5 * pointSize, y:pointSize});
        items = [];

        for (var i = 0; i < count; ++i) {
            var p = {x:w/2 - 50 * (i - current),y:pointSize/2};
            p.value = Math.ceil((99 * Math.random()));
            p.colour = colours(p.value);
            p.inHeap = false;
            items.push(p);
        }

        for (var i = 0; i < heap.length; ++i) {
            heap[i].value = 0;
            heap[i].inHeap = true;
            heap[i].colour = colours(0);
            items.push(heap[i]);
        }

        lines = svg.selectAll("line")
                        .data(heap)
            .enter()
            .append("line");
        
        lines.attr("x1", function(d) { return d.x; })
            .attr("y1", function(d) { return d.y; })
            .attr("x2", function(d) { return heap[d.parent].x;})
            .attr("y2", function(d) { return heap[d.parent].y;})
            .attr("stroke", "#CCC")
            .attr("stroke-width", 2)

        points = svg.selectAll("points")
            .data(items)
            .enter()
            .append("g")
            .style("stroke", function(d) { return d.colour; })
            .style("fill", function(d) { return d.colour; })

        background = points.append("circle")
              .attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; })
              .attr("r", radius)
              .attr("fill", "white");

        circle = points.append("circle")
              .attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; })
              .attr("r", radius)
              .attr("fill-opacity", .2)
              .attr("stroke-width",  1);

        text = points.append("text")
            .attr("text-anchor", "middle")
            .attr("x", function(d) { return d.x; })
            .attr("y", function (d) { return d.y + 4; })
            .style("font-size", 12)
            .style("font-weight", 200)
            .text(function(d) { return d.value; });

        increment();
    };

    function increment() {
        var duration = speed;
        if (paused) {
            duration = 50;

        } else if (pending.length) {
            // have items that need their positions swapped, do that
            duration /= 2;
            var toSwap = pending[0];
            pending = pending.splice(1, pending.length);

            var temp = toSwap[0].x;
            toSwap[0].x = toSwap[1].x;
            toSwap[1].x = temp;

            temp = toSwap[0].y;
            toSwap[0].y = toSwap[1].y;
            toSwap[1].y = temp;

            temp = toSwap[0].inHeap;
            toSwap[0].inHeap = toSwap[1].inHeap;
            toSwap[1].inHeap = temp;
        } else {

            // just move all items 50px to the right, and 
            // call the 'reheap' item on the heap of current item
            for (var i = 0; i < items.length; ++i) {
                if (!items[i].inHeap) {
                    items[i].x += 50;
                }
            }
            current += 1; 
            if ((current >= 0) && (current < count) && (items[current].value > heap[0].value)) {
                pending.push([items[current], heap[0]]);
                heap[0] = items[current];

                function swap(a,b) {
                    pending.push([heap[a], heap[b]]);
                }

                function compare(a, b) {
                    return a.value < b.value;
                }

                reheap(heap, compare, swap);
            }
        }

        var transition = d3.transition()
                            .duration(duration);

        // move things. todo: figure out a way to transition just the group
        // and not have to transition each element
        circle.transition()
            .duration(duration)
            .attr("cx", function(d,i) { return d.x; })
            .attr("cy", function(d,i) { return d.y; })
            .ease("linear");

        background.transition()
            .duration(duration)
            .attr("cx", function(d,i) { return d.x; })
            .attr("cy", function(d,i) { return d.y; })
            .ease("linear");

        text.transition()
            .duration(duration)
            .attr("x", function(d,i) { return d.x; })
            .attr("y", function (d) { return d.y + 4; })
            .ease("linear");

        if (current < count + 10) {
            transition.each("end", increment);
        }

        if (current >= count) {
            element.selectAll("rect").attr("style", "display:none");
        }
    };

    resetState();

    function pause() {
        paused = true;
        element.select(".pause-label").text(" Resume");
        element.select(".glyphicon-pause").attr("style", "display:none");
        element.select(".glyphicon-play").attr("style", "display:inline");
    }

    function resume() {
        paused = false;
        element.select(".pause-label").text(" Pause");
        element.select(".glyphicon-pause").attr("style", "display:inline");
        element.select(".glyphicon-play").attr("style", "display:none");
    }

    function togglePause() {
        if (paused) {
            resume();
        } else {
            pause();
        }
    }

    function restart() {
        element.selectAll("svg").data([]).exit().remove();
        resetState();
        resume();
    }

    function setHeapSize(level) {
        levels = level;
        restart();
    }

    element.select(".restart-button").on("click", restart);
    element.select(".pause-button").on("click",  togglePause);

    element.select(".heap1").on("click", function() { setHeapSize(1); });
    element.select(".heap3").on("click", function() { setHeapSize(2); });
    element.select(".heap7").on("click", function() { setHeapSize(3); });
    element.select(".heap15").on("click", function() { setHeapSize(4); });
    element.select(".heap31").on("click", function() { setHeapSize(5); });

    element.select(".speed1").on("click", function() { speed = 1600; });
    element.select(".speed2").on("click", function() { speed = 800; });
    element.select(".speed3").on("click", function() { speed = 400; });
    element.select(".speed4").on("click", function() { speed = 100; });
}
