/**
 * Charles Hornbaker
 * CS171 HW4
 * 17 March 2014
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1060 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;
var centered;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var title = d3.select("#title")
    .style("text-align", "center")
    .append("text").attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", 0)
    .text("County Level Crop Yield")


var detailVis = d3.select("#detailVis").append("svg").attr({
    width:350,
    height:200
})

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

canvas.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    // .on("click", clicked);

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

var xAxis, yAxis, xScale, yScale;

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path()
    .projection(projection)
    .pointRadius(1.5);;

var zoom = d3.behavior.zoom()
    .scaleExtent([1,8])
    // .translate(projection.translate())
    // .scale(projection.scale())
    // .scaleExtent([height, 8 * height])
   
    .on("zoom", zoomToBB);

canvas.call(zoom)

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        var sum;
        if (typeof dataSet[d["USAF"]] == "undefined") {
            sum = "NO DATA";
        } else {
            sum = formatNum(dataSet[d["USAF"]].sum)
        }
        return "<strong>" + d["STATION"] + ":</strong> <span style='color:lightgrey'>" + sum + "</span>";
    })

canvas.call(tip)

var dataSet = {};
var metaData;

var parseHours = d3.time.format("%H").parse
var timeFormat = d3.time.format("%X");
var formatNum = d3.format(",");

var selected_station = null

queue()
    .defer(d3.json, "../data/us-named.json")
    .await(ready)


function ready(error, us) {

    // var usMap = topojson.feature(data,data.objects.states).features
    // // console.log(data)
    // // console.log(usMap)
    // svg.selectAll(".country").data(usMap).enter()
    //     .append("path").attr("class", "country")
    //     .attr("d", path)
    // loadStations();
    // // loadStats();

    svg.append("g")
        .attr("class", "counties")
    .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
        // .attr("class", function(d) { return quantize(rateById.get(d.id)); })
        .attr("d", path)
        // .on("click", clicked);

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path)
        // .on("click", clicked);

    loadStations();
    areaYield(us.objects.counties);
};

function loadStations() {
    console.log("Test")

    /*This doesn't work. -JBC*/
    // url="http://b1tf4rm4p1.herokuapp.com/station/?page=2&format=json"

    // // d3.json(url, function(error, jsondata) { 
    // //     if (error) return console.warn(error);

    // //     console.log(jsondata);
    // // })
    // var status = $.ajax({
    //     url: url,
    //     // async: false,
    //     // jsonpCallback:'getdata',
    //     crossDomain: true,
    //     dataType:'json',
    //     success: function (data, status){
    //         console.log(status, data)
        
    //     },
    //     error: function() {
    //         return console.log("error");
    //     }
    // });

}

function areaYield(countyPolygons) {
    d3.csv("../data/area-yield_04042014.csv", function(error, data) {

        county_IDs = {};

        countyPolygons['geometries'].forEach(function(d) {
            county_IDs[d.id] = true;
        });

        data.forEach(function(d) {
            if (!(d.json_id in county_IDs)) {
                console.log(d.json_id);
            }
        })
    })
}


function runAQueryOn(indicatorString) {
    if (indicatorString[0] == null) {
        url = "http://api.worldbank.org/countries/all?format=jsonP&prefix=Getdata&per_page=500&date=2010"
    } else {
        url = "http://api.worldbank.org/countries/all/indicators/" + indicatorString[0] + "?format=jsonP&prefix=Getdata&per_page=500&date=" + indicatorString[1]
    }
    var status = $.ajax({
        url: url,
        async: false,
        jsonpCallback:'getdata',
        dataType:'jsonp',
        success: function (data, status){
            if (indicatorString[0] == null) {
                data[1].forEach(function(d){
                    if (typeof countryList[d.id] != 'undefined') {
                        countryList[d.id] = d.iso2Code;
                        dataSet[d.iso2Code] = {"meta": d, "decimal": null, "indicator": null, "value":null}
                    }
                });
                runAQueryOn(query_inputs)
            } else {
                data[1].forEach(function(d){
                    if (typeof dataSet[d.country.id] != 'undefined') {
                        dataSet[d.country.id].decimal = d.decimal
                        dataSet[d.country.id].value = d.value
                        dataSet[d.country.id].indicator = d.indicator
                    }
                    
                })
            }
            updateVis()
        
        },
        error: function() {
            return console.log("error");
        }
    });
}










