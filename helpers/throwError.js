var throwError = {};

throwError.validationError = function(msg) {
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

module.exports = throwError;
