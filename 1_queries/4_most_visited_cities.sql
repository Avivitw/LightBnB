SELECT properties.city, COUNT(reservations) as total_resrvations
FROM properties
JOIN reservations ON properties.id = reservations.property_id
GROUP BY properties.city
ORDER BY total_resrvations DESC;