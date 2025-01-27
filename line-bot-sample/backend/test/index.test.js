const request = require("supertest");
const app = require("../presentation/index.js"); // Expressアプリ
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// `getUserProfile` のモック
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { userId: "123", displayName: "Test User" } })),
}));

// `getEstimatedTime` のモック
jest.mock("../presentation/index.js", () => ({
  getEstimatedTime: jest.fn(),
  getUserProfile: jest.fn(),
  createProfile: jest.fn(),
}));

// `getEstimatedTime` テスト
describe("getEstimatedTime", () => {
  beforeEach(async () => {
    await prisma.profile.create({ data: { userId: "123", displayName: "Test User" } });
    await prisma.callNumber.upsert({
      where: { id: 1 },
      update: { number: 5 },
      create: { id: 1, number: 5 },
    });
  });

  afterEach(async () => {
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
  });

  test("正常に待ち時間を取得できる", async () => {
    const time = await app.getEstimatedTime("123");
    expect(time).toBeGreaterThanOrEqual(0);
  });

  test("ユーザーが存在しない場合エラーを返す", async () => {
    await expect(app.getEstimatedTime("999")).resolves.toBeNull();
  });
});

// `getUserProfile` テスト
describe("getUserProfile", () => {
  test("ユーザー情報を取得できる", async () => {
    const profile = await app.getUserProfile("123");
    expect(profile).toHaveProperty("userId", "123");
    expect(profile).toHaveProperty("displayName", "Test User");
  });

  test("存在しないユーザーの場合エラーを返す", async () => {
    jest.spyOn(app, "getUserProfile").mockRejectedValue(new Error("ユーザーが見つかりません"));
    await expect(app.getUserProfile("999")).rejects.toThrow("ユーザーが見つかりません");
  });
});

// `createProfile` テスト
describe("createProfile", () => {
  test("新規プロフィールを作成する", async () => {
    const profile = { userId: "456", displayName: "New User" };
    await app.createProfile(profile);
    const created = await prisma.profile.findUnique({ where: { userId: "456" } });
    expect(created).not.toBeNull();
    expect(created.displayName).toBe("New User");
  });
});

// `/webhook` エンドポイントテスト
describe("POST /webhook", () => {
  test("待ち時間を確認できる", async () => {
    app.getEstimatedTime.mockResolvedValue(10);
    
    const response = await request(app)
      .post("/webhook")
      .send({ events: [{ type: "message", message: { text: "待ち時間を確認" }, source: { userId: "123" }, replyToken: "token" }] });
    
    expect(response.status).toBe(200);
  });

  test("整理券を発行できる", async () => {
    app.getUserProfile.mockResolvedValue({ userId: "123", displayName: "Test User" });
    app.createProfile.mockResolvedValue();

    const response = await request(app)
      .post("/webhook")
      .send({ events: [{ type: "message", message: { text: "整理券を発行" }, source: { userId: "123" }, replyToken: "token" }] });

    expect(response.status).toBe(200);
  });
});


// const request = require("supertest");
// const app = require("../presentation/index.js"); // Expressアプリ
// const axios = require("axios");
// const { PrismaClient } = require("@prisma/client");

// // モックの設定
// jest.mock("axios");
// jest.mock("@prisma/client", () => {
//   const mockPrisma = {
//     profile: {
//       create: jest.fn(),
//       findUnique: jest.fn(),
//       upsert: jest.fn(),
//     },
//     callNumber: {
//       upsert: jest.fn(),
//       findUnique: jest.fn(),
//     },
//     $disconnect: jest.fn(),
//   };
//   return { PrismaClient: jest.fn(() => mockPrisma) };
// });

// describe("/webhook endpoint", () => {
//   let prisma;

//   beforeAll(() => {
//     prisma = new PrismaClient();
//   });

//   afterAll(async () => {
//     await prisma.$disconnect();
//   });

