//###############
//CHANGE ME
const BACKEND_URL = '';
//###############

const insertSearchResult = (comic, tbody) => {
    let row = document.createElement('tr');
    let publishedAt = document.createElement('td');
    publishedAt.innerHTML = moment(comic.dates.find(d => d.type = 'onsaleDate').date).format('YYYY-MM-DD');
    row.appendChild(publishedAt);
    let title = document.createElement('td');
    title.innerHTML = comic.title;
    row.appendChild(title);
    let series = document.createElement('td');
    let seriesTitle = document.createElement('div')
    seriesTitle.innerHTML = (comic.series) ? comic.series.name : '';
    series.appendChild(seriesTitle)
    if (sessionStorage.getItem('token')) {
        let seriesButtonDiv = document.createElement('div')
        let seriesButtonButton = document.createElement('button')
        seriesButtonButton.innerHTML = 'Track'
        seriesButtonButton.classList.add('btn')
        seriesButtonButton.classList.add('btn-primary')
        seriesButtonButton.addEventListener('click', async(e) => {
            e.preventDefault();
            let data = {
                series: {
                    name: comic.series.name,
                    id: comic.series.resourceURI.split('/')[6]
                }
            }
            const result = await axios.post(BACKEND_URL + '/api/series', data);
            if (result.status == 200) {
                alert("Comic Series tracked");
            }
        })

        seriesButtonDiv.appendChild(seriesButtonButton)
        //series.appendChild(seriesButtonDiv)
    }
    row.appendChild(series);


    let linkTD = document.createElement('td');
    let link = document.createElement('a');
    let thumbnail = document.createElement('img');
    thumbnail.width = 100;
    thumbnail.src = (comic.thumbnail) ? `${comic.thumbnail.path}.${comic.thumbnail.extension}` : ''
    link.href = (comic.urls.length) ? comic.urls[0].url : 'http://marvel.com'
    link.appendChild(thumbnail)
    link.setAttribute('target', '_blank');
    link.addEventListener('click', (e) => { e.stopPropagation(); });
    linkTD.appendChild(link);
    row.appendChild(linkTD);
    tbody.appendChild(row);
}
const insertTableData = (data) => {
    let results = document.querySelector('#comics');
    let tbody = results.querySelector('tbody');
    tbody.innerHTML = '';
    for (let comic of data) {
        insertSearchResult(comic, tbody);
    }
    results.style.display = 'block';
}

const insertSeriesInTable = (seriesList) => {
    const tableBody = document.querySelector('#series tbody')
    tableBody.innerHTML = ''
    for (let series of seriesList) {
        let row = document.createElement('tr');
        let title = document.createElement('td')
        let actions = document.createElement('td')
        let viewBtn = document.createElement('button')
        let deleteBtn = document.createElement('button')
        title.innerHTML = series.name
        viewBtn.innerHTML = 'View comics'
        viewBtn.classList.add('btn')
        viewBtn.classList.add('btn-primary')
        deleteBtn.innerHTML = 'Delete Series'
        deleteBtn.classList.add('btn')
        deleteBtn.classList.add('btn-primary')
        actions.appendChild(viewBtn)
        actions.appendChild(deleteBtn)
        row.appendChild(title)
        row.appendChild(actions)
        tableBody.appendChild(row)

        viewBtn.addEventListener('click', async(e) => {
            e.preventDefault();
            const result = await axios.get(`${BACKEND_URL}/api/comics/${series.id}`);
            insertTableData(result.data);
        })
        deleteBtn.addEventListener('click', async(e) => {
            e.preventDefault();
            await axios.delete(`${BACKEND_URL}/api/series/${series.id}`);
            alert('Series Tracking Delete')
            location.reload()
        }) 

    }
}



const getSeries = async() => {
    const response = await axios.get(`${BACKEND_URL}/api/series`)
    insertSeriesInTable(response.data)
}

(() => {

    let token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href('auth.html')
    } else {
        axios.defaults.headers.common['Authorization'] = 'bearer ' + token;
    }

    getSeries()


})()