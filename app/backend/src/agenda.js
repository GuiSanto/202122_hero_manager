const { Agenda } = require('agenda');
const db = require('./database.js');

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.BD_PORT || 27017;
const dbName = process.env.DB_NAME || 'heroManager';

// Connection URL
const url = `mongodb://${dbHost}:${dbPort}/${dbName}`;

const start = async(mongo) => {
    const agenda = new Agenda({ db: { address: url, collection: 'agendaJobs', options: { useUnifiedTopology: true } } });

    agenda.define('gather data', async(job, done) => {

        console.log('[AGENDA] starting job - gather data');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get Series
        const seriesDocuments = await db.getSeries(mongo.db);

        // Get Full Comics for Series
        const newComics = {
            total: 0,
            series: []
        }
        for (let series of seriesDocuments) {
            let comics = await axios.get('http://hero_manager_marvel:8080/api/marvel/comics/' + series.id)
            for (let comic of comics) {
                let comicDoc = await db.getComic(mongo.db, comic.id)
                if (!comicDoc) {
                    comic.seriesID = series.id
                    let result = await db.insertComic(mongo.db, comic)
                    newComics.total++;
                    let newComicsSeries = newComics.series.find(s => s.id == series.id)
                    if (!newComicsSeries) {
                        newComicsSeries = Object.assign({}, series)
                        newComicsSeries.total = 0
                        newComics.series.push(newComicsSeries)
                    }
                    newComicsSeries.total++
                }
            }
        }
        console.log(`[AGENDA] gathered ${newComics.total} new Comics in ${newComics.series.length} Series`);

        await db.insertStatistics(mongo.db, newComics);

        console.log('[AGENDA] ended job - gather data');
        return done(null, true);
    });

    console.log('Starting Agenda');
    await agenda.start();

    console.log('[Agenda] defining schedules');
    await agenda.every('0 6 * * *', 'gather data');

    let jobs = await db.getComics(mongo.db);
    if (jobs.length < 1) {
        await agenda.now('gather data');
    }

}

module.exports = {
    start: start
}