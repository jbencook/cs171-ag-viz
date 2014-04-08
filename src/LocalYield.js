//Width and height
var w = 960;
var h = 500;

var title = d3.select("#title")
    .style("text-align", "center")
    .append("text").attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", w/2)
    .attr("y", 0)
    .text("Local Crop Yield")

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return "<span style='color:yellow'>" + d.yield + " (bu/ac) </span>";
  });

var yield = function(d) {
    d3.selectAll('[kind="yield"]')
      .text(d.yield + " (bu / ac)");
    d3.selectAll('[kind="elevation"]')
      .text(Math.round(d.elevation) + " (ft)");
    d3.selectAll('[kind="soil"]')
      .text(d.soil)
      .style("fill", "blue")
      .style("text-decoration", "underline");
    d3.selectAll('[kind="slopes"]')
      .text(d.slopes)
      .style("fill", "blue")
      .style("text-decoration", "underline");
    d3.selectAll('[kind="soil_link"]')
      .attr("xlink:href", d.links)
      .attr("target", "_blank");
}


//Define quantize scale to sort data values into buckets of color
var color = d3.scale.linear()
                    .interpolate(d3.interpolateRgb)
                    .range(["red","#004529"]);

//Load in GeoJSON data
d3.json("../data/nebraska.geojson", function(json) {

    //Define map projection
    var projection = d3.geo.albers();

    //Define path generator
    var path = d3.geo.path()
                     .projection(projection);

    
    projection.scale(5000000);

    var x = path.centroid(json.features[2]);

    console.log(x);
    console.log([w,h]);

    projection.translate([w - x[0], h - x[1]]);
        

    console.log(path.centroid(json.features[2]));

    //Create SVG element
    var svg = d3.select("#localYield")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

    svg.call(tip);                          

    var g = svg.append("g");

    //g.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")scale(" + k + ")translate(" + -x[0] + "," + -x[1] + ")");

    var x = path.centroid(json.features[2]);
    var k = 6000;
    
    //Bind data and create one path per GeoJSON feature
    g.selectAll("path")
       .data(json.features)
       .enter()
       .append("path")
       .attr("d", path)
       .style("fill", "white")
       .style("stroke", "white");

    svg.append("text")
       .attr("x", 700)
       .attr("y", 135)
       .text("Yield")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 24);                

    svg.append("text")
       .attr("x", 700)
       .attr("y", 175)
       .attr("kind", "yield")
       .text("___  (bu / ac)")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 34);

    svg.append("text")
       .attr("x", 700)
       .attr("y", 225)
       .text("Elevation")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 24);                    

    svg.append("text")
       .attr("x", 700)
       .attr("y", 265)
       .attr("kind", "elevation")
       .text("____ (ft)")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 34);                        

    svg.append("text")
       .attr("x", 700)
       .attr("y", 315)
       .text("Soil Profile")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 24);

    svg.append("a")
        .attr("kind", "soil_link")
        .append("text")
        .attr("x", 700)
        .attr("y", 345)
        .attr("kind", "soil")                       
        .text("________________")
        .style("fill", "grey")
        .style("font-weight", "bold")
        .style("font-size", 18);

    svg.append("a")
        .attr("kind", "soil_link")
        .append("text")
        .attr("x", 700)
        .attr("y", 375)
        .attr("kind", "slopes")
        .text("________________")
        .style("fill", "grey")
        .style("font-weight", "bold")
        .style("font-size", 18);                    

    d3.csv("../data/local-yield_04042014.csv", function(data) {

        color.domain([
            d3.min(data, function(d) { return d.yield; }), 
            d3.max(data, function(d) { return d.yield; })
        ]);                 
        
        svg.selectAll("circle")
           .data(data)
           .enter()
           .append("circle")
           .attr("cx", function(d) {
               return projection([d.lon, d.lat])[0];
           })
           .attr("cy", function(d) {
               return projection([d.lon, d.lat])[1];
           })
           .attr("r", 2.5)
           .attr("bin", function(d) {
            return d.yield_binned;
           })
           .style("fill", function(d) {
                return d.color;
           })
           .style("opacity", 1)
           .on('click', yield);

            /*                     
           .on("mouseover", function(d) {
                d3.select(this).style("fill", "white");
             });
           .on("mouseout", function(d) {
                d3.select(this).style("fill", function(d) {
                    return color(d.yield);
                })
           });
            */

        lon_max = d3.max(data, function(d) { return d.lon; });
        lat_max = d3.max(data, function(d) { return d.lat; });
        console.log(projection([lon_max, lat_max]));

        /*svg.append("rect")
           .attr("x", 775)
           .attr("y", 100)
           .attr("width", 250)
           .attr("height", 600)
           .style("fill", "lightgrey");*/



    
});                

});