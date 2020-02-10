// areas of research
var area = ["Chromium", "V8", "Skia", "WebGL", "WebGPU"];
var cmpy = ["intel.com", "chromium.org", "google.com", "microsoft.com", "igalia.com",
            "arm.com", "ibm.com", "opera.com", "amazon.com", "lge.com",
            "samsung.com", "imgtec.com", "skia.org", "nvidia.com", "alum.mit.edu"];


var trendArray = [];

var marginT = {top: 30, right: 20, bottom: 70, left: 50},
    widthT = 1000 - marginT.left - marginT.right,
    heightT = 300 - marginT.top - marginT.bottom;

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

for (i = 0; i < area.length; i++) {
    prepareTrends(i);
}
for (i = 0; i < area.length; i++) {
    updateTrends(i); 
}

function prepareTrends(index) {

    let filename = area[index];
let label = "#" + filename + "Trend"

let trend= d3.select(label)
        .append("svg")
        .attr("width", widthT + marginT.left + marginT.right)
        .attr("height", heightT + marginT.top + marginT.bottom)
        .attr("id", "svg" + filename)

        .append("g")
       .attr("transform", 
              "translate(" + marginT.left + "," + marginT.top + ")");
    trendArray.push(trend);
}

function updateTrends(index) {
let filename = area[index];
let label = "#" + filename + "Trend"
    console.log("label is " + label)
//    trend.svg.selectAll("*").remove();
//    trend.g.selectAll("*").remove();

// Set the dimensions of the canvas / graph
// Parse the date / time
let parseDate = d3.timeParse("%B %Y");
var formatTime = d3.timeFormat("%B %Y");

var color = d3.scaleOrdinal(d3.schemeCategory20);   // set the colour scale

// color map(active or not)
var colorMap = new Map();
for (let i = 0; i < cmpy.length; i++) {
    colorMap.set(cmpy[i], color(i));
}
console.log(colorMap);

// Set the ranges
let x_ = d3.scaleTime().range([0, widthT]);
let y_ = d3.scaleLinear().range([heightT, 0]);

// Define the axes
let xAxis = d3.axisBottom(x_)
              .ticks(5);

let yAxis = d3.axisLeft(y_)
              .ticks(5);

// Define the line
let commitsline = d3.line()	
    .x(function(d) { return x_(d.date); })
    .y(function(d) { return y_(d.commits); })
    .curve(d3.curveLinear);
    
// Adds the svgX canvas
// Get the data
d3.csv("Data/Trends/" + filename + ".csv", function(error, data) {
    data.forEach(function(d) {
		d.date = parseDate(d.date);
		d.commits = +d.commits;
    });

    // Nest the entries by symbol
    let dataNest = d3.nest()
        .key(function(d) {return d.company;})
        .entries(data);

    // Symbol map(active or not)
    let symbolMap = new Map();
    for (let i = 0; i < dataNest.length; i++) {
        symbolMap.set(dataNest[i].key, 1);
    }
    // Scale the range of the data
    x_.domain(d3.extent(data, function(d) { return d.date; }));
    y_.domain([0, d3.max(data, function(d) { if(symbolMap.get(d.company) == 1) {return d.commits;}})]);


    modulo = Math.ceil(dataNest.length / 2);       
    legendSpace = widthT/modulo; // spacing for the legend
    // Loop through each symbol / key
    dataNest.forEach(function(d,i) { 

	// LINES
        trendArray[index].append("path")
            .attr("class", "line")
            .style("stroke", function() { // Add the colours dynamically
                return d.color = colorMap.get(d.key); })
            //.attr("id", "tag"+d.key.replace(/\./g, '\\.')) // assign ID
            .attr("id", "tag"+d.key+filename) // assign ID
            //.attr("d", commitsline(d.values));
            .attr("d", function() { if (symbolMap.get(d.key) == 1) return commitsline(d.values);});

	// DOTS
	trendArray[index].selectAll("dot")
            .data(data.filter(function() { if(symbolMap.get(d.key) == 1) return d;}))
            .enter().append("circle")
            .attr("r",5)
            .attr("cx", function(d) {return x_(d.date);})
            .attr("cy", function(d) {return y_(d.commits);})
            .style("opacity", 0)
            .on("mouseover", function(d) {
		d3.select(this).style("opacity", 1);
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div .html(d.company + "<br/>" + formatTime(d.date) + "<br/>"  + d.commits)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                })
            .on("mouseout", function(d) {
		d3.select(this).style("opacity", 0);
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
                });


        // Add the Legend
        trendArray[index].append("text")
            .attr("x", function (d) { console.log(i%modulo + " & " + legendSpace ) ;return (legendSpace/2) + i%modulo * legendSpace;})
                            
            .attr("y", function (d) { if ((dataNest.length/2) > i) {return heightT + (marginT.bottom/2)+ 5}
                                      else {return heightT + (marginT.bottom/2)+ 30};})

            .attr("class", "legend")    // style the legend
            .style("fill", function() { // Add the colours dynamically
                return d.color = colorMap.get(d.key); })
            .on("click", function(){
                // Determine if current line is visible 
                let active   = d.active ? false : true,
                newOpacity = active ? 0 : 1; 
                // Hide or show the elements based on the ID
                d3.select("#tag"+d.key.replace(/\./g, '\\.')+filename)
                    .transition().duration(100) 
                    .style("opacity", newOpacity);
                // Update whether or not the elements are active
                d.active = active;
                // NEW LINES
                if (d.active)
                    symbolMap.set(d.key, 0);
                else
                    symbolMap.set(d.key, 1);
                console.log("ARNO>" + d.key);
                console.log(symbolMap.get(d.key));
                redraw(data, XAxisGroup, YAxisGroup, d.key, symbolMap);
                // NEW LINES END.
                })
            .text(d.key); 

    });

    // Add the X Axis
    let XAxisGroup = trendArray[index].append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + heightT + ")")
        .call(xAxis);

    // Add the Y Axis
    let YAxisGroup = trendArray[index].append("g")
        .attr("class", "y axis")
        .call(yAxis);

});

