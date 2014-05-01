
// Set margins and vis boundaries
var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1000;
var height = 700;
var koz = true;

var bbFieldVis = {
    x: 0,
    y: 0,
    w: width* 0.6,
    h: height* 0.8
};

var bbYieldMeta = {
    x: 0,
    y: bbFieldVis.h,
    w: width*0.60,
    h: height - bbFieldVis.h
};

var bbYieldHist = {
    x: bbFieldVis.w,
    y: 0,
    w: width - bbFieldVis.w,
    h: height/2
};

var bbPrice = {
    x: bbFieldVis.w,
    y: bbYieldHist.h,
    w: width*0.40,
    h: height - bbYieldHist.h
};

var weatherVis = {
    x: bbFieldVis.w,
    y: bbYieldHist.h+margin.top-25,
    w: 350,
    h: 250
}
// Color scale for field -- Needs work
var color_range = colorbrewer.YlGn[9];
var colors = d3.scale.quantize()
    .range(color_range);
    // .range([colorMin, colorMax])
    // .interpolate(d3.interpolateHcl);
    
var colors_grey = d3.scale.quantize()
    .range(colorbrewer.Greys[9]);

// Define map projection
var projection = d3.geo.albers().scale(18000000);
// Define path generator
var path = d3.geo.path().projection(projection);

// Axes and Scale for histogram
var xAxis; 
var yAxis;
var xScale;
var yScale;

var xAxis_soil;
var yAxis_soil; 
var xScale_soil; 
var yScale_soil;

// Global vars for interaction between sections
var bar
var bar2;
var bins;
var hist_values;

var brushHist;
var brushField;

var yieldMean;
var yieldMean_select;
var yield_range;


var legend_ticks = color_range.length;
var legend_height = 125;

// Formatters
var formatCount = d3.format(",.2f");
var formatCoords = d3.format(".4f");


var field_list = "../data/local_fields.csv"
var field_weather = '../data/local_climate.csv'
var field_file;
var local_field_info;
var current_field;
var offx, offy, proj;
var field_image;
var select_year;
var climate_data;
var months = ['Jan', 'Feb', "Mar", 'Apr', 'May', "Jun", 'Jul', 'Aug', "Sep", "Oct", "Nov", "Dec"]
var temp_color = ['orange']
var prcp_color = ['lightblue']
var legend_tick_color = ['ccc']
var weather_range = [3,10];

// Declare visualization areas
var canvas = d3.select("#fieldVis").append("svg")
    .attr("width", width)
    .attr("height", height);

canvas.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    // .style("fill", "blue");

field_image = canvas.append("g").append('image').attr('class', 'image')

var fieldVis = canvas.append("svg")
    .attr({
        width: bbFieldVis.w,
        height: bbFieldVis.h,
        x: bbFieldVis.x,
        y: bbFieldVis.y
    });

fieldVis.append("rect")
    .attr("class", "background")
    .attr("width", bbFieldVis.w)
    .attr("height", bbFieldVis.h)
    .on("click", function(d) {
            var select_values = [];
            histYield_select(select_values);            
    })


var price = d3.select("#yieldDetail").append("svg").attr({
    width: bbPrice.w,
    height: bbPrice.h
});

price.append("rect")
     .attr("class", "background")
     .attr("width", bbPrice.w)
     .attr("height", bbPrice.h);

var yieldHist = canvas.append("svg").attr({
    width: bbYieldHist.w,
    height: bbYieldHist.h,
    x: bbYieldHist.x,
    y: bbYieldHist.y
});

yieldHist.append("rect")
    .attr("class", "background")
    .attr("width", bbYieldHist.w)
    .attr("height", bbYieldHist.h);

var weather_vis = canvas.append('svg')
    .attr("width", weatherVis.w)
    .attr("height", weatherVis.h)
    .attr("x", weatherVis.x+15)
    .attr("y", weatherVis.y)
    .attr('id', 'weather')


weather_vis.append("rect")
    .attr("class", "background")
    .attr("width", weatherVis.w)
    .attr("height", weatherVis.h)

