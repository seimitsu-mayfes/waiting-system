const profileUseCase = require("../usecase/profileUseCase.js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// axiosのモック
jest.mock("axios", () => ({
    get: jest.fn(() => Promise.resolve({ data: { userId: "123", displayName: "Test User" } })),
  }));
  

describe("profileUseCase", () => {
  beforeEach(async () => {
    await prisma.profile.deleteMany();
  });

  afterEach(async () => {
    await prisma.profile.deleteMany();
  });

  test("ユーザー情報を取得できる", async () => {
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

    const profile = await profileUseCase.getUserProfile("123");
    expect(profile).toHaveProperty("userId", "123");
    expect(profile).toHaveProperty("displayName", "Test User");
  });

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
