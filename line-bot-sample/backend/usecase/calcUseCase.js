const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

class calcUseCase {
  constructor() {
    this.prisma = new PrismaClient();
    this.LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // 環境変数から取得
  }

  // 待ち時間を取得する関数
  async getEstimatedTime(userId) {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        throw new Error("ユーザーが見つかりません");
      }

      const callNumber = await this.prisma.callNumber.findUnique({
        where: { id: 1 },
        select: { number: true },
      });

      if (!callNumber) {
        throw new Error("呼出番号データが見つかりません");
      }

      const gain = 1.5;
      const difference = Math.ceil((callNumber.number - profile.id) * gain);
      return Math.max(0, difference);
    } catch (error) {
      console.error("❌ エラー: ", error.message);
      return null;
    }
  }

  // 呼出番号をインクリメントする関数
  async incrementCallNumber() {
    try {
      const callNumber = await this.prisma.callNumber.upsert({
        where: { id: 1 },
        update: { number: { increment: 1 } },
        create: { id: 1, number: 1 },
      });

      console.log("Updated Call Number:", callNumber.number);
      return callNumber.number;
    } catch (error) {
      console.error("❌ 呼出番号インクリメントエラー:", error.message);
      throw error;
    }
  }
}

// クラスをエクスポート
module.exports = new calcUseCase();
