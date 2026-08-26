import {NextRequest, NextResponse} from "next/server";
import { v2 as cloudinary } from 'cloudinary';

import connectToDatabase from "@/lib/mongodb";
import { Event } from '@/database/event.model';

function parseFormArray(formData: FormData, name: string): string[] {
    const values = formData.getAll(name).length > 0
        ? formData.getAll(name)
        : formData.getAll(`${name}[]`);
    const textValues = values.filter((value): value is string => typeof value === "string");

    if (textValues.length === 0) {
        return [];
    }

    if (textValues.length === 1 && textValues[0].trim().startsWith("[")) {
        try {
            const parsed: unknown = JSON.parse(textValues[0]);
            if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
                return parsed;
            }
        } catch {
            throw new Error(`${name} must be valid JSON or form values`);
        }
    }

    return textValues.flatMap((value) => value.split(/\r?\n/)).map((value) => value.trim());
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('image');

        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
        }

        let tags: string[];
        let agenda: string[];
        try {
            tags = parseFormArray(formData, 'tags');
            agenda = parseFormArray(formData, 'agenda');
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Invalid array data' },
                { status: 400 },
            );
        }

        if (tags.length === 0 || agenda.length === 0 ||
            tags.some((tag) => tag.trim() === '') || agenda.some((item) => item.trim() === '')) {
            return NextResponse.json(
                { message: 'Tags and agenda must contain at least one non-empty item' },
                { status: 400 },
            );
        }

        const event = {
            title: formData.get('title'),
            description: formData.get('description'),
            overview: formData.get('overview'),
            venue: formData.get('venue'),
            location: formData.get('location'),
            date: formData.get('date'),
            time: formData.get('time'),
            mode: formData.get('mode'),
            audience: formData.get('audience'),
            organizer: formData.get('organizer'),
            tags,
            agenda,
        };

        if (Object.values(event).some((value) =>
            typeof value === 'string' ? value.trim() === '' : value === null
        )) {
            return NextResponse.json({ message: 'All event fields are required' }, { status: 400 });
        }

        const cloudinaryConfig = process.env.CLOUDINARY_URL
            ? cloudinary.config()
            : cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });

        if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
            throw new Error('Cloudinary configuration is missing');
        }

        await connectToDatabase();

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if(error) return reject(error);

                resolve(results);
            }).end(buffer);
        });

        const image = (uploadResult as { secure_url?: string }).secure_url;
        if (!image) {
            throw new Error('Cloudinary did not return an image URL');
        }

        const createdEvent = await Event.create({ ...event, image });

        return NextResponse.json({ message: 'Event created successfully', event: createdEvent }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown'}, { status: 500 })
    }
}

export async function GET() {
    try {
        await connectToDatabase();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message: 'Event fetching failed', error: e }, { status: 500 });
    }
}