import Image from "next/image";
import React from "react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel (Hidden on Mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-end bg-black lg:flex">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 z-10" />
        
        {/* Background Image */}
        <Image
          src="/truck.jpg"
          alt="Fleet logistics"
          fill
          className="object-cover"
          priority
        />
        
        {/* Text Content */}
        <div className="relative z-20 p-12 lg:p-16">
          <h1 className="text-[36px] font-semibold text-white mb-4">
            FleetOps
          </h1>
          <p className="text-[24px] font-medium text-white mb-2 max-w-md leading-tight">
            Smart Fleet Operations Platform
          </p>
          <p className="text-[16px] text-white/80 max-w-sm">
            Built for fleet managers, dispatchers and operations teams.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 md:px-16 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
