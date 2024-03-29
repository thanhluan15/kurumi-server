/** @format */

import { PrismaClient, User } from "@prisma/client";
import express, { Request, Response } from "express";
import CryptoJS from "crypto-js";

const prisma = new PrismaClient();

const getAllUser = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { posts: true, profile: true, comment: true },
    });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json("User Not Found!");
  }
};

const getSingleUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(id);
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { posts: true, profile: true },
    });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, password, newPassword }: User & { newPassword: string } =
    req.body;
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
  });
  console.log(user);
  const bytes = CryptoJS.AES.decrypt(
    user?.password as string,
    process.env.SECRET_KEY as string
  );
  const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
  console.log(originalPassword);
  // @ts-ignore
  if (req?.user?.id === user?.id || req?.user?.Role === "ADMIN") {
    if (originalPassword !== password) {
      res.status(401).json("Wrong password!");
    } else {
      try {
        await prisma.user.update({
          where: { id: Number(id) || undefined },
          data: {
            name,
            password: CryptoJS.AES.encrypt(
              newPassword,
              process.env.SECRET_KEY as string
            ).toString(),
          },
        });
        res.status(200).json("Update user successful!");
      } catch (err) {
        res.status(500).json("User Not Found!");
      }
    }
  } else {
    res.status(401).json("Enabled to change password");
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    res.status(200).json("Delete user successful!");
  } catch (error) {
    res.status(500).json(error);
  }
};

export default { getAllUser, getSingleUser, updateUser, deleteUser };
