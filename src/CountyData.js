// Structure:
// 1. Constants
// 2. Global Variables
// 3. Create Visualization Canvases
// 4. Create Time Range Slider
// 5. Costume Fxn
// Calls

// Overall page margins
var padding = 50;
var margin = {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
};

var width = 1400 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;
var centered;


// Individual vis bounding boxes
var mapVis = {
    x: 100,
    y: 0,
    w: width * 0.8,
    h: height * 0.8
};

var timeVis = {
    x: 330,
    y: mapVis.h - 100,
    w: mapVis.w * 0.5, 
    h: height - mapVis.h + 100
}

var histVis = {
    x: mapVis.w,
    y: 0,
    w: width - mapVis.w,
    h: height * 0.5
};

var weatherVis = {
    x: mapVis.w-150,
    y: histVis.h,
    w: width - mapVis.w+150,
    h: height - histVis.h
}


/////////////////////////
////////////////////////
// Global Variables (Scoping)
////////////////////////
/////////////////////
var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([mapVis.w/2, mapVis.h/2]);
var path = d3.geo.path().projection(projection).pointRadius(1.5);

var color_range = colorbrewer.YlGn[9].slice(2,8);
var gray_range = colorbrewer.Greys[9].slice(2,8); //['orange', 'darkgreen']
var legend_ticks = color_range.length;
var legend_height = 75;

var highlight_color = 'blue';
var HLT_color = 'blue';
var HLTavg_color= 'none';

var bin_num = 30;
var num_color_bins = 7;

var hist_height = 100;
var hist_length = 250;

var weather_range = [3,10];
var weather_radius = 10
var weather_radius = 10;

var station_path = '../data/station_03312014.csv';
var gdd_path = "../data/yield_data_full.csv";

var yield_path = '../data/yield_data_full.csv';
var months = ['Jan', 'Feb', "Mar", 'Apr', 'May', "Jun", 'Jul', 'Aug', "Sep", "Oct", "Nov", "Dec"]
var growing_months = [];
var brush_highlight_color = '#FFFF6C';
var county_fill_color = '#E2C670';
var weather_colors = colorbrewer.RdBu[9];

var checked = false;
var keep_marks = false;

var animate_year = 2013
var sanimate_stop = false

//Global variables (initialize)
var county_num2name = {};

var yield_color_scale;
var gray_color_scale;
var temp_color = 'orange'
var prcp_color = 'lightblue'
var data_by_year = {};
var data_by_id = {};
var all_yields = [];
var county_ids = {};

var county_to_station = {};
var yield_average = {};

var all_stations = [];
var selected_stations = [];
var selected_counties;
var years;
var selected_data;
var select_year;
var yield_range;
var weather_dict = {};

// Create Canvases
var canvas = d3.select("#vis").append("svg")
    .attr("width", width)
    .attr("height", height);

canvas.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    // .style("fill", "blue");

var Map = canvas.append("svg")
    .attr("width", mapVis.w)
    .attr("height", mapVis.h)
    .attr("x", mapVis.x)
    .attr("y", mapVis.y);

Map.append("rect")
    .attr("class", "background")
    .attr("width", mapVis.w)
    .attr("height", mapVis.h)

//title vis:
canvas.append("text").attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", 135)
    .attr("y", 30)
    .style("text-align", "center")
    .html("A Century of Corn<br>");

canvas.append("text").attr("class", "subtitle")
    .attr("text-anchor", "middle")
    .attr("x", 135)
    .attr("y", 50)
    .style("text-align", "center")
    .html("Harvesting U.S. Crop Yield Data");

canvas.append("text").attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", 30)
    .style("text-align", "center")
    .html("National Yield by County");

var timeslider = canvas.append("svg")
    .attr("width", timeVis.w)
    .attr("height", timeVis.h)
    .attr("x", timeVis.x)
    .attr("y", timeVis.y);

//timeslider.append("rect")
//    .attr("class", "background")
//    .attr("width", timeVis.w)
//    .attr("height", timeVis.h)

var hist_canvas = canvas.append("svg")
    .attr("width", histVis.w)
    .attr("height", histVis.h)
    .attr("x", histVis.x)
    .attr("y", histVis.y);

hist_canvas.append("rect")
    .attr("class", "background")
    .attr("width", histVis.w)
    .attr("height", histVis.h)

