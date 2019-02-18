var throwError = {};

throwError.validationError = function(msg) {
	msg = msg ? msg : 'Bad request';
	var err = new Error(msg);
	err.name = 'ValidationError';
	throw err;
};

throwError.unauthorized = function(msg) {
	var err = new Error(msg);
	err.name = 'Unauthorized';
	err.status = 401;
	throw err;
};

throwError.userNotFound = function(msg) {
	msg = msg ? msg : 'User not found';
	var err = new Error(msg);
	err.name = 'User not found';
	err.status = 406;
	throw err;
};

throwError.noTable = function(msg) {
	var err = new Error(msg);
	err.name = 'booking-failed';
	err.status = 455;
	throw err;
};

module.exports = throwError;
