// areas of research
var area = ["Chromium", "V8", "Skia", "WebGL"];

var trendArray = [];

var marginT = {top: 30, right: 20, bottom: 70, left: 50},
    widthT = 1000 - marginT.left - marginT.right,
    heightT = 300 - marginT.top - marginT.bottom;

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

var color = d3.scaleOrdinal(d3.schemeCategory20);   // set the colour scale

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
/// new code 
    let symbolMap = new Map();
    for (let i = 0; i < dataNest.length; i++) {
        symbolMap.set(dataNest[i].key, 1);
    }
    // Scale the range of the data
    x_.domain(d3.extent(data, function(d) { return d.date; }));
    y_.domain([0, d3.max(data, function(d) { if(symbolMap.get(d.company) == 1) {return d.commits;}})]);
//    y_.domain([0, d3.max(data, function(d) { return d.commits; })]);

///


    modulo = Math.ceil(dataNest.length / 2);       
    legendSpace = widthT/modulo; // spacing for the legend
    // Loop through each symbol / key
    dataNest.forEach(function(d,i) { 

        trendArray[index].append("path")
            .attr("class", "line")
            .style("stroke", function() { // Add the colours dynamically
                return d.color = color(d.key); })
            //.attr("id", "tag"+d.key.replace(/\./g, '\\.')) // assign ID
            .attr("id", "tag"+d.key+filename) // assign ID
            //.attr("d", commitsline(d.values));
            .attr("d", function() { if (symbolMap.get(d.key) == 1) return commitsline(d.values);});

        // Add the Legend
        trendArray[index].append("text")
            .attr("x", function (d) { console.log(i%modulo + " & " + legendSpace ) ;return (legendSpace/2) + i%modulo * legendSpace;})
                            
            .attr("y", function (d) { if ((dataNest.length/2) > i) {return heightT + (marginT.bottom/2)+ 5}
                                      else {return heightT + (marginT.bottom/2)+ 30};})

            .attr("class", "legend")    // style the legend
            .style("fill", function() { // Add the colours dynamically
                return d.color = color(d.key); })
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
    scaleYAxis(data, map, Xaxis, Yaxis);

    var dataNestX = d3.nest()
        .key(function(d) {return d.company;})
        .entries(data)
    dataNestX.forEach(function(d,i) { 
        let newGraph = trendArray[index].append("path")
        .attr("class", "line")
        .style("stroke", function() { // Add the colours dynamically
                return d.color = color(d.key); })
            .attr("id", "tag"+d.key) // assign ID
            .attr("d", function() { if (map.get(d.key) == 1) return commitsline(d.values);});
   
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