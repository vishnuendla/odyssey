import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables. Please add it to your .env file.');
  throw new Error('GEMINI_API_KEY is required for geocoding functionality');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getCoordinatesFromPlaceName = async (placeName: string) => {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `You are a geocoding service. Given the place name "${placeName}", provide the latitude and longitude coordinates.
    Important rules:
    1. Return ONLY a JSON object in this exact format:
    {
      "latitude": number,
      "longitude": number
    }
    2. Use decimal degrees format for coordinates
    3. If the place is not found or ambiguous, return null
    4. For major cities, use their central coordinates
    5. For countries, use their capital city coordinates
    6. Ensure coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
    
    Example valid response for "London":
    {
      "latitude": 51.5074,
      "longitude": -0.1278
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Clean the response text to ensure it's valid JSON
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const coordinates = JSON.parse(cleanText);
      
      if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        console.error('Invalid coordinates format:', coordinates);
        return null;
      }

      // Validate coordinate ranges
      if (coordinates.latitude < -90 || coordinates.latitude > 90 || 
          coordinates.longitude < -180 || coordinates.longitude > 180) {
        console.error('Coordinates out of valid range:', coordinates);
        return null;
      }

      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        placeName: placeName
      };
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  } catch (error: any) {
    console.error('Error getting coordinates:', error);
    if (error.message?.includes('API_KEY_INVALID')) {
      console.error('Invalid Gemini API key. Please check your .env file and ensure VITE_GEMINI_API_KEY is set correctly.');
    }
    return null;
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 