canvas.append("text").attr("class", "text")
    .attr("x", histVis.x + histVis.w/2-15)
    .attr("y", histVis.h)
    .attr("text-anchor", "middle")
    .style("text-align", "center")
    .style("fill", "black")
    // .style("font-weight", "bold")
    .style("font-size", 15)                
    .text("Yield Distribution (Bu/Ac)");


canvas.append("text").attr("class", "text")
    .attr("x", mapVis.w+margin.left+15)
    .attr("y", histVis.h+weatherVis.h-5)
    .attr("text-anchor", "middle")
    .style("text-align", "center")
    .style("fill", "black")
    // .style("font-weight", "bold")
    .style("font-size", 15)                
    .text("Growing Season Weather");


var weather_vis = canvas.append('svg')
    .attr("width", weatherVis.w)
    .attr("height", weatherVis.h)
    .attr("x", weatherVis.x+15)
    .attr("y", weatherVis.y)
    .attr('id', 'weather');

weather_vis.append("rect")
    .attr("class", "background")
    .attr("width", weatherVis.w)
    .attr("height", weatherVis.h)

var story_nav = canvas.append("svg")
    .attr("class", "story")
    .attr("width", 270)
    .attr("height", 400)
    .attr("x", 0)
    .attr("y", 230)

story_nav.append("rect")
    .attr("class", "background")
    .attr("width", 270)
    .attr("height", 400)
    .style("fill", "#ccc")



// story_pages = [0,1,2,3,4]

// story_pages.forEach(function(d) {
//     story_page_select = story_nav.selectAll(".storypage")
//         .enter().
// })

// Create Time Range Slider
var xtime_range = d3.scale.linear().domain([1910,2013]).range([0, timeVis.w - padding]).clamp(true);
var time_brush = d3.svg.brush().x(xtime_range).on('brush', time_brushed);
var slider = timeslider.append('g').attr('class', 'slider').attr('fill', 'gray').call(time_brush);

timeslider.append('g')
          .attr('class', 'axis')
          .attr('height',20)
          .attr('width', 100)
          .attr('transform', 'translate('+padding/2+','+ (timeVis.h - padding/2) +")")
          .call(d3.svg.axis().scale(xtime_range)
          .orient('bottom').tickFormat(d3.format("d")))
          .style("z-index", 999);;

var handle = slider.append('image').attr('class', 'handle')
    .attr("xlink:href", "../img/corn_icon.svg")
    // .attr("y", function(){return (timeVis.h - padding)})
    .attr('transform', 'translate('+5+','+(timeVis.h - padding)+")")
    .attr("width", 40)
    .attr("height", 40);
    // .attr('r', 9)
    
// slider.selectAll('.extent, .resize' ).remove();

    
// Costume Fxns

function generate_color_scale(yield_range){
    //continuous color scale:
    //yield_color_scale = d3.scale.linear().domain(yield_range).range(color_range);   

    //quantized color scale:
    yield_color_scale = d3.scale.quantize().domain(yield_range).range(color_range);
    gray_color_scale = d3.scale.quantize().domain(yield_range).range(gray_range);
}



function generate_WeatheVis(counties, year){

    weather_vis.selectAll(".axis").remove();
    weather_vis.selectAll(".temps").remove();
    weather_vis.selectAll(".highlighted_weather").remove();
    weather_vis.selectAll('.avg_temps').remove();
    weather_vis.selectAll('.HL_avg_temps').remove();

    // var weather_xscale = d3.scale.linear().domain([0, 11]).range([0, weatherVis.w]);

    
    var weather_ordinal = d3.scale.ordinal().domain(growing_months).rangeRoundBands([margin.left, weatherVis.w-margin.left])
    var weather_xscale = d3.scale.linear().domain(weather_range).range([margin.left, weatherVis.w-margin.left]);
    var temp_yscale = d3.scale.linear().domain([100, 0]).range([margin.bottom, weatherVis.h-margin.top]);
    var prcp_yscale = d3.scale.linear().domain([3, 0]).range([margin.bottom, weatherVis.h-margin.top]);
    var num_path = 0
        var temp_totals = {};
        var prcp_totals = {};
        if (counties.length != 0){
            
            for(i=0; i < counties.length; i++){

                var key = counties[i]+String(select_year);
                var start_pathT = 0
                var start_pathP = 0
                var start_idxT = NaN
                var start_idxP = NaN
                var weather_datum = weather_dict[key];
                var temp_path = '';
                var prcp_path = '';
                if (weather_datum != null){
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
                    
            }};

            weather_vis.selectAll(".temps").attr('opacity', Math.sqrt(1/num_path))
    
            
        }
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
          if (counties.length == 0 || num_path==0){
            weather_vis.append('text')
                     .attr('y',weatherVis.h/2)
                     .attr('x',+(weatherVis.w-margin.left-margin.right)/2-30) 
                     .text('No Weather for Selection')
                     .attr('class', 'axis')
                     .attr('id', 'nodata_weather')
                     .style('text-align', 'center')
                     .style('font-style', 'italic')
                     .style('font-size', 15);
          }
}