canvas.append("text").attr("class", "text")
    .attr("x", weatherVis.x+weatherVis.w/2+15)
    .attr("y", weatherVis.y+weatherVis.h-5)
    .attr("text-anchor", "middle")
    .style("text-align", "center")
    .style("fill", "black")
    // .style("font-weight", "bold")
    .style("font-size", 15)                
    .text("Growing Season Weather");
    

// Add Title
canvas.append("text").attr("class", "text")
    .attr("x", bbYieldHist.x + bbYieldHist.w/2)
    .attr("y", bbYieldHist.h + 20)
    .attr("text-anchor", "middle")
    .style("text-align", "center")
    .style("fill", "black")
    // .style("font-weight", "bold")
    .style("font-size", 15)                
    .text("Yield Distribution (Bu/Ac)");

var yieldMeta = canvas.append("svg")
    .attr({
    width: bbYieldMeta.w,
    height: bbYieldMeta.h,
    x: bbYieldMeta.x,
    y: bbYieldMeta.y
    });

yieldMeta.append("rect")
    .attr("class", "background")
    .attr("width", bbYieldMeta.w)
    .attr("height", bbYieldMeta.h);

// Add Title
var title = canvas.append("text").attr("class", "title")
    .attr("x", width/2 - 110)
    .attr("y", 35)
    .attr("text-anchor", "middle")
    .style("text-align", "center")
    .text("Local Crop Yield");

// Load data and create visualizations


queue()
    .defer(d3.csv, field_list)
    .defer(d3.csv, field_weather)
    .await(init);

function init(error, data, weather){

    local_field_info = data;

    climate_data = weather

    local_field_info.forEach(function(d) {
        // console.log(d[''])
        d3.select("#fieldList").append("li").append("a")
            .text(d.name + " " + d.year + " (" + d.crop + ")")
            .attr("value", d[''])
    });

    $(".dropdown-menu li a").on('mouseup', function(){
        current_field = local_field_info[$(this).attr('value')]
        field_file = "../" + current_field['path'];
        //console.log($(".btn btn-default btn-sm dropdown-toggle").__data__)
       
        select_year = current_field.year
      
        queue()
            // .defer(d3.json, "../data/nebraska.geojson")
            // .defer(d3.csv, "../data/wmk5_2009_small.csv")
            .defer(d3.csv, field_file)
            .await(createVis);
       });

    $('#fieldSelect .btn').on("click", function(d){
        // console.log(current_field, parseInt(current_field['']))
        // console.log(local_field_info[parseInt(current_field[''])])
        // console.log($(this).attr('value'))
        if ($(this).attr('value') == 'prev'){
                var idx = parseInt(current_field[''])-1
                if (idx == -1){idx = Object.keys(local_field_info).length-1}
                current_field = local_field_info[idx]
                select_year = current_field.year
                $('#Fieldlabel').text(current_field.name + " " + current_field.year + " (" + current_field.crop + ")")
                // current_field = local_field_info[parseInt(current_field['']) - 1]
                field_file = "../" + current_field['path'];
                queue()
                    // .defer(d3.json, "../data/nebraska.geojson")
                    // .defer(d3.csv, "../data/wmk5_2009_small.csv")
                    .defer(d3.csv, field_file)
                    .await(createVis);
    
        } else if($(this).attr('value') == 'next') {
                var idx = parseInt(current_field[''])+1
                if (idx == Object.keys(local_field_info).length){idx = 0}
                current_field = local_field_info[idx]
                select_year = current_field.year
                // current_field = local_field_info[parseInt(current_field['']) - 1]
                field_file = "../" + current_field['path'];
                $('#Fieldlabel').text(current_field.name + " " + current_field.year + " (" + current_field.crop + ")")
                queue()
                    // .defer(d3.json, "../data/nebraska.geojson")
                    // .defer(d3.csv, "../data/wmk5_2009_small.csv")
                    .defer(d3.csv, field_file)
                    .await(createVis);


        }
    })


    current_field = local_field_info[0]
    $('#Fieldlabel').text(current_field.name + " " + current_field.year + " (" + current_field.crop + ")")
    select_year = current_field.year
    field_file = "../" + current_field['path'];
    queue()
        .defer(d3.csv, field_file)
        .await(createVis);
};


