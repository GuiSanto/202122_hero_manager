const express = require('express');
const cors = require('cors')
const marvel = require('./marvel.js');

const PORT = process.env.PORT || 8080;

const start = async() => {
    console.log("Starting Node Server")
    const app = express();

    app.use(cors())

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.post('/api/marvel/search', async(request, response) => {
        let search = request.body.search;
        console.log(`[Search] ${search}`);
        let limit = request.body.limit || 10;
        let offset = request.body.offset || 1;
        let data = await marvel.searchComics(search, limit, offset);
        return response.send(data);
    });

    app.get('/api/marvel/comics/:seriesID', async(request, response) => {
        let comicsDocuments = await marvel.getComicsForSeries(
            {
                id: request.params.seriesID
            }
        );
        console.log("[Tracking] GET")
        return response.send(comicsDocuments);
    });

    app.listen(PORT, () => console.log(`Marvel Hero Manager API listening on port ${PORT}`));
}
start();