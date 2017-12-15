// var generateCart = function(chartData){
//     var fromTime;
    
//     var margin = {top: 10, right: 5, bottom: 5, left: 30};

//     var width = 550 - margin.left - margin.right,
//         height = 350 - margin.top - margin.bottom;

//     var svg = d3.select("#chartDiv")
//       .append("svg")
//       .attr("width", width + margin.left + margin.right)
//       .attr("height", height + margin.top + margin.bottom)
//       .append("g")
//       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
//     var data = chartData

//     var parse = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;


//     // Transpose the data into layers
//     var dataset = d3.layout.stack()(["category0", "category1", "category2", "category3", "category4", "category5", "category6", "category7"].map(function(category) {
//         return data.map(function(d) {
//           return {x: new Date(d.fromTime), y: +d[category]};
//         });
//     }));
    
//     // Set x, y and colors
//     var x = d3.scale.ordinal()
//       .domain(dataset[0].map(function(d) { 
//            console.log(d.x);
//            return d.x; 
//         }))
//       .rangeRoundBands([10, width-10], 0.02);

//     var y = d3.scale.linear()
//       .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.y0 + d.y; });  })])
//       .range([height, 0]);

//     var colors = ['#BEE8FF', "#73DFFF", "#4096FF", "#0066FF", "#D3FFBE", "#59F52A", "#48D900", "#38A800"];

//     // Define and draw axes
//     var yAxis = d3.svg.axis()
//       .scale(y)
//       .orient("left")
//       .ticks(5)
//       .tickSize(-width, 0, 0)
//       .tickFormat( function(d) { return d } );

//     var xAxis = d3.svg.axis()
//       .scale(x)
//       .orient("bottom")
//       .tickFormat(function(d) { console.log (d) });

//     svg.append("g")
//       .attr("class", "y axis")
//       .call(yAxis);

//     svg.append("g")
//       .attr("class", "x axis")
//       .attr("transform", "translate(0," + height + ")")
//       .call(xAxis);
     

//     // Create groups for each series, rects for each segment 
//     var groups = svg.selectAll("g.area")
//       .data(dataset)
//       .enter().append("g")
//       .attr("class", "area")
//       .style("fill", function(d, i) { return colors[i]; });

//     var rect = groups.selectAll("rect")
//       .data(function(d) { return d; })
//       .enter()
//       .append("rect")
//       .attr("x", function(d) { return x(d.x); })
//       .attr("y", function(d) { return y(d.y0 + d.y); })
//       .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
//       .attr("width", x.rangeBand())
//       .on("mouseover", function(d) { 
//           renderQueryRsultLayer(d.x);
//           tooltip.style("display", null); 
//        })
//       .on("mouseout", function(d) { 
//           tooltip.style("display", "none"); 
//        })
//       .on("mousemove", function(d) {
//         var xPosition = d3.mouse(this)[0] - 15;
//         var yPosition = d3.mouse(this)[1] - 25;
//         tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
//         tooltip.select("text").text(parseFloat(d.y).toFixed(1) + '% of total area');        
//         // console.log(d.x);
//       });  
      
//         // Prep the tooltip bits, initial display is hidden
//         var tooltip = svg.append("g")
//         .attr("class", "tooltip")
//         .style("display", "none");
            
//         // tooltip.append("rect")
//         // .attr("width", 30)
//         // .attr("height", 20)
//         // .attr("fill", "white")
//         // .style("opacity", 0.5);

//         tooltip.append("text")
//         .attr("x", 15)
//         .attr("dy", "1.2em")
//         .style("text-anchor", "middle")
//         .attr("font-size", "12px")
//         .attr("font-weight", "bold");        
// }