function createVis(error, yield_data) {


    if(typeof field_image != 'undefined') {
        field_image.attr("opacity", 0)
    }
    if(parseInt(current_field.img) == 1) {
        field_img = "../img/" + current_field.name + ".jpg"
     

        field_image.attr("xlink:href", field_img)
        .attr("width", bbFieldVis.w)
        .attr("height", bbFieldVis.h)
        .attr("opacity", 1)
    } else {
        field_img = NaN;
    }

    

    yieldHist.remove()
    yieldHist = canvas.append("svg").attr({
        width: bbYieldHist.w,
        height: bbYieldHist.h,
        x: bbYieldHist.x,
        y: bbYieldHist.y
    });
    yieldMeta.append("rect")
        .attr("class", "background")
        .attr("width", bbYieldMeta.w)
        .attr("height", bbYieldMeta.h);  

    lat = []
    lon = []
    var yld_threshold = 5

    yield_data.forEach(function(d){
        lat.push(parseFloat(d.lat))
        lon.push(parseFloat(d.lon))
    });
    yield_data_filtered = [];
    hist_values = [];
    yield_data.forEach(function(d) {
        if(d.val >= yld_threshold) {
            hist_values.push(parseInt(d.val));
            yield_data_filtered.push(d);
        }
        
        
    });

    fieldVis.selectAll(".point").remove()
    createYieldMeta();

    offx = 85;
    offy = -90;
    proj = 4300000;

    if(current_field.offx != '') {
        offx = parseFloat(current_field.offx);
    } 
    if(current_field.offy != '') {
        offy = parseFloat(current_field.offy);
    } 
    if(current_field.proj != '') {
        proj = parseFloat(current_field.proj);
    } 



    projection = d3.geo.albers().scale(parseInt(proj));
    // Define path generator
    path = d3.geo.path().projection(projection);
    x = projection([d3.mean(lon), d3.mean(lat)])
    projection.translate([bbFieldVis.w - x[0] + offx, bbFieldVis.h - x[1] + offy]);    

    // if (koz) {
    //     projection = d3.geo.albers().scale(18000000);
    //     // Define path generator
    //     path = d3.geo.path().projection(projection);
    //     x = projection([d3.mean(lon), d3.mean(lat)])
    //     projection.translate([bbFieldVis.w - x[0] + 100, bbFieldVis.h - x[1]]);           
    // } else {
    //     projection = d3.geo.albers().scale(4000000);
    //     // Define path generator
    //     path = d3.geo.path().projection(projection);
    //     x = projection([d3.mean(lon), d3.mean(lat)])
    //     projection.translate([bbFieldVis.w - x[0] + 75, bbFieldVis.h - x[1] - 50]); 
    // }
     

    xScale = d3.scale.linear()
        .domain([d3.min(hist_values),d3.max(hist_values)])
        .range([25, bbYieldHist.w - 25]);    

    colors.domain(d3.extent(hist_values));
    colors_grey.domain(d3.extent(hist_values));

    point = fieldVis.selectAll(".point")
        .data(yield_data_filtered)
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
        .attr("yield", function(d) {
            return d.val;
        })
        .style("opacity", 0.4)
        .on("mouseover", showYield)
        .on("mouseout", hideYield)
        .on("click", function(d) {
            var select_values = []
            fieldVis.selectAll(".point")
                .transition().duration(0)
                .style("fill", function(d){return colors_grey(d.val)})
            fieldVis.selectAll("[soil = '" + d.soil + "']")
                .transition().duration(0)
                .style("fill", function(d){
                    select_values.push(parseInt(d.val)); 
                    return colors(d.val)
                })
            histYield_select(select_values);
        });
        
    // fieldVis.selectAll(".background")
    //     .on("click", function(d) {
    //         fieldVis.selectAll(".point")
    //             .transition().duration(0)
    //             .style("opacity", 1)            
    //     });

    brushField = d3.svg.brush()
        .x(d3.scale.identity().domain([0, bbFieldVis.w]))
        .y(d3.scale.identity().domain([0, bbFieldVis.h]))
        .on("brush", brushedField);

    fieldVis.append("g")
        .attr("class", "brush")
        .attr("id", "fieldBrush")
        .call(brushField);


    yield_range = d3.extent(hist_values)

    histYield(yield_data_filtered)  
    histSoil(yield_data_filtered);
    generate_legend(hist_values)
    weather_viz(select_year)
    d3.selectAll('.brush').remove()
}    

