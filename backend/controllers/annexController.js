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
        const parseIfString = (value, fallback) => {
            if (value === undefined || value === null) return fallback;
            if (typeof value === 'string') return JSON.parse(value);
            return value;
        };

        const annexData = {
            ownerId: req.body.ownerId,
            title: req.body.title,
            price: Number(req.body.price),
            description: req.body.description,
            selectedAddress: req.body.selectedAddress || '',
            preferredGender: req.body.preferredGender || 'Any',
            features: parseIfString(req.body.features, []),
            rulesAndConditions: parseIfString(req.body.rulesAndConditions, []),
            tags: parseIfString(req.body.tags, ["New"]),
            location: parseIfString(req.body.location, undefined)
        };

        if (req.files && req.files.length > 0) {
            const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
            annexData.imageUrls = imageUrls;
            annexData.imageUrl = imageUrls[0];
        }

        const newAnnex = new Annex(annexData);
        const savedAnnex = await newAnnex.save();
        res.status(201).json({ success: true, data: savedAnnex });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getOwnerAnnexes = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const annexes = await Annex.find({ ownerId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: annexes.length,
            data: annexes
        });
    } catch (error) {
        console.error("Owner Annexes Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const getAnnexById = async (req, res) => {
    try {
        const annex = await Annex.findById(req.params.id).populate('ownerId', 'firstName lastName');
        if (!annex) {
            return res.status(404).json({ success: false, message: "Annex not found" });
        }

        res.status(200).json({ success: true, data: annex });
    } catch (error) {
        console.error("Get Annex Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const updateAnnex = async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId } = req.body;

        const annex = await Annex.findById(id);
        if (!annex) {
            return res.status(404).json({ success: false, message: "Annex not found" });
        }

        if (ownerId && String(annex.ownerId) !== String(ownerId)) {
            return res.status(403).json({ success: false, message: "Not authorized to edit this annex" });
        }

        const updatableFields = [
            "title",
            "price",
            "description",
            "selectedAddress",
            "preferredGender",
            "features",
            "rulesAndConditions",
            "tags"
        ];

        updatableFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                annex[field] = req.body[field];
            }
        });

        if (req.body.location) {
            annex.location = req.body.location;
        }

        const updated = await annex.save();
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Annex Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteAnnex = async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId } = req.body;

        const annex = await Annex.findById(id);
        if (!annex) {
            return res.status(404).json({ success: false, message: "Annex not found" });
        }

        if (ownerId && String(annex.ownerId) !== String(ownerId)) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this annex" });
        }

        await Annex.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Annex deleted successfully" });
    } catch (error) {
        console.error("Delete Annex Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
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


module.exports = { searchAnnexes, createAnnex, getOwnerAnnexes, getAnnexById, updateAnnex, deleteAnnex, getDistanceToAnnex };