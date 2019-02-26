var router = require('express').Router();

// restaurant Create, Read, Update, Delete 
router.use('/', require('./restaurant'));

// Add, read, modify and delete tables by restaurant owner
router.use('/table', require('./table'));

// read list of tables by restaurant owner
router.use('/tables', require('./tables'));

// list bookings
router.use('/bookings', require('./bookings'));

// booking releted operations
router.use('/booking', require('./booking'));

// Access customer details who has booking
// '/restaurant/:restaurant/:phone'
router.use('/', require('./customer'));

module.exports = router;
