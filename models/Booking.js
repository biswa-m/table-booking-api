var mongoose = require('mongoose');

var bookingValidator = require('../helpers/bookingValidator');

var ObjectId = mongoose.Schema.Types.ObjectId;

var BookingSchema = new mongoose.Schema({
	customer: {
		type: ObjectId,
		required: [true, "can't be blank"]
	},
	restaurant: {
		type: ObjectId,
		ref: 'Restaurant',
		required: [true, "Can't be blank"],
		validate: {
			isAsync: true,
			validator: bookingValidator.restaurant,
			message: 'Invalid restaurant'
		}
	},
	tables: {
		type: [{type: ObjectId, ref: 'Table'}],
		default: undefined,
		required: [true, "can't be blank"]
	},
	noOfPersons: {
		type: Number, // TODO integer
		required: [true, "can't be blank"],
		validate: {
			isAsync: true,
			validator: bookingValidator.noOfPersons,
			message: 'No of persons can not be more than table capacity'
		}
	},
	bookingFrom: {
		type: Date,
		required: [true, "can't be blank"],
	},
	bookingTo: {
		type: Date,
		required: [true, "can't be blank"]
	},
	bookingStatus: {
		type: String,
		default: 'pending',
		validate: {
			validator: function(value) {
				validStrings = ['pending', 'confirmed', 'canceled'];
				return (validStrings.indexOf(value.toLowerCase()) !== -1);
			},
			message: 'invalid input, enter pending/confirmed/canceled'
		}
	},
	bookingStatusUpdatedBy: {
		type: String,
		validate: {
			validator: function(value) {
				validStrings = ['customer', 'restaurantOwner', 'superAdmin'];
				return (validStrings.indexOf(value.toLowerCase()) !== -1);
			},
			message: 'invalid string'
		}
	}
}, {timestamps: true});

BookingSchema.methods.toUserJSON = function() {
	return {
		id: this._id,
		restaurant: this.restaurant,
		tables: this.tables,
		bookingFrom: this.bookingFrom,
		bookingTo: this.bookingTo
	};
};

BookingSchema.methods.toAuthUserJSON = function() {
	return {
		id: this._id,
		restaurant: this.restaurant,
		tables: this.tables,
		noOfPersons: this.noOfPersons,
		customer: this.customer,
		bookingFrom: this.bookingFrom,
		bookingTo: this.bookingTo,
		bookingStatus: this.bookingStatus
	};
};

var Booking = mongoose.model('Booking', BookingSchema);

validateBookingTime = function() {
	var data = this;
	return new Promise(async function(resolve, reject) {
		if (!(bookingValidator.bookingTime(data))) {
			console.log('Invalid booking time');
			resolve(false);
		};

		if (!(await bookingValidator.businessHours(data))) {
			console.log('Restaurant will be closed');
			resolve(false, 'Restaurant will be closed');
		} else {
			console.log('Restarant will be open');
		};

		// TODO in V2.0 restaurant specific custom closing dates/ hours

		if (!(await bookingValidator.availability(Booking, data))) {
			console.log('Table not available');
			resolve(false, 'Table not available');
		} else {
			console.log('table(s) are available');
		};

		resolve(true);
	});
};

Booking.schema.path('bookingFrom').validate(validateBookingTime, 'Invalid booking time!');

module.exports = Booking;
