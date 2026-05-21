export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-white text-2xl font-bold">ETSCRM</span>
          </div>
          <p className="text-slate-400 mt-2 text-sm">Professional Real Estate CRM</p>
        </div>

        <div className="space-y-6">
          <blockquote className="text-white text-2xl font-semibold leading-relaxed">
            "The best CRM platform for Indian real estate professionals. Manage leads, close deals, and grow your business."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold">R</div>
            <div>
              <p className="text-white font-medium">Rajesh Sharma</p>
              <p className="text-slate-400 text-sm">Top Real Estate Agent, Mumbai</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Users", value: "2,400+" },
            { label: "Deals Closed", value: "₹850Cr+" },
            { label: "Cities", value: "50+" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-800 rounded-xl p-4">
              <p className="text-white text-xl font-bold">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
