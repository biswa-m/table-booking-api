var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../helpers/auth');

var Table = mongoose.model('Table');
var Restaurant = mongoose.model('Restaurant');
var RestaurantOwner = mongoose.model('RestaurantOwner');

/*
 * Add table(s) to their restaurant by restaurantOwner
 * required data: Authentication token, restaurant.id, tables, tableIdentifier, capacity
 * optional data: description
 */
router.post('/', auth.required, function(req, res, next) {
	RestaurantOwner.findById(req.user.id).then(function(restaurantOwner) {
		if (!restaurantOwner) return res.sendStatus(401);

		if (!req.body.restaurant || !req.body.tables || !(req.body.tables instanceof Array))
			return res.sendStatus(400);

		Restaurant.findOne({
			admin: req.user.id,
			_id: req.body.restaurant.id
		}).then(function(restaurant) {
			if (!restaurant) return res.sendStatus(401);

			// instantiate empty array to be written into database
			let tables = [];

			// Grep only required data from req.body 
			req.body.tables.forEach(function(table) {
				if (!(table instanceof Object)) {
					var err = new Error('Invalid input');
					err.name = 'ValidationError';
					throw err;
				}

				let data = {
					restaurant: req.body.restaurant.id,
					tableIdentifier: table.tableIdentifier,
					capacity: table.capacity,
					description: table.description
				};

				tables.push(data);
			});

			Table.insertMany(tables).then(function(tables) {
				let list = [];

				tables.forEach(function(table) {
					list.push(table.viewJSON());
				});

				return res.json({tables: list});
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

/*
 * Update single table info by restaurantOwner
 * required data: Authentication token, table.id
 * optional data: tableIdentifier, capacity, description
 */
router.put('/', auth.required, function(req, res, next) {
	RestaurantOwner.findById(req.user.id).then(function(restaurantOwner) {
		if (!restaurantOwner) return res.sendStatus(401);

		let data = req.body.table;
		if (!data || !data.id || !(data.tableIdentifier || data.capacity || data.description))
			return res.sendStatus(400);

		// find the table id is valid
		Table.findById(data.id).then(function(table) {
			if (!table) return res.sendStatus(401);

			// check the table belongs to a restaurant and user is admin
			Restaurant.findOne({
				_id: table.restaurant,
				admin: req.user.id
			}).then(function(restaurant) {
				if (!restaurant) return res.sendStatus(401);

				// Update the field that were passed
				if (typeof data.tableIdentifier !== 'undefined')
					table.tableIdentifier = data.tableIdentifier;
				if (typeof data.capacity !== 'undefined')
					table.capacity = data.capacity;
				if (typeof data.description !== 'undefined')
					table.description = data.description;

				table.save().then(function() {
					return res.json({table: table.viewJSON()});
				}).catch(next);
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

/*
 * List all tables for particular restaurants
 * required data: restaurant=ObjectId in querystring
 */
router.get('/', function(req, res, next) {
	Table.find({restaurant: req.query.restaurant}).then(function(tables) {
		let list = [];

		tables.forEach(function(table) {
			list.push(table.viewJSON());
		});

		return res.json({tables: list});
	}).catch(next);
});

module.exports = router;
