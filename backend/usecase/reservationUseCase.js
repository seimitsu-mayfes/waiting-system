const profileUseCase = require("./profileUseCase.js");
const { PrismaClient } = require("@prisma/client");

class ReservationUseCase {
  constructor() {
    this.prisma = new PrismaClient();
    this.profileUseCase = new profileUseCase();
  }

  async invalidateAfterAWhile() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // 30分以上経過したCallHistoryを検索
      const expiredCalls = await this.prisma.callHistory.findMany({
        where: {
          calledAt: {
            lte: thirtyMinutesAgo,
          },
        },
        distinct: ["callNumber"], // 重複するcallNumberを除外
        orderBy: {
          calledAt: "desc",
        },
      });

      let invalidatedCount = 0;
      // 各期限切れCallHistoryに対して処理
      for (const call of expiredCalls) {
        // 対応するProfileを検索（まだvalidityがtrueのもののみ）
        const profile = await this.prisma.profile.findFirst({
          where: {
            reservationNumber: call.callNumber,
            validity: true,
          },
        });

        // Profileが見つかった場合のみinvalidateを実行
        if (profile) {
          const result = await this.profileUseCase.invalidateProfile(
            profile.reservationNumber
          );
          if (result) {
            invalidatedCount++;
            console.log(
              `✅ Profile ${profile.reservationNumber} を無効化しました`
            );
          }
        }
      }

      return invalidatedCount;
    } catch (error) {
      console.error("❌ 期限切れProfile無効化エラー:", error);
      throw error;
    }
  }

  // 呼出番号をインクリメントする際にCallHistoryも作成する
  async incrementCallNumber() {
    try {
      const callNumber = await this.prisma.callNumber.upsert({
        where: { id: 1 },
        update: { number: { increment: 1 } },
        create: { id: 1, number: 1 },
      });

      // CallHistoryを作成
      await this.prisma.callHistory.create({
        data: {
          callNumber: callNumber.number,
        },
      });

      console.log("Updated Call Number:", callNumber.number);
      return callNumber.number;
    } catch (error) {
      console.error("❌ 呼出番号インクリメントエラー:", error.message);
      throw error;
    }
  }
}

module.exports = new ReservationUseCase();
