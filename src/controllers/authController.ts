/** @format */

import { PrismaClient, User } from "@prisma/client";
import { Request, Response } from "express";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import "dotenv/config";

const prisma = new PrismaClient();

const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, Role }: User = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: CryptoJS.AES.encrypt(
          password,
          process.env.SECRET_KEY as string
        ).toString(),
        Role: Role,
      },
    });
    // console.log(newUser);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json(err);
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password }: User = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) res.status(401).json("Wrong email!");
    else {
      const bytes = CryptoJS.AES.decrypt(
        user?.password as string,
        process.env.SECRET_KEY as string
      );
      const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
      if (originalPassword !== password) {
        res.status(401).json("Wrong password!");
      } else {
        const accessToken = jwt.sign(
          { id: user?.id, Role: user?.Role },
          process.env.SECRET_KEY as string,
          {
            expiresIn: "5d",
          }
        );
        const info = {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          Role: user?.Role,
        };
        // console.log(info);
        res.status(200).json({ ...info, accessToken });
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export default { loginUser, registerUser };
