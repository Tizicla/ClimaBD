import { readData, readsensor, readhist,  readfocos} from './config.js';
import {turnOn, turnOff} from './config.js';
import { onValue, ref } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';
import { onChildAdded, onChildChanged, onChildRemoved } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';

//console.log
// readData();

let sensor = readsensor();
let focos = readfocos();
let hist = readhist();

//SET UP DOCS --------------------------------------------------------------------------
const tempSite = document.getElementById('tempCurrent');
const humSite = document.getElementById('humCurrent');
const timeSite = document.getElementById('timeCurrent');

const foco1Input = document.getElementById('foco1input');
const foco2Input = document.getElementById('foco2input');

const printButton = document.getElementById('printButton');
const csvButton = document.getElementById('csvButton');


//READ THE VALUES OF SENSOR AND UPDATE THEM TO THE SITE  --------------------------------------
sensor.then((data) => {
    // Extracting the data from the resolved object
    const temperatura = data.temperatura;
    const humedad = data.humedad;
    const timestamp = new Date(data.timestamp).toLocaleString(); // Format the timestamp

    // Update the HTML elements with the data
    tempSite.textContent = `${temperatura} °C`;
    humSite.textContent = `${humedad} %`;
    timeSite.textContent = timestamp;
}).catch((error) => {
    console.error("Error fetching sensor data:", error);
    tempSite.textContent = 'N/A °C';
    humSite.textContent = 'N/A %';
    timeSite.textContent = 'N/A';
});

//READ THE VALUES OF FOCOS AND UPDATE THE CHECKBOXES --------------------------------------
focos.then((data) => {
    // Extract the values of foco1 and foco2
    const foco1Status = data.foco1;
    const foco2Status = data.foco2;

    // Update the checkbox states based on the status values
    foco1Input.checked = foco1Status === 'on';
    foco2Input.checked = foco2Status === 'on';
}).catch((error) => {
    console.error("Error fetching focos data:", error);

    // Optionally, set a default state for checkboxes in case of an error
    foco1Input.checked = false;
    foco2Input.checked = false;
});


//EDIT THE VALUE OF FOCOS ----------------------------------------------------------------
foco1Input.addEventListener('change', () => {
    if (foco1Input.checked) {
        turnOn('foco1'); // Turn on foco1
    } else {
        turnOff('foco1'); // Turn off foco1
    }
});

foco2Input.addEventListener('change', () => {
    if (foco2Input.checked) {
        turnOn('foco2'); // Turn on foco2
    } else {
        turnOff('foco2'); // Turn off foco2
    }
});

