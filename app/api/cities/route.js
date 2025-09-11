export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prefName = searchParams.get('pref');
  if (!prefName) {
    return Response.json({ error: 'prefName is missing', cities: [] }, { status: 400 });
  }
  const baseApiUrl = process.env.NEXT_PUBLIC_JAPAN_CITIES_API_ENDPOINT;
  if (!baseApiUrl) {
    console.error('NEXT_PUBLIC_JAPAN_CITIES_API_ENDPOINT is not set');
    return Response.json({ error: 'Server configuration error', cities: [] }, { status: 500 });
  }
  const apiUrl = `${baseApiUrl}?prefecture=${encodeURIComponent(prefName)}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errorText = await res.text();
      return Response.json({ error: errorText, cities: [] }, { status: res.status });
    }
    const data = await res.json();
    return Response.json({ cities: data });
  } catch (error) {
    return Response.json({ error: error.message, cities: [] }, { status: 500 });
  }
}