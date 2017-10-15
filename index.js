const Syslogd = require('./syslogd')

const co            = require("co");
const moment        = require('moment');

const port = process.argv[2];
const mongo_host = process.argv[3];
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://" + mongo_host + ":27017/procyon";


Syslogd(function(info) {
    co(function* () {
        console.log("info" , info);

        db = yield MongoClient.connect(url);
        yield db.collection("syslog").insertOne(info);
        yield db.close();
    }).catch(function(err){
        process.on('unhandledRejection', console.log(err));
    });
}).listen(port, function(err) {
    console.log('listen :' + port)

    if(err)
        console.log(err);
})