function highlighted_weather(highlighted, year){
    d3.select('#weather').selectAll(".highlighted_weather").remove();
    d3.select('#weather').selectAll(".HL_avg_temps").remove();

    var weather_xscale = d3.scale.linear().domain(weather_range).range([margin.left, weatherVis.w-margin.left]);
    var temp_yscale = d3.scale.linear().domain([100, 0]).range([margin.bottom, weatherVis.h-margin.top]);
    var prcp_yscale = d3.scale.linear().domain([3, 0]).range([margin.bottom, weatherVis.h-margin.top]);
    var num_path = 0
      for(i=0; i< highlighted.length; i ++){

          var key = highlighted[i]+String(select_year);
          var start_pathT = 0
          var start_pathP = 0
          var start_idxT = NaN
          var start_idxP = NaN
          var weather_datum = weather_dict[key];
          var temp_path = '';
          var prcp_path = '';

          if (weather_datum != null){
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
             
                    //add temperature path
                    if(temp_path != ''){
                    num_path += 1
                    weather_vis.append('path')
                               .attr('d', temp_path)
                               .attr('class', 'highlighted_weather')
                               .attr('fill', 'none')
                               .attr('stroke', temp_color)
                               .attr('stroke-width', 3);}

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
                  //add Prcp path:
                    if(prcp_path != ''){
                      
                    weather_vis.append('path')
                               .attr('d', prcp_path)
                               .attr('class', 'highlighted_weather')
                               .attr('fill', 'none')
                               .attr('stroke', prcp_color)
                               .attr('stroke-width', 3);}
       
   
      }
      }

      weather_vis.selectAll(".highlighted_weather").attr('opacity', Math.sqrt(1/num_path))
      weather_vis.selectAll(".temps").attr('stroke', 'grey')
      if (num_path != 0){d3.select('#weather').select("#nodata_weather").remove();}
}


function generate_legend(data){
    //continuous color scale:
    //var legend_color_scale = d3.scale.linear().domain([0,legend_ticks]).range(color_range)

    //quantized color scale:
    var legend_color_scale = d3.scale.quantize().domain([0,legend_ticks]).range(color_range);

    var legend = Map.append('g').attr('class', 'legend')
        .attr("transform", "translate("+ (mapVis.w - 200) + "," + (mapVis.h/2 - 50) + ")");

    var tick_size = (yield_range[1]-yield_range[0]) / (legend_ticks)

    for (i=1; i<=legend_ticks; i++){
        legend.append('rect')
              .attr('class', 'legend_box')
              .attr('x', 0)
              .attr('y', (legend_height/legend_ticks)*i)
              .attr('height', (legend_height/legend_ticks) - 1)
              .attr('width', 10)
              .style('fill', legend_color_scale(legend_ticks - i));

        legend.append('text')
           .attr('class', 'legend_tick')
           .attr('x', 13)
           .attr('y', (legend_height/legend_ticks)*i + 10)
           .attr('height', 10)
           .attr('width', 10)
           .text(d3.round(yield_range[1] - (i)*tick_size) + " to " + d3.round(yield_range[1] - (i-1)*tick_size) )
    }

    legend.append('rect')
              .attr('class', 'legend_box')
              .attr('x', 0)
              .attr('y', (legend_height/legend_ticks)*(legend_ticks+1) + 5)
              .attr('height', (legend_height/legend_ticks) - 1)
              .attr('width', 10)
              .style('fill', county_fill_color);

    legend.append('text')
       .attr('class', 'legend_tick')
       .attr('x', 13)
       .attr('y', (legend_height/legend_ticks)*(legend_ticks+1) + 15)
       .attr('height', 10)
       .attr('width', 10)
       .text("No Data")



        
    legend.append('text').attr('class', 'legend_tick').attr('x', 13).attr('y', 5).text('Bu/Acre');

}


