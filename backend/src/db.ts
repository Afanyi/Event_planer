import mongoose from 'mongoose';
export async function connect(mongoUri: string) { await mongoose.connect(mongoUri); }