// function createVis(error, yield_data) {
//     createYieldMeta();

//     lat = []
//     lon = []
//     yield_data.forEach(function(d){
//         lat.push(parseFloat(d.lat))
//         lon.push(parseFloat(d.lon))
//     });

//     x = projection([d3.mean(lon), d3.mean(lat)])
//     projection.translate([bbFieldVis.w - x[0] + 100, bbFieldVis.h - x[1]]); 
//     // timeSeries(price);

//     hist_values = [];
//     yield_data_filtered = [];
//     yield_data.forEach(function(d) {
//         if(d.val > 0) {
//             hist_values.push(parseInt(d.val));
//             yield_data_filtered.push(d);
//         }
//     });

//     xScale = d3.scale.linear()
//         .domain([d3.min(hist_values),d3.max(hist_values)])
//         .range([25, bbYieldHist.w - 25]);

//     colors.domain(d3.extent(hist_values));
//     colors_grey.domain(d3.extent(hist_values));

//     point = fieldVis.selectAll(".point")
//         .data(yield_data_filtered)
//         .enter()
//         .append("rect")
//         .attr("class", "point")
//         .attr("soil", function(d) {
//             return d.soil
//         })
//         .attr("x", function(d) {
//             return projection([d.lon, d.lat])[0];
//         })
//         .attr("y", function(d) {
//             return projection([d.lon, d.lat])[1];
//         })
//         .attr("width", 7)
//         .attr("height", 7)
//         .attr("yield", function(d) {
//             return d.val;
//         })
//         .style("opacity", 0.7)
//         .on("mouseover", showYield)
//         .on("mouseout", hideYield)
//         .on("click", function(d) {
//             var select_values = []
//             fieldVis.selectAll(".point")
//                 .transition().duration(0)
//                 .style("fill", function(d){return colors_grey(d.val)})
//             fieldVis.selectAll("[soil = '" + d.soil + "']")
//                 .transition().duration(0)
//                 .style("fill", function(d){
//                     select_values.push(parseInt(d.val)); 
//                     return colors(d.val)
//                 })
//             histYield_select(select_values);
//         });
        
//     fieldVis.selectAll(".background")
//         .on("click", function(d) {
//             fieldVis.selectAll(".point")
//                 .transition().duration(0)
//                 .style("opacity", 1)            
//         });

//     brushField = d3.svg.brush()
//         .x(d3.scale.identity().domain([0, bbFieldVis.w]))
//         .y(d3.scale.identity().domain([0, bbFieldVis.h]))
//         .on("brush", brushedField);

//     fieldVis.append("g")
//         .attr("class", "brush")
//         .attr("id", "fieldBrush")
//         .call(brushField);
//         // .selectAll("rect")
//         // .attr("height", bbFieldVis.h);

//     yield_range = d3.extent(hist_values)

//     histYield(yield_data_filtered);
//     histSoil(yield_data_filtered);
//     generate_legend(hist_values)
//     d3.selectAll('.brush').remove()
// }
var histYield_data, binWidth;


