const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const reservationUseCase = require("../usecase/reservationUseCase.js");

class profileUseCase {
  constructor() {
    this.prisma = new PrismaClient();
    this.LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // 環境変数から取得
  }

  // プロフィールを取得する関数
  async getUserProfile(userId) {
    try {
      const received = await axios.get(
        `https://api.line.me/v2/bot/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${this.LINE_ACCESS_TOKEN}` },
        }
      );
      return received.data;
    } catch (error) {
      console.error("❌ ユーザー情報の取得エラー:", error.message);
      return null;
    }
  }

  // profileデータベースを作成する関数
  async createProfile(profile) {
    try {
      const newReservationNumber =
        await reservationUseCase.getNextReservationNumber();

      const newProfile = await this.prisma.profile.create({
        data: {
          reservationNumber: newReservationNumber,
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

  // 整理券をのvalidityを更新する関数
  async invalidateProfile(reservationNumber) {
    try {
      const updatedProfile = await this.prisma.profile.update({
        where: { reservationNumber }, // reservationNumber を使用
        data: { validity: false },
      });

      console.log("✅ プロフィールの有効性を false に更新:", updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error("❌ プロフィール更新エラー:", error.message);
      return null;
    }
  }
}

// クラスをエクスポート
module.exports = new profileUseCase();
