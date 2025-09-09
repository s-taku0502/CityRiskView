export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prefName = searchParams.get('pref');
  const apiUrl = `https://japan-pref-city-api.vercel.app/api/pref/${encodeURIComponent(prefName)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    return Response.json({ cities: [] }, { status: 500 });
  }
  const data = await res.json();
  return Response.json(data);
}