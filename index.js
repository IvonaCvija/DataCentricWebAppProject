var express = require('express')
var mySQLDAO = require('./mySQLDAO.js')
var mongoDAO = require('./mongoDAO')
var app = express()
let ejs = require('ejs');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')
const { check, validationResult } = require('express-validator');
var pool = require('./mySQLDAO.js').pool;

app.get('/', (req, res) => {
    res.render('home');
})

//getting stores from store table
app.get('/stores', (req, res) => {
    console.log("Running /stores...")

    mySQLDAO.getStores()
        .then((data) => {
            console.log(data)
            res.render("stores", { "stores": data })
        })
        .catch((error) => {
            res.send(error)
        })
})

//getting products from product table
app.get('/products', (req, res) => {
    console.log("Running /products...")

    mySQLDAO.getProducts()
        .then((data) => {
            console.log(data)
            res.render("products", { "products": data })
        })
        .catch((error) => {
            res.send(error)
        })
})

//open addStore
app.get('/addStore', (req, res) => {
    res.render("addStore", { errors: undefined });
})

//add store
app.post('/addStore', [
    check("sid").isLength({ min: 5, max: 5 }).withMessage("Store ID should have 5 characters"),
    check("location").notEmpty().withMessage("Please enter Location"),
    check("mgrid").isLength({ min: 4, max: 4 }).withMessage("Manager ID should have 4 characters")
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        res.render("addStore", { errors: errors.errors });
    } else {
        console.log("Received values from the form:");
        console.log("sid ", req.body.sid);
        console.log("location ", req.body.location);
        console.log("mgrid ", req.body.mgrid);

        try {
            // Insert the store information into the database
            const [result] = await mySQLDAO.addStoreToDatabase(req.body.sid, req.body.location, req.body.mgrid);
            console.log(result);
            res.redirect('/stores');
        } catch (error) {
            console.error(error);
            res.redirect('/stores');
        }
    }
});

//open editStore
app.get('/stores/editStore/:sid', (req, res) => {
    const sid = req.params.sid;

    mySQLDAO.getStoreBySid(sid)
        .then((store) => {
            if (!store) {
                res.status(404).send('Store not found');
            } else {
                res.render("editStore", { errors: undefined, store: store });
            }
        })
        .catch((error) => {
            console.error(error);
            res.redirect('/');
        });
});

//update store in a database
app.post('/stores/editStore/:sid', [
    check("location").notEmpty().withMessage("Please enter Location"),
    check("mgrid").isLength({ min: 4, max: 4 }).withMessage("Manager ID should have 4 characters")
], async (req, res) => {
    const sid = req.params.sid;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        res.render("editStore", { errors: errors.errors, store: { sid, location: req.body.location, mgrid: req.body.mgrid } });
    } else {
        console.log("Received values from the form:");
        console.log("sid ", sid);
        console.log("location ", req.body.location);
        console.log("mgrid ", req.body.mgrid);

        try {
            // Update the store information in the database
            const [result] = await mySQLDAO.updateStore(req.body.location, req.body.mgrid, sid);
            console.log(result);
            res.redirect('/stores');
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    }
});

//delete product
app.get('/products/delete/:pid', (req, res) => {
    mySQLDAO.deleteProduct(req.params.pid)

        .then((data) => {
            console.log(data)
            if (data.affectedRows > 0) {
                console.log("Product deleted");
            }
            res.redirect('/products');
        })
        .catch((error) => {
            console.log(error)
            //res.render("errors", { "Product is currently in stores and cannot be deleted":  errorMessage  })
            res.render("errors", { errors: [{ msg: "Error: Product " + req.body.pid + " is currently in stores and cannot be deleted" }] });
            //res.redirect('/')
        })
})

//get managers (MongoDB)
app.get('/managers', (req, res) => {

    mongoDAO.findAllManagers()
        .then((data) => {
            res.render("managers", { "managers": data })
        })
        .catch((error) => {
        })
})

//open addManager
app.get('/addManager', (req, res) => {
    res.render("addManager", { errors: undefined });
})

//add manager (MongoDB)
app.post('/addManager', [
    check("_id").isLength({ min: 4, max: 4 }).withMessage("Manager ID has to have 4 characters"),
    check("name").isLength({ min: 5 }).withMessage("Name has to be over 5 characters"),
    check("salary").isInt({ min: 30000, max: 70000 })
        .withMessage("Salary must be number between 30000 and 70000")
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        res.render("addManager", { errors: errors.errors });
    } else {
        console.log("Received values from the form:");
        console.log("_id ", req.body._id);
        console.log("name ", req.body.name);
        console.log("mgrid ", req.body.salary);

        mongoDAO.addManager({
            _id: req.body._id,
            name: req.body.name,
            salary: req.body.salary
        })
            .then((result) => {
                console.log(result)
                console.log("Manager added")
                res.redirect('/managers')
            })
            .catch((error) => {
                console.log(error)
                if (error.code === 11000) {
                    res.render("addManager", { errors: [{ msg: "Error: Manager " + req.body._id + " already exists" }] });
                } else {
                    res.render("errors", { "myerror": error });
                }
            })
    }
})

app.listen(3000, () => {
    console.log("Listening on port 3000")
})