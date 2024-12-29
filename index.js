import 'dotenv/config'
import cors from "cors"
import { app, server } from "./socket.js"

const corsOptions = {
    origin: process.env.FRONTEND_URI,
    credentials: true,
};

app.use(cors(corsOptions));

server.listen(process.env.PORT, async () => {
    console.log(`Backend is Live 🎉🎉`)
})