import { ArrowRight, Menu, Soup } from 'lucide-react'
import { useState } from 'react'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="relative z-50 px-3 pt-3 sm:px-5 sm:pt-5">
      <nav className="mx-auto max-w-[1450px] rounded-[22px] border border-[#54200f]/40 bg-[#f8eed9]/95 px-5 py-3 shadow-[0_5px_20px_rgba(59,23,12,0.12)] backdrop-blur-md">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <a
            href="#home"
            className="flex items-center gap-3 text-[#54200f]"
          >
            <div className="relative flex h-10 w-10 items-center justify-center">
              <Soup size={32} strokeWidth={2.2} />

              <span className="absolute -top-2 left-3 text-sm">
                ♨
              </span>
            </div>

            <span className="text-2xl font-bold tracking-tight sm:text-3xl">
              KitchenOS
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className="relative py-2 text-[17px] text-[#54200f]"
            >
              Home
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#b94f27]" />
            </a>

            <a
              href="#recipes"
              className="py-2 text-[17px] text-[#54200f] transition-opacity hover:opacity-60"
            >
              Recipes
            </a>

            <a
              href="#pantry"
              className="py-2 text-[17px] text-[#54200f] transition-opacity hover:opacity-60"
            >
              Pantry
            </a>

            <a
              href="#planner"
              className="py-2 text-[17px] text-[#54200f] transition-opacity hover:opacity-60"
            >
              Meal Planner
            </a>

            <a
              href="#about"
              className="py-2 text-[17px] text-[#54200f] transition-opacity hover:opacity-60"
            >
              About
            </a>
          </div>

          {/* Desktop CTA */}
          <a
            href="#start"
            className="hidden items-center gap-2 rounded-[14px] bg-[#b94f27] px-6 py-3 font-semibold text-[#fff8e8] shadow-[0_5px_12px_rgba(59,23,12,0.18)] transition-transform hover:-translate-y-0.5 md:flex"
          >
            Get Started
            <ArrowRight size={18} />
          </a>

          {/* Mobile Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#54200f]/20 text-[#54200f] md:hidden"
            aria-label="Toggle navigation"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="mt-4 border-t border-[#54200f]/15 pt-4 md:hidden">
            <div className="flex flex-col gap-1">

              {['Home', 'Recipes', 'Pantry', 'Meal Planner', 'About'].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-[#54200f] hover:bg-[#54200f]/5"
                  >
                    {item}
                  </a>
                ),
              )}

              <a
                href="#start"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#b94f27] px-4 py-3 font-semibold text-[#fff8e8]"
              >
                Get Started
                <ArrowRight size={18} />
              </a>

            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar