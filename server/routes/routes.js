import { Router } from "express";

//Routes
import userRoutes from "./userRoutes.js";


//MiddleWare
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = Router();
router.get("/", (req, res) => {
    res.json("404 Not Found");
});

router.use(userRoutes);



router.get("/getstorage", authenticateToken, (req, res) => {
    const urlImages = `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/resources/image`;
    const urlVideos = `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/resources/video`;

    const apiKey = process.env.CLOUD_API_KEY;
    const apiSecret = process.env.CLOUD_API_SECRET;

    const headers = {
        Authorization: `Basic ${Buffer.from(apiKey + ":" + apiSecret).toString(
            "base64"
        )}`,
    };

    Promise.all([
        fetch(urlImages + "?max_results=500", { headers }).then((response) =>
            response.json()
        ),
        fetch(urlVideos, { headers }).then((response) => response.json()),
    ])
        .then(([imageData, videoData]) => {
            const combinedData = [...imageData.resources, ...videoData.resources];
            res.json(combinedData);
        })
        .catch((err) => {
            console.log(err);
            res
                .status(500)
                .json({ error: "An error occurred while fetching data." });
        });
});

export default router;


