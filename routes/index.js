var router = require('express').Router();

router.get('/ping', function(req, res, next){
    return res.status(200).send('Hello');
});

router.use('/user', require('./user/customer'));

module.exports = router;
