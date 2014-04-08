/**
 * Charles Hornbaker
 * CS171 Project
 * 7 April 2014
 */

// Set margins and vis boundaries
var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1300 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;

var bbFieldVis = {
    x: 0,
    y: 0,
    w: width*0.60,
    h: height - 150
};

var bbYieldDetail = {
    x: bbFieldVis.w,
    y: 0,
    w: width*0.40,
    h: height/2
};

var bbYieldMeta = {
    x: 0,
    y: height - 150,
    w: width*0.60,
    h: 150
};

var bbYieldHist = {
    x: bbFieldVis.w,
    y: 0,
    w: width*0.40,
    h: height/2
};

var colorMin = colorbrewer.Greens[3][0];
var colorMax = colorbrewer.Greens[3][2];
var colors = d3.scale.linear()
    .range([colorMin, colorMax])
    .interpolate(d3.interpolateHcl);

// Add Title
var title = d3.select("#title")
    .style("text-align", "center")
    .append("text").attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", 0)
    .text("Local Crop Yield")

// Declare three visualization areas
var canvas = d3.select("#fieldVis").append("svg").attr({
    width: bbFieldVis.w,
    height: bbFieldVis.h
    })

canvas.append("rect")
    .attr("class", "background")
    .attr("width", bbFieldVis.w)
    .attr("height", bbFieldVis.h)

var fieldVis = canvas.append("g");

var yieldDetail = d3.select("#yieldDetail").append("svg").attr({
    width: bbYieldDetail.w,
    height: bbYieldDetail.h
    })

var yieldHist = d3.select("#yieldHist").append("svg").attr({
    width: bbYieldHist.w,
    height: bbYieldHist.h
    })

var yieldMeta = d3.select("#yieldDetail2").append("svg").attr({
    width: bbYieldMeta.w,
    height: bbYieldMeta.h
    })

yieldDetail.append("rect")
    .attr("class", "background")
    .attr("width", bbYieldDetail.w)
    .attr("height", bbYieldDetail.h)

yieldHist.append("rect")
    .attr("class", "background")
    .attr("width", bbYieldHist.w)
    .attr("height", bbYieldHist.h)

yieldMeta.append("rect")
    .attr("class", "background")
    .attr("width", bbYieldMeta.w)
    .attr("height", bbYieldMeta.h)

// Define map projection
var projection = d3.geo.albers().scale(5000000);

// Define path generator
var path = d3.geo.path().projection(projection);

// Axes and Scale for histogram
var xAxis, yAxis, xScale, yScale;

var bar;
var brushHist = d3.svg.brush();


// A formatter for counts.
var formatCount = d3.format(",.2f");

queue()
    .defer(d3.json, "../data/nebraska.geojson")
    .defer(d3.csv, "../data/local-yield_04042014.csv")
    .await(createVis)

