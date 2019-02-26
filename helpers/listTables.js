var mongoose = require('mongoose');

var Table = mongoose.model('Table');
var Booking = mongoose.model('Booking');
var Restaurant = mongoose.model('Restaurant');

var config = require('../config');
var utility = require('./utility');

// List tables based on availability
var listTables = function(query, restaurant, date, next) {
	return new Promise(async function(resolve,reject){
		// List all tables
		if (query == 'all') {
			resolve(await listAllTables(restaurant))	
		}

		let restaurantOpen = undefined;

		// find restaurant is open or close at the given time
		if (query != 'all') {
			// Find the restaurant is open or close at that time
			await Restaurant.findById(restaurant, 'businessHours')
			.then(function(data) {
				let businessHours = (data.businessHours[utility.time.getDay(date)]);
				let time = utility.time.get(date);

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
			// Find the occupied tables of the restaurant at the given time
			Booking.find(
				{
					'restaurant': restaurant,
					'bookingFrom': {
						$gt: date - config.defaultBookingDuration,
						$lt: date + config.defaultBookingDuration
					}
				},
				'tables'
			).populate('tables')
			.then(async function(bookings) {

				// For Unavailable tables
				if (query == 'unavailable') {

					//return occupied tables with desired keys
					let list = [];
					bookings.forEach(function(booking) {
						list.push(booking.tables[0].viewJSON());
					});

					resolve(list);

				} else if (query == 'available' || query == 'status') {

					let allTables = await listAllTables(restaurant);

					let occupiedTables = bookings.map(a => a.tables[0].id);

					// To provide booking status of tables
					if (query == 'status') {
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
			if (query == 'unavailable') {
				// All tables will be unavailable when restaurant is closed
				resolve(await listAllTables(restaurant));
			} else if (query == 'available') {
				// No tables will be available wheb restaurant is closed
				resolve([]);
			} else if (query == 'status') {
				// Provide status information with each table
				let allTables = await listAllTables(restaurant);
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
var listAllTables = function(restaurant) {
	return new Promise(function(resolve,reject){
		Table.find(
			{
				'restaurant': restaurant,
			}
		).then(function(tables) {
			let list = [];
			tables.forEach(function(table) {
				list.push(table.viewJSON());
			});
			resolve(list);
		}).catch();
	});
}

module.exports = listTables;
