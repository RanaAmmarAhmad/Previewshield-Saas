import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";
import { randomBytes } from "crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

const router: IRouter = Router();

router.post("/upload", upload.single("file"), (req, res): void => {
  if (!req.file) {
    res.status(400).json({ error: "no_file", message: "No file provided" });
    return;
  }

  const fileUrl = `/api/files/${req.file.filename}`;

  res.status(201).json({
    fileUrl,
    fileName: req.file.originalname,
    fileMimeType: req.file.mimetype,
    fileSize: req.file.size,
  });
});

export default router;
