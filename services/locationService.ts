
import { GeolocationData } from '../types';

/**
 * Promisified wrapper for navigator.geolocation.getCurrentPosition to fetch user's GPS coordinates.
 * Requests high accuracy for better precision.
 * @returns A Promise that resolves with GeolocationData or rejects with an error.
 */
export const getGeolocation = (): Promise<GeolocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied the request for Geolocation.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out.";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Fetches the user's public IP address from the ipify API.
 * @returns A Promise that resolves with the IP address string or 'Unavailable' on failure.
 */
export const getIpAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      throw new Error('Failed to fetch IP address');
    }
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('IP fetch error:', error);
    return 'Unavailable';
  }
};