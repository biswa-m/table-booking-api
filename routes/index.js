var router = require('express').Router();

router.get('/ping', function(req, res, next){
    return res.status(200).send('Hello');
});

// user signup, login, view user data, modify user data
router.use('/user', require('./user/customer'));
router.use('/user', require('./user/restaurant'));

// Create, update, read and delete restaurant by restaurant owner
router.use('/restaurant', require('./restaurant'));

module.exports = router;
