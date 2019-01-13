var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');

var RestaurantOwner = mongoose.model('RestaurantOwner');

/*
 * Restaurant owner login
 * required data: email, password
 */
router.post('/restaurant/login', function(req, res, next) {
	if (!req.body.user) {
		return res.sendStatus(400);
	}
	if (!req.body.user.email) {
	    return res.status(422).json({errors: {email: "can't be blank"}});
	}
	if (!req.body.user.password) {
	    return res.status(422).json({errors: {password: "can't be blank"}});
	}

	RestaurantOwner.findOne({'email': req.body.user.email}).then(function(user) {
		if (!user) return res.status(401).json({errors: 'Wrong email or password'});
		if (!user.validPassword(req.body.user.password)) {
			return res.status(401).json({errors: 'Wrong email or password'});
		};
		
		return res.json({user: user.toAuthJSON()});
	}).catch(next);
});

// TODO router.get('/:phone', function(req, res, next) {});

module.exports = router;
