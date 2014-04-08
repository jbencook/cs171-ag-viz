/**
Ryan
 * CS171 HW4
 * 17 March 2014
 */


/////////////////////
////////////////////
// Structure:
// 1. Constants
// 2. Global Variables
// 3. Create Visualization Canvases
// 4. Create Time Range Slider
// 5. Costume Fxn
// Calls
////////////////////
////////////////////


/////////////////////////
////////////////////////
// Constants
////////////////////////
/////////////////////

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1060 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;
var centered;

var mapVis = {
    x: 100,
    y: 10,
    w: width-margin.right-margin.left,
    h: height-margin.top-margin.bottom
};

var TimeVis = {
    h: 100,
    w: 500, 
    x: (width-500)/2,
    y: 0
}


var histVis = {
    x: 100,
    y: 10,
    w: 300,
    h: 500
};

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);
var path = d3.geo.path().projection(projection).pointRadius(1.5);
var legend_ticks = 100
var legend_height = 75
var color_range = ['orange', 'green']
var bin_num = 50

/////////////////////////
////////////////////////
// Global Variables (Scoping)
////////////////////////
/////////////////////


var county_num2name = {};
var yield_color_scale 
var data_by_year = {}
var all_yields = []
/////////////////////////
////////////////////////
// Create Canvases
////////////////////////
/////////////////////


//title vis:
var title = d3.select("#title")
    .style("text-align", "center")
    .append("text").attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", 0)
    .text("County Level Crop Yield")

var slider_canvas = d3.select("#timeslider").append('svg').attr({
    width: width + margin.left + margin.right,
    height: TimeVis.h+ margin.top + margin.bottom,})

var timeslider = slider_canvas.append('g').attr({
    transform:  "translate(" + TimeVis.x + "," + TimeVis.y + ")"})

var hist_canvas = d3.select("#hist").append('svg').attr({
    width: width + margin.left + margin.right,
    height: TimeVis.h+ margin.top + margin.bottom,})
    .attr("width", histVis.w)
    .attr("height", histVis.h)


var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom})

canvas.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)

var svg = canvas.append("g").attr({transform: "translate(" + margin.left + "," + margin.top + ")"});



/////////////////////////
////////////////////////
// Create Time Range Slider
////////////////////////
/////////////////////

var xtime_range = d3.scale.linear().domain([1980, 2013]).range([0, TimeVis.w]).clamp(true)
var time_brush = d3.svg.brush().x(xtime_range).on('brush', time_brushed)
var slider = timeslider.append('g').attr('class', 'slider').attr('fill', 'gray').call(time_brush)
timeslider.append('g').attr('class', 'axis').attr('height',20).attr('width', 100).attr('transform', 'translate('+0+','+margin.top+")").call(d3.svg.axis().scale(xtime_range)
    .orient('bottom').tickFormat(d3.format("d")))
var handle = slider.append('circle').attr('class', 'handle').attr('transform', 'translate('+0+','+margin.top+")").attr('r', 9)
    slider.selectAll('.extent, .resize' ).remove()
  




/////////////////////////
////////////////////////
// Costume Fxns
////////////////////////
/////////////////////





function generate_color_scale(yield_range){
        yield_color_scale = d3.scale.linear().domain(yield_range).range(color_range)    
    }

function generate_legend(data){
    var legend_color_scale = d3.scale.linear().domain([0,legend_ticks]).range(color_range)
    for (i=0; i<=legend_ticks; i++){
        svg.append('rect')
           .attr('class', 'legend_box')
           .attr('x', mapVis.w)
           .attr('y', mapVis.h/2+ (legend_height/legend_ticks)*i)
           .attr('height', 10)
           .attr('width', 10)
           .style('fill', legend_color_scale(i))
        }
    svg.append('text').attr('class', 'legend_tick').attr('x', mapVis.w+25).attr('y',  mapVis.h/2-15).text('Bu/Acre')
    svg.append('text').attr('class', 'legend_tick').attr('x', mapVis.w+25).attr('y',  mapVis.h/2+10).text(d3.min(data))
    svg.append('text').attr('class', 'legend_tick').attr('x', mapVis.w+25).attr('y',  mapVis.h/2+10+legend_height).text(d3.max(data))

}


