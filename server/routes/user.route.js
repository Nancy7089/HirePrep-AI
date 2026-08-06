import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getCurrent } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/current-user", isAuth, getCurrent);

export default userRouter;