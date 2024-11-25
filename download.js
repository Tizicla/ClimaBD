import {db, readData, readsensor, readhist, readfocos} from './config.js';

const date = new Date();
const dateTimeString = date.toLocaleString();  // Formats the date and time to a readable string
const dateTimeElement = document.getElementById('currentDateTime');
dateTimeElement.textContent = `Time of print: ${dateTimeString}`.toLocaleUpperCase();

let hist = readhist();

// Function to check if both date and logs are ready
const isPageReadyToPrint = () => {
    const logsContainer = document.querySelector(".datalogs");
    const logsReady = logsContainer && logsContainer.children.length > 0;
    const dateReady = dateTimeElement && dateTimeElement.textContent.length > 0;
    return logsReady && dateReady;
};

// D3.JS GRAPH ----------------------------------------------------------------------------
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
        .style("padding", "20px")
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
            .domain([10, 70])
            .range([innerHeight, 0]);

        const temperaturaScale = d3.scaleLinear()
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
        const graphnum = localStorage.getItem('graphnum');

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

    // Display the last n elements inside of datalogs
    const last = hist.slice(-6);

    const dataLogsContainer = document.querySelector(".datalogs");
    dataLogsContainer.innerHTML = "";

    last.forEach(entry => {
        const logEntry = document.createElement("div");
        logEntry.classList.add("log-entry");

        // Format the temperature and humidity
        const details = document.createElement("h4");
        details.textContent = `Temperatura: ${entry.temperatura}.C   Humedad: ${entry.humedad}%`;

        // Format the timestamp
        const timestamp = document.createElement("p");
        timestamp.style.fontStyle = "italic"; // Apply italics
        timestamp.textContent = `Timestamp: ${new Date(entry.timestamp).toLocaleString()}`;

        // Append both elements to the log entry
        logEntry.appendChild(details);
        logEntry.appendChild(timestamp);

        // Append the log entry to the container
        dataLogsContainer.appendChild(logEntry);
    });

    // Print the page only if all required data is loaded
    if (isPageReadyToPrint()) {
        window.print();
    } else {
        console.error("Page is not ready to print.");
    }

}).catch(error => {
    console.error("Error loading historical data:", error);
});

window.onafterprint = function () {
    window.close();
};
