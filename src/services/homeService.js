// src/services/homeService.js
import { authedFetch } from '../api/client';

export async function loadHomepageSlides() {


  try {
    const response = await authedFetch("/home/slides");



    const json = await response.json();
    console.log("📡 [homeService] Parsed JSON:", json);

    if (!json || !json.success) {

      return [];
    }

    if (!json.slides || json.slides.length === 0) {
      console.warn("📡 [homeService] slides array empty:", json.slides);
      return [];
    }

    return json.slides;

  } catch (err) {
    console.error("❌ [homeService] Error loading slides:", err);
    return [];
  }
}