const { workerData, parentPort, isMainThread } = require("node:worker_threads")
const {
    accessToken,
    accessTokenSecret,
    clientID,
    clientSecret,
    apiKey,
    apiSecretKey
} = require("../config/twitter.json")
const Twit = require("twit")

console.log("thread check")

if(isMainThread) return;

console.log("logiing")

const T = new Twit({
    consumer_key: apiKey,
    consumer_secret: apiSecretKey,
    access_token: accessToken,
    access_token_secret: accessTokenSecret
})

console.log("in")

T.get('search/tweets', { q: 'banana since:2011-07-11', count: 100 }, function(err, data, response) {
    console.log(data)
})