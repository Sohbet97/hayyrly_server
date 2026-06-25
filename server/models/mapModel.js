const { mapPool } = require('../config/mapDb');

async function getLocationName(lng, lat, radiusMeters = 50) {
    // planet_osm_point uses SRID 3857 (Web Mercator).
    // ST_DWithin on geometry uses the spatial index for fast filtering,
    // then ST_Transform to 4326 + geography gives accurate distance in metres.
    const result = await mapPool.query(
        `SELECT name, place AS fclass,
                ROUND(ST_Distance(
                    ST_Transform(way, 4326)::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                )::numeric, 1) AS distance_m
         FROM planet_osm_point
         WHERE name IS NOT NULL
           AND ST_DWithin(
                way,
                ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 3857),
                $3
           )
         ORDER BY distance_m ASC
         LIMIT 1`,
        [lng, lat, radiusMeters]
    );
    return result.rows[0] || null;
}

module.exports = { getLocationName };
