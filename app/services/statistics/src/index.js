const express = require('express');
const cors = require('cors')
const mongo = require('./database.js');


const PORT = process.env.PORT || 8083;


const start = async() => {
    console.log("Starting Node Server")
    const app = express();
    console.log("MongoDB setup")
    const db = await mongo.connect();
    
    app.use(cors())
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/api/statistics', async(request, response) => {
        console.log("[Statistics] GET")
        return response.send(await mongo.getStatistics(db.db));
    });

    app.get('/api/statistics/latest', async(request, response) => {
        console.log("[Statistics] GET Latest")
        return response.send(await mongo.getStatisticsLatest(db.db));
    });


    app.post('/api/statistics', async(request, response) => {
        console.log("[Statistics] POST")
        return response.send(await mongo.insertStatistics(db.db, request.body));
        });

    app.listen(PORT, () => console.log(`Marvel Hero Manager API listening on port ${PORT}`));
}
start();