function yield_color(year){        
    //remove old coloring
    d3.selectAll('.counties').selectAll('path').attr('fill', county_fill_color);
    
    // New Coloring
    var data = data_by_year[year];
   
    if (selected_data.length == 0 && data != null){
        for (i=0; i<data.length;i++){

            var county_id = data[i]['FIPS'];

            d3.selectAll('.counties').select('#c'+county_id)
              .attr('fill', yield_color_scale(parseFloat(data[i].Value)));
        }
    };

    var high_lighted = [];
    
    if (selected_data.length != 0){
        d3.selectAll('.counties').selectAll('path').attr('fill', 'none');
        
        for (i=0; i<data.length;i++){

            var county_id = data[i]['FIPS'];

            var gray_scale = true;
            
            for(j=0; j<selected_data.length; j++){
                if ("c"+county_id==selected_data[j]){
                    high_lighted.push(selected_data[j]);
                    gray_scale=false;
                }
            }
            
            if (gray_scale==true){
                d3.selectAll('.counties').select('#c'+county_id)
                  .attr('fill', gray_color_scale(parseFloat(data[i].Value)));
            }
            
            if (gray_scale ==false){
                d3.selectAll('.counties').select('#c'+county_id)
                  .attr('fill', yield_color_scale(parseFloat(data[i].Value)));
            }
        }
    }

    for(i=0; i<selected_data.length; i++) {
        var county_id = selected_data[i];
        var colored = false;
        
        for (j=0; j<high_lighted.length; j++){
            if(high_lighted[j] == county_id) {
                colored = true;
            }
        }
        
        if(colored == false){
            d3.selectAll('.counties').select('#'+county_id).attr('fill', county_fill_color);
        }
    }
      
    generateHist(data);
    generate_average_scatterplot(yield_average);

    //add year to map:
    canvas.select('#yrtoptip').remove();
    canvas.append('text')
        .attr('y',mapVis.y+85)
        .attr('x',width/2)
        .attr("text-anchor", "middle")
        .style("text-align", "center")
        .text('Year: '+year)
        .attr('id', 'yrtoptip')
        // .attr('font-weight', 'bold')
        .style('font-size', 20);
}


function process_data(path){  

    d3.csv(path, function(data){

        var start_year = 0;
        var data_for_year = [];
        var start_id = 0;
        var data_for_id = [];
        
        for(i=0;i<data.length;i++){
            if (data[i].County != 'OTHER (COMBINED) COUNTIES'){
                all_yields.push(parseFloat(data[i].Value));
                
                if(start_year==0){
                    var current_year = data[i].Year;
                    start_year = 1;
                }
                
                if(current_year == data[i].Year){
                    data_for_year.push(data[i]);
                }
                
                if(current_year != data[i].Year){
                   data_by_year[current_year] = data_for_year;
                   current_year  = data[i].Year;
                   data_for_year = [];
                   data_for_year.push(data[i]);
                 }
                
                if(i==data.length-1){
                    data_for_year.push(data[i]);
                    data_by_year[current_year] = data_for_year;
                }

                // var current_id = ('c'+parseFloat(data[i]['State ANSI'])+data[i]['County ANSI']);
                var current_id = ('c'+parseFloat(data[i]['FIPS']));
                var current_list = county_ids[current_id];
                
                if (current_list != null){
                    current_list.push(data[i]);
                }
            }
        }

        //create growing months:

        for(i=weather_range[0]; i < weather_range[1]; i++){
          growing_months.push(months[i])
        }




        //Create Weather Data:
        weather_dict 
        for(i=0; i<data.length; i++){
          weather_dict[String(data[i]['FIPS']+data[i]['Year'])] = data[i]
        }
        


            
        yield_range = d3.extent(all_yields);
        generate_color_scale(yield_range);
        generate_legend(all_yields);

        years = Object.keys(data_by_year);
        select_year = d3.min(years);

        yield_color(parseFloat(d3.min(years)));

        for(i=0;i<years.length;i++){
            var current_data = data_by_year[years[i]];
            var sum = 0;
            
            for(j=0;j<current_data.length;j++){
                sum += parseFloat(current_data[j].Value);
            }
        
            yield_average[years[i]] = sum/current_data.length;
        }
        
        generate_average_scatterplot(yield_average);
        yield_color(animate_year);
        canvas.transition().ease("linear").call(time_brush.event)
    });        
}



