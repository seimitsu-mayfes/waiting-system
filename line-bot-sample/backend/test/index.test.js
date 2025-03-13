const request = require("supertest");
const { app } = require("../presentation/index");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

// .envファイルの読み込み
dotenv.config({ path: "../.env" });
// process.env.NODE_ENV = "test";

// Prismaクライアントの設定
const prisma = new PrismaClient();

// axiosのモック
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { userId: "123", displayName: "Test User" } })),
}));

describe("POST /webhook", () => {
  beforeAll(async () => {
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
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
