import * as d3 from "d3";

var groups = [],
  dots = [];

var flag = false;
var margin = { top: 20, right: 20, bottom: 30, left: 40 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;
var svg = d3
  .select("#kmeans svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.selectAll("#kmeans button").style("padding", ".5em .8em");

d3.selectAll("#kmeans label")
  .style("display", "inline-block")
  .style("width", "15em");

// Axis scales
var x = d3.scale.linear().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

var lineg = svg.append("g");
var dotg = svg.append("g");
var centerg = svg.append("g");

d3.select("#step").on("click", function() {
  step();
  draw();
});
d3.select("#reset").on("click", function() {
  dots = [];
  randomDots();
  centroids();
  axes();
  draw();
});

function loadFileData(aFile) {
  dots = [];
  fetch(aFile)
    .then(response => response.text())
    .then(text => {
      //First line
      let firstLine = text.split("\n")[0].split(" ");
      let arrFirstLine = firstLine.filter(e => String(e).trim());

      //second line
      let secondLine = text.split("\n")[1].split(" ");
      let arrSecondLine = secondLine.filter(e => String(e).trim());
      dots = [];

      arrFirstLine.forEach((e, i) => {
        var dot = {
          x: parseFloat(e),
          y: parseFloat(arrSecondLine[i]),
          group: undefined
        };
        dot.init = {
          x: dot.x,
          y: dot.y,
          group: dot.group
        };
        dots.push(dot);
      });
    })
    .then(() => {
      centroids();
      axes();
      draw();
    });
}

d3.select("#d1").on("click", function() {
  loadFileData("td2_d1.txt");
});

d3.select("#d2").on("click", function() {
  loadFileData("td2_d2.txt");
});

d3.select("#d3").on("click", function() {
  loadFileData("td2_d3.txt");
});

function step() {
  if (flag) {
    moveCenter();
    draw();
  } else {
    updateGroups();
    draw();
  }
  flag = !flag;
}

function randomDots() {
  var N = parseInt(d3.select("#N")[0][0].value, 10);
  dots = [];
  flag = false;
  for (let i = 0; i < N; i++) {
    var dot = {
      x: Math.random() * width,
      y: Math.random() * height,
      group: undefined
    };
    dot.init = {
      x: dot.x,
      y: dot.y,
      group: dot.group
    };
    dots.push(dot);
  }
}

function centroids() {
  var K = parseInt(d3.select("#K")[0][0].value, 10);
  groups = [];
  for (let i = 0; i < K; i++) {
    var g = {
      dots: [],
      color: "hsl(" + (i * 360) / K + ",100%,50%)",
      center: {
        x:
          Math.random() *
          Math.max.apply(
            Math,
            dots.map(function(o) {
              return o.x;
            })
          ),
        y:
          Math.random() *
          Math.max.apply(
            Math,
            dots.map(function(o) {
              return o.y;
            })
          )
      },
      init: {
        center: {}
      }
    };
    g.init.center = {
      x: g.center.x,
      y: g.center.y
    };
    groups.push(g);
  }
}

function axes() {
  if (document.getElementById("x-axis")) {
    var element = document.getElementById("x-axis");
    element.parentNode.removeChild(element);
    element = document.getElementById("y-axis");
    element.parentNode.removeChild(element);
  }

  var xAxis = d3.svg
    .axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg
    .axis()
    .scale(y)
    .orient("left");

  x.domain(
    d3.extent(dots, function(d) {
      return d.x;
    })
  ).nice();
  y.domain(
    d3.extent(dots, function(d) {
      return d.y;
    })
  ).nice();

  svg
    .append("g")
    .attr("id", "x-axis")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text("x axis");

  svg
    .append("g")
    .attr("id", "y-axis")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("y axis");
}

function draw() {
  var circles = dotg.selectAll("circle").data(dots);
  circles.enter().append("circle");
  circles.exit().remove();
  circles
    .transition()
    .duration(500)
    .attr("cx", function(d) {
      return x(d.x);
    })
    .attr("cy", function(d) {
      return y(d.y);
    })
    .attr("fill", function(d) {
      return d.group ? d.group.color : "black";
    })
    .attr("r", 5);

  var c = centerg.selectAll("path").data(groups);

  var updateCenters = function(centers) {
    centers
      .attr("transform", function(d) {
        return (
          "translate(" + x(d.center.x) + "," + y(d.center.y) + ") rotate(45)"
        );
      })
      .attr("fill", function(d, i) {
        return d.color;
      })
      .attr("stroke", "black")
      .attr("stroke-width", "2");
  };
  c.exit().remove();
  updateCenters(
    c
      .enter()
      .append("path")
      .attr("d", d3.svg.symbol().type("circle"))
      .attr("stroke", "black")
      .attr("stroke-width", "2")
  );
  updateCenters(c.transition().duration(500));
}

function moveCenter() {
  groups.forEach(function(group, i) {
    if (group.dots.length == 0) return;

    // get center of gravity
    var x = 0,
      y = 0;
    group.dots.forEach(function(dot) {
      x += dot.x;
      y += dot.y;
    });

    group.center = {
      x: x / group.dots.length,
      y: y / group.dots.length
    };
  });
}

function updateGroups() {
  groups.forEach(function(g) {
    g.dots = [];
  });
  dots.forEach(function(dot) {
    // find the nearest group
    var min = Infinity;
    var group;
    groups.forEach(function(g) {
      var d = Math.pow(g.center.x - dot.x, 2) + Math.pow(g.center.y - dot.y, 2);
      if (d < min) {
        min = d;
        group = g;
      }
    });

    // update group
    group.dots.push(dot);
    dot.group = group;
  });
}
