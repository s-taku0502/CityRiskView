export const metadata = {
  title: 'CityRiskView',
};

export default function MapTemplate({ children }) {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-2 mx-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}