function histYield(yield_data) {

    // hist_values = []
    // yield_data.forEach(function(d) {hist_values.push(parseInt(d.val))})

    // xScale = d3.scale.linear()
    //     .domain([d3.min(hist_values),d3.max(hist_values)])
    //     .range([25, bbYieldHist.w - 25]);

    // colors.domain(d3.extent(hist_values));

    // Generate a histogram using twenty uniformly-spaced bins.
    var histYield_data = d3.layout.histogram()
        //.bins(xScale.ticks(20))
        (hist_values);

    //console.log(histYield_data, d3.extent(hist_values));
    //console.log(histYield_data[0].x, histYield_data[0].dx, Math.ceil(histYield_data[histYield_data.length-1].x + histYield_data[0].dx));

    bins = histYield_data.length;

    binWidth = (d3.extent(hist_values)[1] - d3.extent(hist_values)[0]) / histYield_data.length ;
    //console.log(binWidth);

    point.attr("bin", function(d) {
            return Math.round((d.val / binWidth) - 1);
        })
        .style("fill", function(d) {
            return colors(d.val);
        });

    yScale = d3.scale.linear()
        .domain([0, d3.max(histYield_data, function(d) { return d.y; })])
        .range([bbYieldHist.h-25, 25]);
    
    xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom"); 

    yieldHist.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (bbYieldHist.h - 25) + ")")
        .call(xAxis)
        .selectAll('text')
            .attr('y',0)
            .attr('x',-15)
            .style("text-anchor", "middle")
            .style("text-align", "right")
            .attr('transform', 'rotate(-70)')  
            .style('font-size', 10);
    
    bar = yieldHist.selectAll(".bar")
        .data(histYield_data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + (yScale(d.y) + 25) + ")"; });

    bar.append("rect")
        .attr("x", 1)
        .attr("y", -25)
        .attr("width", 20)
        .attr("height", function(d) { return (bbYieldHist.h - yScale(d.y) - 25); });

    // Add histogram brush
    brushHist = d3.svg.brush()
        .x(d3.scale.linear().domain(d3.extent(hist_values)).range([25, bbYieldHist.w - 25]))
        .on("brush", brushedHist);

    yieldHist.append("g")
        .attr("class", "brush")
        .attr("id", "histBrush")
        .call(brushHist)
        .selectAll("rect")
        .attr("y", bbYieldHist.y + 25)
        .attr("height", bbYieldHist.h - 50);
        // .on("mouseup", highlightBrushedYield);

    yieldMean = yieldHist.append("line")
        .attr({"x1": xScale(d3.mean(hist_values)), "x2": xScale(d3.mean(hist_values)), "y1": 10, "y2": bbYieldHist.h - 25})
        .attr("stroke-width", 3)
        .attr("stroke", "black")
        .attr("fill", "black")
        .attr("visibility", "visible");

    yieldMean_select = yieldHist.append("line")
        .attr({"x1": xScale(d3.mean(hist_values)), "x2": xScale(d3.mean(hist_values)), "y1": 10, "y2": bbYieldHist.h - 25})
        .attr("stroke-width", 3)
        .attr("stroke", "darkorange")
        .attr("fill", "darkorange")
        .attr("visibility", "hidden");

    // price.on("click", function() {
    //     value.text("$ " + d3.round(data[d3.round(x_reversed(d3.mouse(this)[0]))].price * 29712))
    //     vertLine.attr({"x1": d3.mouse(this)[0], "x2": d3.mouse(this)[0]})
    //         .attr("visibility", "visible");
    //     })
}


var histYield_data2;

function histYield_select(select_values) {

    // Generate a histogram using twenty uniformly-spaced bins.
    histYield_data2 = d3.layout.histogram()
        .range(d3.extent(hist_values))
        .bins(bins)
        (select_values);

    if (select_values.length == 0) { 
        fieldVis.selectAll(".point")
            .transition().duration(0)
            .style("fill", function(d){return colors(d.val)})
        yieldMean_select.attr("visibility", "hidden");
    };
    
    yieldHist.selectAll(".bar_sub").remove();
    
    // console.log(histYield_data2)
    
    bar2 = yieldHist.selectAll(".bar_sub")
        .data(histYield_data2)
        .enter().append("g")
        .attr("class", "bar_sub")
        .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + (yScale(d.y) + 25) + ")"; });

    bar2.append("rect")
        .style("fill", "#f1a340")
        .attr("x", 1)
        .attr("y", -25)
        .attr("width", 20)
        .attr("height", function(d) { return (bbYieldHist.h - yScale(d.y) - 25); });

    if (select_values.length != 0) {
        yieldMean_select.attr({"x1": xScale(d3.mean(select_values)), "x2": xScale(d3.mean(select_values))})
            .attr("visibility", "visible");
    }
}


function histSoil(yield_data) {

    var soil_data = {};

    xScale_soil = d3.scale.ordinal()
        .rangeRoundBands([25, bbYieldHist.w-25], .8, 0)
        .domain(d3.keys(soil_data));

    var soil_data = d3.nest()
        .key(function(d) { return d.soil}).sortKeys(d3.ascending)
        .rollup(function(i) { return i.length; })
        .entries(yield_data);   

    var data = d3.layout.histogram()
        (yield_data.map(function(d){return d.soil}));
}


