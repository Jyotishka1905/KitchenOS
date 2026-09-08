import { ArrowRight, CalendarDays, NotebookPen, Package } from 'lucide-react'
import HeroSphereCanvas from './HeroSphereCanvas'

function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden px-4 pb-10 pt-8 sm:px-6 lg:px-10 lg:pb-16 lg:pt-12"
    >
      <div className="mx-auto grid max-w-[1450px] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-0">

        {/* LEFT */}
        <div className="relative z-20 px-2 py-8 sm:px-6 lg:px-10 lg:py-16">

          <p className="mb-4 text-lg font-semibold text-[#637a35] sm:text-xl">
            Welcome to KitchenOS
          </p>

          <h1 className="max-w-[650px] text-[clamp(3.5rem,7vw,6.8rem)] font-black leading-[0.9] tracking-[-0.04em] text-[#54200f]">
            Your Kitchen,
            <br />
            <span className="text-[#3b170c]">
              Smarter.
            </span>
          </h1>

          <p className="mt-7 max-w-[560px] text-lg leading-8 text-[#704329] sm:text-xl">
            Plan meals. Discover recipes.
            <br />
            Keep your pantry in check.
            <br />
            All from one cozy kitchen space.
          </p>

          <a
            href="#start"
            className="mt-8 inline-flex items-center gap-3 rounded-[16px] bg-[#b94f27] px-7 py-4 text-lg font-bold text-[#fff8e8] shadow-[0_8px_18px_rgba(59,23,12,0.2)] transition-all hover:-translate-y-1 hover:bg-[#a94420]"
          >
            Start Your KitchenOS
            <ArrowRight size={21} />
          </a>

          {/* Mini features */}
          <div className="mt-9 flex flex-wrap gap-5 text-[#54200f]">

            <div className="flex items-center gap-2">
              <NotebookPen size={25} strokeWidth={1.7} />
              <span className="text-sm">
                Curated
                <br />
                Recipes
              </span>
            </div>

            <div className="h-10 w-px bg-[#54200f]/25" />

            <div className="flex items-center gap-2">
              <Package size={25} strokeWidth={1.7} />
              <span className="text-sm">
                Smart
                <br />
                Pantry
              </span>
            </div>

            <div className="h-10 w-px bg-[#54200f]/25" />

            <div className="flex items-center gap-2">
              <CalendarDays size={25} strokeWidth={1.7} />
              <span className="text-sm">
                Meal
                <br />
                Planning
              </span>
            </div>

          </div>
        </div>

        {/* RIGHT — Kitchen illustration + 3D */}
        <div className="relative min-h-[430px] overflow-hidden rounded-[28px] lg:min-h-[650px] lg:rounded-l-[45px] lg:rounded-r-none">

          <img
            src="/images/kitchen-hero.png"
            alt="Cozy illustrated KitchenOS kitchen"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Soft overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4e6c9]/40 via-transparent to-transparent" />

          {/* 3D layer */}
          <div className="absolute inset-0">
            <HeroSphereCanvas />
          </div>

        </div>
      </div>
    </section>
  )
}

export default Hero