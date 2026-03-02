"use client";

export default function OpenInLinePage() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      <div className="flex flex-col items-center pt-12 px-6 pb-6 max-w-lg mx-auto">
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-0 text-center">
            <div className="relative w-48 h-48 min-h-[192px] mx-auto mb-4 flex items-center justify-center">
              {/* Plain img so the image loads in LINE/external browser without Next image optimization */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/open-in-line-hero.png"
                alt=""
                width={192}
                height={192}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A] mb-2">
              ขออภัย กรุณาเปิดใน line ของมือถือน้าา~
            </h1>
          </div>
          <div className="px-6 pb-6">
            <p className="text-[#0F172A]/80 text-center text-base leading-relaxed">
              หน้านี้เปิดได้ในแอป LINE บนมือถือเท่านั้น กรุณาเปิดลิงก์จากแชท LINE อีกครั้ง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
