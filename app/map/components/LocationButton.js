export default function LocationButton({ onClick }) {
  return (
    console.log("LocationButton components is here"),
    <button
      onClick={onClick}
      className="absolute bottom-8 right-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg z-10 flex items-center gap-2"
      aria-label="現在地を取得"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
      現在地を再取得
    </button>
  );
  // console.log("LocationButton is here")
}