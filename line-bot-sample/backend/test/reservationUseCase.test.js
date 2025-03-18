const reservationUseCase = require("../usecase/reservationUseCase.js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

describe("reservationUseCase", () => {
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

  test("呼出番号をインクリメントできる", async () => {
    const initial = await prisma.callNumber.findUnique({ where: { id: 1 } });
    const newNumber = await reservationUseCase.incrementCallNumber();
    expect(newNumber).toBe(initial.number + 1);
  });

  test("初回の呼出番号を 1 で作成する", async () => {
    await prisma.callNumber.deleteMany();
    const newNumber = await reservationUseCase.incrementCallNumber();
    expect(newNumber).toBe(1);
  });

  test("次の予約番号を取得できる", async () => {
    await prisma.profile.create({
      data: {
        reservationNumber: 2,
        userId: "456",
        displayName: "Another User",
        language: "ja",
        pictureUrl: "",
        statusMessage: "",
      },
    });
    const nextNumber = await reservationUseCase.getNextReservationNumber();
    expect(nextNumber).toBe(3);
  });

  test("予約がない場合は 1 を返す", async () => {
    await prisma.profile.deleteMany();
    const nextNumber = await reservationUseCase.getNextReservationNumber();
    expect(nextNumber).toBe(1);
  });
});
