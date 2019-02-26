var mongoose = require('mongoose');

var Table = mongoose.model('Table');
var Booking = mongoose.model('Booking');
var Restaurant = mongoose.model('Restaurant');

var config = require('../config');
var utility = require('./utility');

// List tables based on availability
var listTables = function(availability, restaurant, query, next) {
	return new Promise(async function(resolve,reject){
		// List all tables
		if (availability == 'all') {
			resolve(await listAllTables(restaurant, query))	
		}

		let restaurantOpen = undefined;

		// find restaurant is open or close at the given time
		if (availability != 'all') {
			// Find the restaurant is open or close at that time
			await Restaurant.findById(restaurant, 'businessHours')
			.then(function(data) {
				let businessHours = (data.businessHours[utility.time.getDay(query.date)]);
				let time = utility.time.get(query.date);

				if (time < businessHours.start || time > businessHours.end) {
					restaurantOpen = false;
				} else {
					restaurantOpen = true;
				}
			}).catch(next);
		}
		console.log('restaurantOpen = ', restaurantOpen);

		// List when restaurant is open
		if (restaurantOpen)	{	
			// Find the occupied tables with required property of the restaurant at the given time
			let dbQuery = {};
			dbQuery.restaurant = restaurant;

			// Logic for table availability
			dbQuery.bookingFrom = {
				$gt: query.date - config.defaultBookingDuration,
				$lt: query.date + config.defaultBookingDuration
			}

			Booking.find(dbQuery, 'tables')
			.populate('tables')
			.then(async function(bookings) {

				// For Unavailable tables
				if (availability == 'unavailable') {

					//return occupied tables with desired keys
					let list = [];
					bookings.forEach(function(booking) {
						list.push(booking.tables[0].viewJSON());
					});

					resolve(list);

				} else if (availability == 'available' || availability == 'status') {

					let allTables = await listAllTables(restaurant, query);

					let occupiedTables = bookings.map(a => a.tables[0].id);

					// To provide booking status of tables
					if (availability == 'status') {
						let allTablesWithStatus = allTables;
						allTablesWithStatus.map(x => {
							if ((occupiedTables).includes(JSON.parse(JSON.stringify(x.id)))) {
								x.availability = 'unavailable';
								return x;
							}
							else {
								x.availability = 'available';
								return x;
							}
						});
						
						resolve(allTablesWithStatus);
					} else {
						// For Available tables

						// Substract the tables ids of occupiedTables from allTables
						let availableTables = allTables.filter(x =>
							!(occupiedTables).includes(JSON.parse(JSON.stringify(x.id)))
						);

						resolve(availableTables);
					}
				}
			}).catch(next);
		}

		// When restaurant is closed
		if (!restaurantOpen)	{	
			if (availability == 'unavailable') {
				// All tables will be unavailable when restaurant is closed
				resolve(await listAllTables(restaurant, query));
			} else if (availability == 'available') {
				// No tables will be available wheb restaurant is closed
				resolve([]);
			} else if (availability == 'status') {
				// Provide status information with each table
				let allTables = await listAllTables(restaurant, query);
				allTables = allTables.map(x => {
					x.availability = 'unavailable';
					return x;
				});
				resolve(allTables);
			}
		}
	});
};

// Function to read all tables of a restaurant
var listAllTables = function(restaurant, query) {
	let dbQuery = {};
	dbQuery.restaurant = restaurant;

	// Query obj for required table capacity
	if (query.capacity) {
		dbQuery.capacity = query.capacity;
	} else if (query.mincapacity || query.maxcapacity) {
		dbQuery.capacity = {};

		if (query.mincapacity) {
			dbQuery.capacity.$gte = query.mincapacity;
		}
		if (query.maxcapacity) {
			dbQuery.capacity.$lte = query.maxcapacity;
		}
	}
	console.log(dbQuery);

	return new Promise(function(resolve,reject){
		Table.find(dbQuery)
		.then(function(tables) {
			let list = [];
			tables.forEach(function(table) {
				list.push(table.viewJSON());
			});
			resolve(list);
		}).catch(e => reject(e));
	});
}

module.exports = listTables;
