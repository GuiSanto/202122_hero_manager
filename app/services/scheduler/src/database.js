const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.BD_PORT || 27017;
const dbName = process.env.DB_NAME || 'heroManager';

// Connection URL
const url = `mongodb://${dbHost}:${dbPort}/${dbName}`;
const mongoDBOptions = {
    reconnectInterval: 1000,
    reconnectTries: 60,
    autoReconnect: true,
    useNewUrlParser: true
}

const APP_USER_PASS = process.env.APP_USER_PASS || 'password';

const loadDefaults = (db) => {
    return new Promise((resolve, reject) => {
        const seriesCollection = db.collection('series');
        const defaultSeries = [
            { name: 'Thor (2020)', id: '28031' },
            { name: 'Iron Man (2020 - Present)', id: '30148' },
            { name: 'Guardians of the Galaxy (2020 - Present)', id: '28042' },
            { name: 'Non-Stop Spider-Man (2021 - Present)', id: '31034' },
        ]
        console.log(`[MongoDB] Checking Default Series`);
        seriesCollection.find({}).toArray((err, result) => {
            if (err) return reject(err);
            if (!result || result.length == 0) {
                seriesCollection.insertMany(defaultSeries, (err, result) => {
                    if (err) return reject(err);
                    console.log(`[MongoDB] Loaded Default Series`);
                    return resolve(true);
                });
            }
            return resolve(true);
        });
    });
}

const loadDefaultUser = (db) => {
    return new Promise((resolve, reject) => {
        const users = db.collection('users');
        users.find({}).toArray((error, result) => {
            if (error) return reject(error);
            if (!result || result.length == 0) {

                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(APP_USER_PASS, salt);

                users.insert({ username: 'admin', password: hash }, (err, result) => {
                    if (err) return reject(err);
                    console.log(`[MongoDB] Loaded Default User`);
                    return resolve(true);
                });
            }
            return resolve(true);
        })
    })
}

const connect = () => {
    let db;
    let client;
    console.log(`[MongoDB] connecting to: ${url}`);

    return new Promise((resolve, reject) => {
        console.log("Connecting to " + url)
        client = new MongoClient(url, mongoDBOptions);
        
        const mongoConnect = () => client.connect(async(err) => {
            if (err) {
                setTimeout(mongoConnect, 1000);
                return;
            }
            console.log("Connected successfully to server");
            db = client.db(dbName);
            await loadDefaults(db);
            await loadDefaultUser(db);

            return resolve({
                client: client,
                db: db
            });
        });
        mongoConnect();
    })
}

const insertSeries = (db, series) => {
    return new Promise((resolve, reject) => {
        const seriesCollection = db.collection('series');
        seriesCollection.findOne({ id: series.id }, (err, dbSeries) => {
            if (err) return reject(err);
            if (dbSeries) {
                seriesCollection.find({}).toArray((err, docs) => {
                    if (err) return reject(err);
                    return resolve(docs);
                });
            } else {
                seriesCollection.insertOne(series, (err, result) => {
                    if (err) return reject(err);
                    seriesCollection.find({}).toArray((err, docs) => {
                        if (err) return reject(err);
                        return resolve(docs);
                    });
                });
            }
        });
    });
}

const getSeries = (db) => {
    return new Promise((resolve, reject) => {
        const series = db.collection('series');
        series.find({}).toArray((err, docs) => {
            if (err) return reject(err);
            return resolve(docs);
        });
    });
}

const deleteSeries = (db, id) => {
    return new Promise((resolve, reject) => {
        const series = db.collection('series');
        const comics = db.collection('comics');
        series.deleteOne({ id: id }, (err, resultSeries) => {
            if (err) return reject(err);
            comics.deleteMany({ seriesID: id }, (err, resultComics) => {
                if (err) return reject(err);
                return resolve(resultComics);
            })
        });
    });
}

const getComic = (db, id) => {
    return new Promise((resolve, reject) => {
        const comics = db.collection('comics');
        comics.findOne({ id: id }, (err, doc) => {
            if (err) return reject(err);
            return resolve(doc);
        });
    });
}

const insertComic = (db, comic) => {
    return new Promise((resolve, reject) => {
        const comics = db.collection('comics');

        comics.insertOne(comic, (err, result) => {
            if (err) return reject(err);
            return resolve(result);
        });
    });
}

const getComics = (db) => {
    return new Promise((resolve, reject) => {
        const comics = db.collection('comics');
        comics.find({}).toArray((err, documents) => {
            if (err) return reject(err);
            return resolve(documents);
        });
    });
}

const getComicsForSeries = (db, seriesID) => {
    return new Promise((resolve, reject) => {
        const comics = db.collection('comics');
        comics.find({ seriesID: seriesID }).toArray((err, documents) => {
            if (err) return reject(err);
            return resolve(documents);
        });
    });
}

const searchComics = (db, search) => {
    return new Promise((resolve, reject) => {
        const comics = db.collection('comics');
        comics.find({ title: { $regex: new RegExp(search, 'ig') } }).toArray(async(err, docs) => {
            if (err) return reject(err);
            return resolve(docs);
        });
    });
}

const insertStatistics = (db, statistics) => {
    return new Promise((resolve, reject) => {
        const statisticsCollection = db.collection('statistics');
        statistics.date = new Date()
        statisticsCollection.insertOne(statistics, (err, result) => {
            if (err) return reject(err);
            return resolve(result);
        });
    });
}

const getStatistics = (db) => {
    return new Promise((resolve, reject) => {
        const statistics = db.collection('statistics');
        statistics.find({}).sort({ date: -1 }).toArray((err, documents) => {
            if (err) return reject(err);
            return resolve(documents);
        });
    });
}

const getStatisticsLatest = (db) => {
    return new Promise((resolve, reject) => {
        const statistics = db.collection('statistics');
        let lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        statistics.find({ date: { $gte: lastWeek } }).sort({ date: -1 }).toArray((err, documents) => {
            if (err) return reject(err);
            return resolve(documents);
        });
    });
}

module.exports = {
    connect: connect,
    insertSeries: insertSeries,
    getSeries: getSeries,
    insertComic: insertComic,
    getComic: getComic,
    getComics: getComics,
    searchComics: searchComics,
    getComicsForSeries: getComicsForSeries,
    deleteSeries: deleteSeries,
    insertStatistics: insertStatistics,
    getStatistics: getStatistics,
    getStatisticsLatest: getStatisticsLatest
}