var leading_zero = d3.format("05d");

function generateMap(error, us) {      

    // Remove HI and AK (FIPS states 02 and 15)
    counties = [];
    topojson.feature(us, us.objects.counties).features.forEach(function(d) {
        if((leading_zero(d.id).slice(0,2) != 02) && (leading_zero(d.id).slice(0,2) != 15)){
            counties.push(d)
        }
    });

    Map.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(counties)
        .enter().append("path")
        .attr("d", path)
        .attr('name', function(d,i){
            county_num2name[d.id] = d.properties.name;
            return d.properties.name})
        .attr('id', function(d,i){
            county_ids[('c'+d.id)] = [];
            return 'c'+d.id})
        .attr('xpos', function(d,i){return path.centroid(d)[0]})
        .attr('ypos', function(d,i){return path.centroid(d)[1] + margin.top})
        .on('click', function(){selected_county_vis(this)})
        .on('mousemove', function(){
            d3.select('#vis').select('#cname_tip').remove();
            var county_name = this.__data__.properties.name;
            var coordinates = d3.mouse(this);
            Map.append('text')
               .attr('x', coordinates[0]+5)
               .attr('y', coordinates[1]-5)
               .text(county_name)
               .attr('id', 'cname_tip')
               .style('font-weight', 'bold')
               .style('font-size', 15)
               .style('fill', 'brown')})

        .on('mouseout', function(){
            d3.select('#vis').select('#cname_tip').remove();
        });

       
    process_data(yield_path);


}

  
function time_brushed(){
    //fix timeslider vis:
    d3.selectAll('.selectVis').remove();
    
    //brush        
    var value = time_brush.extent()[0];
    
    if (d3.event.sourceEvent){
        value = xtime_range.invert(d3.mouse(this)[0]);
        time_brush.extent([value, value]);
        select_year = d3.round(value, 0);
    }
    else{
        time_brush.extent([value, value]);
        value = animate_year
        select_year = animate_year;
    }
    // handle.attr('cx', xtime_range(value))
    handle.transition(100).attr('x', xtime_range(value));
    animate_year = d3.round(value, 0);
    //update color 
    yield_color(select_year);
    //load weather data:
    generate_WeatheVis(selected_counties, select_year);

}


function generate_average_scatterplot(data){
    d3.select('#vis').select("#avg_title").remove();
    d3.select('#vis').selectAll('.nat_avg').remove();
    var keys = Object.keys(data);
    var xscale = d3.scale.linear().domain(d3.extent(keys)).range([0, timeVis.w]).clamp(true);
    var yscale = d3.scale.linear().domain(d3.extent(all_yields)).range([0, timeVis.h]);

    if (selected_data.length == 0){
        timeslider.append('text')
                  .attr('x', 0)
                  .attr('y', margin.top)
                  .text('National Averages:')
                  .attr('id', "avg_title")
                  .style({'font-size':15});

        for(i=0;i<keys.length;i++){
            var year = keys[i];
            var datum = data[year];

            timeslider.append('rect')
                      .attr('x', xtime_range(year) + padding/2)
                      .attr('y', timeVis.h - yscale(datum) - padding/2)
                      .attr('width', 5)
                      .attr('height', 5)
                      .attr('value', datum)
                      .attr('year', year)
                      .style('fill', yield_color_scale(datum))
                      .attr('class', 'nat_avg')
                      .on('mouseover', function(){
                            d3.select('#vis').select('#avg_yeildttip').remove();
                            var coordinates = d3.mouse(this);
                            var avg_yield = this.getAttribute('value');
                            var avg_year = this.getAttribute('year');
                            timeslider.append('text')
                                      .attr('x', 0)
                                      .attr('y',margin.top +20)
                                      .text("Nat'l Avg, "+avg_year+": "+d3.round(avg_yield, 2)+" Bu/acre")
                                      .attr('id', 'avg_yeildttip')
                                      .style({'font-size':15})
                            })
                            
                      .on('mouseout', function(){
                        d3.select('#vis').select('#avg_yeildttip').remove();  
                      });
        }  
    }

    if (selected_data.length != 0){
    
        timeslider.append('text')
                  .attr('x', 0)
                  .attr('y', margin.top)
                  .text('Regional Averages:')
                  .attr('id', "avg_title")
                  .style('font-size', 15);

        var regional_yields = {};
        
        for(i=0; i<years.length; i++){
            regional_yields[years[i]] = {'sum':0, 'count':0, 'avg':0};
        }
   
        for(i=0;i<selected_data.length; i++){
            var datum  = county_ids[selected_data[i]];
            for(j=0; j<datum.length; j++){
                regional_yields[datum[j].Year].sum += parseFloat(datum[j].Value);
                regional_yields[datum[j].Year].count += 1;
            }
        }
        
        for(i=0; i<years.length; i++){
            regional_yields[years[i]].avg = regional_yields[years[i]].sum/regional_yields[years[i]].count;
        }

        for(i=0; i<years.length; i++){
            var year = years[i];
            var datum = regional_yields[year].avg;
  
            if(!isNaN(datum)){
                timeslider.append('rect')
                          .attr('x', xscale(year))
                          .attr('y', timeVis.h - yscale(datum)-margin.top)
                          .attr('width', 5)
                          .attr('height', 5)
                          .attr('value', datum)
                          .attr('year', year)
                          .style('fill', yield_color_scale(datum))
                          .attr('class', 'nat_avg')
                          .on('mouseover', function(){
                                d3.select('#vis').select('#avg_yeildttip').remove()
                                var coordinates = d3.mouse(this);
                                var avg_yield = this.getAttribute('value');
                                var avg_year = this.getAttribute('year');
                                timeslider.append('text')
                                          .attr('x', 0)
                                          .attr('y', margin.top+20)
                                          .text("Reg'l Avg, "+avg_year+": "+d3.round(avg_yield, 2)+" Bu/acre")
                                          .attr('id', 'avg_yeildttip')
                                          .style({ 'font-size':15})
                          })
                          .on('mouseout', function(){
                                d3.select('#vis').select('#avg_yeildttip').remove();
                          });
            }
        }
    }
} 


