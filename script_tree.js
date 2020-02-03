
        var svgTree = d3.select("#svgTree")
        var marginTree = {top: 20, right: 90, bottom: 30, left: 90};
        var widthTree = +svgTree.attr("width") - marginTree.left - marginTree.right;
        var heightTree = +svgTree.attr("height") - marginTree.top - marginTree.bottom;

        console.log("ARNO width = " + widthTree);
        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
//       var svgTree = d3.select("#svgTree").append("svg")
        
        //svgTree.attr("width", widthTree + marginTree.right + marginTree.left)
        //svgTree.attr("height", heightTree + marginTree.top + marginTree.bottom)
        var gTree = svgTree.append("g").attr("transform", "translate(" + marginTree.left + "," + marginTree.top + ")");
function updateTree(filename) {

    gTree.selectAll("*").remove()
    let path ="Data/";
    path=path.concat(filename);
    console.log("update Tree YOOOO FILENAME : " + filename);
    d3.json(path, function(error, data) {
        if (error) throw error;


        var i = 0,
        duration = 750,
        root;

        var treemap = d3.tree().size([heightTree, widthTree]);

        var root  = d3.hierarchy(data, function(d) {return d.children;})
                    .sum(function(d) {return d.size;});
        root.x0 = heightTree /2;
        root.y0= 0;

        console.log(root);    

        // Collapse after the second level
        // root.children.forEach(collapse);

        update(root);

        // Collapse the node and all it's children
        function collapse(d) {
        if(d.children) {
            d._children = d.children
            d._children.forEach(collapse)
            d.children = null
            } 
        }

        function update(source) {
            // Assigns the x and y position for the nodes
            var treeData = treemap(root);

            // Compute the new tree layout.
            var nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);

            // Normalize for fixed-depth.
            nodes.forEach(function(d){ d.y = d.depth * 180});

            // ****************** Nodes section ***************************

            // Update the nodes...
            var node = gTree.selectAll('g.node')
           .data(nodes, function(d) {return d.id || (d.id = ++i); });

            // Enter any new modes at the parent's previous position.
            var nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
            })
           .on('click', click);

            // Add Circle for the nodes
            nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style('fill', function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

            // Add labels for the nodes
            nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("x", function(d) {
              return d.children || d._children ? -13 : 13;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) { return d._children? d.data.name : d.data.name + "   " + d.value; })
            .style("fill", function(d) { return d.data.name == "intel.com" ? "blue" : "black";});

            // UPDATE
            var nodeUpdate = nodeEnter.merge(node);

            // Transition to the proper position for the node
           nodeUpdate.transition()
           .duration(duration)
           .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

            // Update the node attributes and style
            nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            })
            .attr('cursor', 'pointer');


            // Remove any exiting nodes
            var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
              return "translate(" + source.y + "," + source.x + ")";
             })
             .remove();

             // On exit reduce the node circles size to 0
            nodeExit.select('circle')
            .attr('r', 1e-6);

            // On exit reduce the opacity of text labels
            nodeExit.select('text')
            .style('fill-opacity', 1e-6);

// ****************** links section ***************************

            // Update the links...
            var link = gTree.selectAll('path.link')
            .data(links, function(d) { return d.id; });

            // Enter any new links at the parent's previous position.
            var linkEnter = link.enter().insert('path', "g")
           .attr("class", "link")
           .attr('d', function(d){
                var o = {x: source.x0, y: source.y0}
                return diagonal( o, o);
            });

            // UPDATE
            var linkUpdate = linkEnter.merge(link);

            // Transition back to the parent element position
            linkUpdate.transition()
            .duration(duration)
            .attr('d', function(d) {return diagonal(d, d.parent)});

            // Remove any exiting links
            var linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', function(d) {
                var o = {x: source.x, y: source.y}
                return diagonal(o, o);
            })
            .remove();

            // Store the old positions for transition.
            nodes.forEach(function(d){
                d.x0 = d.x;
                d.y0 = d.y;
            });

            // Creates a curved (diagonal) path from parent to the child nodes
            function diagonal(s, d) {
                path = `M ${s.y} ${s.x}
                        C ${(s.y + d.y) / 2} ${s.x},
                          ${(s.y + d.y) / 2} ${d.x},
                          ${d.y} ${d.x}`
                return path
            }
            // Toggle children on click.
            function click(d) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            }
        }
    });
}
