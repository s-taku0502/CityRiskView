export async function fetchCitiesByPref(prefName) {
  try {
    const res = await fetch(`/api/cities?pref=${encodeURIComponent(prefName)}`);
    if (!res.ok) {
      console.error(`Failed to fetch cities for ${prefName}: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.cities || [];
  } catch (error) {
    console.error('An error occurred while fetching cities:', error);
    return [];
  }
}