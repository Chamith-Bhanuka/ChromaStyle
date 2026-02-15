import axios from 'axios';
import { WardrobeItem } from '@/store/wardrobeStore';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const getAISuggestedWeek = async (
  items: WardrobeItem[],
  weekDates: string[]
) => {
  // 1. Construct the wardrobe context
  const wardrobeDescription = items
    .map((item) => `${item.id} available in colors: ${item.colors.join(', ')}`)
    .join('\n');

  // 2. Define the exact prompt text
  const text = `
    I have a digital wardrobe:
    ${wardrobeDescription}

    Plan a stylish outfit for each date: ${weekDates.join(', ')}.
    Pick one 'top', one 'bottom', and one 'footwear' from available items.
    Ensure colors match aesthetically.

    Return ONLY raw JSON. No markdown.
    Format:
    {
      "YYYY-MM-DD": {
        "top": { "id": "shirt", "color": "#hexcode" },
        "bottom": { "id": "trousers", "color": "#hexcode" },
        "footwear": { "id": "sneakers", "color": "#hexcode" }
      }
    }
  `;

  try {
    // 3. Match your Express example's structure
    const aiResponse = await axios.post(
      BASE_URL,
      {
        contents: [
          {
            parts: [{ text }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1000, // Increased to ensure full JSON isn't cut off
          response_mime_type: 'application/json',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': API_KEY, // Key moved to headers per your example
        },
      }
    );

    // 4. Extract content using the logic from your example
    const generatedContent =
      aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      aiResponse.data?.candidates?.[0]?.content?.[0]?.text ||
      'No data';

    if (generatedContent === 'No data')
      throw new Error('AI returned no content');

    return JSON.parse(generatedContent);
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw error;
  }
};