function brushedHist() {
    var extent = brushHist.extent();
    bar.selectAll("rect").style("fill", function(d) {
        if((d.x + d.dx >= extent[0]) & (d.x <= extent[1])) {
            return "#f1a340";
        } 
        else {
            return null;
        }
    });
    brushField.extent([[0,0],[0,0]])
    highlightBrushedYield();
}


function highlightBrushedYield(){
    var extent = brushHist.extent();
    point.transition().style("fill", function(pt) {
        if(pt.val >= Math.floor((extent[0] / binWidth) - 1) * binWidth & pt.val <= Math.ceil((extent[1] / binWidth)) * binWidth) {
            return colors(pt.val);
        } 
        else {
            return colors_grey(pt.val);
        }
    });
}

function brushedField() {
    var extent = brushField.extent();
    var brush_min = projection.invert(extent[0]);
    var brush_max = projection.invert(extent[1]);
    
    bar.selectAll("rect").style("fill", null);
    var select_values = []
    point.transition().duration(0).style("fill", function(pt) {
        if(pt.lon >= brush_min[0] && pt.lon <= brush_max[0] && pt.lat >= brush_max[1] && pt.lat <= brush_min[1]) {
            select_values.push(parseInt(pt.val))
            return colors(pt.val);
        } 
        else {
            return colors_grey(pt.val);
        }
    });
    brushHist.extent([0,0])
    histYield_select(select_values);
}


var showYield = function(d) {
    yieldMeta.selectAll('[kind="yield"]')
      .text(formatCount(d.val) + " (bu / ac)");
    yieldMeta.selectAll('[kind="elevation"]')
      .text(Math.round(d.elevation_) + " (ft)");
    yieldMeta.selectAll('[kind="soil"]')
      .text(d.soil)
      // .style("fill", "blue")
      // .style("text-decoration", "underline");
    yieldMeta.selectAll('[kind="slopes"]')
      .text(d.slopes)
    yieldMeta.selectAll('[kind="lon"]')
      .text(formatCoords(d.lon))
    yieldMeta.selectAll('[kind="lat"]')
      .text(formatCoords(d.lat))
    //   .style("fill", "blue")
    //   .style("text-decoration", "underline");
    // yieldMeta.selectAll('[kind="soil_link"]')
    //   .attr("xlink:href", d.links)
    //   .attr("target", "_blank");
}


var hideYield = function(d) {
    d3.selectAll('[kind="yield"]').text("");    
    d3.selectAll('[kind="elevation"]').text("");    
    d3.selectAll('[kind="soil"]').text("")
      //                         .style("fill", "blue")
      //                         .style("text-decoration", "underline");      
    d3.selectAll('[kind="slopes"]').text("");
    
    yieldMeta.selectAll('[kind="lon"]').text("");
    yieldMeta.selectAll('[kind="lat"]').text("");
      //                               .style("fill", "blue")
      //                               .style("text-decoration", "underline");
   
    //d3.selectAll('[kind="soil_link"]').attr("xlink:href", d.links)
    //                                  .attr("target", "_blank");   
}

function generate_legend(data){
    d3.select(".legend").remove()

    //quantized color scale:
    var legend_color_scale = d3.scale.quantize().domain([0,legend_ticks]).range(color_range);

    var legend = fieldVis.append('g').attr('class', 'legend')
        .attr("transform", "translate("+ (bbFieldVis.w - 85) + "," + (bbFieldVis.h/2 - 90) + ")");

    var tick_size = (yield_range[1]-yield_range[0]) / (legend_ticks)

    for (i=1; i<=legend_ticks; i++){
        legend.append('rect')
              .attr('class', 'legend_box')
              .attr('x', 0)
              .attr('y', (legend_height/legend_ticks)*i-2)
              .attr('height', (legend_height/legend_ticks) - 1)
              .attr('width', 10)
              .style('fill', legend_color_scale(legend_ticks - i));

        legend.append('text')
           .attr('class', 'legend_tick')
           .attr('x', 13)
           .attr('y', (legend_height/legend_ticks)*i + 10)
           .attr('height', 10)
           .attr('width', 10)
           .style('fill', legend_tick_color)
           .text(d3.round(yield_range[1] - (i)*tick_size) + " to " + d3.round(yield_range[1] - (i-1)*tick_size) )
    }

    // legend.append('rect')
    //           .attr('class', 'legend_box')
    //           .attr('x', 0)
    //           .attr('y', (legend_height/legend_ticks)*(legend_ticks+1) + 5)
    //           .attr('height', (legend_height/legend_ticks) - 1)
    //           .attr('width', 10)
    //           .style('fill', county_fill_color);

    // legend.append('text')
    //    .attr('class', 'legend_tick')
    //    .attr('x', 13)
    //    .attr('y', (legend_height/legend_ticks)*(legend_ticks+1) + 15)
    //    .attr('height', 10)
    //    .attr('width', 10)
    //    // .style('fill', legend_color_scale(legend_ticks-i))
    //    .text("No Data")



        
    legend.append('text').attr('class', 'legend_tick').attr('x', 13).attr('y', 5).text('Bu/Acre').style('fill', legend_tick_color);
    // legend.append('text').attr('class', 'legend_tick').attr('x', mapVis.w+25).attr('y',  mapVis.h/2+10).text(d3.min(data));
    // legend.append('text').attr('class', 'legend_tick').attr('x', mapVis.w+25).attr('y',  mapVis.h/2+10+legend_height).text(d3.max(data));

}