function generateHist(data){
    hist_canvas.selectAll('.bars').remove();
    hist_canvas.selectAll('.axis').remove();
   
    var bin_values = [];
    // create bin values:
    if (selected_data.length == 0){
        for (i=0;i<data.length; i++){
            bin_values.push(parseFloat(data[i].Value))
        }
    }

    for (i=0; i < selected_data.length; i++){  
          var datum = county_ids[selected_data[i]];
          for(j=0; j<datum.length; j++){
            if (datum[j].Year == data[0].Year){
                bin_values.push(parseFloat(datum[j].Value));
            }
          }
    }

    var xscale_hist = d3.scale.linear().domain(d3.extent(all_yields)).range([5,histVis.w - padding]);
    var yscale_hist = d3.scale.linear().domain([0, 550]).range([5,histVis.h - padding]);

    var hist_data = d3.layout.histogram().bins(xscale_hist.ticks(bin_num))(bin_values);
    var data_for_bins = {};
    
    hist_canvas.selectAll('.bars').data(hist_data).enter().append('rect')
               .attr('height', function(d,i){
                    if(d.y == 0){
                        return 0;
                    }
                    if(d.y != 0){
                        return yscale_hist(d.y);
                    }
                })
               .attr('width', histVis.w/bin_num)
               .attr('x', function(d,i){return i*histVis.w/bin_num + 15})
               .attr('y', function(d,i){
                    if(d.y == 0){ 
                        return histVis.h - padding;
                    }
                    if(d.y != 0){
                        return histVis.h - yscale_hist(d.y) - padding;
                    }
                })
               .attr('fill', function(d,i){return yield_color_scale(d.x);})
               .attr('class', 'bars')
               .attr('id', function(d,i){return 'b'+i})
               .attr('bin_count', function(d,i){return d.y});
   
    //create axis for histogram:         
    var yAxis = d3.svg.axis().scale(yscale_hist).orient('right').tickFormat(d3.format("d"));
    var xAxis = d3.svg.axis().scale(xscale_hist).orient('bottom').tickFormat(d3.format("d"));
   
    hist_canvas.append('g')
        .call(xAxis).attr('transform',  "translate("+(10)+","+(histVis.h - padding)+")")
        .attr('class', 'axis')
        .selectAll('text')
        .attr('y',0)
        .attr('x',-20)
        .style("text-anchor", "middle")
        .style("text-align", "right")
        .attr('transform', 'rotate(-70)')  
        .style('font-size', 10);
    //hist_canvas.append('text').attr('y', histVis.h).attr('x', histVis.w/2-margin.left).text('Yield').style('font-weight', 'bold').attr('class', 'axis')

    hist_canvas.selectAll('.bars')
        .on('mousemove', function(){
            hist_canvas.select('#bcount_tip').remove();
            var bin_count = this.__data__.y;
            var coordinates = d3.mouse(this);

            //add bin count tool tip:
            hist_canvas.append('text')
                       .attr('x', function(){
                        if(coordinates[0]+10 < histVis.w-100){
                          return coordinates[0]+10 }
                        else{return  coordinates[0]-100 }
                       })
                       .attr('y', coordinates[1]-5)
                       .text('Bin Count: '+bin_count)
                       .attr('id', 'bcount_tip')
                       .style('font-weight', 'bold');

       
        })

      .on('mouseout', function(){
         
            hist_canvas.select('#bcount_tip').remove();})
            
      .on('click', function(){
            yield_color(data[0].Year)
            var bin_min = d3.min(this.__data__);
            var bin_max = d3.max(this.__data__);
            hist_canvas.select('#'+this.id).style('fill', highlight_color)
            var highlightd_counties = [] ;
            for (i=0; i<data.length; i++){
                if (parseFloat(data[i].Value)>=bin_min && parseFloat(data[i].Value)<=bin_max){
                    // var stateANSI = parseFloat(data[i]['State ANSI']);
                    // var countyANSI = data[i]['County ANSI'];
                    // var county_id = ""+stateANSI+""+countyANSI;
                    var county_id = data[i]['FIPS']

                    d3.selectAll('.counties').select('#c'+county_id).attr('fill', highlight_color);
                    highlightd_counties.push(county_id);
                }
            }
            highlighted_weather(highlightd_counties, select_year);
        });
}   