function yeild_color(year){
        
    //remove old coloring
    d3.selectAll('.counties').selectAll('path').attr('fill', 'white')

    // New Coloring
    var data = data_by_year[year]
    for (i=0; i<data.length;i++){
        if (parseFloat(data[i].Year)==year){
        var stateANSI = parseFloat(data[i]['State ANSI'])
        var countyANSI = data[i]['County ANSI']
        var county_id = ""+stateANSI+""+countyANSI
        d3.selectAll('.counties').select('#c'+county_id)
          .attr('fill', yield_color_scale(parseFloat(data[i].Value)))}
      }

    generateHist(data)

    //add year to map:
    svg.select('#yrtooptip').remove()    
    svg.append('text').attr('y',mapVis.y+margin.top).attr('x',mapVis.w)
       .text('Year: '+year)
       .attr('id', 'yrtooptip')
       .attr('font-weight', 'bold')
       .style('font-size', 20)
    }

function process_data(){
    
    d3.csv('../data/county_yield_1980_2013.csv', function(data){
        var start_year = 0
        var data_for_year = [];
        for(i=0;i<data.length;i++){
            all_yields.push(parseFloat(data[i].Value))
            if(start_year==0){
            var current_year = data[i].Year;
            start_year = 1}
            if(current_year == data[i].Year){
                data_for_year.push(data[i])}
            if(current_year != data[i].Year){
               data_by_year[current_year] = data_for_year
               current_year  = data[i].Year
               data_for_year = []
               data_for_year.push(data[i])}
            if(i==data.length-1){
                data_for_year.push(data[i])
                data_by_year[current_year] = data_for_year}
             }

          var yield_range = d3.extent(all_yields) 
          generate_color_scale(yield_range)
          generate_legend(all_yields)

          var years = Object.keys(data_by_year)
          yeild_color(parseFloat(d3.min(years)))
          })

    }


function generateMap(error, us) {   
    
    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("d", path)
        .attr('name', function(d,i){
            county_num2name[d.id] = d.properties.name
            return d.properties.name})
        .attr('id', function(d,i){return 'c'+d.id})
       
     

    svg.append("path")
        .data(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path)
       
    process_data()
 
  }




function time_brushed(){
    var value = time_brush.extent()[0]
    var year
    if (d3.event.sourceEvent){
        value = xtime_range.invert(d3.mouse(this)[0])
        time_brush.extent([value, value])
        year = d3.round(value, 0)
    }
    handle.attr('cx', xtime_range(value))
    //update color 
    yeild_color(year)

}


   

function generateHist(data){
    d3.select('#hist').selectAll('.bars').remove()
    d3.select('#hist').selectAll('.axis').remove()
    var hist_height = 400
    var hist_length = 250
    var bin_values = []
    var xscale_hist = d3.scale.linear().domain(d3.extent(all_yields)).range([0,hist_length])
    var yscale_hist = d3.scale.linear().domain([0, data.length/10]).range([0,hist_height])
    for (i=0;i<data.length; i++){
        bin_values.push(parseFloat(data[i].Value))}
    var hist_data = d3.layout.histogram().bins(xscale_hist.ticks(bin_num))(bin_values);
    
    hist_canvas.selectAll('.bars').data(hist_data).enter().append('rect')
               .attr('height', function(d,i){return yscale_hist(d.y)})
               .attr('width', hist_height/bin_num)
               .attr('x', function(d,i){return i*hist_length/bin_num})
               .attr('y', function(d,i){return .9*histVis.h - yscale_hist(d.y)})
               .attr('fill', function(d,i){return yield_color_scale(d.x)})
               .attr('class', 'bars')

    //create axis for histogram:         
    var yAxis = d3.svg.axis().scale(yscale_hist).orient('right').tickFormat(d3.format("d"))
    var xAxis = d3.svg.axis().scale(xscale_hist).orient('bottom').tickFormat(d3.format("d"))

   
    hist_canvas.append('g')
               .call(xAxis).attr('transform',  "translate("+(0)+","+(.9*histVis.h)+")")
               .attr('class', 'axis')
               .selectAll('text')
               .attr('y',0)
               .attr('x',+20)
               .attr('transform', 'rotate(90)')  
               .style('font-size', 10)
    hist_canvas.append('text').attr('y', histVis.h).attr('x', histVis.w/2-margin.left).text('Yield').style('font-weight', 'bold').attr('class', 'axis')
}   

/////////////////////////
////////////////////////
// Calls
////////////////////////
/////////////////////



queue()
    .defer(d3.json, "../data/us-named.json")
    .await(generateMap)

