//###############
//CHANGE ME
const BACKEND_URL = '';
//###############

const processStatistics = (data) => {
    data.reverse();
    const processed = {
        datasets: [{
            data: [],
            label: 'Comics',
            backgroundColor: 'red',
            type: 'line',
            fill: false
        }]
    }
    for (let stat of data) {
        processed.datasets[0].data.push({
            t: new Date(stat.date).valueOf(),
            y: [stat.total]
        });
    }
    return processed;
}


(async() => {

    const responseStatistics = await axios.get(`${BACKEND_URL}/api/statistics`)
    const responseStatisticsLatest = await axios.get(`${BACKEND_URL}/api/statistics/latest`)

    const statistics = responseStatistics.data
    const latest = responseStatisticsLatest.data
    const lastestElement = document.querySelector(".latest h2");
    lastestElement.innerHTML = latest.map(l => l.total).reduce((a, c) => a + c)
    const statisticsCtx = document.querySelector("#statistics_chart");
    const timeFormat = 'YYYY/MM/DD';
    const timeData = processStatistics(statistics);
    console.table(timeData)
    const totalComicsChart = new Chart(statisticsCtx, {
        type: 'line',
        data: timeData,
        options: {
            responsive: false,
            layout: { padding: { right: 8, left: 0 } },
            legend: { display: false },
            title: { display: true, text: "New Comics" },
            scales: {
                xAxes: [{
                    type: 'time',
                    distribution: 'series',
                    ticks: {
                        source: 'data',
                        autoSkip: true,
                        display: false
                    },
                    scaleLabel: { display: false }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Comics'
                    }
                }]
            }
        }
    });

})()