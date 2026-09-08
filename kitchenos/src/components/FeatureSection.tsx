import {
  CalendarDays,
  ChefHat,
  Lightbulb,
  Package,
} from 'lucide-react'

import FeatureCard from './FeatureCard'

function FeatureSection() {
  return (
    <section
      id="features"
      className="border-t border-[#54200f]/10 px-4 py-14 sm:px-6 lg:px-10 lg:py-20"
    >
      <div className="mx-auto max-w-[1400px]">

        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-[#54200f] sm:text-4xl lg:text-5xl">
            ❦ Everything You Need in Your Kitchen ❦
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <FeatureCard
            icon={<ChefHat size={52} strokeWidth={1.3} />}
            title="Delicious Recipes"
            description="Handpicked meals for every mood and moment."
          />

          <FeatureCard
            icon={<Package size={52} strokeWidth={1.3} />}
            title="Pantry Tracker"
            description="Keep track of what you have, so you waste less."
          />

          <FeatureCard
            icon={<CalendarDays size={52} strokeWidth={1.3} />}
            title="Meal Planner"
            description="Plan your week with ease and confidence."
          />

          <FeatureCard
            icon={<Lightbulb size={52} strokeWidth={1.3} />}
            title="Kitchen Tips"
            description="Little hacks for a happier cooking experience."
          />

        </div>

        <div className="mt-8 text-center">
          <p className="text-2xl italic text-[#704329]">
            A Better Kitchen, A Better You
          </p>
        </div>

      </div>
    </section>
  )
}

export default FeatureSection