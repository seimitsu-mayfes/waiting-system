const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

class profileUseCase {
  constructor() {
    this.prisma = new PrismaClient();
    this.LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // 環境変数から取得
  }

  // プロフィールを取得する関数
  async getUserProfile(userId) {
    try {
      const response = await axios.get(
        `https://api.line.me/v2/bot/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${this.LINE_ACCESS_TOKEN}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("❌ ユーザー情報の取得エラー:", error.message);
      return null;
    }
  }

  // プロフィールを作成する関数
  async createProfile(profile) {
    try {
      const newProfile = await this.prisma.profile.create({
        data: {
          displayName: profile.displayName,
          userId: profile.userId,
          language: profile.language || "en",
          pictureUrl: profile.pictureUrl || "",
          statusMessage: profile.statusMessage || "",
        },
      });
      console.log("Profile created:", newProfile);
      return newProfile;
    } catch (error) {
      console.error("❌ プロフィール作成エラー:", error.message);
      throw error;
    }
  }
}

// クラスをエクスポート
module.exports = new profileUseCase();
