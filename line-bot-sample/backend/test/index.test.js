const request = require("supertest");
const { app } = require("../presentation/index");
const profileUseCase = require("../usecase/profileUseCase.js");
const messageUseCase = require("../usecase/messageUseCase.js");
const calcUseCase = require("../usecase/calcUseCase.js");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

// .envファイルの読み込み
dotenv.config({ path: "../.env" });
process.env.NODE_ENV = "test";

// Prismaクライアントの設定
const prisma = new PrismaClient();

// axiosのモック
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { userId: "123", displayName: "Test User" } })),
}));

describe("LINE Bot API Tests", () => {
  // テスト前の共通セットアップ
  beforeAll(async () => {
    // データベースのクリーンアップ
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
    await prisma.$connect();
  });

  // 各テスト前のセットアップ
  beforeEach(async () => {
    // データベースのクリーンアップ
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
  });

  // 各テスト後のクリーンアップ
  afterEach(async () => {
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
  });

  // テスト終了後の処理
  afterAll(async () => {
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
    await prisma.$disconnect();
  });

  describe("calcUseCase.getEstimatedTime", () => {
    beforeEach(async () => {
      // テストデータのセットアップ
      await prisma.profile.create({
        data: {
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
    });

    test("正常に待ち時間を取得できる", async () => {
      const time = await calcUseCase.getEstimatedTime("123");
      expect(time).toBeGreaterThanOrEqual(0);
    });

    test("ユーザーが存在しない場合エラーを返す", async () => {
      const time = await calcUseCase.getEstimatedTime("999");
      expect(time).toBeNull();
    });
  });

  describe("profileUseCase.getUserProfile", () => {
    test("ユーザー情報を取得できる", async () => {
      const profile = await profileUseCase.getUserProfile("123");
      expect(profile).toHaveProperty("userId", "123");
      expect(profile).toHaveProperty("displayName", "Test User");
    });
  });

  describe("profileUseCase.createProfile", () => {
    test("新規プロフィールを作成する", async () => {
      const profile = {
        userId: "456",
        displayName: "New User",
        language: "ja",
        pictureUrl: "https://example.com/image.jpg",
        statusMessage: "Hello!"
      };

      await profileUseCase.createProfile(profile);
      const created = await prisma.profile.findUnique({
        where: { userId: "456" }
      });

      expect(created).not.toBeNull();
      expect(created.displayName).toBe("New User");
      expect(created.language).toBe("ja");
      expect(created.pictureUrl).toBe("https://example.com/image.jpg");
      expect(created.statusMessage).toBe("Hello!");
    });
  });

  describe("POST /webhook", () => {
    test("待ち時間を確認できる", async () => {
      // プロフィールとCallNumberの作成
      await prisma.profile.create({
        data: {
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

      await new Promise(resolve => setTimeout(resolve, 100)); // LINE APIのレスポンスを待つ
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
      await new Promise(resolve => setTimeout(resolve, 100)); // 非同期処理の完了を待つ
    });

    test("整理券を発行できる", async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // LINE APIのレスポンスを待つ
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

      await new Promise(resolve => setTimeout(resolve, 100)); // 非同期処理の完了を待つ

      // プロフィールが作成されたことを確認
      const profile = await prisma.profile.findUnique({
        where: { userId: "123" }
      });
      expect(profile).not.toBeNull();
    });
  });
});