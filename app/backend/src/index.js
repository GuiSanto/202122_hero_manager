const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const passportHTTPBearer = require('passport-http-bearer').Strategy;
const mongo = require('./database.js');
const agenda = require('./agenda.js');
const marvel = require('./marvel.js');
const path = require('path');


const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';



const start = async() => {
    console.log("Starting Node Server")
    const app = express();
    console.log("MongoDB setup")
    const db = await mongo.connect();
    console.log("Agenda setup")
    agenda.start(db);

    passport.use(new passportLocal((username, password, done) => {
        const users = db.db.collection('users');
        users.findOne({ username: username }, (err, user) => {
            if (err) return done(err);
            if (!user) return done(null, false);
            if (!bcrypt.compareSync(password, user.password)) return done(null, false);
            return done(null, user);
        });
    }));

    passport.use(new passportHTTPBearer((token, done) => {
        const users = db.db.collection('users');
        try {
            jwt.verify(token, JWT_SECRET);
        } catch (exception) {
            return done(exception);
        }
        users.findOne({ token: token }, (err, user) => {
            if (err) return done(err);
            if (!user) return done(null, false);
            return done(null, user, { scope: 'all' });
        });
    }));

    app.use(cors())

    app.use(passport.initialize());

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    //app.use('/', express.static(path.join(__dirname, '../../frontend/src')))

    app.post('/api/signin', passport.authenticate('local', { session: false }), async(request, response) => {
        let user = request.user;
        user.token = jwt.sign({ userID: user._id }, JWT_SECRET);
        const users = db.db.collection('users');
        users.findOneAndReplace({ _id: user._id }, user, (err, result) => {
            if (err) return response.send({ error: 'db error' });
            return response.send({ token: user.token });
        }); 
    });

    app.post('/api/search', async(request, response) => {
        let search = request.body.search;
        console.log(`[Search] ${search}`);
        let limit = request.body.limit || 10;
        let offset = request.body.offset || 1;
        let data = await marvel.searchComics(search, limit, offset);
        return response.send(data);
    });

    app.post('/api/local', passport.authenticate('bearer', { session: false }), async(request, response) => {
        let search = request.body.search;
        console.log(`[Local Search] ${search}`);
        let data = await mongo.searchComics(db.db, search, true);
        return response.send(data);
    });

    app.post('/api/series', passport.authenticate('bearer', { session: false }), async(request, response) => {
        let series = request.body.series;
        let seriesDocuments = await mongo.insertSeries(db.db, series);
        console.log("[Tracking] POST")
        return response.send(seriesDocuments);
    });

    app.get('/api/series', passport.authenticate('bearer', { session: false }), async(request, response) => {
        let seriesDocuments = await mongo.getSeries(db.db);
        console.log("[Tracking] GET")
        return response.send(seriesDocuments);
    });

    app.delete('/api/series/:id', passport.authenticate('bearer', { session: false }), async(request, response) => {
        let result = await mongo.deleteSeries(db.db, request.params.id);
        console.log("[Tracking] GET")
        return response.send(result);
    });

    app.get('/api/comics/:seriesID', passport.authenticate('bearer', { session: false }), async(request, response) => {
        let comicsDocuments = await mongo.getComicsForSeries(db.db, request.params.seriesID);
        console.log("[Tracking] GET")
        return response.send(comicsDocuments);
    });


    app.get('/api/statistics', async(request, response) => {
        console.log("[Statistics] GET")
        return response.send(await mongo.getStatistics(db.db));
    });

    app.get('/api/statistics/latest', async(request, response) => {
        console.log("[Statistics] GET Latest")
        return response.send(await mongo.getStatisticsLatest(db.db));
    });

    app.listen(PORT, () => console.log(`Marvel Hero Manager API listening on port ${PORT}`));
}
start();