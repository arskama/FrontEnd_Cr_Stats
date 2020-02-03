/* BUBBLE GRAPH PUT INTO SILENT MODE
// bubble graph
var svgBubble = d3.select("#svgBubble")
    .attr("preserveAspectRatio", "xMinYMin meet")
    margin = 20,
    diameter = +svgBubble.attr("width"),
    g = svgBubble.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

var color = d3.scaleLinear()
    .domain([-1, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

var pack = d3.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);

function updateGraph(filename) {

    console.log("update Graph Tree YOOOO FILENAME : " + filename);
    g.selectAll("*").remove()
    let path ="Data/";
    path=path.concat(filename);

    d3.json(path, function(error, root) {
        if (error) throw error;

        root = d3.hierarchy(root)
        .sum(function(d) { return d.size; })
        .sort(function(a, b) { return b.value - a.value; });

        var focus = root,
        nodes = pack(root).descendants(),
        view;

        var circle = g.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
            .attr("class", function(d) {return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
            .style("fill", function(d) { return d.children ? color(d.depth) : null; })
            .on("click", function(d) {if (focus !== d) zoom(d), d3.event.stopPropagation(); });

        var text = g.selectAll("text")
        .data(nodes)
        .enter().append("text")
            .attr("class", "label")
            .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
            .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
            .text(function(d) { return d.data.name + " " + d.value; });

        var node = g.selectAll("circle,text");

        svgBubble
        .style("background", color(-1))
        .on("click", function() { if(focus !== root) zoom(root); });

        zoomTo([root.x, root.y, root.r * 2 + margin]);

        function zoom(d) {
            var focus0 = focus; focus = d;

            var transition = d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", function(d) {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function(t) { zoomTo(i(t)); };
            });

            svgBubble.transition().selectAll("text")
            .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
            .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
            .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
        }

        function zoomTo(v) {
            var k = diameter / v[2]; view = v;
            node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
            circle.attr("r", function(d) { return d.r * k; });
        }
    });
}
*/
var allText = [];
var allTextLines = [];
var Lines = [];
var listOfFiles = [];
var currentChoice;

loadListOfFiles();

function loadListOfFiles() {
    let txtFile = new XMLHttpRequest();
    txtFile.open("GET", "calendar.txt", true);
    txtFile.setRequestHeader('Access-Control-Allow-Headers', '*');
    let defaultSelection="";

    txtFile.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            listOfFiles = txtFile.responseText;
            allTextLines = listOfFiles.split(/\n/);
            for(let i = 0; i < allTextLines.length; i++) {
                if(allTextLines[i] != "") {
                    item = document.createElement('choice');
                    item.innerHTML = allTextLines[i];
                    z = document.createElement("option");
                    z.appendChild(item);
                    if (i == 0) {
                        z.setAttribute("selected", "selected");
                        defaultSelection = item.innerHTML;
                        currentChoice = defaultSelection.replace(/ /g, "_");
                        propagateChoice(currentChoice);
                    }
                z.setAttribute("value", item.innerHTML);
                document.getElementById("myselect").appendChild(z);
                }
            }
        }
    };
    txtFile.send(null);
}

function propagateChoice(choice) {
    let chromeFilename = "contributions_cr_".concat(choice);
    let chromeOSFilename = "contributions_cros_".concat(choice);
    title = "Chromium Commits for " + choice.replace("_"," ");
    document.getElementById('monthTitle').innerHTML = title; 
//    updateGraph(chromeFilename.concat(".json"));
    updateTree(chromeFilename.concat(".json"));
    let url = "Data/";
    let urlCr = url.concat(chromeFilename);
    let urlCrOs = url.concat(chromeOSFilename);
    document.getElementById('download_link_cr').href = urlCr.concat(".csv");
    document.getElementById('download_link_cr').download = chromeFilename.concat(".csv");
    document.getElementById('download_link_crOS').href = urlCrOs.concat(".csv");
    document.getElementById('download_link_crOS').download = chromeOSFilename.concat(".csv");

}

document.getElementById("myselect").onclick = function() {
    let currentChoice = document.getElementById("myselect").value
    currentChoice = currentChoice.replace(/ /g, "_");
    propagateChoice(currentChoice);
}
