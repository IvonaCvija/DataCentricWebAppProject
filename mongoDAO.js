const MongoClient = require('mongodb').MongoClient

var coll;

MongoClient.connect('mongodb://127.0.0.1:27017')

    .then((client) => {
        db = client.db('proj2023MongoDB')
        coll = db.collection('managers')
    })
    .catch((error) => {
        console.log("Error " + error.message)
    })

var findAllManagers = function () {
    return new Promise((resolve, reject) => {

        var cursor = coll.find()
        cursor.toArray()
            .then((documents) => {
                console.log("managers found")
                console.log(documents)
                resolve(documents)
            })
            .catch((error) => {
                reject(error)
                console.log(error)
                console.log("error with managers")
            })
    })
}

var addManager = function (manager) {
    return new Promise((resolve, reject) => {

        coll.insertOne(manager)
            .then((documents) => {
                resolve(documents)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

module.exports = { findAllManagers, addManager } 