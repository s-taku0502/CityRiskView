export async function fetchCitiesByPref(prefName) {
  const res = await fetch(`/api/cities?pref=${encodeURIComponent(prefName)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.cities || [];
}