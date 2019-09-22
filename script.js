
var svg = d3.select("svg")
   .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox", "0 0 960 960"),
    margin = 20,
    diameter = +svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

var color = d3.scaleLinear()
    .domain([-1, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

var pack = d3.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);

function updateGraph(filename) {

    g.selectAll("*").remove()
    let path ="Data/";
    path=path.concat(filename);
    console.log(path);
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
      .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
      .style("fill", function(d) { return d.children ? color(d.depth) : null; })
      .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

  var text = g.selectAll("text")
    .data(nodes)
    .enter().append("text")
      .attr("class", "label")
      .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
      .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
      .text(function(d) { return d.data.name + " " + d.value; });

  var node = g.selectAll("circle,text");

  svg
      .style("background", color(-1))
      .on("click", function() { zoom(root); });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; focus = d;

    var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", function(d) {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) { zoomTo(i(t)); };
        });

    transition.selectAll("text")
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

var allText = [];
var allTextLines = [];
var Lines = [];
var listOfFiles = [];
var currentChoice;

loadListOfFiles();
//document.getElementById("rand_txt").innerHTML = "List of files:";
console.log(typeof(allTextLines));

function loadListOfFiles() {
    let txtFile = new XMLHttpRequest();
    txtFile.open("GET", "list_of_files_json.txt", true);
    txtFile.setRequestHeader('Access-Control-Allow-Headers', '*');

    txtFile.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            listOfFiles = txtFile.responseText;
            console.log("listOfFile is : " + typeof(listOfFiles));
            allTextLines = listOfFiles.split(/\n/);
            console.log("what " + allTextLines.length);
            for(let i = 0; i < allTextLines.length; i++) {
                console.log(i);
                if(allTextLines[i] != "") {
                    item = document.createElement('choice');
                    item.innerHTML = allTextLines[i];

                    z = document.createElement("option");
                    z.appendChild(item);
                    z.setAttribute("value", item.innerHTML);
                    console.log("z value = " + z.value + "VS " + this.innerHTML);
                    document.getElementById("myselect").appendChild(z);

                }
            }
            console.log(listOfFiles);
            console.log(allTextLines);
        }
    };
    txtFile.send(null);

}

document.getElementById("myselect").onclick = function() {
    console.log("current value is" + document.getElementById("myselect").value);
    let jsonFilename = document.getElementById("myselect").value
    updateGraph(jsonFilename); //document.getElementById("myselect").value);
    document.getElementById("filename").innerHTML = jsonFilename;
    let url = "http://127.0.0.1:8080/Data/";
    let filename = jsonFilename.slice(0,-5);
    filename = filename.concat(".csv");
    url = url.concat(filename);
    console.log(url + " and " + filename);
    document.getElementById('download_link').href = url;
    document.getElementById('download_link').download = filename;
    loadDoc(filename)

}

function updatefull() {
    console.log(document.getElementById("filename").value + "or" + document.getElementById("filename").innerHTML)
    let jsonFileName = document.getElementById("filename").innerHTML;
    updateGraph(jsonFileName); //document.getElementById("myselect").value);
};
function updateTop5() {
    let jsonFileName = document.getElementById("filename").innerHTML;
    jsonFileName=jsonFileName.replace('.json','_TOP5.json');
    let top5 = "Subset/";
    top5 = top5.concat(jsonFileName);
    updateGraph(top5);
};
function updateIntel() {
    let jsonFileName = document.getElementById("filename").innerHTML;
    jsonFileName=jsonFileName.replace('.json','_INTEL.json');
    let top5 = "Subset/";
    top5 = top5.concat(jsonFileName);
    updateGraph(top5);
};

function loadDoc(filename) {
    var allDocLines = [];
    let csvPath ="Data/";
    csvPath=csvPath.concat(filename);
    currentCSV = csvPath;
    let dataFile = new XMLHttpRequest();
    dataFile.open("GET", csvPath, true);
    dataFile.setRequestHeader('Access-Control-Allow-Headers', '*');
    dataFile.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var txt = this.responseText;
            // https://www.youtube.com/watch?v=ts3CJT2VGO0
            let num_txt = txt.split(/\r?\n|\r/);
            console.log("num txt = " + num_txt.length);
            var table_data = '<table class="table table-bordered table-striped">';
            for (var count = 0; count < num_txt.length; count++)
            {
                var cell_data = num_txt[count].split(",");
                table_data += '<tr>';
                for (var cell_count = 0; cell_count < cell_data.length; cell_count++)
                {
                    if(count === 0)
                    {
                        table_data += '<th>'+cell_data[cell_count]+'</th>';
                    }
                    else
                    {
                        table_data += '<td>'+cell_data[cell_count]+'</td>';
                    }
                }
                table_data += '<tr>';

            }
            table_data += '</table>';
            document.getElementById("showData").innerHTML = table_data;

//            document.getElementById("showData").innerHTML= this.responseText.split(/","?\n|\r/);
        }
    };
    //txtFile.open("GET", "file://home/amandy/Repos/WebTeam_2019/Documentation_make/process_csv_in_JS/contribution_june_2019.csv", true);
    dataFile.send(null);
    console.log(dataFile);
};


function handleFiles(files) {
    // Check for the various File API support.
    if (window.FileReader) {
        alert('FileReader supported in this browser.');
        getAsText(files[0]);
          // FileReader are supported.
    } else {
        alert('FileReader are not supported in this browser.');
    }
}

function getAsText(fileToRead) {
    let reader = new FileReader();
    reader.fileName = "file://home/amandy/Repos/WebTeam_2019/Documentation_make/process_csv_in_JS/contribution_june_2019.csv";
    reader.readAsText();
    reader.onload = loadHandler;
    reader.onerror = errorHandler;
}

function loadHandler(event) {
    let csv = event.target.results;
    processData(csv);
}

function processData(csv) {
    let allTextLines = csv.split(/\r\n|\n/);
    let lines = [];
    for (let i = 0; i < allTextLines.length; i++) {
        let data = allTextLines[i].split(';');
            let tarr = [];
            for (let j = 0; j < data.length; j++) {
                tarr.push(data[j]);
            }
            lines.push(tarr);
            
    }
    console.log(lines)
}

function errorHandler(evt) {
    if(evt.target.error.name == "NotReadableError") {
        alert("Cannot Read File!!!");
    }
}


