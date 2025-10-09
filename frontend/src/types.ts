export type ID = string;
export type Tag = { _id: ID; name: string; color: string };
export type Participant = { _id: ID; name: string; email: string };
export type Event = {
    _id: ID;
    title: string;
    description?: string;
    location?: string;
    date: string;
    imageUrl?: string;
    tags: Tag[];
    participants: Participant[];
};
