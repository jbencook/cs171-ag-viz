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

var bbPrice = {
    x: bbFieldVis.w,
    y: bbYieldHist.h,
    w: width*0.40,
    h: height - bbYieldHist.h
};


// Color scale for field -- Needs work
var colors = d3.scale.quantize()
    .range(colorbrewer.YlGn[9])
    // .range([colorMin, colorMax])
    // .interpolate(d3.interpolateHcl);

// Define map projection
var projection = d3.geo.albers().scale(5000000);

// Define path generator
var path = d3.geo.path().projection(projection);

// Axes and Scale for histogram
var xAxis, yAxis, xScale, yScale;
var xAxis_soil, yAxis_soil, xScale_soil, yScale_soil

// Globals for interaction between sections
var bar;
var brushHist = d3.svg.brush();

// Formatters
var formatCount = d3.format(",.2f");
// var formatYield = d3.format(".2f");


// Add Title
var title = d3.select("#title")
    .style("text-align", "center")
    .append("text").attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", 0)
    .text("Local Crop Yield")

// Declare visualization areas
var canvas = d3.select("#fieldVis").append("svg").attr({
    width: bbFieldVis.w,
    height: bbFieldVis.h
    })

canvas.append("rect")
    .attr("class", "background")
    .attr("width", bbFieldVis.w)
    .attr("height", bbFieldVis.h)

var fieldVis = canvas.append("g");

var price = d3.select("#yieldDetail").append("svg").attr({
    width: bbPrice.w,
    height: bbPrice.h
    })

price.append("rect")
    .attr("class", "background")
    .attr("width", bbPrice.w)
    .attr("height", bbPrice.h)

var yieldHist = d3.select("#yieldHist").append("svg").attr({
    width: bbYieldHist.w,
    height: bbYieldHist.h
    })

yieldHist.append("rect")
    .attr("class", "background")
    .attr("width", bbYieldHist.w)
    .attr("height", bbYieldHist.h)

var yieldMeta = d3.select("#yieldDetail2").append("svg").attr({
    width: bbYieldMeta.w,
    height: bbYieldMeta.h
    })

yieldMeta.append("rect")
    .attr("class", "background")
    .attr("width", bbYieldMeta.w)
    .attr("height", bbYieldMeta.h)





// Load data and create visualizations
queue()
    .defer(d3.json, "../data/nebraska.geojson")
    .defer(d3.csv, "../data/wmk5_2009_small.csv")
    .defer(d3.csv, "../data/price.csv")
    .await(createVis)


 // Create the Google Map…
// map = new google.maps.Map(d3.select("#fieldVis").node(), {
//   zoom: 8,
//   center: new google.maps.LatLng(41.251073956522, -97.1449267811),
//   mapTypeId: google.maps.MapTypeId.TERRAIN
// });

function createVis(error, geo_data, yield_data, price) {

    createYieldMeta();

    var x = path.centroid(geo_data.features[2]);

    // console.log(x)
    loadMap(x)
    
    projection.translate([bbFieldVis.w - x[0], bbFieldVis.h - x[1]]);

    timeSeries(price);

    point = fieldVis.selectAll(".point")
        .data(yield_data)
        .enter()
        .append("rect")
        .attr("class", "point")
        .attr("soil", function(d) {
            return d.soil
        })
        .attr("x", function(d) {
            return projection([d.lon, d.lat])[0];
        })
        .attr("y", function(d) {
            return projection([d.lon, d.lat])[1];
        })
        .attr("width", 7)
        .attr("height", 7)
        // .attr("bin", function(d) {
        //     return d.yield_binned;
        // })
        .attr("yield", function(d) {
            return d.yld;
        })
        // .style("fill", function(d) {
        //     return d.color;
        // })
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

    histYield(yield_data)
    histSoil(yield_data)
 
}

function loadMap(center_coord) {
    // Create the Google Map…
    var map = new google.maps.Map(d3.select("#map").node(), {
      zoom: 16,
      center: new google.maps.LatLng(41.2531, -97.1440),
      mapTypeId: google.maps.MapTypeId.HYBRID
    });

    // Load the station data. When the data comes back, create an overlay.
    // d3.json("stations.json", function(data) {
      var overlay = new google.maps.OverlayView();
     
      // Add the container when the overlay is added to the map.
      overlay.onAdd = function() {
     
        // Draw each marker as a separate SVG element.
        // We could use a single SVG, but what size would it have?
        overlay.draw = function() {
          var projection = this.getProjection(),
              padding = 10;
     
          function transform(d) {
            d = new google.maps.LatLng(d.value[1], d.value[0]);
            d = projection.fromLatLngToDivPixel(d);
            return d3.select(this)
                .style("left", (d.x - padding) + "px")
                .style("top", (d.y - padding) + "px");
          }
        };
      };
     
      // Bind our overlay to the map…
      overlay.setMap(map);
}

