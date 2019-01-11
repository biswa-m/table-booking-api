/*
 * Create and export configuration variables
 */

// Container for all the environments
var environments = {};

// Staging (default) environments
environments.staging = {
	'port' : 3000,
	'envName' : 'staging',
	'secret' : 'ThisIsSecretCodeForJWT',
	'mongodb' : {
		'URL' : 'mongodb://localhost:27017/',
		'option' : {
			'dbName' : 'RTBS-dev',
			'useNewUrlParser' : true
		}
	}
};

// Production environments
environments.production = {
	'port' : 5000,
	'envName' : 'production',
	'secret' : process.env.JWT_SECRET || 'ThisIsSecretCodeForJWT',
	'mongodb' : {
		'URL' : process.env.MONGO_URL || 'mongodb://localhost:27017/',
		'option' : {
			'dbName' : 'RTBS',
			'useNewUrlParser' : true
		}
	}
};

// Check command-line arguments for environment
var currentEnvironment =
	typeof(process.env.NODE_ENV) == 'string'
	? process.env.NODE_ENV.toLowerCase()
	: '';

// Check currentEnvironment is defined
var environmentToExport =
	typeof(environments[currentEnvironment]) == 'object'
	? environments[currentEnvironment]
	: environments.staging;

// Export the module
module.exports = environmentToExport;