function createVis(error, geo_data, yield_data) {

    createYieldMeta();

    var x = path.centroid(geo_data.features[2]);

    projection.translate([bbFieldVis.w - x[0], bbFieldVis.h - x[1]]);

    var g = fieldVis.append("g");
    // var k = 6000
    // g.attr("transform", "translate(" + bbFieldVis.w / 2 + "," + bbFieldVis.h / 2 + ")scale(" + k + ")translate(" + -x[0] + "," + -x[1] + ")");

    point = fieldVis.selectAll(".point")
        .data(yield_data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("soil", function(d) {
            return d.soil
        })
        .attr("cx", function(d) {
            return projection([d.lon, d.lat])[0];
        })
        .attr("cy", function(d) {
            return projection([d.lon, d.lat])[1];
        })
        .attr("r", 2.5)
        // .attr("bin", function(d) {
        //     return d.yield_binned;
        // })
        .attr("yield", function(d) {
            return d.yield;
        })
        .style("fill", function(d) {
            return d.color;
        })
        .style("opacity", 1)
        .on("mouseover", showYield)
        .on("mouseout", hideYield)
        .on("click", function(d) {
            fieldVis.selectAll(".point")
                .transition().duration(0)
                .style("opacity", 0.1)
            fieldVis.selectAll("[soil = '" + d.soil + "']")
                .transition().duration(0)
                .style("opacity", 1)
            
        })

    fieldVis.selectAll(".background")
        .on("click", function(d) {
            fieldVis.selectAll(".point")
                .transition().duration(0)
                .style("opacity", 1)
            
        })

    createHist(yield_data)

}

function createHist(yield_data) {

    var values = []
    yield_data.forEach(function(d) {values.push(parseInt(d.yield))})

    xScale = d3.scale.linear()
        .domain(d3.extent(values))
        .range([25, bbYieldHist.w - 25]);

    colors.domain(d3.extent(values));

    // Generate a histogram using twenty uniformly-spaced bins.
    var data = d3.layout.histogram()
        // .bins(xScale.ticks(20))
        (values);

    var binWidth = (d3.extent(values)[1] - d3.extent(values)[0]) / data.length


    // point
    //     .attr("bin", function(d) {
    //         return Math.round(d.yield / binWidth) - 1)
    //     })
        // .style("fill", function(d) {
        //     return colors(d.yield)
        // })
    yield_data.slice(1,100).forEach(function(d){console.log(d.yield, Math.round(d.yield / binWidth) - 1)})    

    yScale = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([bbYieldHist.h-25, 25]);
    
    xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom"); 

    yieldHist.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (bbYieldHist.h - 25) + ")")
        .call(xAxis);


    bar = yieldHist.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + (yScale(d.y) + 25) + ")"; });

    bar.append("rect")
        .attr("x", 1)
        .attr("y", -25)
        .attr("width", xScale(data[0].dx) - 15)
        .attr("height", function(d) { return (bbYieldHist.h - yScale(d.y) - 25); })
        .on("click", getBarYield);

    bar.append("text")
        .attr("dy", ".75em")
        .attr("y", -35)
        .attr("x", xScale(data[0].dx - 12) / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.y / values.length * 100); })
        // .on("click", getBarYield);;

    console.log(data)    
    // Add histogram brush
    brushHist.x(d3.scale.linear().domain(d3.extent(values)).range([25, bbYieldHist.w - 25]));
}

brushHist
    .x(d3.scale.linear().domain([0, 100]).range([25, bbYieldHist.w - 25]))
    .on("brush", brushedHist);

yieldHist.append("g")
    .attr("class", "brush")
    .call(brushHist)
    .selectAll("rect")
    .attr("y", 25)
    .attr("height", bbYieldHist.h - 50)

function brushedHist() {
    var extent = brushHist.extent();
    bar.selectAll("rect").style("fill", function(d) {
        if((d.x + d.dx >= extent[0]) & (d.x < extent[1])) {
            return "violet"
        } else {
            return null
        }
    });

    // point.transition().style("fill", function(pt) {
    //     if(pt.yield >= extent[0] & pt.yield < extent[1]) {
    //         return "violet";
    //     } else {
    //         return pt.color;
    //     }
    // });
}

var brushField = d3.svg.brush()
    .x(d3.scale.linear().domain([0, 100]).range([0, bbFieldVis.w]))
    .y(d3.scale.identity().domain([0, bbFieldVis.h]))

    .on("brush", brushedField);

fieldVis.append("g")
    .attr("class", "brush")
    .call(brushField)
    .selectAll("rect")
    .attr("height", bbFieldVis.h);

function brushedField() {
    // var extent = brushField.extent();
    // bar.selectAll("rect").style("fill", function(d) {
    //     if((d.x + d.dx >= extent[0]) & (d.x < extent[1])) {
    //         return "violet"
    //     } else {
    //         return null
    //     }
    // });
    // point.transition().style("fill", function(pt) {
    //     if(pt.yield >= extent[0] & pt.yield < extent[1]) {
    //         return "violet";
    //     } else {
    //         return pt.color;
    //     }
    // });
}