function createYieldMeta() {
    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 25)
       .text("Elevation")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 14);                    

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 40)
       .attr("kind", "elevation")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 16);        

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 60)
       .text("Longitude")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 14);                    

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 75)
       .attr("kind", "lon")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 16);       

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 95)
       .text("Latitude")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 14);                    

    yieldMeta.append("text")
       .attr("x", 10)
       .attr("y", 110)
       .attr("kind", "lat")
       .style("fill", "grey")
       .style("font-weight", "bold")
       .style("font-size", 16);        

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
       .attr("y", 85)
       .text("Soil Profile")
       .style("fill", "black")
       .style("font-weight", "bold")
       .style("font-size", 18);

    yieldMeta.append("a")
        .attr("kind", "soil_link")
        .append("text")
        .attr("x", 240)
        .attr("y", 105)
        .attr("kind", "soil")                       
        .style("fill", "grey")
        .style("font-weight", "bold")
        .style("font-size", 18);

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

function weather_viz(year){
     weather_vis.selectAll(".temps").remove();
    var growing_months = []
    var num_path = 0
    for(i=weather_range[0]; i<weather_range[1]; i++){
        growing_months.push(months[i])
    }
    

    var climate_datum 
    for(i=0; i<climate_data.length; i++){
        if (climate_data[i].Year == year){
        climate_datum = climate_data[i]}
    }
    var weather_ordinal = d3.scale.ordinal().domain(growing_months).rangeRoundBands([margin.left, weatherVis.w-margin.left])
    var weather_xscale = d3.scale.linear().domain(weather_range).range([margin.left, weatherVis.w-margin.left]);
    var temp_yscale = d3.scale.linear().domain([100, 0]).range([margin.bottom, weatherVis.h-margin.top]);
    var prcp_yscale = d3.scale.linear().domain([3, 0]).range([margin.bottom, weatherVis.h-margin.top]);
    var start_pathT = 0
    var start_pathP = 0
    var start_idxT = NaN
    var start_idxP = NaN
    var weather_datum = climate_datum
    var temp_path = '';
    var prcp_path = '';

    var P_data = weather_datum['Prcp_monthly'];
    var T_data = weather_datum['Tavg_monthly'];
    var T_datum = T_data.split(',')
    var P_datum = P_data.split(',')
    var current_T = [];
    var current_P = [];
    for(j=0; j<T_datum.length; j++){                   
        var TempList = T_datum[j].split("'")
        var Temp = TempList[1]
        if (Temp == null){Temp = NaN}
        current_T.push(Temp)
    }
    for(j=0; j<P_datum.length; j++){       
        var PrcpList = P_datum[j].split("'")
        var Prcp = PrcpList[1]
        if (Prcp == null){Prcp = NaN}
        current_P.push(Prcp)
    }
    //create Temperature Path Element
      if (current_T.length > weather_range[0]){
        for (j=weather_range[0]; j<=weather_range[1]; j++){
            var Temp = current_T[j]
            
            if (!isNaN(Temp)){
            var xpos = weather_xscale(j);
            var ypos = temp_yscale(Temp);

            if (start_pathT == 0){
                temp_path = 'M '+xpos+" "+ypos;
                start_pathT = 1
                start_idxT = j

            }
            if (j > start_idxT){
                temp_path += " L "+xpos+" "+ypos;
            }
        }}}

      //Create Prcp Path Element:
      if (current_P.length > weather_range[0]){
        for (j=weather_range[0]; j<=weather_range[1]; j++){
            var Prcp = current_P[j]
            
            if (!isNaN(Prcp)){
            var xpos = weather_xscale(j);
            var ypos = prcp_yscale(Prcp/100);

            if (start_pathP == 0){
                prcp_path = 'M '+xpos+" "+ypos;
                start_pathP = 1
                start_idxP = j

            }
            if (j > start_idxP){
                prcp_path += " L "+xpos+" "+ypos;
            }
        }}}

        if(temp_path != ''){
        num_path += 1
        weather_vis.append('path')
                   .attr('d', temp_path)
                   .attr('class', 'temps')
                   .attr('fill', 'none')

                   .attr('stroke', temp_color)
                   .attr('stroke-width', 3);}
        if(prcp_path != ''){
          
        weather_vis.append('path')
                   .attr('d', prcp_path)
                   .attr('class', 'temps')
                   .attr('fill', 'none')
                   .attr('stroke', prcp_color)
                   .attr('stroke-width', 3);}

          var yAxis1 = d3.svg.axis().scale(temp_yscale).orient('left').tickFormat(d3.format("d"));
          var yAxis2 = d3.svg.axis().scale(prcp_yscale).orient('right').tickFormat(d3.format("d"));
          var xAxis = d3.svg.axis().scale(weather_ordinal).orient('bottom')//.tickFormat(d3.format("d"));
          weather_vis.append('text')
                     .attr('x', (weatherVis.h-margin.top-margin.bottom)/2)
                     .attr('y', -5)
                     .text('Temperature (F)')
                     .attr('transform', 'rotate(90)')  
                    .attr('class', 'axis')
                    .attr('fill', temp_color)
          weather_vis.append('text')
                     .attr('x', (weatherVis.h-margin.top-margin.bottom)/2-10)
                     .attr('y', -weatherVis.w+margin.left-25)
                     .text('Precipitation (Inches)')
                     .attr('transform', 'rotate(90)')  
                    .attr('class', 'axis')
                    .attr('fill', prcp_color)

          weather_vis.append('g')
                     .call(xAxis).attr('transform',  "translate("+(0)+","+(weatherVis.h-margin.top)+")")
                     .attr('class', 'axis')
                     .selectAll('text')
                     .attr('y',0)
                     .attr('x',-20)
                     .attr('transform', 'rotate(-70)')  
                     .style('font-size', 10);

          weather_vis.append('g')
                     .call(yAxis1).attr('transform',  "translate("+(margin.left)+","+(0)+")")
                     .attr('class', 'axis')
                     .selectAll('text')
                     .attr('y',0)
                     .attr('x',-10)
                     .style('font-size', 10);


          weather_vis.append('g')
                     .call(yAxis2).attr('transform',  "translate("+(weatherVis.w-margin.left)+","+(0)+")")
                     .attr('class', 'axis')
                     .selectAll('text')
                     .attr('y',0)
                     .attr('x',+10)
                     .style('font-size', 10);  





}


///////////////////////////
//// BUTTON FUNCTIONS  ////
///////////////////////////

// Radial Button Toggle
$('#selectionType .btn').on("click", function(d){
    if ($(this).children()[0].value == 'point'){
        d3.selectAll('.brush').remove()
    } 
    else if($(this).children()[0].value == 'brush') {
        canvas.append('g').attr('fill', 'none').attr('stroke', 'black').call(brushField).call(brushField.event)
            .attr('class', 'brush');
        yieldHist.append('g').attr('fill', 'none').attr('stroke', 'black').call(brushHist).call(brushHist.event)
            .attr('class', 'brush')
            .selectAll("rect")
            .attr("y", bbYieldHist.y + 25)
            .attr("height", bbYieldHist.h - 50);;
    }
})


$(document).ready(function() {
      
      $("#selectionType .btn").first().button("toggle");
    d3.selectAll('.brush').remove();
});

