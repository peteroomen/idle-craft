import express from 'express';
import { authenticatedUser } from './middleware/authenticatedUser';
import { auth } from './routes/auth.route';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

let PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is up and running on ${PORT} ...`);
});

auth(app);

app.get("/skills", (req, res) => {
    res.send("GET Request Called")
});
app.get("/characters", authenticatedUser, (req, res) => {
    res.send("Authenticated GET Request Called")
});