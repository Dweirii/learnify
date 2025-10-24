export const VerifiedMark = () => {
  return (
    <div className="relative">
      {/* Outer ring */}
      <div className="h-4 w-4 rounded-full border-2 border-[#0FA84E] animate-spin" style={{animationDuration: '3s'}}></div>
      
      {/* Inner checkmark */}
      <div className="absolute inset-0 h-4 w-4 rounded-full bg-[#0FA84E] flex items-center justify-center">
        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      
      {/* Glowing dots */}
      <div className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-[#0FA84E] rounded-full animate-pulse"></div>
      <div className="absolute -bottom-1 -left-1 h-1 w-1 bg-[#0FA84E] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
    </div>
  )
}