function generate_legend(data){
    var legend_ticks = 100
    var legend_height = 75
    var legend_color_scale = d3.scale.quantize().domain([0,legend_ticks]).range(colorbrewer.YlGn[9])
    
    d3.range(legend_ticks).reverse().forEach(function(i) {
        console.log(i)
        yieldMeta.append('rect')
           .attr('class', 'legend_box')
           .attr('x', bbYieldMeta.w-100)
           .attr('y',  (legend_height/legend_ticks)*(legend_ticks.length - i) + 100)
           .attr('height', 10)
           .attr('width', 10)
           .style('fill', legend_color_scale(i))
        })
    yieldMeta.append('text').attr('class', 'legend_tick').attr('x', bbYieldMeta.w-75).attr('y',  15).text('Bu/Acre')
    yieldMeta.append('text').attr('class', 'legend_tick').attr('x', bbYieldMeta.w-75).attr('y', 30).text(d3.max(data))
    yieldMeta.append('text').attr('class', 'legend_tick').attr('x', bbYieldMeta.w-75).attr('y',  30+legend_height).text(d3.min(data))

}

var histYield_data, binWidth;

function histYield(yield_data) {

    var values = []
    yield_data.forEach(function(d) {values.push(parseInt(d.yld))})

    xScale = d3.scale.linear()
        .domain([d3.min(values),d3.max(values)])
        .range([25, bbYieldHist.w - 25]);

    colors.domain(d3.extent(values));

    // Generate a histogram using twenty uniformly-spaced bins.
    var histYield_data = d3.layout.histogram()
        //.bins(xScale.ticks(20))
        (values);

    binWidth = (d3.extent(values)[1] - d3.extent(values)[0]) / histYield_data.length


    point.attr("bin", function(d) {
            return Math.round((d.yld / binWidth) - 1)
        })
        .style("fill", function(d) {
            return colors(d.yld)
        })

    yScale = d3.scale.linear()
        .domain([0, d3.max(histYield_data, function(d) { return d.y; })])
        .range([bbYieldHist.h-25, 25]);
    
    xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom"); 

    yieldHist.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (bbYieldHist.h - 25) + ")")
        .call(xAxis);


    bar = yieldHist.selectAll(".bar")
        .data(histYield_data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + (yScale(d.y) + 25) + ")"; });

    bar.append("rect")
        .attr("x", 1)
        .attr("y", -25)
// <<<<<<< HEAD
//         .attr("width", xScale(histYield_data[0].dx) - 15)
//         .attr("height", function(d) { return (bbYieldHist.h - yScale(d.y) - 25); })
//         .on("click", getBarYield);

//     bar.append("text")
//         .attr("dy", ".75em")
//         .attr("y", -35)
//         .attr("x", xScale(histYield_data[0].dx - 12) / 2)
//         .attr("text-anchor", "middle")
//         .text(function(d) { return formatCount(d.y / values.length * 100); })
//         // .on("click", getBarYield);;

//     generate_legend(values)  
// =======
// //        .attr("width", xScale(histYield_data[0].dx) - 15)
        .attr("width", 20)
        .attr("height", function(d) { return (bbYieldHist.h - yScale(d.y) - 25); });

// >>>>>>> daa5bc605fa20315f0d4c2adba696f99676c6c77
    // Add histogram brush
    // brushHist

    brushHist
        .x(d3.scale.linear().domain(d3.extent(values)).range([25, bbYieldHist.w - 25]))
        // .x(d3.scale.linear().domain([0, 100]).range([25, bbYieldHist.w - 25]))
        .on("brush", brushedHist)

    yieldHist.append("g")
        .attr("class", "brush")
        .call(brushHist)
        .selectAll("rect")
        .attr("y", 25)
        .attr("height", bbYieldHist.h - 50)
        // .on("mouseup", highlightBrushedYield);
}

function histSoil(yield_data) {

    var soil_data = {}

    xScale_soil = d3.scale.ordinal()
        .rangeRoundBands([25, bbYieldHist.w-25], .8, 0)
        .domain(d3.keys(soil_data))

    var soil_data = d3.nest()
        .key(function(d) { return d.soil}).sortKeys(d3.ascending)
        .rollup(function(i) { return i.length; })
        .entries(yield_data)   

    var data = d3.layout.histogram()
        (yield_data.map(function(d){return d.soil}));


}



function brushedHist() {
    var extent = brushHist.extent();
    bar.selectAll("rect").style("fill", function(d) {
        if((d.x + d.dx >= extent[0]) & (d.x < extent[1])) {
            return "#f1a340"
        } else {
            return null
        }
    });
    highlightBrushedYield();

}

