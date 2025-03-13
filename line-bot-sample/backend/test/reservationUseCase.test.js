const reservationUseCase = require("../usecase/reservationUseCase.js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

describe("reservationUseCase.getEstimatedTime", () => {
  beforeEach(async () => {
    await prisma.profile.create({
      data: {
        reservationNumber: 1,
        userId: "123",
        displayName: "Test User",
        language: "ja",
        pictureUrl: "",
        statusMessage: ""
      }
    });
    await prisma.callNumber.upsert({
      where: { id: 1 },
      update: { number: 1 },
      create: { id: 1, number: 1 },
    });
  });

  afterEach(async () => {
    await prisma.profile.deleteMany();
    await prisma.callNumber.deleteMany();
  });

  test("正常に待ち時間を取得できる", async () => {
    const time = await reservationUseCase.getEstimatedTime("123");
    expect(time).toBe(0);
  });

  test("ユーザーが存在しない場合エラーを返す", async () => {
    const time = await reservationUseCase.getEstimatedTime("999");
    expect(time).toBeNull();
  });
});