function getBarYield(d) {
    bar.selectAll("rect").style("fill", null);
    bar.selectAll("text").style("fill", null);
    d3.select(this).style("fill", "violet");
    // point.selectAll("[bin='" +  + "']")

    point.transition().style("fill", function(pt) {
        if(pt.yield >= d.x & pt.yield < (d.dx+d.x)) {
            return "violet";
        } else {
            return pt.color;
        }
    })
}


var showYield = function(d) {
    yieldMeta.selectAll('[kind="yield"]')
      .text(d.yield + " (bu / ac)");
    yieldMeta.selectAll('[kind="elevation"]')
      .text(Math.round(d.elevation) + " (ft)");
    yieldMeta.selectAll('[kind="soil"]')
      .text(d.soil)
      .style("fill", "blue")
      .style("text-decoration", "underline");
    yieldMeta.selectAll('[kind="slopes"]')
      .text(d.slopes)
      .style("fill", "blue")
      .style("text-decoration", "underline");
    yieldMeta.selectAll('[kind="soil_link"]')
      .attr("xlink:href", d.links)
      .attr("target", "_blank");
}

var hideYield = function(d) {
    d3.selectAll('[kind="yield"]')
      .text("");
    d3.selectAll('[kind="elevation"]')
      .text("");
    d3.selectAll('[kind="soil"]')
      .text("")
      .style("fill", "blue")
      .style("text-decoration", "underline");
    d3.selectAll('[kind="slopes"]')
      .text("")
      .style("fill", "blue")
      .style("text-decoration", "underline");
    d3.selectAll('[kind="soil_link"]')
      .attr("xlink:href", d.links)
      .attr("target", "_blank");
}

function createYieldMeta() {
    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 30)
       .text("Yield")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 20);                

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 60)
       .attr("kind", "yield")
       .text("___  (bu / ac)")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 24);

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 100)
       .text("Elevation")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 20);                    

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 130)
       .attr("kind", "elevation")
       .text("____ (ft)")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 24);                        

    yieldMeta.append("text")
       .attr("x", 200)
       .attr("y", 30)
       .text("Soil Profile")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 20);

    yieldMeta.append("a")
        .attr("kind", "soil_link")
        .append("text")
        .attr("x", 200)
        .attr("y", 55)
        .attr("kind", "soil")                       
        .text("________________")
        .style("fill", "grey")
        .style("font-weight", "bold")
        .style("font-size", 16);

    yieldMeta.append("a")
        .attr("kind", "soil_link")
        .append("text")
        .attr("x", 200)
        .attr("y", 75)
        .attr("kind", "slopes")
        .text("________________")
        .style("fill", "grey")
        .style("font-weight", "bold")
        .style("font-size", 16);                    
}

var zoom = d3.behavior.zoom()
    .scaleExtent([1,8])
    .on("zoom", zoomToBB);

fieldVis.call(zoom)

