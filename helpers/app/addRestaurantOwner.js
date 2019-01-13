/* Add restaurant owners
 * Do not include this file in the main app
 */
var mongoose = require('mongoose');
var config = require('../../config');

var RestaurantOwner = require('../../models/RestaurantOwner');

// Connect database
mongoose.connect(config.mongodb.URL, config.mongodb.option)
.then(function() {
	console.log('\x1b[32m%s\x1b[0m', 'Database Connection Established!');

	var user = new RestaurantOwner;

	user.firstName = 'Super';
	user.lastName = 'Admin';
	user.email = 'admin@admin.com';
	user.phone = '1234567890';
	user.setPassword('password');
	//user.restaurants = ''; // add ObjectId

	user.save().then(function() {
		console.log({user: user.toAuthJSON()});
	}).catch(function(err) {console.log(err)});
})
.catch(function(err) {
	console.log('\x1b[31m%s\x1b[0m', 'Error in Database Connection!');
	console.log(err);
});
