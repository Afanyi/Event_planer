const request = require('supertest');
import { createApp } from '../../src/app';

export const app = createApp();
export const api = () => request(app);
