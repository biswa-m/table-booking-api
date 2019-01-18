# Restaurant Table booking system

A web service which will facilate restaurant owners to manage table booking and allow customers to make table reservations.


NOTE: This is a tentative backend system design. Further discussion might be needed and a lot of reservation related challenges are not considered - eg: restaurant might have special timing for some particular day. As this is just going to be prototype minimalistic approach is considered.

## Starting the API in stagging mode

    node index.js

On this command a http server will run in staging environment and start listening to port 3000. 
This can be tested by following URI
    
    http://localhost:3000/ping

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
			'bookingTo': Date
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
		bookingTo: DateTime,
		customer: Customer ObjectId,
		bookingStatus: pending/confirmed/canceled
		bookingStatusUpdatedBy: customer/RestaurantOwner
	}

each collection will have _id by default


## Proposed API routes

#### /user
-	POST - create customer account
	-	Permission - self
-	PUT - update customer details.
	-	Permission - self
-	GET - get customer data.
	-	Permission - self
#### /user/login
-	POST - validate customer login and return jwt token
	-	Permission - self
#### /user/restaurant/login
	POST - validate RestaurantOwner login and return jwt token
	-	Permission - self
#### /restaurant
-	POST - Create new restaurant by RestaurantOwner
-	PUT - Update restaurant details by RestaurantOwner
-	GET - Get restaurants owned by the RestaurantOwner
-	DELETE - Delete restaurant owned by RestaurantOwner
#### /restaurant/:restaurantId/:phone
-	GET - customer details by phone no, if customer has bookings with restaurantOwner
#### /restaurant/:restaurantId/bookings
-	GET - bookings of a restaturant
	-	optional data on query string
		-	phone, sortBy, startDate, endDate, startTime, endTime, pageNo, customerId, customerEmail, bookingStatus //TODO
#### /restaurant/booking/:restaurantId/:bookingId
-	POST - create booking
-	GET	- get booking
-	PUT - update booking
#### /table
-	POST - Add table(s) to their restaurant by RestaurantOwner
	-	example request:
		
        
        POST /table
		BODY: {
			restauranId: 23847hjhd7q3472341,
			tables: [
				{
					tableIdentifier: 1,
					capacity: 4
				},
				{
					tableIdentifier: 2,
					capacity: 2
				}
			]
		}

-	PUT - Update single table details

-	GET - List tables for particular restaurant
#### /restaurants
-	GET - list all verfied restaurants for public view

in version 2, we can add filter by avalibility during datetime
#### /booking
-	POST - Create booking in case its available
	-	return bookingId
	-	Permission - Customer, RestaurantOwner
-	DELETE - Delete a book
	-	Permission - Customer, RestaurantOwner
#### /booking/:bookinId
-	permission- customer

## Impleted API routes

#### /user
-	POST - create customer account
	-	Permission - self
-	PUT - update customer details.
	-	Permission - self
-	GET - get customer data.
	-	Permission - self
#### /user/login
- POST - validate customer login and return jwt token
	-	Permission - self
#### /user/restaurant/login
-	POST - validate RestaurantOwner login and return jwt token
	-	Permission - self
#### /restaurant
-	POST - Create new restaurant by RestaurantOwner
-	GET - Get restaurants owned by the RestaurantOwner
-	PUT - Update restaurant details by RestaurantOwner

set business hours to {start: 0, end: 0} for closed day
#### /restaurant/:restaurantId/:phone
-	GET - customer details by phone no, if customer has bookings with restaurantOwner
#### /restaurant/bookings/:restaurantId
-	GET - bookings of a restaturant
	-	optional data on query string
		-	phone, customerId, email, bookingStatus
#### /restaurant/booking/:restaurantId/:bookingId
-	GET - get booking of a restaurant by bookingId

#### /restaurants
-	GET - list all verfied restaurants for public view
#### /table
-	POST - Add table(s) to their restaurant by RestaurantOwner
-	PUT - Update single table details
-	GET - List tables for particular restaurant
#### /booking
-	POST - Create booking in case its available
	-	return bookingId
-	Get - Get all the bookings by user Id
	-	permission Customer
#### /booking/:bookinId
-	permission- customer, self
