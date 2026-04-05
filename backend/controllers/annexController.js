const Annex = require('../models/Annex');



const searchAnnexes = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const maxDistance = parseFloat(req.query.maxDistance) || 5000;
        
        const minPrice = parseFloat(req.query.minPrice); 
        const maxPrice = parseFloat(req.query.maxPrice);
        
        // gender
        const gender = req.query.gender; 
        
        const tags = req.query.tags ? req.query.tags.split(',') : [];

        let query = {};

        // Distance
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: { type: "Point", coordinates: [lng, lat] },
                    $maxDistance: maxDistance
                }
            };
        }

        //Budget
        if (!isNaN(minPrice) || !isNaN(maxPrice)) {
            query.price = {}; 
            if (!isNaN(minPrice)) query.price.$gte = minPrice; 
            if (!isNaN(maxPrice)) query.price.$lte = maxPrice; 
        }

        // Gender
        if (gender) {
             
            query.preferredGender = { $in: [gender, 'Any'] };
        }

        // Tags
        if (tags.length > 0) {
            query.tags = { $in: tags };
        }

        const annexes = await Annex.find(query);

        res.status(200).json({
            success: true,
            count: annexes.length,
            data: annexes
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


const createAnnex = async (req, res) => {
    try {
        const newAnnex = new Annex(req.body);
        const savedAnnex = await newAnnex.save();
        res.status(201).json({ success: true, data: savedAnnex });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};



const getDistanceToAnnex = async (req, res) => {
    try {
        
        // SLIIT Coordinates: Longitude 79.9723, Latitude 6.9147
        const startLng = parseFloat(req.query.lng) || 79.9723; 
        const startLat = parseFloat(req.query.lat) || 6.9147;  

        // 2. Find the target annex in the database using the ID in the URL
        const annexId = req.params.id;
        const annex = await Annex.findById(annexId);

        if (!annex) {
            return res.status(404).json({ success: false, message: "Annex not found" });
        }

        // Annex coordinates
        const endLng = annex.location.coordinates[0];
        const endLat = annex.location.coordinates[1];

        // Call the Mapbox Directions API (Driving profile)
        const mapboxToken = process.env.MAPBOX_API_KEY;
        // Mapbox requires coordinates in this format: lon,lat;lon,lat
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?access_token=${mapboxToken}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            // Mapbox returns distance in meters and duration in seconds
            const distanceInMeters = data.routes[0].distance;
            const durationInSeconds = data.routes[0].duration;

            // Convert to kilometers and minutes for the student to read easily
            const distanceInKm = (distanceInMeters / 1000).toFixed(2);
            const durationInMins = Math.round(durationInSeconds / 60);

            res.status(200).json({
                success: true,
                annex_title: annex.title,
                commute: {
                    distance_km: distanceInKm,
                    duration_mins: durationInMins,
                    mode: "driving"
                }
            });
        } else {
            res.status(400).json({ success: false, message: "Could not calculate a route." });
        }

    } catch (error) {
        console.error("Distance Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


module.exports = { searchAnnexes, createAnnex, getDistanceToAnnex };