const { mapPool } = require('../config/mapDb');

async function getLocationName(lng, lat, radiusMeters = 50) {
    // hayyrly_map is imported from Geofabrik shapefiles (gis_osm_*_free_1), not osm2pgsql —
    // geom uses SRID 3857 (Web Mercator), same transform/DWithin approach as before.
    //
    // gis_osm_pois_a_free_1 holds the same kind of POIs as gis_osm_pois_free_1 but as polygons
    // (malls, big named buildings, etc). buildings_view is a separately maintained osm2pgsql
    // table (way already in 4326, not 3857) covering plain numbered residential buildings that
    // Geofabrik's gis_osm_* extract doesn't carry names for. If the point sits inside one of
    // these polygons that's the intended answer even when an unrelated point POI (e.g. a cafe)
    // happens to be nominally closer, so containment is checked first and only falls back to
    // nearest-point search. gis_osm_roads_free_1 (streets) is a line layer, so it can only ever
    // be a nearest-distance candidate, never a containment match.
    const contained = await mapPool.query(
        `SELECT name, fclass, 0::numeric AS distance_m FROM (
             SELECT name, fclass, ST_Transform(geom, 4326) AS geom4326, ST_Area(geom) AS area
             FROM gis_osm_pois_a_free_1
             WHERE name IS NOT NULL
             UNION ALL
             SELECT name, building AS fclass, way AS geom4326, ST_Area(way) AS area
             FROM buildings_view
             WHERE name IS NOT NULL
         ) c
         WHERE ST_Contains(geom4326, ST_SetSRID(ST_MakePoint($1, $2), 4326))
         ORDER BY area ASC
         LIMIT 1`,
        [lng, lat]
    );
    if (contained.rows[0]) return contained.rows[0];

    const result = await mapPool.query(
        `SELECT name, fclass,
                ROUND(ST_Distance(
                    geom4326::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                )::numeric, 1) AS distance_m
         FROM (
             SELECT name, fclass, ST_Transform(geom, 4326) AS geom4326 FROM gis_osm_pois_free_1   WHERE name IS NOT NULL
             UNION ALL
             SELECT name, fclass, ST_Transform(geom, 4326) AS geom4326 FROM gis_osm_places_free_1 WHERE name IS NOT NULL
             UNION ALL
             SELECT name, fclass, ST_Centroid(ST_Transform(geom, 4326)) AS geom4326 FROM gis_osm_pois_a_free_1 WHERE name IS NOT NULL
             UNION ALL
             SELECT name, building AS fclass, ST_Centroid(way) AS geom4326 FROM buildings_view WHERE name IS NOT NULL
             UNION ALL
             SELECT name, type AS fclass, geom AS geom4326 FROM places WHERE name IS NOT NULL
             UNION ALL
             SELECT name, fclass, ST_Transform(geom, 4326) AS geom4326 FROM gis_osm_roads_free_1 WHERE name IS NOT NULL
         ) p
         WHERE ST_DWithin(
                geom4326::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
           )
         ORDER BY distance_m ASC
         LIMIT 1`,
        [lng, lat, radiusMeters]
    );
    return result.rows[0] || null;
}

module.exports = { getLocationName };
