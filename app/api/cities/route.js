export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prefName = searchParams.get('pref');
  if (!prefName) {
    return Response.json({ error: 'prefName is missing', cities: [] }, { status: 400 });
  }
  const apiUrl = `https://japan-pref-city-api.vercel.app/api/municipalities?prefecture=${encodeURIComponent(prefName)}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errorText = await res.text();
      return Response.json({ error: errorText, cities: [] }, { status: 500 });
    }
    const data = await res.json();
    return Response.json({ cities: data });
  } catch (error) {
    return Response.json({ error: error.message, cities: [] }, { status: 500 });
  }
}