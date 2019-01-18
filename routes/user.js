var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../helpers/auth');

var Customer = mongoose.model('Customer');
var RestaurantOwner = mongoose.model('RestaurantOwner');

/*
 * Create user for new customers
 * required data: name, phone, email, password
 * optional data: none
 */
router.post('/', function(req, res, next) {
	var user = new Customer();

	user.name = req.body.user.name;
	user.email = req.body.user.email;
	user.phone = req.body.user.phone;
	user.setPassword(req.body.user.password);

	user.save().then(function() {
		return res.json({user: user.toAuthJSON()});
	}).catch(next);
});

/*
 * Read user
 * required data: Authentication token
 */
router.get('/', auth.required, function(req, res, next) {
	Customer.findById(req.user.id).then(function(user) {
		if (!user) return res.sendStatus(401);

		return res.send({user: user.getUserJSON()});
	}).catch(next);
});

/*
 * Update customer info
 * required data: Authentication token
 * optional data: name, email, phone, password
 */
router.put('/', auth.required, function(req, res, next) {
	Customer.findById(req.user.id).then(function(user) {
		if (!user) return res.sendStatus(401);

		let data = req.body.user;

		if (!data || !(data.name || data.email || data.phone || data.password)){
			return res.status(400).json({errors: 'Provide data to update'});
		}

		// Update fields that were passed
		if (typeof data.firstName !== 'undefined')
			user.firstName = data.firstName;
		if (typeof data.lastName !== 'undefined')
			user.lastName = data.lastName;
		if (typeof data.email !== 'undefined')
			user.email = data.email;
		if (typeof data.phone !== 'undefined')
			user.phone = data.phone;
		if (typeof data.password !== 'undefined')
			user.setPassword(data.password);

		user.save().then(function() {
			return res.send({user: user.getUserJSON()});
		}).catch(next);
	}).catch(next);
});

/*
 * Create Token / user login
 * required data: email, password
 */
router.post('/login', function(req, res, next) {
	if (!req.body.user) {
		return res.sendStatus(400);
	}
	if (!req.body.user.email) {
	    return res.status(422).json({errors: {email: "can't be blank"}});
	}
	if (!req.body.user.password) {
	    return res.status(422).json({errors: {password: "can't be blank"}});
	}

	Customer.findOne({'email': req.body.user.email}).then(function(user) {
		if (!user) return res.status(401).json({errors: 'Wrong email or password'});
		if (!user.validPassword(req.body.user.password)) {
			return res.status(401).json({errors: 'Wrong email or password'});
		};
		
		return res.json({user: user.toAuthJSON()});
	}).catch(next);
});

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

module.exports = router;