function zoomToBB() {
    projection.translate(d3.event.translate).scale(d3.event.scale);
    fieldVis.transition().duration(0)
        // .style("stroke-width", 1/d3.event.scale + "px");
    fieldVis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
}

    /*                     
    .on("mouseover", function(d) {
        d3.select(this).style("fill", "white");
     });
    .on("mouseout", function(d) {
        d3.select(this).style("fill", function(d) {
            return color(d.yield);
        })
    });

};

// var tip = d3.tip()
//   .attr('class', 'd3-tip')
//   .offset([-10, 0])
//   .html(function(d) {
//     return "<span style='color:yellow'>" + d.yield + " (bu/ac) </span>";
//   });

// var yield = function(d) {
//     d3.selectAll('[kind="yield"]')
//       .text(d.yield + " (bu / ac)");
//     d3.selectAll('[kind="elevation"]')
//       .text(Math.round(d.elevation) + " (ft)");
//     d3.selectAll('[kind="soil"]')
//       .text(d.soil)
//       .style("fill", "blue")
//       .style("text-decoration", "underline");
//     d3.selectAll('[kind="slopes"]')
//       .text(d.slopes)
//       .style("fill", "blue")
//       .style("text-decoration", "underline");
//     d3.selectAll('[kind="soil_link"]')
//       .attr("xlink:href", d.links)
//       .attr("target", "_blank");
// }





// //Define quantize scale to sort data values into buckets of color
// var color = d3.scale.linear()
//                     .interpolate(d3.interpolateRgb)
//                     .range(["red","#004529"]);

// //Load in GeoJSON data
// d3.json("../data/nebraska.geojson", function(json) {

//     //Define map projection
//     var projection = d3.geo.albers();

//     //Define path generator
//     var path = d3.geo.path()
//                      .projection(projection);

    
//     projection.scale(5000000);

//     var x = path.centroid(json.features[2]);

//     console.log(x);
//     console.log([width,height]);

//     projection.translate([width - x[0], height - x[1]]);
        

//     console.log(path.centroid(json.features[2]));

//     //Create SVG element
//     var svg = d3.select("#localYield")
//                 .append("svg")
//                 .attr("width", width)
//                 .attr("height", height);

//     svg.call(tip);                          

//     var g = svg.append("g");

//     //g.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")scale(" + k + ")translate(" + -x[0] + "," + -x[1] + ")");

//     var x = path.centroid(json.features[2]);
//     var k = 6000;
    
//     //Bind data and create one path per GeoJSON feature
//     g.selectAll("path")
//        .data(json.features)
//        .enter()
//        .append("path")
//        .attr("d", path)
//        .style("fill", "white")
//        .style("stroke", "white");

//     svg.append("text")
//        .attr("x", 700)
//        .attr("y", 135)
//        .text("Yield")
//        .style("fill", "black")
//        .style("font-weight", "bold")
//        .style("font-size", 24);                

//     svg.append("text")
//        .attr("x", 700)
//        .attr("y", 175)
//        .attr("kind", "yield")
//        .text("___  (bu / ac)")
//        .style("fill", "grey")
//        .style("font-weight", "bold")
//        .style("font-size", 34);

//     svg.append("text")
//        .attr("x", 700)
//        .attr("y", 225)
//        .text("Elevation")
//        .style("fill", "black")
//        .style("font-weight", "bold")
//        .style("font-size", 24);                    

//     svg.append("text")
//        .attr("x", 700)
//        .attr("y", 265)
//        .attr("kind", "elevation")
//        .text("____ (ft)")
//        .style("fill", "grey")
//        .style("font-weight", "bold")
//        .style("font-size", 34);                        

//     svg.append("text")
//        .attr("x", 700)
//        .attr("y", 315)
//        .text("Soil Profile")
//        .style("fill", "black")
//        .style("font-weight", "bold")
//        .style("font-size", 24);

//     svg.append("a")
//         .attr("kind", "soil_link")
//         .append("text")
//         .attr("x", 700)
//         .attr("y", 345)
//         .attr("kind", "soil")                       
//         .text("________________")
//         .style("fill", "grey")
//         .style("font-weight", "bold")
//         .style("font-size", 18);

//     svg.append("a")
//         .attr("kind", "soil_link")
//         .append("text")
//         .attr("x", 700)
//         .attr("y", 375)
//         .attr("kind", "slopes")
//         .text("________________")
//         .style("fill", "grey")
//         .style("font-weight", "bold")
//         .style("font-size", 18);                    

//     var quadtree;
//     var point;



//     d3.csv("../data/local-yield_04042014.csv", function(data) {

//         color.domain([
//             d3.min(data, function(d) { return d.yield; }), 
//             d3.max(data, function(d) { return d.yield; })
//         ]);                 
        
//         point = svg.selectAll(".point")
//           .data(data)
//           .enter()
//           .append("circle")
//           .attr("class", "point")
//           .attr("cx", function(d) {
//              return projection([d.lon, d.lat])[0];
//           })
//           .attr("cy", function(d) {
//              return projection([d.lon, d.lat])[1];
//           })
//           .attr("r", 2.5)
//           .attr("bin", function(d) {
//           return d.yield_binned;
//           })
//           .style("fill", function(d) {
//               // if(d.soil == "Butler silt loam") {
//               //   return "blue"
//               // } else if(d.soil == "Fillmore silt loam") {
//               //   return "red"
//               // } else if(d.soil == "Olbut-Butler silt loams") {
//               //   return "violet"
//               // } else if(d.soil == "Hastings silty clay loam") {
//               //   return "yellow"
//               // }

//               return d.color;
//           })
//           .style("opacity", function(d){
//             return 1
//           })
//            .on('click', yield);

//             /*                     
//            .on("mouseover", function(d) {
//                 d3.select(this).style("fill", "white");
//              });
//            .on("mouseout", function(d) {
//                 d3.select(this).style("fill", function(d) {
//                     return color(d.yield);
//                 })
//            });
//             */

