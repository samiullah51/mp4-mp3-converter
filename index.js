const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ytdlp = require("yt-dlp-exec");

const app = express();
// convert link to mp3
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

const dir = "public";
const subDir = "public/uploads";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
  fs.mkdirSync(subDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, subDir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/convert", upload.single("file"), (req, res) => {
  if (req.file) {
    console.log(req.file.path);

    const output = Date.now() + "-" + "convertedAudio.mp3";

    ffmpeg(req.file.path)
      .toFormat("mp3")
      .on("end", () => {
        console.log("File is converted");
        res.download(output, (error) => {
          if (error) {
            throw error;
          } else {
            fs.unlinkSync(req.file.path);
            fs.unlinkSync(output);
          }
        });
      })
      .saveToFile(output);
  } else if (req.body.videoURL) {
    const videoURL = req.body.videoURL;
    const output = Date.now() + "-" + "convertedAudio.mp3";

    ytdlp(videoURL, {
      extractAudio: true,
      audioFormat: "mp3",
      output: output,
    })
      .then(() => {
        console.log("Video is converted");
        res.download(output, (error) => {
          if (error) {
            throw error;
          } else {
            fs.unlinkSync(output);
          }
        });
      })
      .catch((error) => {
        console.log(`Convert Error: ${error}`);
        res.status(500).send("Error converting video");
      });
  }
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