//D3.JS GRAPH ----------------------------------------------------------------------------
hist.then(data => {
    const hist = data.historico;
    const svg = d3.select("#scatterPlot");

    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create a tooltip for displaying data on hover
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-family", "Helvetica");

    const render = (graphData) => {
        // Clear the existing SVG content
        svg.selectAll("*").remove();

        // Create scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(graphData, d => new Date(d.timestamp)))
            .range([0, innerWidth]);

        // These two scales can be changed
        const humedadScale = d3.scaleLinear()
            // .domain([20, d3.max(graphData, d => d.humedad)])
            .domain([10, 70])
            .range([innerHeight, 0]);

        const temperaturaScale = d3.scaleLinear()
            // .domain([20, d3.max(graphData, d => d.temperatura)])
            .domain([10, 70])
            .range([innerHeight, 0]);

        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxisHumedad = d3.axisLeft(humedadScale);
        const yAxisTemperatura = d3.axisRight(temperaturaScale);

        // Append a group for the plot
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add axes
        g.append("g")
            .call(yAxisHumedad)
            .attr("class", "y-axis humedad-axis")
            .select(".domain").attr("stroke", "steelblue"); // Color for humedad axis

        g.append("g")
            .call(xAxis)
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${innerHeight})`);

        g.append("g")
            .call(yAxisTemperatura)
            .attr("class", "y-axis temperatura-axis")
            .attr("transform", `translate(${innerWidth},0)`)
            .select(".domain").attr("stroke", "orange"); // Color for temperatura axis

        // Add line for humedad
        const humedadLine = d3.line()
            .x(d => xScale(new Date(d.timestamp)))
            .y(d => humedadScale(d.humedad));

        g.append("path")
            .datum(graphData)
            .attr("class", "line humedad-line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", humedadLine);

        // Add line for temperatura
        const temperaturaLine = d3.line()
            .x(d => xScale(new Date(d.timestamp)))
            .y(d => temperaturaScale(d.temperatura));

        g.append("path")
            .datum(graphData)
            .attr("class", "line temperatura-line")
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 2)
            .attr("d", temperaturaLine);

        // Add scatter points for humedad
        g.selectAll(".humedad-point")
            .data(graphData)
            .enter()
            .append("circle")
            .attr("class", "humedad-point")
            .attr("cx", d => xScale(new Date(d.timestamp)))
            .attr("cy", d => humedadScale(d.humedad))
            .attr("r", 4)
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`Timestamp: ${new Date(d.timestamp).toLocaleString()}<br>Humedad: ${d.humedad}<br>Temperatura: ${d.temperatura}`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"));

        // Add scatter points for temperatura
        g.selectAll(".temperatura-point")
            .data(graphData)
            .enter()
            .append("circle")
            .attr("class", "temperatura-point")
            .attr("cx", d => xScale(new Date(d.timestamp)))
            .attr("cy", d => temperaturaScale(d.temperatura))
            .attr("r", 4)
            .attr("fill", "orange")
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`Timestamp: ${new Date(d.timestamp).toLocaleString()}<br>Humedad: ${d.humedad}<br>Temperatura: ${d.temperatura}`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"));
    };

    const updateGraph = () => {
        const graphnum = +document.getElementById("graphnum").value;

        // Filter valid data points
        const filteredHist = hist.filter(d => d && d.timestamp && d.humedad != null && d.temperatura != null);

        // Slice data based on graphnum
        const graphData = graphnum === 0 ? filteredHist : filteredHist.slice(-graphnum);

        if (graphData.length === 0) {
            console.error("No valid data points available to render the graph.");
            return;
        }

        render(graphData);
    };

    // Initial render
    updateGraph();

    // Attach event listener to the button
    document.getElementById("updateButton").addEventListener("click", updateGraph);
    document.getElementById("graphnum").addEventListener("keydown", (event) => {
        if (event.key === "Enter") { 
            updateGraph();
        }
    });

}).catch(error => {
    console.error("Error loading historical data:", error);
});

//UPDATE BOTH SENSOR AND HIST VAR ----------------------------------------------------------
// Set up a real-time listener for the 'sensor' child
const sensorRef = ref(db, 'sensor');
onValue(sensorRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();

        // Update your variables
        const temperatura = data.temperatura;
        const humedad = data.humedad;
        const timestamp = new Date(data.timestamp).toLocaleString(); // Format the timestamp

        // Update the HTML elements
        tempSite.textContent = `${temperatura} °C`;
        humSite.textContent = `${humedad} %`;
        timeSite.textContent = timestamp;

        console.log('Updated sensor data:', data);
    } else {
        console.log('No data available for sensor');
    }
}, (error) => {
    console.error('Error listening for sensor updates:', error);
});



// Set up listeners for child events in the 'sensorHist' node
const histRef = ref(db, 'sensorHist/historico');

// Listen for new data added
onChildAdded(histRef, (snapshot) => {
    const newEntry = snapshot.val();
    console.log('New historical entry added:', newEntry);

    // Optionally update your graph or UI
    updateGraph(); // Call your updateGraph function here
});

// Listen for data changes
onChildChanged(histRef, (snapshot) => {
    const updatedEntry = snapshot.val();
    console.log('Historical entry updated:', updatedEntry);

    // Update the graph or other UI components
    updateGraph();
});

// Listen for data removal
onChildRemoved(histRef, (snapshot) => {
    const removedEntry = snapshot.val();
    console.log('Historical entry removed:', removedEntry);

    // Optionally update the graph/UI
    updateGraph();
});

