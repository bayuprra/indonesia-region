import { httpServerHandler } from 'cloudflare:node';
import appModule from './app.js';

const { createApp } = appModule;
const app = createApp();

app.listen(3000);

export default httpServerHandler({ port: 3000 });
