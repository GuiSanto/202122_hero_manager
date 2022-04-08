const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const passportHTTPBearer = require('passport-http-bearer').Strategy;
const marvel = require('./marvel.js');


const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';



const start = async() => {
    console.log("Starting Node Server")
    const app = express();
    console.log("Agenda setup")

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

    
    app.post('/api/marvel/search', async(request, response) => {
        let search = request.body.search;
        console.log(`[Search] ${search}`);
        let limit = request.body.limit || 10;
        let offset = request.body.offset || 1;
        let data = await marvel.searchComics(search, limit, offset);
        return response.send(data);
    });

    app.get('/api/marvel/comics/:seriesId', passport.authenticate('bearer', { session: false }), async(request, response) => {
        let comicsDocuments = await marvel.getComicsForSeries(db.db, request.params.seriesID);
        console.log("[Tracking] GET")
        return response.send(comicsDocuments);
    });


    app.listen(PORT, () => console.log(`Marvel Hero Manager API listening on port ${PORT}`));
}
start();