function highlightBrushedYield(){
    var extent = brushHist.extent();
    point.transition().style("fill", function(pt) {
        if(pt.yld >= Math.round((extent[0] / binWidth) - 1) * binWidth & pt.yld <= Math.round((extent[1] / binWidth)) * binWidth) {
            return "#f1a340";
        } else {
            return colors(pt.yld);
        }
    });

}

// var brushField = d3.svg.brush()
//     .x(d3.scale.linear().domain([0, 100]).range([0, bbFieldVis.w]))
//     .y(d3.scale.identity().domain([0, bbFieldVis.h]))

//     .on("brush", brushedField);

fieldVis.append("g")
    .attr("class", "brush")
//    .call(brushField)
    .selectAll("rect")
    .attr("height", bbFieldVis.h);

function brushedField() {
}



var showYield = function(d) {
    yieldMeta.selectAll('[kind="yield"]')
      .text(formatCount(d.yld) + " (bu / ac)");
    yieldMeta.selectAll('[kind="elevation"]')
      .text(Math.round(d.elevation) + " (ft)");
    yieldMeta.selectAll('[kind="soil"]')
      .text(d.soil)
      // .style("fill", "blue")
      // .style("text-decoration", "underline");
    yieldMeta.selectAll('[kind="slopes"]')
      .text(d.slopes)
    yieldMeta.selectAll('[kind="lon"]')
      .text(d.lon)
    yieldMeta.selectAll('[kind="lat"]')
      .text(d.lat)
    //   .style("fill", "blue")
    //   .style("text-decoration", "underline");
    // yieldMeta.selectAll('[kind="soil_link"]')
    //   .attr("xlink:href", d.links)
    //   .attr("target", "_blank");
}

var hideYield = function(d) {
    d3.selectAll('[kind="yield"]')
      .text("");
    d3.selectAll('[kind="elevation"]')
      .text("");
    d3.selectAll('[kind="soil"]')
      .text("")
      // .style("fill", "blue")
      // .style("text-decoration", "underline");
    d3.selectAll('[kind="slopes"]')
      .text("")
    yieldMeta.selectAll('[kind="lon"]')
      .text("")
    yieldMeta.selectAll('[kind="lat"]')
      .text("")
      // .style("fill", "blue")
      // .style("text-decoration", "underline");
    // d3.selectAll('[kind="soil_link"]')
    //   .attr("xlink:href", d.links)
    //   .attr("target", "_blank");
}

function createYieldMeta() {
    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 25)
       .text("Elevation")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 16);                    

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 50)
       .attr("kind", "elevation")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 20);        

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 75)
       .text("Longitude")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 16);                    

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 95)
       .attr("kind", "lon")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 20);       

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 120)
       .text("Latitude")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 16);                    

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 140)
       .attr("kind", "lat")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 20);        

    yieldMeta.append("text")
       .attr("x", 240)
       .attr("y", 30)
       .text("Point Yield")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 18);                

    yieldMeta.append("text")
       .attr("x", 240)
       .attr("y", 60)
       .attr("kind", "yield")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 24);                

    yieldMeta.append("text")
       .attr("x", 240)
       .attr("y", 100)
       .text("Soil Profile")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 20);

    yieldMeta.append("a")
        .attr("kind", "soil_link")
        .append("text")
        .attr("x", 240)
        .attr("y", 125)
        .attr("kind", "soil")                       
        .style("fill", "grey")
        .style("font-weight", "bold")
        .style("font-size", 16);

    // yieldMeta.append("a")
    //     .attr("kind", "soil_link")
    //     .append("text")
    //     .attr("x", 200)
    //     .attr("y", 75)
    //     .attr("kind", "slopes")
    //     .style("fill", "grey")
    //     .style("font-weight", "bold")
    //     .style("font-size", 16);                    
}


var timeSeries = function(data) {
    var parseDate = d3.time.format("%Y-%m").parse;

    var x = d3.time.scale()
    .range([20, bbPrice.w - 50]);

    var y = d3.scale.linear()
        .range([bbPrice.h/2, 20]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(5)
        .orient("right");

    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.price); });

    data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.price = +d.price;
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain(d3.extent(data, function(d) { return d.price; }));

    price.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (bbPrice.h/2 + 20) + ")")
      .call(xAxis); 

    price.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + (bbPrice.w - 40) + ",0)")
      .call(yAxis)
      .append("text")
      .attr("dy", ".71em")
      .style("text-anchor", "end");

    price.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);

    price.append("text")
       .attr("x", 20)
       .attr("y", bbPrice.h/2 + 150)
       .text("Value of Field:")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 20);

    price.append("text")
       .attr("x", 180)
       .attr("y", bbPrice.h/2 + 150)
       .attr("kind", "value")
       .text("$ 1 quadrillion")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 24);

}
