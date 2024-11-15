// VARIABLES
const priceSpan = document.getElementById('price-span'); // Span element to display the current price of the stock
const dateSpan = document.getElementById('date-span'); // Span element to display the date of the last update
const timeSpan = document.getElementById('time-span'); // Span element to display the time of the last update
const clockDiv = document.getElementById('clock'); // Div element for the live clock display
const timeZoneSpan = document.getElementById('timezone'); // Span element to display the user's timezone
const daySpan = document.getElementById('day'); // Span element to display the day in the live clock
const monthSpan = document.getElementById('month'); // Span element to display the month in the live clock
const yearSpan = document.getElementById('year'); // Span element to display the year in the live clock
const timeDiv = document.getElementById('time'); // Div element for time display
const hourSpan = document.getElementById('hour'); // Span element to display the hour in the live clock
const minuteSpan = document.getElementById('minute'); // Span element to display the minute in the live clock
const secondsSpan = document.getElementById('seconds'); // Span element to display the seconds in the live clock
const chartContainer = document.getElementById('chart-container'); // Container for rendering charts
const chartButtons = document.querySelectorAll('.chart-button'); // Buttons for switching between chart timeframes

const updateButton = document.getElementById('update-price-btn'); // Button to manually update the stock price
const loaderPrice = document.getElementById('loader-update-price'); // Loader animation for the stock price update process

const loaderChart = document.getElementById('loader-update-chart'); // Loader animation for chart updates

// LIVE CLOCK VARIABLES
let date = new Date(); // Current date object
let sec = date.getSeconds(); // Current seconds value

// Ticker Symbol
let ticker; // Variable to hold the current stock ticker symbol

// STOCK TRACKER VARIABLES
const stockInput = document.getElementById('stock-input'); // Input field for stock symbol search
const stockSearchResults = document.getElementById('stock-search-results'); // Container for displaying stock search results
let stockItems = document.querySelectorAll('.stock-search-item'); // List of stock search result items

let stockSymbolText = document.querySelector('.stock-symbol'); // Span element to display the selected stock symbol
let stockSymbol = stockSymbolText.id; // ID of the selected stock symbol
let stockNameText = document.querySelector('.stock-name'); // Span element to display the selected stock name
let stockName = stockNameText.id; // ID of the selected stock name



// HIDE
function hide(element) {
    // Function to hide an element by adding the "hidden" class
    element.classList.add('hidden');
}

// Design of clicked chart-buttons
function addClicked(clickedBtn, otherBtns) {
    // Function to handle the styling of clicked chart buttons
    otherBtns.forEach(btn => {
        btn.classList.remove('clicked'); // Remove 'clicked' class from other buttons
    });
    clickedBtn.classList.add('clicked'); // Add 'clicked' class to the selected button
}

// Update PRICE
function updatePrice(stockSymbol) {
    // Function to fetch and display the current stock price
    console.log(`Trying to get current price of ${stockSymbol}`);
    loaderPrice.classList.remove('hide'); // Show loader during the fetch process
    fetch(`https://irp3olgj53.execute-api.eu-central-1.amazonaws.com/dev/get_price_live?symbol=${stockSymbol}`)
    .then(response => {
        if (!response.ok) {
            // Handle errors during the fetch
            throw new Error(`Error whereas fetch. Status: ${response.status}`);
        }
        loaderPrice.classList.add('hide'); // Hide loader after fetch
        return response.json(); // Parse response JSON
    })
    .then(data => {
        console.log(data);

        if (!data) {
            throw new Error(`No Data found`); // Throw error if no data is received
        };

        // Format date and time from the fetched data
        const date = new Date(data[0]['date']).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Europe/Berlin' // Explicitly set the German timezone
        });

        time = new Date(data[0]['date']).toTimeString();

        // Update price, date, and time in the UI
        priceSpan.innerText = data[0]['close'];
        dateSpan.innerText = date;
        timeSpan.innerText = time;

        // Update stock symbol and name in the UI
        stockSymbolText.innerText = stockSymbol;
        stockSymbolText.id = stockSymbol;

        stockName = data[0]['name'];
        stockNameText.innerText = stockName;
        stockNameText.id = stockName;

        // Save the stock data to localStorage
        const stock = {
            symbol: stockSymbol,
            name: stockName,
            price: data[0]['close'],
        };

        saveStockToLocalStorage(stock);
    })
    .catch(error => {
        console.log(error); // Log any errors that occur
    });
}

