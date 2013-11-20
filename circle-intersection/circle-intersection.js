(function(circleIntersection) {
    "use strict";
    var SMALL = 1e-10;

    /** Returns the intersection area of a bunch of circles (where each circle
     is an object having an x,y and radius property) */
    circleIntersection.intersectionArea = function(circles, stats) {
        // get all the intersection points of the circles
        var intersectionPoints = circleIntersection.getIntersectionPoints(circles);
        
        // filter out points that aren't included in all the circles
        var innerPoints = intersectionPoints.filter(function (p) {
            return circleIntersection.containedInCircles(p, circles);
        });

        var arcArea = 0, polygonArea = 0, arcs = [], i;

        // if we have intersection points that are within all the circles,
        // then figure out the area contained by them
        if (innerPoints.length > 1) {
            // sort the points by angle from the center of the polygon, which lets
            // us just iterate over points to get the edges
            var center = circleIntersection.getCenter(innerPoints);
            for (i = 0; i < innerPoints.length; ++i ) {
                var p = innerPoints[i];
                p.angle = Math.atan2(p.x - center.x, p.y - center.y);
            }
            innerPoints.sort(function(a,b) { return b.angle - a.angle;});

            // iterate over all points, get arc between the points
            // and update the areas
            var p2 = innerPoints[innerPoints.length - 1];
            for (i = 0; i < innerPoints.length; ++i) {
                var p1 = innerPoints[i];

                // polygon area updates easily ...
                polygonArea += (p2.x + p1.x) * (p1.y - p2.y);
    
                // updating the arc area is a little more involved
                var midPoint = {x : (p1.x + p2.x) / 2,
                                y : (p1.y + p2.y) / 2},
                    arc = null;

                for (var j = 0; j < p1.parentIndex.length; ++j) {
                    if (p2.parentIndex.indexOf(p1.parentIndex[j]) > -1) {
                        // figure out the angle halfway between the two points
                        // on the current circle
                        var circle = circles[p1.parentIndex[j]],
                            a1 = Math.atan2(p1.x - circle.x, p1.y - circle.y),
                            a2 = Math.atan2(p2.x - circle.x, p2.y - circle.y);

                        var angleDiff = (a2 - a1);
                        if (angleDiff < 0) {
                            angleDiff += 2*Math.PI;
                        }
                        
                        // and use that angle to figure out the width of the
                        // arc
                        var a = a2 - angleDiff/2,
                            width = circleIntersection.distance(midPoint, {
                                x : circle.x + circle.radius * Math.sin(a),
                                y : circle.y + circle.radius * Math.cos(a)
                            });
                        
                        // pick the circle whose arc has the smallest width
                        if ((arc === null) || (arc.width > width)) {
                            arc = { circle : circle,    
                                    width : width,
                                    p1 : p1,
                                    p2 : p2};
                        }
                    }
                }
                arcs.push(arc);
                arcArea += circleIntersection.circleArea(arc.circle.radius, arc.width);
                p2 = p1;
            }
        } else {
            // no intersection points, is either disjoint - or is completely
            // overlapped. figure out which by examining the smallest circle
            var smallest = circles[0];
            for (i = 1; i < circles.length; ++i) {
                if (circles[i].radius < smallest.radius) {
                    smallest = circles[i];
                }
            }
           
            // make sure the smallest circle is completely contained in all
            // the other circles
            var disjoint = false;
            for (i = 0; i < circles.length; ++i) {
                if (circleIntersection.distance(circles[i], smallest) > Math.abs(smallest.radius - circles[i].radius)) {
                    disjoint = true;
                    break;
                }
            }

            if (disjoint) {
                arcArea = polygonArea = 0;

            } else {
                arcArea = smallest.radius * smallest.radius * Math.PI;
                arcs.push({circle : smallest,
                           p1: { x: smallest.x,        y : smallest.y + smallest.radius},
                           p2: { x: smallest.x - SMALL, y : smallest.y + smallest.radius},
                           width : smallest.radius * 2 });
            }
        }

        polygonArea /= 2;
        if (stats) {
            stats.area = arcArea + polygonArea;
            stats.arcArea = arcArea;
            stats.polygonArea = polygonArea;
            stats.arcs = arcs;
            stats.innerPoints = innerPoints;
            stats.intersectionPoints = intersectionPoints;
        }

        return arcArea + polygonArea;
    };

    /** returns a monte carlo estimate of the overlap of a bunch of circles
     much simpler method than the one above, but slower and less accurate */
    circleIntersection.monteCarloEstimate = function(circles, count) {
        count = count || 10000;
        var contained = 0;
        var bound = circleIntersection.getBoundingRectangle(circles);
        for (var i = 0; i < count; ++i) {
            var p = circleIntersection.randomPoint(bound);
            if (circleIntersection.containedInCircles(p, circles)) {
                contained++;
            }
        }
        return bound.width * bound.height * contained / count;
    };
   
    circleIntersection.subdivideRectangle = function(current, output) {
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

    circleIntersection.rectangleContained = function(current, circles) {
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
 
        
    circleIntersection.quadtreeEstimate = function(circles, depth) {
        var bound = circleIntersection.getBoundingRectangle(circles),
            area = 0, outsideArea = 0;

        if (bound.widh <= 0 || bound.height <= 0) {
            return [0,0];
        }

        depth = depth || 8;
        
        function examineRectangle(r) {
            var inOrOut = circleIntersection.rectangleContained(r, circles);
            if (inOrOut === 0) {
                if (r.level <= depth) {
                    circleIntersection.subdivideRectangle(r, examineRectangle);
                }
            } else if (inOrOut > 0) {
                area += r.width * r.height;
            } else {
                outsideArea += r.width * r.height;
            }
        }

        bound.level = 0;
        circleIntersection.subdivideRectangle(bound, examineRectangle);

        var uncertain = (bound.width * bound.height - area - outsideArea)/2;
        return [area + uncertain, uncertain];
    };

    /** returns whether a point is contained by all of a list of circles */
    circleIntersection.containedInCircles = function(point, circles) {
        for (var i = 0; i < circles.length; ++i) {
            if (circleIntersection.distance(point, circles[i]) > circles[i].radius + SMALL) {
                return false;
            }
        }
        return true;
    };

    /** Gets all intersection points between a bunch of circles */
    circleIntersection.getIntersectionPoints = function(circles) {
        var ret = [];
        for (var i = 0; i < circles.length; ++i) {
            for (var j = i + 1; j < circles.length; ++j) {
                var intersect = circleIntersection.circleCircleIntersection(circles[i],
                                                              circles[j]);
                for (var k = 0; k < intersect.length; ++k) {
                    var p = intersect[k];
                    p.parentIndex = [i,j];
                    ret.push(p);
                }
            }
        }
        return ret;
    }

    circleIntersection.circleIntegral = function(r, x) {
        var y = Math.sqrt(r * r - x * x);
        return x * y + r * r * Math.atan2(x, y);
    };

    /** Returns the area of a circle of radius r - up to width */
    circleIntersection.circleArea = function(r, width) {
        return circleIntersection.circleIntegral(r, width - r) - circleIntersection.circleIntegral(r, -r);
    };


    /** euclidean distance between two points */
    circleIntersection.distance = function(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) +
                         (p1.y - p2.y) * (p1.y - p2.y));
    };


    /** Returns the overlap area of two circles of radius r1 and r2 - that
    have their centers separated by distance d. Simpler faster
    circle intersection for only two circles */
    circleIntersection.circleOverlap = function(r1, r2, d) {
        // no overlap
        if (d >= r1 + r2) {
            return 0;
        }

        // completly overlapped
        if (d <= Math.abs(r1 - r2)) {
            return Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
        }

        var w1 = r1 - (d * d - r2 * r2 + r1 * r1) / (2 * d),
            w2 = r2 - (d * d - r1 * r1 + r2 * r2) / (2 * d);
        return circleIntersection.circleArea(r1, w1) + circleIntersection.circleArea(r2, w2);
    };


    /** Given two circles (containing a x/y/radius attributes),
    returns the intersecting points if possible.
    note: doesn't handle cases where there are infinitely many
    intersection poiints (circles are equivalent):, or only one intersection point*/
    circleIntersection.circleCircleIntersection = function(p1, p2) {
        var d = circleIntersection.distance(p1, p2),
            r1 = p1.radius,
            r2 = p2.radius;

        // if to far away, or self contained - can't be done
        if ((d >= (r1 + r2)) || (d <= Math.abs(r1 - r2))) {
            return [];
        }

        var a = (r1 * r1 - r2 * r2 + d * d) / (2 * d),
            h = Math.sqrt(r1 * r1 - a * a),
            x0 = p1.x + a * (p2.x - p1.x) / d,
            y0 = p1.y + a * (p2.y - p1.y) / d,
            rx = -(p2.y - p1.y) * (h / d),
            ry = -(p2.x - p1.x) * (h / d);

        return [{ x: x0 + rx, y : y0 - ry },
                { x: x0 - rx, y : y0 + ry }];
    };

    /** Returns the center of a bunch of points */
    circleIntersection.getCenter = function(points) {
        var center = { x: 0, y: 0};
        for (var i =0; i < points.length; ++i ) {
            center.x += points[i].x;
            center.y += points[i].y;
        }
        center.x /= points.length;
        center.y /= points.length;
        return center;
    };

    circleIntersection.randomPoint = function(rect) {
        return { x: rect.x + Math.random() * rect.width,
                 y: rect.y + Math.random() * rect.height};
    };

    circleIntersection.getBoundingRectangle = function(circles) {
        function contained(p) {
            return circleIntersection.containedInCircles(p, circles); 
        } 
        var intersectionPoints = circleIntersection.getIntersectionPoints(circles);
        var inner = intersectionPoints.filter(contained);

        var x1 = Math.min.apply(null, inner.map(function (p) { return p.x; })),
            y1 = Math.min.apply(null, inner.map(function (p) { return p.y; })),
            x2 = Math.max.apply(null, inner.map(function (p) { return p.x; })),
            y2 = Math.max.apply(null, inner.map(function (p) { return p.y; }));
        
        for (var i = 0; i < circles.length; ++i) {
            var p = circles[i];
            if ((p.x - p.radius < x1) && (contained({x: p.x - p.radius, y:p.y}))) {
                x1 = p.x - p.radius
            }
            if ((p.x + p.radius > x2) && (contained({x:p.x + p.radius, y:p.y}))) {
                x2 = p.x + p.radius
            }
            if ((p.y - p.radius < y1) && (contained({y: p.y - p.radius, x:p.x}))) {
                y1 = p.y - p.radius
            }
            if ((p.y + p.radius > y2) && (contained({y:p.y + p.radius, x:p.x}))) {
                y2 = p.y + p.radius
            }
        }

        return { x: x1, y : y1, height : y2 - y1, width : x2 - x1};
    };
}(window.circleIntersection = window.circleIntersection || {}));

