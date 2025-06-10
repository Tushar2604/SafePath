const axios = require('axios');
const logger = require('../utils/logger');

class LocationService {
  // Get address from coordinates using Google Maps Geocoding API
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${latitude},${longitude}`,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return `${latitude}, ${longitude}`;
    } catch (error) {
      logger.error('Geocoding error:', error);
      return `${latitude}, ${longitude}`;
    }
  }

  // Get nearby emergency services
  async getNearbyEmergencyServices(latitude, longitude, type = 'hospital') {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${latitude},${longitude}`,
          radius: 5000, // 5km radius
          type: type,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.status === 'OK') {
        return response.data.results.map(place => ({
          name: place.name,
          address: place.vicinity,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          rating: place.rating,
          isOpen: place.opening_hours?.open_now,
          placeId: place.place_id
        }));
      }

      return [];
    } catch (error) {
      logger.error('Nearby places search error:', error);
      return [];
    }
  }

  // Calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Get directions between two points
  async getDirections(origin, destination) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          distance: route.legs[0].distance,
          duration: route.legs[0].duration,
          steps: route.legs[0].steps,
          polyline: route.overview_polyline.points
        };
      }

      return null;
    } catch (error) {
      logger.error('Directions error:', error);
      return null;
    }
  }
}

module.exports = new LocationService();