function loadStations_old() {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){
        data = data.filter(function(d){return projection([d["ISH_LON(dd)"], d["ISH_LAT (dd)"]]) !== null});
        metaData = data;

        radScale = d3.scale.linear()
            .range([1,10])
            .domain(d3.extent(d3.keys(dataSet).map(function(d){return dataSet[d].sum})))

        data.sort(function(a,b){ 
            var sum_a = 0;
            var sum_b = 0;
            if (typeof dataSet[a["USAF"]] != "undefined") {
                sum_a = dataSet[a["USAF"]].sum
            }
            if (typeof dataSet[b["USAF"]] != "undefined") {
                sum_b = dataSet[b["USAF"]].sum
            }
            return d3.descending(sum_a, sum_b);
        })



        svg.selectAll(".station")
            .data(data)
            .enter().append("circle").attr("class", "station")
            .attr("r", function(d, i){
                // if (i==0) {
                //     selected_station = this;
                // }
                if (typeof dataSet[d["USAF"]] != 'undefined') {
                    return radScale(dataSet[d["USAF"]].sum);
                } else {
                    return 1;
                };
            })
            .style("fill", function(d, i){
                // if (i==0) {
                //     return "orange";
                // }
                if (typeof dataSet[d["USAF"]] != 'undefined') {
                    return "blue";
                }
            })
            .attr("transform", function(d) {
                var location = projection([d["ISH_LON(dd)"], d["ISH_LAT (dd)"]])
                if (location != null) {
                    return "translate(" + location + ")"
                };
            })
            .on("click", function(d){
                d3.select(selected_station).style("fill", function(d){
                    if (typeof dataSet[d["USAF"]] != 'undefined') {
                        return "blue";
                    } 
                })
                d3.select(this).style("fill", "orange");
                selected_station = this;
                updateDetailVis(d);
            })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

            createDetailVis();
    });
}


function loadStats() {

    d3.json("reducedMonthStationHour2003_2004.json", function(error,data){
        dataSet= data;
		//....
		
        loadStations();
    })

}





var createDetailVis = function(){
    hours = d3.range(24).map(function(d){return ("0"+ d).slice(-2) + ":00:00"})
    hours_init = []
    hours.forEach(function(d){hours_init.push({"key":d, "value":0})})

    xScale = d3.scale.ordinal()
        .rangeRoundBands([0, 280], 0.1)
        .domain(hours);

    

    yScale = d3.scale.linear()
        .range([140, 10])
        .domain([0, d3.max(d3.keys(dataSet).map(function(d){return d3.max(d3.values(dataSet[d].hourly))})) + 1000]);

    xAxis = d3.svg.axis().scale(xScale).orient("bottom");
    yAxis = d3.svg.axis().scale(yScale).orient("right");

    detailVis.append("g").attr("class", "x axis")
        .attr("transform", "translate(0," + 140 + ")")
        .call(xAxis)
        .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)" 
                });

    detailVis.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate("+ 280 + ",0)")
        .call(yAxis)

    detailVis.append("text")
        .attr("class", "name")
        .attr("transform", "translate(0,10)")

    detailVis.selectAll(".bar")
        .data(hours_init)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return xScale(d.key); })
        .attr("width", xScale.rangeBand())
        .attr("y", function(d) { return yScale(d.value); })
        .attr("height", function(d) { return 140 - yScale(d.value); })


}


var updateDetailVis = function(data){
    if (typeof dataSet[data["USAF"]] == 'undefined') {
        data_hours = hours_init;
    } else {
        data_hours = d3.entries(dataSet[data["USAF"]].hourly)
    };
    // data = d3.entries(dataSet[d3.keys(dataSet)[0]].hourly)
    detailVis.selectAll(".bar")
        .data(data_hours)
        .transition()
        .attr("x", function(d) { return xScale(d.key); })
        .attr("width", xScale.rangeBand())
        .attr("y", function(d) { return yScale(d.value); })
        .attr("height", function(d) { return 140 - yScale(d.value); })

    detailVis.selectAll(".name")
        .text(data["STATION"])

}



// ZOOMING
function zoomToBB() {
    projection.translate(d3.event.translate).scale(d3.event.scale);
    svg.transition().duration(0)
        .style("stroke-width", 1/d3.event.scale + "px");
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
        
    
    // svg.selectAll("path")
    //     .attr("d", path);

    // svg.selectAll("circle")
    //     .attr("transform", function(d) {
    //             return "translate(" + projection([d["ISH_LON(dd)"], d["ISH_LAT (dd)"]]) + ")"
    //         });

}

function resetZoom() {
    
}

function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  svg.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  svg.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}




