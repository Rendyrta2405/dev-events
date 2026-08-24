'use client';
import Image from "next/image"
import posthog from "posthog-js"

const ExploreBtn = () => {
   const handleExplore = () => {
      if (
         process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
         process.env.NEXT_PUBLIC_POSTHOG_HOST
      ) {
         posthog.capture("events_explored")
      }
   }

   return (
      <button type="button" id="explore-btn" className="mt-7 mx-auto"
         onClick={handleExplore}>
         <a href="#events">
            Explore Events
            <Image src="/icons/arrow-down.svg" alt="arrow-down"
               height={24} width={24} />
         </a>
      </button>
   )
}

export default ExploreBtn