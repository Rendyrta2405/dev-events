import {Suspense} from "react";
import EventDetails from "@/components/EventDetails";

const EventDetailsPage = async (
   { params }: { params: Promise<{ slug: string }> }
) => {
   // const slug = params.then((p) => p.slug);
   // const { slug } = await params;
   
   return (
      <main>
         <Suspense fallback={<div>Loading...</div>}>
            <EventDetails params={params} />
         </Suspense>
      </main>
   )
}
export default EventDetailsPage