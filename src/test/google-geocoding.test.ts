import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeAddress, reverseGeocodeCoordinates, searchAddresses } from '@/lib/geocoding';

// Mock the Google Maps Services client
const mockGeocodeResult = {
  json: {
    results: [
      {
        formatted_address: 'Brussels, Belgium',
        geometry: {
          location: {
            lat: 50.8503,
            lng: 4.3517
          }
        },
        place_id: 'ChIJOXnm4hRuYA0RIxbZd5d5b5f',
        address_components: [
          {
            long_name: 'Brussels',
            short_name: 'Brussels',
            types: ['locality', 'political']
          },
          {
            long_name: 'Belgium',
            short_name: 'BE',
            types: ['country', 'political']
          }
        ]
      }
    ],
    status: 'OK'
  }
};

const mockReverseGeocodeResult = {
  json: {
    results: [
      {
        formatted_address: 'Rue de la Loi 200, 1000 Brussels, Belgium',
        geometry: {
          location: {
            lat: 50.8503,
            lng: 4.3517
          }
        },
        place_id: 'ChIJOXnm4hRuYA0RIxbZd5d5b5f'
      }
    ],
    status: 'OK'
  }
};

const mockAutocompleteResult = {
  json: {
    predictions: [
      {
        description: 'Brussels, Belgium',
        place_id: 'ChIJOXnm4hRuYA0RIxbZd5d5b5f',
        structured_formatting: {
          main_text: 'Brussels',
          secondary_text: 'Belgium'
        }
      },
      {
        description: 'Brussels Airport, Zaventem, Belgium',
        place_id: 'ChIJo2_460QGwUcRwjWpn1XCUr8',
        structured_formatting: {
          main_text: 'Brussels Airport',
          secondary_text: 'Zaventem, Belgium'
        }
      }
    ],
    status: 'OK'
  }
};

const mockGoogleClient = {
  geocode: vi.fn(),
  reverseGeocode: vi.fn(),
  placeAutocomplete: vi.fn()
};

// Mock the Google Maps Services module
vi.mock('@googlemaps/google-maps-services-js', () => ({
  Client: vi.fn(() => mockGoogleClient)
}));