// Automatic price-update every minute
window.onload = setTimeout(setInterval(updatePrice(stockSymbol), 60*1000), (60-sec)*1000); // Adjust initial delay to sync updates with the next minute

// LIVE CLOCK
function updateTime() {
    // Function to update and display the live clock
    date = new Date();

    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get user's timezone
    day = date.getDate();
    month = date.getMonth()+1;
    year = date.getFullYear();
    hour = date.getHours();
    minute = date.getMinutes();
    seconds = date.getSeconds();

    // Update the clock elements in the UI
    timeZoneSpan.innerText = String(timezone);
    daySpan.innerText = String(day + '.').padStart(3, '0');
    monthSpan.innerText = String(month + '.').padStart(3, '0');
    yearSpan.innerText = String(year).padStart(4, '0');
    hourSpan.innerText = String(hour + ':').padStart(3, '0');
    minuteSpan.innerText = String(minute + ':').padStart(3, '0');
    secondsSpan.innerText = String(seconds).padStart(2, '0');
}
// Update time every second
setInterval(updateTime, 1000);

// FETCH DIAGRAM DATA
async function getData(symbol, time_frame) {
    // Function to fetch stock data for charts
    try {
        loaderChart.classList.remove('hide'); // Show loader during fetch

        const response = await fetch(`https://irp3olgj53.execute-api.eu-central-1.amazonaws.com/dev/get_price_${time_frame}?symbol=${symbol}`);
        if (!response.ok) {
            throw new Error(`Error during fetch. Status: ${response.status}`); // Handle fetch errors
        }
        const data = await response.json();
        console.log('DATA FROM getData');
        console.log(data);

        if (!data) {
            throw new Error(`No Data found`); // Throw error if no data is found
        }
        loaderChart.classList.add('hide'); // Hide loader after fetch
        return data;
    } catch (error) {
        console.log(error); // Log errors
    }
}

// PLOT DIAGRAMS
async function plotlyChart(symbol, time_frame) {
    // Function to create charts with Plotly
    ticker = await getData(symbol, time_frame); // Fetch data for the chart
    ticker.forEach(d => {
        d.date = new Date(d.date); // Convert dates to Date objects
    });

    function unpack(objects, key) {
        // Helper function to extract key values from an array of objects
        return objects.map(function(object) {
            return object[key];
        });
    }

    let typeValue = 'candlestick'; // Default chart type
    var trace;

    if (time_frame === '1d' || time_frame === '5d') {
        typeValue = "scatter"; // Use scatter plot for short timeframes

        trace = {
            x: unpack(ticker, 'date'),
            y: unpack(ticker, 'close'), // Use closing prices for scatter plot
            type: typeValue,
            mode: 'lines+markers', // Combine lines and markers
            marker: {
                color: '#FF9708', // Marker color
                size: 4, // Marker size
            },
            xaxis: 'x',
            yaxis: 'y',
            line: {color: '#FF9708'},
        };
    } else {
        trace = {
            x: unpack(ticker, 'date'),
            close: unpack(ticker, 'close'),
            high: unpack(ticker, 'high'),
            low: unpack(ticker, 'low'),
            open: unpack(ticker, 'open'),
            stock_splits: unpack(ticker, 'stock_splits'),
            volume: unpack(ticker, 'volume'),

            // Customize colors for candlestick chart
            increasing: {line: {color: '#FF9708'}},
            decreasing: {line: {color: '#505050'}},
            
            type: typeValue,  
        };
    }

    var data = [trace]; // Chart data

    var layout = {
        dragmode: 'zoom', // Enable zooming
        showlegend: false,
        height: 350, // Set chart height
        autosize: true,
        xaxis: {
            rangeslider: {
                visible: false
            },
        },
        margin: {
            l: 50,
            r: 50,
            t: 50,
            b: 50,
        },
    };
    Plotly.newPlot(chartContainer, data, layout); // Render the chart
};