function redraw(data, Xaxis, Yaxis, tag, map) {
    trendArray[index].selectAll("path").remove();
    trendArray[index].selectAll("dot").remove();
    trendArray[index].selectAll("circle").remove();

    scaleYAxis(data, map, Xaxis, Yaxis);

    var dataNestX = d3.nest()
        .key(function(d) {return d.company;})
        .entries(data)
    dataNestX.forEach(function(d,i) { 
        let newGraph = trendArray[index].append("path")
        .attr("class", "line")
        .style("stroke", function() { // Add the colours dynamically
                return d.color = colorMap.get(d.key); })
            .attr("id", "tag"+d.key) // assign ID
            .attr("d", function() { if (map.get(d.key) == 1) return commitsline(d.values);});

        let newDots = trendArray[index].selectAll("dot")
            .data(data.filter(function (d) { if(map.get(d.company) == 1) return d;}))
            .enter().append("circle")
            .attr("r",5)
            .style("opacity", 0)
            .attr("cx", function(d) {return x_(d.date);})
            .attr("cy", function(d) {return y_(d.commits);})
            .on("mouseover", function(d) {
		d3.select(this).style("opacity", 1);
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div .html(d.company + "<br/>" + formatTime(d.date) + "<br/>"  + d.commits)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
		d3.select(this).style("opacity", 0);
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    });
}

function scaleYAxis(data, map, xScale, yScale) {
    data.forEach(function(d) {
        //console.log("d.key: " + tag + " map.get(tag): " + map.get(d.symbol));
        y_.domain([0, d3.max(data, function(d) { if(map.get(d.company) == 1) {return d.commits;}})]);
    });
    xScale.transition().call(xAxis);
    yScale.transition().call(yAxis);

}

}
