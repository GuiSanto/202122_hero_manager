const axios = require('axios');
const { createHash } = require('crypto');

//###############
//CHANGE ME
const MARVEL_PUBLIC_KEY = process.env.MARVEL_PUBLIC_KEY;
const MARVEL_PRIVATE_KEY = process.env.MARVEL_PRIVATE_KEY;
//###############


const MARVEL_TIMESTAMP = process.env.MARVEL_TIMESTAMP || 'meicm';
const MARVEL_URL = process.env.MARVEL_URL || 'https://gateway.marvel.com';

const md5 = createHash('md5')
md5.update(MARVEL_TIMESTAMP + MARVEL_PRIVATE_KEY + MARVEL_PUBLIC_KEY)
const hash = md5.digest('hex')

exports.searchComics = (search, limit, offset) => {
    return new Promise((resolve, reject) => {
        const url = `${MARVEL_URL}/v1/public/comics`;

        const requestOptions = {
            url: url,
            method: 'GET',
            json: true,
            params: {
                ts: MARVEL_TIMESTAMP,
                apikey: MARVEL_PUBLIC_KEY,
                hash: hash,
                titleStartsWith: search,
                limit: limit,
                offset: offset
            }
        };
        console.log(`[MARVEL] getting ${url}`);
        axios(requestOptions.url, requestOptions)
            .then(async(response) => {
                if (response.data.error) {
                    console.log("[MARVEL] ERROR:", response.data.error)
                    return reject(response.data.error);
                }
                if (!response.data.data || !response.data.data.results) {
                    console.log("[MARVEL] ERROR: NO Data", response.data)
                    return resolve({
                        meta: {
                            total: 1,
                            offset: 1,
                            limit: 10,
                            count: 0,
                            query: search
                        },
                        data: []
                    });
                }
                console.log(`DATA received ${typeof response.data}`);
                const returnData = {
                    meta: {
                        total: response.data.data.total,
                        offset: response.data.data.offset,
                        limit: response.data.data.limit,
                        query: search
                    },
                    data: response.data.data.results
                };
                return resolve(returnData);
            })
            .catch(error => {
                console.log(error);
                return reject(error);
            });
    });
}
exports.getComicsForSeries = (series) => {
    return new Promise((resolve, reject) => {
        const url = `${MARVEL_URL}/v1/public/series/${series.id}/comics`;

        const requestOptions = {
            url: url,
            method: 'GET',
            json: true,
            params: {
                ts: MARVEL_TIMESTAMP,
                apikey: MARVEL_PUBLIC_KEY,
                hash: hash,
                limit: 100
            }
        };
        console.log(`[MARVEL] getting ${url}`);
        axios(requestOptions.url, requestOptions)
            .then(async(response) => {
                if (response.data.error) {
                    console.log("[MARVEL] ERROR:", response.data.error)
                    return reject(response.data.error);
                }
                if (!response.data.data || !response.data.data.results) {
                    console.log("[MARVEL] ERROR: NO Data", response.data)
                    return resolve([]);
                }
                console.log(`DATA received ${typeof response.data}`);
                return resolve(response.data.data.results);
            })
            .catch(error => {
                console.log(error);
                return reject(error);
            });
    });
}