var router = require('express').Router();

router.get('/ping', function(req, res, next){
    return res.status(200).send('Hello');
});

// user signup, login, view user data, modify user data
router.use('/user', require('./user'));

// Restaurant releted operations 
router.use('/restaurant', require('./restaurant/'));

// View all varified restaurants by public
router.use('/restaurants', require('./restaurants'));

// Add, read, modify and delete tables by restaurant owner
router.use('/table', require('./table'));

// Manage bookings
router.use('/booking', require('./booking'));

module.exports = router;