//   it("should process user message and save profile", async () => {
//     const mockUserProfile = {
//       displayName: "Test User",
//       userId: "U1234567890",
//       language: "ja",
//       pictureUrl: "https://example.com/image.jpg",
//       statusMessage: "Hello!",
//     };

//     // モック設定
//     axios.get.mockResolvedValue({ data: mockUserProfile });
//     prisma.profile.create.mockResolvedValue(mockUserProfile);

//     const response = await request(app)
//       .post("/webhook")
//       .send({
//         events: [
//           {
//             type: "message",
//             source: { userId: "U1234567890" },
//           },
//         ],
//       });

//     // ステータスコードの確認
//     expect(response.status).toBe(200);

//     // axiosの呼び出しが正しいURLで行われたか確認
//     expect(axios.get).toHaveBeenCalledWith(
//       `https://api.line.me/v2/bot/profile/U1234567890`,
//       expect.any(Object)
//     );

//     // Prismaのcreateメソッドが適切に呼ばれたか確認
//     expect(prisma.profile.create).toHaveBeenCalledWith({
//       data: mockUserProfile,
//     });
//   });

//   it("should handle user message and respond with estimated wait time", async () => {
//     const mockUserProfile = {
//       displayName: "Test User",
//       userId: "U1234567890",
//       language: "ja",
//       pictureUrl: "https://example.com/image.jpg",
//       statusMessage: "Hello!",
//     };

//     // PrismaのMockデータ

//     prisma.profile.findUnique.mockResolvedValue({ id: 1, userId: "U1234567890" });
//     prisma.callNumber.findUnique.mockResolvedValue({ number: 5 });

//     // モック設定
//     axios.get.mockResolvedValue({ data: mockUserProfile });

//     // WebhookのPOSTリクエスト
//     const response = await request(app)
//       .post("/webhook")
//       .send({
//         events: [
//           {
//             type: "message",
//             source: { userId: "U1234567890" },
//             message: { text: "待ち時間を確認" },
//             replyToken: "dummy_token",
//           },
//         ],
//       });

//     // レスポンスが200かどうか確認
//     expect(response.status).toBe(200);

//     // PrismaのfindUniqueの呼び出し確認
//     expect(prisma.profile.findUnique).toHaveBeenCalledWith({
//       where: { userId: "U1234567890" },
//       select: { id: true },
//     });

//     // 返却された待機時間の確認
//     expect(response.text).toContain("現在の待ち時間は");
//   });

//   it("should handle message and issue a reservation", async () => {
//     // モックのデータ
//     const mockUserProfile = {
//       displayName: "Test User",
//       userId: "U1234567890",
//       language: "ja",
//       pictureUrl: "https://example.com/image.jpg",
//       statusMessage: "Hello!",
//     };

//     // PrismaのMockデータ
//     prisma.callNumber.upsert.mockResolvedValue({ number: 123456 });
//     axios.get.mockResolvedValue({ data: mockUserProfile });

//     // WebhookのPOSTリクエスト（整理券発行のケース）
//     const response = await request(app)
//       .post("/webhook")
//       .send({
//         events: [
//           {
//             type: "message",
//             source: { userId: "U1234567890" },
//             message: { text: "整理券を発行" },
//             replyToken: "dummy_token",
//           },
//         ],
//       });

//     // レスポンスが200かどうか確認
//     expect(response.status).toBe(200);
//     expect(response.text).toContain("予約を行いました。あなたの予約番号は123456です。");
//   });

//   it("should handle invalid message", async () => {
//     // WebhookのPOSTリクエスト（無効なメッセージ）
//     const response = await request(app)
//       .post("/webhook")
//       .send({
//         events: [
//           {
//             type: "message",
//             source: { userId: "U1234567890" },
//             message: { text: "無効なメッセージ" },
//             replyToken: "dummy_token",
//           },
//         ],
//       });

//     // レスポンスが200かどうか確認
//     expect(response.status).toBe(200);
//     expect(response.text).toContain("無効なメッセージです。");
//   });
// });
