// src/types.ts
export type Id = string;

export type CreateEventDTO = {
    title: string;
    description?: string;
    location: string;
    date: string | Date;
    imageUrl?: string;
    tags?: string[];         // ObjectId strings
    participants?: string[]; // ObjectId strings
};

export type UpdateEventDTO = Partial<CreateEventDTO>;
