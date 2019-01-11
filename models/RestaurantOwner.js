var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var secret = require('../config').secret;

var ObjectId = mongoose.Schema.Types.ObjectId;

var RestaurantOwnerSchema = new mongoose.Schema({
	firstName: {
		type: String,
		required: [true, "can't be blank"]
	},
	lastName: {
		type: String,
		required: [true, "can't be blank"]
	},
	email: {
		type: String,
		required: [true, "can't be blank"],
		unique: true,
		index: true,
		match: [/^(\D)+(\w)*((\.(\w)+)?)+@(\D)+(\w)*((\.(\D)+(\w)*)+)?(\.)[a-z]{2,}$/, 'is invalid']
	},
	phone: {
		type: String,
		required: [true, "can't be blank"],
		//unique: true,
		match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im, 'is invalid']
	},
	hash: String,
	salt: String,
	restaurants: {
		type: [ObjectId],
		default: undefined
	},
}, {timestamps: true});

RestaurantOwnerSchema.plugin(uniqueValidator, {message: 'is already taken.'});

RestaurantOwnerSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	return this.hash === hash;
};

RestaurantOwnerSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

RestaurantOwnerSchema.methods.generateJWT = function() {
	var today = new Date();
	var exp = new Date(today);
	exp.setDate(today.getDate() + 1000); // token will valid for 1 day

	return jwt.sign({
		id: this._id,
		username: this.username,
		exp: parseInt(exp.getTime() / 1000),
	}, secret);
};

RestaurantOwnerSchema.methods.toAuthJSON = function() {
	return {
		firstName: this.firstName,
		lastName: this.lastName,
		email: this.email,
		token: this.generateJWT()
	};
};

RestaurantOwnerSchema.methods.getUserJSON = function() { return {
		firstName: this.firstName,
		lastName: this.lastName,
		email: this.email,
		phone: this.phone,
		restaurants: this.restaurants
	};
};

var RestaurantOwner = mongoose.model('RestaurantOwner', RestaurantOwnerSchema);
module.exports = RestaurantOwner;