//         lon_max = d3.max(data, function(d) { return d.lon; });
//         lat_max = d3.max(data, function(d) { return d.lat; });
//         console.log(projection([lon_max, lat_max]));
//         console.log(data)
//         /*svg.append("rect")
//            .attr("x", 775)
//            .attr("y", 100)
//            .attr("width", 250)
//            .attr("height", 600)
//            .style("fill", "lightgrey");*/

//         // quadtree = d3.geom.quadtree()
//         //   .extent([[-1, -1], [w + 1, h + 1]])
//         //   (data);
//   // var brush = d3.svg.brush()
//   //   .x(d3.scale.identity().domain([0, w]))
//   //   .y(d3.scale.identity().domain([0, h]))
//   //   // .extent([[100, 100], [200, 200]])
//   //   .on("brush", brushed);

//   // svg.append("g")
//   //   .attr("class", "brush")
//   //   .call(brush);
  

  // // brushed();

  // function brushed() {
  //   var extent = brush.extent();
  //   // point.each(function(d) { d.scanned = d.selected = false; });
  //   // search(quadtree, extent[0][0], extent[0][1], extent[1][0], extent[1][1]);
  //   // point.classed("scanned", function(d) { return d.scanned; });
  //   // point.classed("selected", function(d) { return d.selected; });
  // }

  // svg.selectAll(".node")
  //   .data(nodes(quadtree))
  // .enter().append("rect")
  //   .attr("class", "node")
  //   .attr("x", function(d) { return d.x; })
  //   .attr("y", function(d) { return d.y; })
  //   .attr("width", function(d) { return d.width; })
  //   .attr("height", function(d) { return d.height; });

  // // console.log(quadtree.visit())
  // // Collapse the quadtree into an array of rectangles.
  // function nodes(quadtree) {
  //   var nodes = [];
  //   quadtree.visit(function(node, x1, y1, x2, y2) {
  //     nodes.push({x: x1, y: y1, width: x2 - x1, height: y2 - y1});
  //   });
  //   console.log(nodes)
  //   return nodes;
  // }

  // // Find the nodes within the specified rectangle.
  // function search(quadtree, x0, y0, x3, y3) {
  //   quadtree.visit(function(node, x1, y1, x2, y2) {
  //     var p = node.point;
  //     if (p) {
  //       console.log(p)
  //       p.scanned = true;
  //       p.selected = (p[0] >= x0) && (p[0] < x3) && (p[1] >= y0) && (p[1] < y3);
  //     }
  //     return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
  //   });
  // }

    
// });                

// });