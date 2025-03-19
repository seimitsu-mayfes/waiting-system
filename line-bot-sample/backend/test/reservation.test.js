const request = require("supertest");
const express = require("express");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const presentationRoutes = require("../presentation/reservation");

// 環境変数の読み込み
dotenv.config();

// テスト用のExpressアプリを作成
const app = express();
app.use(express.json());
app.use(presentationRoutes);

// Prismaクライアントの設定
const prisma = new PrismaClient();

// axiosのモック
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { userId: "123", displayName: "Test User" } })),
}));

describe("POST /webhook", () => {
  beforeEach(async () => {
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("待ち時間を確認できる", async () => {
    await prisma.profile.create({
      data: {
        reservationNumber: 5,
        userId: "123",
        displayName: "Test User",
        language: "ja",
        pictureUrl: "",
        statusMessage: ""
      }
    });
    await prisma.callNumber.upsert({
      where: { id: 1 },
      update: { number: 5 },
      create: { id: 1, number: 5 },
    });

    const response = await request(app)
      .post("/webhook")
      .send({
        events: [{
          type: "message",
          message: { text: "待ち時間を確認" },
          source: { userId: "123" },
          replyToken: "token"
        }]
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({});
  });

  test("整理券を発行できる", async () => {
    const response = await request(app)
      .post("/webhook")
      .send({
        events: [{
          type: "message",
          message: { text: "整理券を発行" },
          source: { userId: "123" },
          replyToken: "token"
        }]
      });

    expect(response.status).toBe(200);
    
    const profile = await prisma.profile.findUnique({
      where: { userId: "123" }
    });
    expect(profile).not.toBeNull();
  });
});
