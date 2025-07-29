import React, { useState, useEffect } from 'react';
import './AppointmentFinder.css'; // Basic styling (create this file)

const AppointmentFinder = () => {
  const [psychiatrists, setPsychiatrists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({
    lat: 13.0827, // Latitude for Chennai
    lng: 80.2707  // Longitude for Chennai
  });

  // Replace with your actual API key
  const API_KEY = '';

  const fetchNearbyPsychiatrists = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/nearby?lat=${location.lat}&lng=${location.lng}`
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch psychiatrists');
      }
  
      const data = await response.json();
  
      if (data.status === 'OK') {
        setPsychiatrists(data.results);
      } else {
        throw new Error(data.error_message || 'No psychiatrists found');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };
  

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Fallback to default location
          fetchNearbyPsychiatrists();
        }
      );
    } else {
      fetchNearbyPsychiatrists(); // Use default location
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (location.lat && location.lng) {
      fetchNearbyPsychiatrists();
    }
  }, [location]);
 
  return (
    <div className="psychiatrist-finder">
      <h1>Find Psychiatrists Near You</h1>

      {loading && <div className="loading">Loading...</div>}

      {error && (
        <div className="error">
          Error: {error}
          <button onClick={fetchNearbyPsychiatrists}>Retry</button>
        </div>
      )}

      <div className="psychiatrist-list">
        
        {psychiatrists.map((psychiatrist) => (
          <div key={psychiatrist.place_id} className="psychiatrist-card">
            <h2>{psychiatrist.name}</h2>

            <div className="info-row">
              <span className="rating">
                ⭐ {psychiatrist.rating || 'No rating'} (
                {psychiatrist.user_ratings_total || 0} reviews)
              </span>
              {psychiatrist.opening_hours?.open_now !== undefined && (
                <span
                  className={`open-now ${
                    psychiatrist.opening_hours.open_now ? 'open' : 'closed'
                  }`}
                >
                  {psychiatrist.opening_hours.open_now ? 'Open Now' : 'Closed'}
                </span>
              )}
            </div>

            <p className="address">{psychiatrist.vicinity}</p>

            {psychiatrist.formatted_phone_number && (
              <a
                href={`tel:${psychiatrist.formatted_phone_number}`}
                className="phone-call"
              >
                Call Now: {psychiatrist.formatted_phone_number}
              </a>
            )}

            {psychiatrist.photos?.[0] && (
              <img
                src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${psychiatrist.photos[0].photo_reference}&key=${API_KEY}`}
                alt={psychiatrist.name}
                className="place-image"
              />
            )}
            <button>Book Now</button>
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${psychiatrist.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-on-map"
            >
              View on Google Maps
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentFinder;