function brushed_county_vis(data){
    if (select_year != null){
        yield_color(select_year);
    }
  
    for(i=0; i<data.length;i++){
        var county_id = "c"+data[i];
    }
}


function selected_county_vis(data){

    d3.selectAll('.selectVis').remove();
    d3.selectAll('.nat_avg').style('fill', 'gray').style('opacity', 0.5);
    d3.select('#vis').select("#avg_title").remove();

    var count_data = county_ids[data.id];
    var xscale_selectvis = d3.scale.linear().domain([parseFloat(d3.min(years)), parseFloat(d3.max(years))]).range([0, timeVis.w]);
    var yscale_selectvis = d3.scale.linear().domain(d3.extent(all_yields)).range([0, timeVis.h]);

    timeslider.append('text')
             .attr('x', 0)
             .attr('y',histVis.y+margin.top-15)
             .attr('class', 'selectVis')
             .text('Time Series Data: ').style('font-size', 15);
    timeslider.append('text')
             .attr('x', 0)
             .attr('y',histVis.y+margin.top)
             .attr('class', 'selectVis')
             .text(data.getAttribute('name')+', '+count_data[0].State).style('font-size', 15);

    var delta = hist_length/years.length;

    for (i=0; i<count_data.length;i++){

        var year = parseFloat(count_data[i].Year);
        var xpos = xtime_range(year) + padding/2;
        var yield = parseFloat(count_data[i].Value);
        var ypos = yscale_selectvis(yield);

        timeslider.append('rect')
                   .attr('x', xpos)
                   .attr('y', timeVis.h-ypos-padding/2)
                   .attr('width', delta)
                   .attr('height', ypos)
                   .attr('class', 'selectVis')
                   .attr('yield', yield)
                   .attr('year', year)
                   .attr('fill', yield_color_scale(yield));
        }

        d3.select('#vis').selectAll('rect').on('mousemove', function(){
              d3.select('#yield_ttip').remove();
              var coordinates = d3.mouse(this);
              var yield = this.getAttribute('yield');
              var year = this.getAttribute('year');
              if (yield != null){
                  timeslider.append('text')
                             .attr('x', coordinates[0]+5)
                             .attr('y', coordinates[1]-5)
                             .text(year+': '+yield+" Bu/acre")
                             .style('font-weight', 'bold')
                             .style('font-size', 15)
                             .attr('id', 'yield_ttip')
              }
        }) 
          
       .on('mouseout', function(){d3.select('#yield_ttip').remove();});
}


