# Restaurant Table booking system

A web service which will facilate restaurant owners to manage table booking and allow customers to make table reservations.


NOTE: This is a tentative backend system design. Further discussion might be needed and a lot of reservation related challenges are not considered - eg: restaurant might have special timing for some particular day. As this is just going to be prototype minimalistic approach is considered.

## Install all dependencies
		npm install

## Starting the API in stagging mode
If mongodb service is not running

		sudo service mongod start

Start the API

    node app.js

### Starting in production mode
    
    NODE_ENV=production JWT_SECRET=<secret code for JWT> MONGO_URL=<url for mongoDB> node index.js

## Configuration
Modify values in config/index.js for custom configuration.

## Payload Syntax
Default structure and valid keys to send JSON data on payload.

	{
		'user': {
			'name': '',
			'firstName': '',
			'lastName': '',
			'phone': '',
			'email': '',
			'password': ''
		},
		'restaurant': {
			'id': '',
			'name': '',
			'address': '',
			'businessHours': {
				'sunday': {
					'start': '1030',
					'end': '1845'
				},
				'monday': {
					'start': '0',
					'end': '0'
				},
				...
				...
			}
		},
		'tables': [
			'tableIdentifier': '',
			'capacity': '',
			'description': ''
		],
		'table': {
			'id': '',
			'tableIdentifier': '',
			'capacity': '',
			'description': ''
		},
		'booking': {
			'restaurant': ObjectId,
			'tables': [ObjectId],
			'noOfPersons': Integer,
			'bookingFrom': Date
			'customer': ObjectId,
		}
	}

## Authorization
Send authorization token in headers

	'Authorization': 'Bearer <token>'

## Database Schema

	RestaurantOwner: {
		firstName: String,
		lastName: String,
		email: String,
		phone: String,
		password: String,
		resturants: [resturant ObjectId] 
	}
	Customer: {
		email: String,
		password: String,
		name: String,
		phone: String
	}
	Restaurant: {
		name: String,
		Address: String,
		description: String,
		admin: [RestaurantOwner ObjectId]
		verified: Boolean
		businessHours: {
			Sunday: {
				start: Time,
				end: Time
			},
			Monday: {
				start: Time,
				end: Time
			},
			...
			...
		}
	}
	Table: {
		restaurant: ObjectId,
		tableIdentifier: String,	// eg Table No 12
		capacity: Number,
		description: String
	}
	Booking: {
		restaurant: ObjectId,
		tables: [table ObjectId],
		noOfPersons: Integer,
		bookingFrom: DateTime,
		customer: Customer ObjectId,
		bookingStatus: pending/confirmed/canceled
		bookingStatusUpdatedBy: customer/RestaurantOwner
	}

each collection will have _id by default

## Implemented API routes

#### /user
-	POST - create customer account
	-	Permission - self
	- required data: name, phone, email
	- optional data: password
-	PUT - update customer details.
	-	Permission - self
	-	required data: Authentication token
	-	optional data: name, email, phone, password (atleast one is required)
-	GET - get customer data.
	-	Permission - self
	-	required data: Authentication token
#### /user/login
- POST - validate customer login and return jwt token
	-	Permission - self
	-	required data: email, password
#### /user/restaurant/login
-	POST - validate RestaurantOwner login and return jwt token
	-	Permission - self
	-	required data: email, password
#### /restaurant
-	POST - Create new restaurant by RestaurantOwner
	-	required data: name, address, business hours
	-	optional data: description
-	GET - Get restaurants owned by the RestaurantOwner
	-	required data: Authentication token
-	PUT - Update restaurant details by RestaurantOwner
	-	required data: Authentication token
	-	optional data: name, address, description, businessHours

set business hours to {start: 0, end: 0} for closed day
#### /restaurant/:restaurantId/customer
-	GET - customer details by phone no/ customer id/ email
	-	permission: restaurant owner, if the customer has booking in the restaurant
	-	required data: Authentication token
	- optional data in querystring: id, phone, email (Atleast one is required)
#### /restaurant/bookings/:restaurantId
-	GET - bookings of a restaturant
	-	required data: Authentication token
	-	optional data on query string
		-	phone, customerId, email, bookingStatus, table
		- before, after (type: date, to filter by date)
		-	skip (type: int, skip n results), limit(type: int, show only n rusult)
		-	sortby (type: array of array, ex: [['bookingFrom', -1], ['bookingStatus', 1]])
		- countOnly (type: boolean) // To get only the counts of bookings 
#### /restaurant/booking/:restaurantId/
-	POST - create new booking to own restaurant by restauranteur
	-	required data - Authentication token, user: {phone}, booking: {bookingFrom, noOfPersons}
	-	optional data
		-	user: {name, email} (optional data required in case of new customer)
		-	table (type: objectId)

#### /restaurant/booking/:restaurantId/:bookingId
-	GET - get booking of a restaurant by bookingId
	-	required data: Authentication token
-	PUT - update booking of a restaurant by bookingId
	-	required data: Authentication token, noOfPersons, bookingFrom
	- optional data: table (type: objectId)

#### /restaurant/booking/:restaurantId/:bookingId/status
-	PUT - Change bookingStatus
	-	Confirm / Cancel a booking
	-	required data: Authentication token, bookingStatus

#### /restaurants
-	GET - list all verfied restaurants for public view
	-	permission: public

#### /restaurant/table/:restaurantId
-	POST - Add table(s) to their restaurant by RestaurantOwner
	-	required data: Authentication token, tables, tableIdentifier, capacity
	-	optional data: description
#### /restaurant/table/:restaurantId/:tableId
-	GET - Read table details
	-	required data: Authorization token
#### /restaurant/table
-	PUT - Update single table details
	-	required data: Authentication token, table.id
	-	optional data: tableIdentifier, capacity, description
#### /restaurant/tables/:restaurantId
-	GET - List tables for particular restaurant
	-	required data: Authorization token
	-	optional data in query string: 
		-	availability='available' / 'unavailable' / 'status'. To filter tables on given date
		-	date, in mili-second format. Find out booking status on this time
		- capacity, mincapacity, maxcapacity // Capacity wise filtering for available tables

#### /booking
-	POST - Create booking in case its available
	-	Required data: token, restaurant, noOfPersons, bookingFrom
	- Permision: login customer
-	Get - Get all the bookings by user Id
	-	required data: Authentication token
	-	permission Customer
#### /booking/:bookinId
-	permission- customer, self
	-	required data: Authentication token

## API routes to be implemented

#### /restaurant
-	DELETE - Delete restaurant owned by RestaurantOwner
#### /restaurant/bookings/:restaurantId
-	GET - bookings of a restaturant
	-	optional data on query string
		-	phone, sortBy, startDate, endDate, startTime, endTime, pageNo, customerId, customerEmail, bookingStatus //TODO
#### /restaurant/booking/:restaurantId/:bookingId
-	POST - create booking
-	PUT - update booking
#### /restaurants
-	GET - list all verfied restaurants for public view
add filter by avalibility during datetime
#### /booking
-	DELETE - Delete a book
	-	Permission - Customer, RestaurantOwner

# Additional helper app

## Directly access database to create new restaurant owner
		node helpers/app/addRestaurantOwner.js
