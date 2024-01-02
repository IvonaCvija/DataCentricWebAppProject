var pool;
var pmysql = require('promise-mysql')

//add connection
pmysql.createPool({
    connectionLimit: 3,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'proj2023'
})
    .then(p => {
        pool = p
    })
    .catch(e => {
        console.log("pool error:" + e)
    })

//methods
//get a list of stores
var getStores = function () {
    return new Promise((resolve, reject) => {

        pool.query('SELECT * FROM store')
            .then((data) => {
                resolve(data)
            })
            .catch(error => {
                reject(error)
            })
    })
}

//get a list of products
var getProducts = function () {
    return new Promise((resolve, reject) => {

        pool.query(`
        SELECT p.pid, p.productdesc, ps.sid, IFNULL(s.location, "") AS location, IFNULL(ps.Price, "") AS Price
            FROM product p
            LEFT JOIN product_store ps ON p.pid = ps.pid
            LEFT JOIN store s ON ps.sid = s.sid;`)
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

//inserting store into a database
var addStoreToDatabase = function (sid, location, mgrid) {
    var takeInformation = {
        sql: 'insert into store set sid=?, location=?, mgrid=?',
        values: [sid, location, mgrid]
    }

    return new Promise((resolve, reject) => {

        pool.query(takeInformation)
            .then((data) => {
                resolve(data)
            })
            .catch(error => {
                reject(error)
            })
    })
}

//update store based on ID
var updateStore = function (location, mgrid, sid) {
    return new Promise((resolve, reject) => {
        var updateQuery = {
            sql: 'UPDATE store SET location=?, mgrid=? WHERE sid=?',
            values: [location, mgrid, sid]
        };

        pool.query(updateQuery)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

//get store by SID
var getStoreBySid = function (sid) {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM store WHERE sid = ?', [sid])
            .then((data) => {
                resolve(data[0]); // Assuming you expect only one result
            })
            .catch((error) => {
                reject(error);
            });
    });
}

//delete product if it´s not sold anywhere
var deleteProduct = function (pid) {
    console.log(pid)

    return new Promise((resolve, reject) => {

        //delete from product_store table
        var myQuery = {
            sql: 'DELETE FROM product WHERE pid=? AND NOT EXISTS (SELECT 1 FROM product_store WHERE pid =?)',
            values: [pid, pid]
        }
        pool.query(myQuery)
            .then((data) => {
                resolve(data)
            })
            .catch(error => {
                reject(error)
            })

    })

}
//exports
module.exports = { getStores, getProducts, addStoreToDatabase, updateStore, getStoreBySid, deleteProduct }