describe('Google Geocoding Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  describe('Forward Geocoding', () => {
    it('should successfully geocode an address and return coordinates', async () => {
      mockGoogleClient.geocode.mockResolvedValue(mockGeocodeResult);

      const result = await geocodeAddress('Brussels, Belgium');

      expect(mockGoogleClient.geocode).toHaveBeenCalledWith({
        params: {
          address: 'Brussels, Belgium',
          key: 'test-api-key'
        }
      });

      expect(result).toEqual([4.3517, 50.8503]);
    });

    it('should handle geocoding failures gracefully', async () => {
      mockGoogleClient.geocode.mockResolvedValue({
        json: {
          results: [],
          status: 'ZERO_RESULTS'
        }
      });

      const result = await geocodeAddress('NonexistentPlace123');
      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      mockGoogleClient.geocode.mockRejectedValue(new Error('API quota exceeded'));

      await expect(geocodeAddress('Brussels, Belgium')).rejects.toThrow('API quota exceeded');
    });

    it('should validate input addresses', async () => {
      await expect(geocodeAddress('')).rejects.toThrow('Address is required');
      await expect(geocodeAddress(null as any)).rejects.toThrow('Address is required');
      await expect(geocodeAddress(undefined as any)).rejects.toThrow('Address is required');
    });
  });

  describe('Reverse Geocoding', () => {
    it('should successfully reverse geocode coordinates and return address', async () => {
      mockGoogleClient.reverseGeocode.mockResolvedValue(mockReverseGeocodeResult);

      const result = await reverseGeocodeCoordinates([4.3517, 50.8503]);

      expect(mockGoogleClient.reverseGeocode).toHaveBeenCalledWith({
        params: {
          latlng: '50.8503,4.3517',
          key: 'test-api-key'
        }
      });

      expect(result).toBe('Rue de la Loi 200, 1000 Brussels, Belgium');
    });

    it('should handle reverse geocoding failures gracefully', async () => {
      mockGoogleClient.reverseGeocode.mockResolvedValue({
        json: {
          results: [],
          status: 'ZERO_RESULTS'
        }
      });

      const result = await reverseGeocodeCoordinates([0, 0]);
      expect(result).toBeNull();
    });

    it('should validate input coordinates', async () => {
      await expect(reverseGeocodeCoordinates(null as any)).rejects.toThrow('Coordinates are required');
      await expect(reverseGeocodeCoordinates([])).rejects.toThrow('Coordinates must be an array of [lng, lat]');
      await expect(reverseGeocodeCoordinates([1])).rejects.toThrow('Coordinates must be an array of [lng, lat]');
      await expect(reverseGeocodeCoordinates([181, 0])).rejects.toThrow('Invalid longitude: must be between -180 and 180');
      await expect(reverseGeocodeCoordinates([0, 91])).rejects.toThrow('Invalid latitude: must be between -90 and 90');
    });
  });

  describe('Address Search/Autocomplete', () => {
    it('should successfully search addresses and return suggestions', async () => {
      mockGoogleClient.placeAutocomplete.mockResolvedValue(mockAutocompleteResult);
      // Mock the geocoding call for each place prediction
      mockGoogleClient.geocode.mockResolvedValueOnce(mockGeocodeResult);
      mockGoogleClient.geocode.mockResolvedValueOnce({
        json: {
          results: [
            {
              formatted_address: 'Brussels Airport, Zaventem, Belgium',
              geometry: {
                location: {
                  lat: 50.9014,
                  lng: 4.4844
                }
              }
            }
          ],
          status: 'OK'
        }
      });

      const results = await searchAddresses('Brussels');

      expect(mockGoogleClient.placeAutocomplete).toHaveBeenCalledWith({
        params: {
          input: 'Brussels',
          key: 'test-api-key',
          types: 'address'
        }
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        address: 'Brussels, Belgium',
        placeId: 'ChIJOXnm4hRuYA0RIxbZd5d5b5f',
        coordinates: [4.3517, 50.8503],
        confidence: 1.0
      });
    });

    it('should handle empty search results', async () => {
      mockGoogleClient.placeAutocomplete.mockResolvedValue({
        json: {
          predictions: [],
          status: 'ZERO_RESULTS'
        }
      });

      const results = await searchAddresses('NonexistentPlace123');
      expect(results).toEqual([]);
    });

    it('should validate search input', async () => {
      const results = await searchAddresses('');
      expect(results).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockGoogleClient.placeAutocomplete.mockRejectedValue(new Error('API quota exceeded'));

      await expect(searchAddresses('Brussels')).rejects.toThrow('API quota exceeded');
    });
  });

  describe('API Key Configuration', () => {
    it('should throw error when API key is missing', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY;

      await expect(geocodeAddress('Brussels, Belgium')).rejects.toThrow('Google Maps API key is required');
    });

    it('should throw error when API key is empty', async () => {
      process.env.GOOGLE_MAPS_API_KEY = '';

      await expect(geocodeAddress('Brussels, Belgium')).rejects.toThrow('Google Maps API key is required');
    });
  });

  describe('Rate Limiting and Error Handling', () => {
    it('should handle OVER_QUERY_LIMIT errors', async () => {
      mockGoogleClient.geocode.mockResolvedValue({
        json: {
          results: [],
          status: 'OVER_QUERY_LIMIT',
          error_message: 'You have exceeded your daily request quota for this API.'
        }
      });

      await expect(geocodeAddress('Brussels, Belgium')).rejects.toThrow('You have exceeded your daily request quota for this API.');
    });

    it('should handle REQUEST_DENIED errors', async () => {
      mockGoogleClient.geocode.mockResolvedValue({
        json: {
          results: [],
          status: 'REQUEST_DENIED',
          error_message: 'This API project is not authorized to use this API.'
        }
      });

      await expect(geocodeAddress('Brussels, Belgium')).rejects.toThrow('This API project is not authorized to use this API.');
    });

    it('should handle INVALID_REQUEST errors', async () => {
      mockGoogleClient.geocode.mockResolvedValue({
        json: {
          results: [],
          status: 'INVALID_REQUEST',
          error_message: 'Invalid request. Missing the address or latlng parameter.'
        }
      });

      await expect(geocodeAddress('Brussels, Belgium')).rejects.toThrow('Invalid request. Missing the address or latlng parameter.');
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain compatibility with existing forwardGeocode function', async () => {
      mockGoogleClient.geocode.mockResolvedValue(mockGeocodeResult);

      // Import the old function name that existing code might use
      const { forwardGeocode } = await import('@/lib/geocoding');
      const result = await forwardGeocode('Brussels, Belgium');

      expect(result).toEqual([4.3517, 50.8503]);
    });

    it('should maintain compatibility with existing reverseGeocode function', async () => {
      mockGoogleClient.reverseGeocode.mockResolvedValue(mockReverseGeocodeResult);

      // Import the old function name that existing code might use
      const { reverseGeocode } = await import('@/lib/geocoding');
      const result = await reverseGeocode([4.3517, 50.8503]);

      expect(result).toBe('Rue de la Loi 200, 1000 Brussels, Belgium');
    });

    it('should maintain compatibility with existing getCoordinatesFromAddress function', async () => {
      mockGoogleClient.geocode.mockResolvedValue(mockGeocodeResult);

      // Import the old function name that existing code might use
      const { getCoordinatesFromAddress } = await import('@/lib/geocoding');
      const result = await getCoordinatesFromAddress('Brussels, Belgium');

      expect(result).toEqual([4.3517, 50.8503]);
    });

    it('should maintain compatibility with existing getAddressFromCoordinates function', async () => {
      mockGoogleClient.reverseGeocode.mockResolvedValue(mockReverseGeocodeResult);

      // Import the old function name that existing code might use
      const { getAddressFromCoordinates } = await import('@/lib/geocoding');
      const result = await getAddressFromCoordinates([4.3517, 50.8503]);

      expect(result).toBe('Rue de la Loi 200, 1000 Brussels, Belgium');
    });
  });
});