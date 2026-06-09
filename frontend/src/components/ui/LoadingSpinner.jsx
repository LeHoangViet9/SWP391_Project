export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="w-8 h-8 border-2 border-[#bfa15f] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
