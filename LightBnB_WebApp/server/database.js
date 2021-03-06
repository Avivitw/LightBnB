const { Pool } = require('pg');
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'

});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const query = `SELECT * 
  FROM users
  WHERE email = $1;
  `;
  return pool.query(query, [email])
    .then((result) => result.rows[0])
    .catch((err) => err.message);

};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const query = `SELECT * 
  FROM users
  WHERE id = $1;
  `;
  
  return pool.query(query, [id])
    .then((result) => result.rows[0])
    .catch((err) => err.message);
    
};

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const values = [user.name, user.email, user.password];
  const query = `INSERT INTO users(name, email, password)
  VALUES($1, $2, $3)
  RETURNING *;
  `;

  return pool.query(query, values)
    .then((result) => result.rows[0])
    .catch((err) => err.message);

};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guestId The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guestId, limit = 10) {
  const query = `SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id= $1
  AND reservations.end_date <now()::date
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `;
  
  return pool.query(query, [guestId, limit])
    .then((result) => result.rows)
    .catch((err) => err.message);

};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const values = [];
  let query = `SELECT properties.*, AVG(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_reviews.property_id`;
  const conditions = [];
  if (options.city) {
    values.push(`%${options.city}%`);
    conditions.push(`city LIKE $${values.length}`);
  }

  if (options.owner_id) {
    values.push(`${options.owner_id}`);
    conditions.push(`properties.owner_id = $${values.length}`);
  }

  if (options.minimum_price_per_night) {
    values.push(`${options.minimum_price_per_night * 100}`);
    conditions.push(`properties.cost_per_night >= $${values.length}`);
  }

  if (options.maximum_price_per_night) {
    values.push(`${options.maximum_price_per_night * 100}`);
    conditions.push(`properties.cost_per_night <= $${values.length}`);
  }
  
  if (conditions.length > 0) {
    query += ` 
    WHERE ` + conditions.join(` 
      AND `);
  }
  
  query += ` 
    GROUP BY properties.id`;
  
  if (options.minimum_rating) {
    values.push(`${options.minimum_rating}`);
    query += ` 
      HAVING AVG(property_reviews.rating) >= $${values.length}`;
  }
  values.push(limit);
  query += ` 
    ORDER BY cost_per_night
  LIMIT $${values.length};
  `;

  return pool.query(query, values)
    .then((result) => result.rows)
    .catch((err) => err.message);

};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  const values = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code];
  const query = `INSERT INTO properties(owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code)
  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
  `;

  return pool.query(query, values)
    .then((result) => result.rows)
    .catch((err) => err.message);
};
exports.addProperty = addProperty;