// STOCK TRACKER
stockInput.addEventListener('change', function(event) {
    event.preventDefault(); // Prevent default form submission behavior

    const KEYWORD_SEARCH = stockInput.value; // Retrieve the user input for stock search
    const safeKeyword = encodeURIComponent(KEYWORD_SEARCH);

    if (!KEYWORD_SEARCH) {
        // If input is empty, clear the search results and hide the results container
        stockSearchResults.innerText = "";
        hide(stockSearchResults);
        return;
    } else {
        // Fetching stock symbols from the API using the search keyword
        fetch(`https://financialmodelingprep.com/api/v3/search?query=${safeKeyword}&apikey=I15m655vBJh7IM0dQifurTL9cuLNDV9G`)
        .then(response => {
            // Handle errors if the network response is not ok
            if (!response.ok) {
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }
            return response.json(); // Parse the response JSON
        })
        .then(data => {
            console.log("DATA"); // Debugging: Log the data received from the API
            console.log(data);
            stockSearchResults.innerText = ""; // Clear previous search results

            // Iterate over the stock data and dynamically create list items for each result
            for (let i = 0; i < data.length; i++) {
                let li = document.createElement('li'); // Create a list item
                let symbol = document.createElement('span'); // Create a span for the stock symbol
                let name = document.createElement('span'); // Create a span for the stock name
                name.classList.add('search-symbol-name')

                symbol.innerText = data[i]['symbol']; // Populate the symbol span with the stock symbol
                name.innerText = data[i]['name']; // Populate the name span with the stock name

                li.append(symbol); // Append the symbol to the list item
                li.append(name); // Append the name to the list item

                // Add unique ID and a CSS class to the list item
                li.id = data[i]['symbol'];
                li.classList.add('stock-search-item');

                // Add a click event listener to handle stock selection
                li.addEventListener('click', function() {
                    stockSymbol = data[i]['symbol']; // Retrieve the selected stock's symbol

                    // Special case handling for BTCUSD to match yfinance's format
                    if (stockSymbol === 'BTCUSD') {
                        stockSymbol = 'BTC-USD';
                    }

                    stockSymbolText.id = stockSymbol; // Update the stockSymbolText element ID with the selected symbol

                    stockName = data[i]['name']; // Retrieve the selected stock's name
                    stockNameText.id = stockName; // Update the stockNameText element ID with the selected name

                    updatePrice(stockSymbol); // Call updatePrice function with the selected symbol
                    plotlyChart(stockSymbol, '1mo'); // Call plotlyChart function with the selected symbol and a default timeframe
                });

                stockSearchResults.appendChild(li); // Append the list item to the search results container
            }
            stockSearchResults.classList.remove('hidden'); // Make the search results container visible
        })
        .catch(error => {
            console.log(error); // Log any errors encountered during the fetch process
            stockSearchResults.classList.remove('hidden'); // Make the search results container visible
            stockSearchResults.innerText = "Error fetching stock data. Please try again later.";
        });
    }
});

// LOCALSTORAGE
const localStorageKey = 'watchedStock'; // Key used to store the watched stock in localStorage

function loadWatchedStock() {
    let storedStock;
    try {
        storedStock = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    } catch (error) {
        console.error("Error parsing localStorage data:", error);
        storedStock = [];
    }
    console.log("storedStock", storedStock);
    if (storedStock.symbol) {
        updatePrice(storedStock.symbol);
        plotlyChart(storedStock.symbol, '1mo');
    }
}

function saveStockToLocalStorage(stock) {
    // Retrieve existing stored stock or initialize as an empty array
    let storedStock = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    storedStock = stock; // Overwrite the stored stock with the new stock
    localStorage.setItem(localStorageKey, JSON.stringify(storedStock)); // Save the updated stock data to localStorage
};

// EVENT LISTENERS
updateButton.addEventListener('click', function() {
    // Handle the update button click to refresh stock data
    stockSymbol = stockSymbolText.id; // Get the current stock symbol from the stockSymbolText element
    updatePrice(stockSymbol); // Call updatePrice function with the current stock symbol
}); 

chartButtons.forEach(btn => {
    // Add event listeners to all chart buttons for updating the chart with a specific timeframe
    btn.addEventListener('click', function() {
        stockSymbol = stockSymbolText.id; // Get the current stock symbol from the stockSymbolText element
        console.log("TRYING TO FETCH DATA"); // Debugging: Log the attempt to fetch data
        console.log(stockSymbol); // Debugging: Log the current stock symbol
        plotlyChart(stockSymbol, btn.id); // Call plotlyChart function with the current stock symbol and the button's ID as the timeframe
        addClicked(btn, chartButtons); // Highlight the clicked button
    });
});

// Localstorage load on window load
window.onload = loadWatchedStock; // Load the watched stock data from localStorage when the page is loaded


