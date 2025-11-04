import { Router } from "express";
import { TagController } from "../controllers/tag.controller";
export const tags = Router();

tags.get("/", TagController.list);
tags.get("/:id", TagController.get);
tags.post("/", TagController.create);
tags.put("/:id", TagController.update);
tags.delete("/:id", TagController.remove);
tags.delete("/", TagController.removeBulk);
