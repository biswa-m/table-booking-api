var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var secret = require('../config').secret;

ObjectId = mongoose.Schema.Types.ObjectId;

var CustomerSchema = new mongoose.Schema({
	name: {
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
		unique: true,
		match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im, 'is invalid']
	},
	hash: String,
	salt: String,
}, {timestamps: true});

CustomerSchema.plugin(uniqueValidator, {message: 'is already taken.'});

CustomerSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	return this.hash === hash;
};

CustomerSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

CustomerSchema.methods.generateJWT = function() {
	var today = new Date();
	var exp = new Date(today);
	exp.setDate(today.getDate() + 1); // token will valid for 1 day

	return jwt.sign({
		id: this._id,
		username: this.username,
		exp: parseInt(exp.getTime() / 1000),
	}, secret);
};

CustomerSchema.methods.toAuthJSON = function() {
	return {
		name: this.name,
		email: this.email,
		token: this.generateJWT()
	};
};

CustomerSchema.methods.getUserJSON = function() { return {
		name: this.name,
		email: this.email,
		phone: this.phone
	};
};

var Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;
