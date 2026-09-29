interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="group rounded-[20px] border border-[#54200f]/30 bg-[#f8eed9] p-6 text-center shadow-[0_5px_15px_rgba(59,23,12,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(59,23,12,0.14)]">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center text-[#b94f27]">
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-[#54200f]">
        {title}
      </h3>

      <p className="mt-2 text-[#704329]">
        {description}
      </p>

      <div className="mt-3 text-[#b94f27] transition-transform group-hover:translate-x-1">
        →
      </div>
    </article>
  )
}

export default FeatureCard