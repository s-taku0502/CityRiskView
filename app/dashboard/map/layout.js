export const metadata = {
  title: 'map | CityRiskView',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}