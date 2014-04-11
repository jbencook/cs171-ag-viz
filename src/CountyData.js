/**
Ryan
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
var height = 900 - margin.bottom - margin.top;
var centered;

var mapVis = {
    x: 100,
    y: 10,
    w: width-margin.right-margin.left,
    h: height-margin.bottom
};

var TimeVis = {
    h: 200,
    w: 500, 
    x: (width-500)/2,
    y: mapVis.h-margin.top
}


var histVis = {
    x: 100,
    y: 10,
    w: 400,
    h: 500
};

///change

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);
var path = d3.geo.path().projection(projection).pointRadius(1.5);
var legend_ticks = 100
var legend_height = 75
var color_range = colorbrewer.YlGn[9].slice(2,8)
var gray_range = colorbrewer.Greys[9].slice(2,8) //['orange', 'darkgreen']
var highlight_color = 'blue'
var bin_num = 30
var num_color_bins = 7
var hist_height = 100
var hist_length = 250
var brush_highlight_color = '#FFFF6C'
var county_fill_color = '#E2C670'
var remove_counties = ["c15001", "c15009", "c15009", "c15009", "c15009", "c15003","c15007", "c15007", "c2016", "c2013", "c2130", "c2060", "c2070", "c2164", "c2150", "c2110", "c2280", "c2232", "c2100", "c2220", "c2270", "c2050", "c2170", "c2068", "c2020", "c2261", "c2122", "c2282", "c2290", "c2090", "c2240", "c2185", "c2188", "c2180", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201", "c2201"]
/////////////////////////
////////////////////////
// Global Variables (Scoping)
////////////////////////
/////////////////////


var county_num2name = {};
var yield_color_scale, gray_color_scale  
var data_by_year = {}
var data_by_id = {}
var all_yields = []
var county_ids = {}
var yield_average = {}
var years, selected_data, select_year
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
    
var Map = canvas.append("g").attr({transform: "translate(" + 0 + "," + margin.top + ")"});

var slider_canvas = d3.select("#vis").append('svg').attr({
    width: width + margin.left + margin.right,
    height: TimeVis.h+ margin.top + margin.bottom,})

var timeslider = canvas.append('g').attr({
    transform:  "translate(" + TimeVis.x + "," + TimeVis.y + ")"})

/////////////////////////
////////////////////////
// Create Time Range Slider
////////////////////////
/////////////////////

var xtime_range = d3.scale.linear().domain([1910,2013]).range([0, TimeVis.w]).clamp(true)
var time_brush = d3.svg.brush().x(xtime_range).on('brush', time_brushed)
var slider = timeslider.append('g').attr('class', 'slider').attr('fill', 'gray').call(time_brush)
timeslider.append('g')
          .attr('class', 'axis')
          .attr('height',20)
          .attr('width', 100)
          .attr('transform', 'translate('+0+','+(margin.top+hist_height)+")")
          .call(d3.svg.axis().scale(xtime_range)
          .orient('bottom').tickFormat(d3.format("d")))
var handle = slider.append('circle').attr('class', 'handle').attr('transform', 'translate('+0+','+(margin.top+hist_height)+")").attr('r', 9)
    slider.selectAll('.extent, .resize' ).remove()
  


/////////////////////////
////////////////////////
// Costume Fxns
////////////////////////
/////////////////////





function generate_color_scale(yield_range){

        //continuous color scale:
        //yield_color_scale = d3.scale.linear().domain(yield_range).range(color_range)   

        //quantized color scale:
        yield_color_scale = d3.scale.quantize().domain(yield_range).range(color_range)
        gray_color_scale = d3.scale.quantize().domain(yield_range).range(gray_range)
    }


function generate_WeatheVis(){

    d3.json("../data/gdd.json", function(data){

     //console.log(data)

    }) 

  

  
  //var weather_vis = hist_canvas.append('rect').attr('x', 0).attr('y', 0).attr('height', 200).attr('width', 250).attr('fill', 'none').attr('stroke', 'black')
 //hist_canvas.append('text').attr('x', margin.left).attr('y', margin.top).text('Weather Data Panel')

 //var link =  hist_canvas.append('rect').attr('x', 0).attr('y', 500).attr('height', 20).attr('width', 250).attr('fill', 'none').attr('stroke', 'black')

}



function generate_legend(data){
    //continuous color scale:
    //var legend_color_scale = d3.scale.linear().domain([0,legend_ticks]).range(color_range)

    //quantized color scale:
    var legend_color_scale = d3.scale.quantize().domain([0,legend_ticks]).range(color_range)


    var legend = Map.append('g').attr('class', 'legend')


    for (i=0; i<=legend_ticks; i++){
        legend.append('rect')
           .attr('class', 'legend_box')
           .attr('x', mapVis.w)
           .attr('y', mapVis.h/2+ (legend_height/legend_ticks)*i)
           .attr('height', 10)
           .attr('width', 10)
           .style('fill', legend_color_scale(i))
        }
    legend.append('text').attr('class', 'legend_tick').attr('x', mapVis.w+25).attr('y',  mapVis.h/2-15).text('Bu/Acre')
    legend.append('text').attr('class', 'legend_tick').attr('x', mapVis.w+25).attr('y',  mapVis.h/2+10).text(d3.min(data))
    legend.append('text').attr('class', 'legend_tick').attr('x', mapVis.w+25).attr('y',  mapVis.h/2+10+legend_height).text(d3.max(data))

}


function yield_color(year){
        
    //remove old coloring
    d3.selectAll('.counties').selectAll('path').attr('fill', county_fill_color)
    
    // New Coloring

    var data = data_by_year[year]
   
    if (selected_data.length == 0){
    for (i=0; i<data.length;i++){
        var stateANSI = parseFloat(data[i]['State ANSI'])
        var countyANSI = data[i]['County ANSI']
        var county_id = ""+stateANSI+""+countyANSI

        d3.selectAll('.counties').select('#c'+county_id)
          .attr('fill', yield_color_scale(parseFloat(data[i].Value)))}}


    var high_lighted = []
    if (selected_data.length != 0){
      d3.selectAll('.counties').selectAll('path').attr('fill', 'none')
        for (i=0; i<data.length;i++){
        var stateANSI = parseFloat(data[i]['State ANSI'])
        var countyANSI = data[i]['County ANSI']
        var county_id = ""+stateANSI+""+countyANSI
        var gray_scale = true
        for(j=0; j<selected_data.length; j++){
          if ("c"+county_id==selected_data[j]){
            high_lighted.push(selected_data[j])
            gray_scale=false}
        }
        if (gray_scale==true){
        d3.selectAll('.counties').select('#c'+county_id)
          .attr('fill', gray_color_scale(parseFloat(data[i].Value)))}
        if (gray_scale ==false){
        
        d3.selectAll('.counties').select('#c'+county_id)
          .attr('fill', yield_color_scale(parseFloat(data[i].Value)))
        }

        }
    
    }
    

    for(i=0; i<selected_data.length; i++) {
      var county_id = selected_data[i]
      var colored = false
      for (j=0; j<high_lighted.length; j++){
  
        if(high_lighted[j] == county_id) {colored = true}
      }
      if(colored == false){
         d3.selectAll('.counties').select('#'+county_id).attr('fill', county_fill_color)
      }
    }
      

   
    generateHist(data)
    generate_average_scatterplot(yield_average)

    //add year to map:
    Map.select('#yrtooptip').remove()    
    Map.append('text').attr('y',mapVis.y+margin.top).attr('x',mapVis.w)
       .text('Year: '+year)
       .attr('id', 'yrtooptip')
       .attr('font-weight', 'bold')
       .style('font-size', 20)
    }


function process_data(){
    
    d3.csv('../data/county_yield_small_1910_2013.csv', function(data){
        var start_year = 0
        var data_for_year = [];
        var start_id = 0
        var data_for_id = [];
        for(i=0;i<data.length;i++){
            if (data[i].County != 'OTHER (COMBINED) COUNTIES'){
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

            var current_id = ('c'+parseFloat(data[i]['State ANSI'])+data[i]['County ANSI'])
            var current_list = county_ids[current_id]
            if (current_list != null){current_list.push(data[i])}
            

             }}

          var yield_range = d3.extent(all_yields) 
          generate_color_scale(yield_range)
          generate_legend(all_yields)
          
          years = Object.keys(data_by_year)
          select_year = d3.min(years)

          yield_color(parseFloat(d3.min(years)))
          
          for(i=0;i<years.length;i++){
            var current_data = data_by_year[years[i]]
            var sum = 0
            for(j=0;j<current_data.length;j++){
              sum += parseFloat(current_data[j].Value)
            }
            yield_average[years[i]] = sum/current_data.length

          }
          generate_average_scatterplot(yield_average)

          yield_color(parseFloat(d3.min(years)))

          })

        
    }


function generateMap(error, us) {   


   
    Map.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("d", path)
        .attr('name', function(d,i){
            county_num2name[d.id] = d.properties.name
            return d.properties.name})
        .attr('id', function(d,i){
          county_ids[('c'+d.id)] = []
          return 'c'+d.id})
        .attr('xpos', function(d,i){return path.centroid(d)[0]})
        .attr('ypos', function(d,i){return path.centroid(d)[1] + margin.top})
        .on('click', function(){selected_county_vis(this)})
        .on('mousemove', function(){
            d3.select('#vis').select('#cname_tip').remove()
            var county_name = this.__data__.properties.name
            var coordinates = d3.mouse(this)
            Map.append('text')
               .attr('x', coordinates[0]+5)
               .attr('y', coordinates[1]-5)
               .text(county_name)
               .attr('id', 'cname_tip')
               .style('font-weight', 'bold')
               .style('font-size', 15)
               .style('fill', 'brown')})

        .on('mouseout', function(){
            d3.select('#vis').select('#cname_tip').remove()
        })
     
  //remove HI and AK:   
  for(i=0;i<remove_counties.length;i++){
    d3.select("#vis").select('#'+remove_counties[i]).remove()
  }
   // svg.append("path")
   //     .data(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
   //     .attr("class", "states")
   //     .attr("d", path)
       
    process_data()
    generate_WeatheVis()
 
  }




function time_brushed(){
    //fix timeslider vis:
    d3.selectAll('.selectVis').remove()
    

    //brush        
    var value = time_brush.extent()[0]
    
    if (d3.event.sourceEvent){
        value = xtime_range.invert(d3.mouse(this)[0])
        time_brush.extent([value, value])
        select_year = d3.round(value, 0)
    }
    handle.attr('cx', xtime_range(value))
    //update color 
    yield_color(select_year)

    
  
}


   ////////////////
   ///////////////

function generate_average_scatterplot(data){
  d3.select('#vis').select("#avg_title").remove()
  d3.select('#vis').selectAll('.nat_avg').remove()
  var keys = Object.keys(data)
  var xscale = d3.scale.linear().domain(d3.extent(keys)).range([0, TimeVis.w]).clamp(true)
  var yscale = d3.scale.linear().domain(d3.extent(all_yields)).range([0, TimeVis.h])

  if (selected_data.length == 0){
     timeslider.append('text')
            .attr('x', 0)
            .attr('y', margin.top)
            .text('National Averages:')
            .attr('id', "avg_title")
  
 
 
            for(i=0;i<keys.length;i++){
            var year = keys[i]
            var datum = data[year]



            timeslider.append('rect')
                      .attr('x', xscale(year))
                      .attr('y', TimeVis.h - yscale(datum)-margin.top)
                      .attr('width', 5)
                      .attr('height', 5)
                      .attr('value', datum)
                      .attr('year', year)
                      .style('fill', yield_color_scale(datum))
                      .attr('class', 'nat_avg')
                      .on('mouseover', function(){
                        d3.select('#vis').select('#avg_yeildttip').remove()
                        var coordinates = d3.mouse(this)
                        var avg_yield = this.getAttribute('value')
                        var avg_year = this.getAttribute('year')
                        timeslider.append('text')
                                  .attr('x', coordinates[0]+5)
                                  .attr('y', coordinates[1]-5)
                                  .text("Nat'l Avg, "+avg_year+": "+d3.round(avg_yield, 2)+" Bu/acre")
                                  .attr('id', 'avg_yeildttip')
                                  .style({'font-weight':'bold', 'font-size':15})

                        })
                      .on('mouseout', function(){
                        d3.select('#vis').select('#avg_yeildttip').remove()
                      })
          }  

}

 if (selected_data.length != 0){
     timeslider.append('text')
            .attr('x', 0)
            .attr('y', margin.top)
            .text('Regional Averages:')
            .attr('id', "avg_title")

            var regional_yields = {}
            for(i=0; i<years.length; i++){
              regional_yields[years[i]] = {'sum':0, 'count':0, 'avg':0}
            }

       
            for(i=0;i<selected_data.length; i++){
              var datum  = county_ids[selected_data[i]]
              for(j=0; j<datum.length; j++){
                regional_yields[datum[j].Year].sum += parseFloat(datum[j].Value)
                regional_yields[datum[j].Year].count += 1
              }

            }
        
            for(i=0; i<years.length; i++){
              regional_yields[years[i]].avg = regional_yields[years[i]].sum/regional_yields[years[i]].count
            }

            for(i=0; i<years.length; i++){
            var year = years[i]
            var datum = regional_yields[year].avg
            //console.log(year, datum)
            if(!isNaN(datum)){
            timeslider.append('rect')
                              .attr('x', xscale(year))
                              .attr('y', TimeVis.h - yscale(datum)-margin.top)
                              .attr('width', 5)
                              .attr('height', 5)
                              .attr('value', datum)
                              .attr('year', year)
                              .style('fill', yield_color_scale(datum))
                              .attr('class', 'nat_avg')
                              .on('mouseover', function(){
                                d3.select('#vis').select('#avg_yeildttip').remove()
                                var coordinates = d3.mouse(this)
                                var avg_yield = this.getAttribute('value')
                                var avg_year = this.getAttribute('year')
                                timeslider.append('text')
                                          .attr('x', coordinates[0]+5)
                                          .attr('y', coordinates[1]-5)
                                          .text("Nat'l Avg, "+avg_year+": "+d3.round(avg_yield, 2)+" Bu/acre")
                                          .attr('id', 'avg_yeildttip')
                                          .style({'font-weight':'bold', 'font-size':15})

                                })
                              .on('mouseout', function(){
                                d3.select('#vis').select('#avg_yeildttip').remove()
                              })
                        }}

 }

} 

function generateHist(data){
    d3.select('#hist').selectAll('.bars').remove()
    d3.select('#hist').selectAll('.axis').remove()
   
    var bin_values = []
    var xscale_hist = d3.scale.linear().domain(d3.extent(all_yields)).range([0,hist_length])
    var yscale_hist = d3.scale.linear().domain([0, data.length/10]).range([0,hist_height-margin.top])

    // create bin values:
    if (selected_data.length == 0){
    for (i=0;i<data.length; i++){
        bin_values.push(parseFloat(data[i].Value))}}
    //console.log(selected_data)
    for (i=0; i < selected_data.length; i++){
          yscale_hist.domain([0, selected_data.length])
          var datum = county_ids[selected_data[i]]
          for(j=0; j<datum.length; j++){
            if (datum[j].Year == data[0].Year){
              bin_values.push(parseFloat(datum[j].Value))
            }
          }
          }


    var hist_data = d3.layout.histogram().bins(xscale_hist.ticks(bin_num))(bin_values);
    var data_for_bins = {}
    
    hist_canvas.selectAll('.bars').data(hist_data).enter().append('rect')
               .attr('height', function(d,i){return yscale_hist(d.y)})
               .attr('width', hist_length/bin_num)
               .attr('x', function(d,i){return i*hist_length/bin_num})
               .attr('y', function(d,i){return .9*histVis.h - yscale_hist(d.y)})
               .attr('fill', function(d,i){return yield_color_scale(d.x)})
               .attr('class', 'bars')
               .attr('id', function(d,i){return 'b'+i})
               .attr('bin_count', function(d,i){return d.y})
   

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

    d3.select('#hist').selectAll('.bars')
      .on('mousemove', function(){
        d3.select('#hist').select('#bcount_tip').remove()
        var bin_count = this.__data__.y
        var coordinates = d3.mouse(this)


        //add bin count tool tip:

        hist_canvas.append('text')
                   .attr('x', coordinates[0]+5)
                   .attr('y', coordinates[1]-5)
                   .text('Bin Count: '+bin_count)
                   .attr('id', 'bcount_tip')
                   .style('font-weight', 'bold')})
      .on('mouseout', function(){
        d3.select('#hist').select('#bcount_tip').remove()})
      .on('click', function(){
        yield_color(data[0].Year)
        var bin_min = d3.min(this.__data__)
        var bin_max = d3.max(this.__data__)
        d3.select('#hist').select('#'+this.id).style('fill', highlight_color)
       
        for (i=0; i<data.length; i++){
            if (parseFloat(data[i].Value)>=bin_min && parseFloat(data[i].Value)<=bin_max){
                var stateANSI = parseFloat(data[i]['State ANSI'])
                var countyANSI = data[i]['County ANSI']
                var county_id = ""+stateANSI+""+countyANSI
                d3.selectAll('.counties').select('#c'+county_id)
                  .attr('fill', highlight_color)
            }}})

}   

////////////////////
////////////////////

function brushed_county_vis(data){

  if (select_year != null){yield_color(select_year)}
  
  //console.log(county_ids)
  for(i=0; i<data.length;i++){
    var county_id = "c"+data[i]
  }
}

function selected_county_vis(data){
  
  d3.selectAll('.selectVis').remove()
  d3.selectAll('.nat_avg').style('fill', 'gray').style('opacity', 0.5)
  d3.select('#vis').select("#avg_title").remove()
  var count_data = county_ids[data.id]
  var xscale_selectvis = d3.scale.linear().domain([parseFloat(d3.min(years)), parseFloat(d3.max(years))]).range([0, TimeVis.w])
 
  var yscale_selectvis = d3.scale.linear().domain(d3.extent(all_yields)).range([0, TimeVis.h])
 
  //timeslider.append('rect').attr('x',0).attr('y',histVis.y).attr('width', histVis.w).attr('height', histVis.h).attr('fill', 'white').attr('class', 'selectVis')
  timeslider.append('text')
             .attr('x', 0)
             .attr('y',histVis.y+margin.top)
             .attr('class', 'selectVis')
             .text('Time Series Data: ').style('font-weight', 'bold').style('font-size', 15)
  timeslider.append('text')
             .attr('x', 0)
             .attr('y',histVis.y+margin.top+25)
             .attr('class', 'selectVis')
             .text(data.getAttribute('name')+', '+count_data[0].State).style('font-weight', 'bold').style('font-size', 15)



  
  var delta = hist_length/years.length

  for (i=0; i<count_data.length;i++){

    var year = parseFloat(count_data[i].Year)
    var xpos = xscale_selectvis(year)
    var yield = parseFloat(count_data[i].Value)
    var ypos = yscale_selectvis(yield)
    timeslider.append('rect')
               .attr('x', xpos)
               .attr('y', TimeVis.h-ypos-margin.top)
               .attr('width', delta)
               .attr('height', ypos)
               .attr('class', 'selectVis')
               .attr('yield', yield)
               .attr('year', year)
               .attr('fill', yield_color_scale(yield))
    }
    d3.select('#vis').selectAll('rect').on('mousemove', function(){
      d3.select('#yield_ttip').remove()
      var coordinates = d3.mouse(this)
      var yield = this.getAttribute('yield')
      var year = this.getAttribute('year')
      if (yield != null){
      timeslider.append('text')
                 .attr('x', coordinates[0]+5)
                 .attr('y', coordinates[1]-5)
                 .text(year+': '+yield+" Bu/acre")
                 .style('font-weight', 'bold')
                 .style('font-size', 15)
                 .attr('id', 'yield_ttip')}})
      .on('mouseout', function(){d3.select('#yield_ttip').remove()})


}

/////////////////////////
////////////////////////
// Create 2D Brush Selector
////////////////////////
/////////////////////

var x_2d = d3.scale.identity().domain([0, width])
var y_2d = d3.scale.identity().domain([0, height])
var brush_2d = d3.svg.brush().x(x_2d).y(y_2d).on('brush', brushed_2d)


canvas.append('g').attr('fill', 'none').attr('stroke', 'black').call(brush_2d).call(brush_2d.event).attr('class', 'brush')


function brushed_2d(){
  var extent = d3.event.target.extent()
  var test = 0
  selected_data = []
  var keys = Object.keys(county_ids)
  
  
  for(i=0; i<keys.length; i++){
    var key = keys[i]
    var county = d3.select('#vis').select('#'+key)
    
    if (county[0][0] != null){
    var xpos = county[0][0].getAttribute('xpos')
    var ypos = county[0][0].getAttribute('ypos')
    if(extent[0][0] <= xpos && xpos< extent[1][0] && extent[0][1] <= ypos && ypos < extent[1][1]){ 
    selected_data.push(key)
    }}
    }

    brushed_county_vis(selected_data)
    generate_average_scatterplot(yield_average)
  //if(select_year != null){yield_color(select_year)}
}

///////////////////
//////////////////
// Radial Button Toggle
/////////////////
/////////////////
// button updates:
d3.select("input[value=\"Point\"]").on("click", function(){d3.selectAll('.brush').remove()});
d3.select("input[value=\"Brush\"]").on("click", function(){
  d3.selectAll('.selectVis').remove()
  canvas.append('g').attr('fill', 'none').attr('stroke', 'black').call(brush_2d).call(brush_2d.event).attr('class', 'brush')});


/////////////////////////
////////////////////////
// Calls
////////////////////////
/////////////////////



queue()
    .defer(d3.json, "../data/us-named.json")
  
    .await(generateMap)
    

