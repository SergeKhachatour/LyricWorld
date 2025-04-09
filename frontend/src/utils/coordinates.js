// Country to coordinates mapping with boundaries
const countryCoordinates = {
    'United States': { 
        center: { lat: 37.0902, lng: -95.7129 },
        bounds: { minLat: 24.3963, maxLat: 49.3843, minLng: -125.0000, maxLng: -66.9346 }
    },
    'United Kingdom': { 
        center: { lat: 55.3781, lng: -3.4360 },
        bounds: { minLat: 49.9195, maxLat: 58.6350, minLng: -8.1440, maxLng: 1.7629 }
    },
    'Canada': { 
        center: { lat: 56.1304, lng: -106.3468 },
        bounds: { minLat: 41.6755, maxLat: 83.1106, minLng: -141.0018, maxLng: -52.6483 }
    },
    'Australia': { 
        center: { lat: -25.2744, lng: 133.7751 },
        bounds: { minLat: -43.0031, maxLat: -10.6681, minLng: 113.6594, maxLng: 153.6119 }
    },
    'Germany': { 
        center: { lat: 51.1657, lng: 10.4515 },
        bounds: { minLat: 47.2701, maxLat: 55.0583, minLng: 5.8663, maxLng: 15.0419 }
    },
    'France': { 
        center: { lat: 46.2276, lng: 2.2137 },
        bounds: { minLat: 41.3039, maxLat: 51.1242, minLng: -5.1422, maxLng: 9.5616 }
    },
    'Spain': { 
        center: { lat: 40.4637, lng: -3.7492 },
        bounds: { minLat: 36.0001, maxLat: 43.7902, minLng: -9.3018, maxLng: 4.3279 }
    },
    'Italy': { 
        center: { lat: 41.8719, lng: 12.5674 },
        bounds: { minLat: 36.6447, maxLat: 47.0921, minLng: 6.6272, maxLng: 18.5204 }
    },
    'Brazil': { 
        center: { lat: -14.2350, lng: -51.9253 },
        bounds: { minLat: -33.7683, maxLat: 5.2718, minLng: -73.9872, maxLng: -34.7929 }
    },
    'India': { 
        center: { lat: 20.5937, lng: 78.9629 },
        bounds: { minLat: 6.7557, maxLat: 35.6743, minLng: 68.1867, maxLng: 97.4152 }
    },
    'China': { 
        center: { lat: 35.8617, lng: 104.1954 },
        bounds: { minLat: 18.1977, maxLat: 53.5608, minLng: 73.6754, maxLng: 135.0263 }
    },
    'Japan': { 
        center: { lat: 36.2048, lng: 138.2529 },
        bounds: { minLat: 24.3963, maxLat: 45.5515, minLng: 122.9339, maxLng: 153.9869 }
    },
    'South Korea': { 
        center: { lat: 35.9078, lng: 127.7669 },
        bounds: { minLat: 33.1909, maxLat: 38.6235, minLng: 124.6120, maxLng: 131.8729 }
    },
    'Russia': { 
        center: { lat: 61.5240, lng: 105.3188 },
        bounds: { minLat: 41.1851, maxLat: 82.0586, minLng: 19.6389, maxLng: 180.0000 }
    },
    'Mexico': { 
        center: { lat: 23.6345, lng: -102.5528 },
        bounds: { minLat: 14.5321, maxLat: 32.7187, minLng: -118.5989, maxLng: -86.4930 }
    },
    'Argentina': { 
        center: { lat: -38.4161, lng: -63.6167 },
        bounds: { minLat: -55.9160, maxLat: -21.7813, minLng: -73.5829, maxLng: -53.6378 }
    },
    'South Africa': { 
        center: { lat: -30.5595, lng: 22.9375 },
        bounds: { minLat: -34.8342, maxLat: -22.1266, minLng: 16.3449, maxLng: 32.8951 }
    },
    'Egypt': { 
        center: { lat: 26.8206, lng: 30.8025 },
        bounds: { minLat: 22.0000, maxLat: 31.6678, minLng: 24.6981, maxLng: 36.8943 }
    },
    'Nigeria': { 
        center: { lat: 9.0820, lng: 8.6753 },
        bounds: { minLat: 4.2704, maxLat: 13.8920, minLng: 2.6917, maxLng: 14.5772 }
    },
    'Kenya': { 
        center: { lat: -1.2921, lng: 36.8219 },
        bounds: { minLat: -4.6769, maxLat: 5.0199, minLng: 33.8939, maxLng: 41.8551 }
    }
};

// Convert country name to coordinates
export const getCountryCoordinates = (country) => {
    const coords = countryCoordinates[country];
    if (!coords) {
        console.warn(`No coordinates found for country: ${country}`);
        return { lat: 0, lng: 0 };
    }
    return coords.center;
};

// Generate random coordinates within a country's boundaries
export const generateRandomCoordinates = (country) => {
    const countryData = countryCoordinates[country];
    if (!countryData) {
        console.warn(`No boundary data found for country: ${country}`);
        return { lat: 0, lng: 0 };
    }

    const { bounds, center } = countryData;
    
    // Use a smaller range around the center (20% of the total range)
    const latRange = (bounds.maxLat - bounds.minLat) * 0.2;
    const lngRange = (bounds.maxLng - bounds.minLng) * 0.2;
    
    // Generate coordinates within the smaller range centered on the country's center
    return {
        lat: center.lat + (Math.random() * latRange - latRange/2),
        lng: center.lng + (Math.random() * lngRange - lngRange/2)
    };
};

// Convert degrees to radians
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

// Convert coordinates to 3D position on sphere
export const getSpherePosition = (lat, lng, radius = 1) => {
    const latRad = toRadians(lat);
    const lngRad = toRadians(lng);
    
    return {
        x: radius * Math.cos(latRad) * Math.cos(lngRad),
        y: radius * Math.sin(latRad),
        z: radius * Math.cos(latRad) * Math.sin(lngRad)
    };
}; 