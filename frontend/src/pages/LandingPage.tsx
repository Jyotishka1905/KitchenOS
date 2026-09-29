import { useEffect, useState } from "react";
import "../styles/globals.css";

type AnimatedTextProps = {
  text: string;
  className?: string;
  startDelay: number;
  letterDelay: number;
};

type KitchenObjectProps = {
  className: string;
  type: 'leaf' | 'tomato' | 'spoon' | 'carrot' | 'pan' | 'book';
  alt: string;
};

type LandingPageProps = {
  onGetStarted: () => void;
};

function AnimatedText({
  text,
  className = "",
  startDelay,
  letterDelay,
}: AnimatedTextProps) {
  return (
    <div className={className} aria-label={text}>
      {text.split("").map((letter, index) => (
        <span
          key={`${text}-${index}`}
          className="kos-letter"
          style={{
            animationDelay: `${startDelay + index * letterDelay}s`,
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </div>
  );
}

// Inline SVG Vector Illustrations replacing external image paths
function KitchenObjectSvg({ type }: { type: KitchenObjectProps['type'] }) {
  switch (type) {
    case 'leaf':
      return (
        <svg viewBox="0 0 64 64" className="kos-object w-12 h-12 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 8C32 8 52 16 52 36C52 48 40 56 32 56C24 56 12 48 12 36C12 16 32 8 32 8Z" fill="#7C9A66" stroke="#4A3525" strokeWidth="2.5"/>
          <path d="M32 16V48" stroke="#4A3525" strokeWidth="2" strokeLinecap="round"/>
          <path d="M32 24C26 26 20 32 18 36" stroke="#4A3525" strokeWidth="2" strokeLinecap="round"/>
          <path d="M32 34C38 36 44 40 46 44" stroke="#4A3525" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'tomato':
      return (
        <svg viewBox="0 0 64 64" className="kos-object w-12 h-12 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="36" r="18" fill="#D9534F" stroke="#4A3525" strokeWidth="2.5"/>
          <path d="M26 18C28 14 32 12 36 12C40 12 42 16 42 16" stroke="#4A3525" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M32 14V22" stroke="#5C7A48" strokeWidth="3" strokeLinecap="round"/>
          <path d="M26 18L32 22L38 18" stroke="#5C7A48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'spoon':
      return (
        <svg viewBox="0 0 64 64" className="kos-object w-12 h-12 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 12C23 12 18 18 18 25C18 31 23 35 28 37V52H36V37C41 35 46 31 46 25C46 18 41 12 32 12Z" fill="#E8D5C4" stroke="#4A3525" strokeWidth="2.5"/>
          <path d="M32 37V56" stroke="#4A3525" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      );
    case 'carrot':
      return (
        <svg viewBox="0 0 64 64" className="kos-object w-12 h-12 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 18L44 42L36 50L12 26L20 18Z" fill="#E8833A" stroke="#4A3525" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d="M44 14C44 14 48 8 54 8C54 14 48 18 44 18Z" fill="#7C9A66" stroke="#4A3525" strokeWidth="2"/>
          <path d="M42 18C42 18 44 12 50 10" stroke="#7C9A66" strokeWidth="2" strokeLinecap="round"/>
          <path d="M26 34L30 38" stroke="#C46110" strokeWidth="2" strokeLinecap="round"/>
          <path d="M32 40L36 44" stroke="#C46110" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'pan':
      return (
        <svg viewBox="0 0 64 64" className="kos-object w-12 h-12 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="34" r="16" fill="#4A3525" stroke="#332215" strokeWidth="2"/>
          <circle cx="28" cy="34" r="12" fill="#E8D5C4"/>
          <path d="M40 30L56 22C58 21 60 23 58 25L42 33" stroke="#4A3525" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 64 64" className="kos-object w-12 h-12 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 16C16 16 23 14 32 18C41 14 48 16 48 16V48C48 48 41 46 32 50C23 46 16 48 16 48V16Z" fill="#D97757" stroke="#4A3525" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d="M32 18V50" stroke="#4A3525" strokeWidth="2.5"/>
          <path d="M20 24H26" stroke="#FFF9F5" strokeWidth="2" strokeLinecap="round"/>
          <path d="M38 24H44" stroke="#FFF9F5" strokeWidth="2" strokeLinecap="round"/>
          <path d="M20 30H26" stroke="#FFF9F5" strokeWidth="2" strokeLinecap="round"/>
          <path d="M38 30H44" stroke="#FFF9F5" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
  }
}

function KitchenObject({
  className,
  type,
  alt,
}: KitchenObjectProps) {
  return (
    <div className={`kos-orbit ${className}`} aria-hidden="true">
      <div className="kos-object-wrapper" title={alt}>
        <KitchenObjectSvg type={type} />
      </div>
    </div>
  );
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnimationDone(true);
    }, 3800);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="kos-page">
      <section
        className={`kos-hero ${
          animationDone ? "kos-animation-done" : ""
        }`}
      >
        {/* BACKGROUND */}

        <img
          className="kos-kitchen-image"
          src="/images/kitchen-hero.png"
          alt="Illustrated modern kitchen"
          draggable={false}
        />

        <div
          className="kos-overlay"
          aria-hidden="true"
        />

        {/* TEXT */}

        <div className="kos-welcome">

          <AnimatedText
            text="Welcome"
            className="kos-welcome-word"
            startDelay={0.3}
            letterDelay={0.1}
          />

          <AnimatedText
            text="to"
            className="kos-to-word"
            startDelay={1.35}
            letterDelay={0.2}
          />

          <AnimatedText
            text="KitchenOS"
            className="kos-name-word"
            startDelay={1.85}
            letterDelay={0.12}
          />

          {/* GET STARTED */}

          <button
            type="button"
            className="kos-get-started"
            onClick={onGetStarted}
          >
            Get Started
          </button>

        </div>

        {/* OBJECTS */}

        <KitchenObject
          className="kos-orbit-1"
          type="leaf"
          alt="Leaf"
        />

        <KitchenObject
          className="kos-orbit-2"
          type="tomato"
          alt="Tomato"
        />

        <KitchenObject
          className="kos-orbit-3"
          type="spoon"
          alt="Spoon"
        />

        <KitchenObject
          className="kos-orbit-4"
          type="carrot"
          alt="Carrot"
        />

        <KitchenObject
          className="kos-orbit-5"
          type="pan"
          alt="Pan"
        />

        <KitchenObject
          className="kos-orbit-6"
          type="book"
          alt="Book"
        />

      </section>
    </main>
  );
}