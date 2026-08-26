import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent} from "@/database";
import {cacheLife} from "next/cache"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async () => {
    'use cache';
    cacheLife('hours');

   let events: IEvent[] = [];
   
   try {
       const response = await fetch(`${BASE_URL}/api/events`);
      
       if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
       }

      const data = await response.json();
      
      events = data?.events || [];
   } catch (error) {
       console.error('Error fetching events:', error.message);
    
       return []; 
   }

   

    return (
        <section>
+            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can&apos;t Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

               <ul className="events">
                    {events && events.length > 0 && 
                       events.map((event: IEvent) => (
                        <li key={event.title} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default Page;