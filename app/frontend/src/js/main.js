//###############
//CHANGE ME
const BACKEND_URL = 'http://localhost:8081';
//###############

const insertSearchResult = (comic, tbody, local) => {
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
        if (!local) series.appendChild(seriesButtonDiv)
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
const insertTableData = (data, local) => {
    let results = document.querySelector('.results');
    let tbody = results.querySelector('tbody');
    tbody.innerHTML = '';
    for (let comic of data) {
        insertSearchResult(comic, tbody, local);
    }
    results.style.display = 'block';
}
const createPagination = (meta) => {
    const ul = document.querySelector('.results ul');
    ul.innerHTML = '';
    if (meta.total <= meta.offset) {
        return
    }
    const pages = meta.total / meta.limit;
    const page = meta.offset / meta.limit

    // PREVIOUS
    let li = document.createElement('li');
    li.classList.add('page-item');
    let a = document.createElement('a');
    a.innerHTML = '<';
    a.classList.add('page-link');
    let previousPage = (page - 1 > 0) ? page - 1 : pages
    a.setAttribute('data-page', previousPage)
    a.addEventListener('click', (event) => {
        event.preventDefault();
        const page = event.target.getAttribute('data-page');
        let searchTerms = document.querySelector("#search").value;
        searchComics(searchTerms, previousPage * meta.limit);
    });
    li.appendChild(a);
    ul.appendChild(li);
    // NEXT
    li = document.createElement('li');
    li.classList.add('page-item');
    a = document.createElement('a');
    a.innerHTML = '>';
    a.classList.add('page-link');
    let nextPage = (page + 1 < pages) ? page + 1 : 1
    a.setAttribute('data-page', nextPage)
    a.addEventListener('click', (event) => {
        event.preventDefault();
        const page = event.target.getAttribute('data-page');
        let searchTerms = document.querySelector("#search").value;
        searchComics(searchTerms, nextPage * meta.limit);
    });
    li.appendChild(a);
    ul.appendChild(li);

}

const searchComics = async(searchTerms, offset = 1, limit = 10) => {
    const data = await queryAPI(searchTerms, false, offset, limit);
    insertTableData(data.data, false);
    createPagination(data.meta)
}
const searchLocalComics = async(searchTerms) => {
    const data = await queryAPI(searchTerms, true);
    insertTableData(data, true);
    const ul = document.querySelector('.results ul');
    ul.innerHTML = '';
}
const queryAPI = (search, local = false, offset = 1, limit = 10) => {
    return new Promise((resolve, reject) => {
        url = `${BACKEND_URL}/api/search`;
        if (local) url = `${BACKEND_URL}/api/local`;
        const parameters = {
            search: search,
            offset: offset,
            limit: limit
        }
        axios.post(url, parameters)
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });
    });
}



const searchListener = (e) => {
    if (e)
        e.preventDefault();
    let searchTerms = document.querySelector("#search").value;
    if (e.target.id == 'local') {
        searchLocalComics(searchTerms);
    } else {
        if (!searchTerms) {
            alert("You need so submit a search term")
            return
        }
        searchComics(searchTerms);
    }
}

const loginListener = (e) => {
    e.preventDefault();
    let data = {
        username: document.querySelector('#username').value,
        password: document.querySelector('#password').value
    }
    axios.post(`${BACKEND_URL}/api/signin`, data)
        .then(response => {
            sessionStorage.setItem('token', response.data.token);
            location.reload();
        }).catch(error => { console.log(error) });
}

(async() => {

    let token = sessionStorage.getItem('token');
    if (token) {
        axios.defaults.headers.common['Authorization'] = 'bearer ' + token;
    }

    let search_form = document.querySelector("#search_form");
    if (search_form) {
        search_form.querySelector('button[type="submit"]').addEventListener('click', searchListener);
        if (token) {
            search_form.querySelector('#local').classList.remove('hidden')
            search_form.querySelector('#local').addEventListener('click', searchListener);
        }
    }


    let loginForm = document.querySelector("form#login");
    let logoutForm = document.querySelector('form#logout');
    if (loginForm) {
        if (token) {
            loginForm.style.display = 'none';
            logoutForm.style.display = 'block';
        } else {
            logoutForm.style.display = 'none';
            loginForm.style.display = 'block';
        }
        loginForm.addEventListener('submit', loginListener);
        logoutForm.addEventListener('submit', (e) => {
            sessionStorage.removeItem('token');
            location.reload();
        });
    }

    let dashboard = document.querySelector('.dashboard')
    if (dashboard) {
        const responseStatistics = await axios.get(`${BACKEND_URL}\api\statistics`)
        const responseStatisticsLatest = await axios.get(`${BACKEND_URL}\api\statistics\latest`)

        const statistics = responseStatistics.data
        const latest = responseStatisticsLatest.data
    }
})()