// Create 2D Brush Selector
var x_2d = d3.scale.identity().domain([0, mapVis.w]);
var y_2d = d3.scale.identity().domain([0, mapVis.h]);
var brush_2d = d3.svg.brush().x(x_2d).y(y_2d).on('brush', brushed_2d);

Map.append('g').attr('class', 'brush')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .call(brush_2d)
    .call(brush_2d.event);
// brushed_2d();

function brushed_2d(){
    d3.select('#vis').select('#avg_yeildttip').remove()

    var extent = d3.event.target.extent();
    var test = 0;
    selected_data = [];
    selected_counties = [];
    var keys = Object.keys(county_ids);

    //select counties
    for(i=0; i<keys.length; i++){
        var key = keys[i];
        var county = Map.select('#'+key);

        if (county[0][0] != null){
            var xpos = county[0][0].getAttribute('xpos');
            var ypos = county[0][0].getAttribute('ypos') - padding;
            
            if(extent[0][0] <= xpos && xpos< extent[1][0] && extent[0][1] <= ypos && ypos < extent[1][1]){ 
                selected_data.push(key);
                selected_counties.push(key.slice(1))
            }
        }
    }
    
    

    brushed_county_vis(selected_data);
    generate_average_scatterplot(yield_average);
    generate_WeatheVis(selected_counties, select_year);

}

function step() {
    canvas.transition().ease("linear").call(time_brush.event)

    animate_year +=1; 
    if ((animate_year < 2013) && (!animate_stop))
        setTimeout(step, 300);
    else {
        animate_year = 1910;
    }
}

// Radial Button Toggle
// button updates:
// d3.select("button[value=\"Play\"]").on("click", function(){
//     animate_stop = false;
//     step();
// });

$('#selectionType .btn').on("click", function(d){
    if ($(this).children()[0].value == 'point'){
        d3.selectAll('.brush').remove();
    } 
    else if($(this).children()[0].value == 'brush') {
        animate_stop = true

        // canvas.transition().duration(1500)
        //   // .attr("width", width)
        //   .attr("height", height)
        //   .style("opacity", 1)

        d3.selectAll('.selectVis').remove();
        Map.append('g').attr('fill', 'none').attr('stroke', 'black').call(brush_2d).call(brush_2d.event).attr('class', 'brush');
    }
})

$('#timeSliderControl .btn').on("click", function(d){
    if ($(this).button()[0].value == 'timeDown'){
 
        animate_stop = true;
        if(animate_year>1910){
            animate_year --;
            canvas.transition().ease("linear").call(time_brush.event)
        }
        $(this).button('toggle')

        // d3.selectAll('.brush').remove();
    } 
    else if($(this).button()[0].value == 'timeUp') {
        animate_stop = true
        if(animate_year<2013){
            animate_year ++;
            canvas.transition().ease("linear").call(time_brush.event)
        }
    }
})
.on("dblclick", function() {  
 animate_stop = false;
    step(); });

$('#changeVis .btn').on("click", function(d){
    
    if ($(this).button()[0].id == 'national'){
        Map.transition().duration(1500)
            .style("opacity", 1)

        d3.select("#localVis")
            .transition().duration(1500)
            .style("opacity", 0)

        d3.select("#localVis").transition().delay(1500).style("z-index", -999)

        // d3.selectAll('.brush').remove();
    } 
    else if($(this).button()[0].id == 'local') {
        d3.select("#localVis")
            .style("z-index", 999)
            .transition().duration(1500)
            .style("opacity", 1)

        Map.transition().duration(1500)
            .style("opacity", 0)
    }
})
 $('#storyControls #storyPages .btn').on("click", function(d){
  var idx_button = $(this).attr('value')
  if (idx_button != "L" & idx_button != "R"){

  } 
  if (idx_button == 1){
    //text for the update
  }
  if (idx_button == 2){
    //text for the update
  }
  if (idx_button == 3){
    //text for the update
  }
  if (idx_button == 4){
    //text for the update
  }
  if (idx_button == 5){
    //text for the update
  }
  if (idx_button == 6){
    //text for the update
  }
  if (idx_button == 7){
    //text for the update
  }
 })







$(document).ready(function() {
    $("#changeVis .btn").first().button("toggle");
      $("#selectionType .btn").first().button("toggle");
    d3.selectAll('.brush').remove();
});



// Calls
queue()
    .defer(d3.json, "../data/us-named.json")
  
    .await(generateMap);
