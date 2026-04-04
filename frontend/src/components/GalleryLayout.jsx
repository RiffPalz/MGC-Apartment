/* eslint-disable react-hooks/static-components */
import { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function GalleryLayout({ items }) {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 1200, once: true });
  }, []);

  const findSlot = (slot) => items.find((it) => it.slot === slot) || null;

  const Card = ({ item, className, aosType = "fade-up" }) => {
    if (!item)
      return <div className={`bg-slate-100 rounded-2xl ${className}`} />;
    return (
      <div
        data-aos={aosType}
        onClick={() => setSelectedImage(item)}
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer group ${className}`}
      >
        <img
          src={item.src}
          alt={item.caption}
          className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110"
        />
        {/* Deep Slate Overlay with Blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>

        {/* Caption Section */}
        <div className="absolute bottom-6 left-6 right-6 transform transition-transform duration-500 group-hover:-translate-y-2">
          <p className="text-[#db6747] text-[10px] font-bold uppercase tracking-[3px] mb-1 opacity-0 group-hover:opacity-100 transition-all duration-700">
            Property View
          </p>
          <h3 className="text-white text-lg sm:text-xl font-OswaldRegular uppercase tracking-widest leading-tight">
            {item.caption}
          </h3>
          <div className="w-0 group-hover:w-12 h-1 bg-[#db6747] mt-3 transition-all duration-700 rounded-full" />
        </div>

        {/* Hover Badge */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
          <span className="text-white text-[10px] font-bold uppercase tracking-[3px] px-8 py-3 border border-white/20 rounded-xl backdrop-blur-md bg-white/10 shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500">
            Expand View
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

          {/* LEFT COLUMN STACK */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6">
            <Card
              item={findSlot("left1")}
              className="h-[350px] lg:h-[480px]"
              aosType="fade-right"
            />

            <div className="grid grid-cols-2 gap-4 lg:gap-6 h-[160px] lg:h-[220px]">
              <Card
                item={findSlot("left2")}
                className="h-full"
                aosType="fade-up"
              />
              <Card
                item={findSlot("left3")}
                className="h-full"
                aosType="fade-up"
              />
            </div>
          </div>

          {/* RIGHT COLUMN STACK */}
          <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-6 lg:h-[726px]">
            <Card
              item={findSlot("rightTop")}
              className="h-[220px] lg:h-[250px]"
              aosType="fade-down"
            />
            <Card
              item={findSlot("rightLarge")}
              className="flex-1 min-h-[380px] lg:min-h-0"
              aosType="fade-left"
            />
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors bg-white/5 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-90">
            ✕
          </button>

          <div
            className="relative max-w-5xl w-full flex flex-col items-center animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Signature Top Bar in Modal */}
            <div className="w-full max-w-4xl h-1.5 bg-[#db6747] rounded-t-full mb-0 shadow-[0_0_20px_rgba(219,103,71,0.3)]" />

            <img
              src={selectedImage.src}
              className="w-full max-h-[70vh] object-contain rounded-b-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/5"
              alt="Expanded view"
            />

            <div className="text-center mt-10">
              <h2 className="text-[#db6747] font-OswaldRegular text-4xl sm:text-5xl uppercase tracking-[8px] drop-shadow-md">
                {selectedImage.caption}
              </h2>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="h-px w-8 bg-white/20" />
                <p className="text-white/40 font-bold uppercase tracking-[4px] text-[10px]">
                  MGC Building Gallery
                </p>
                <div className="h-px w-8 bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}