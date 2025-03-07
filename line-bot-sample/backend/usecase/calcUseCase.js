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
      // ユーザープロファイルを取得
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        throw new Error("ユーザーが見つかりません");
      }

      // 現在の呼出番号を取得
      const callNumber = await this.prisma.callNumber.findUnique({
        where: { id: 1 },
        select: { number: true },
      });

      if (!callNumber) {
        throw new Error("呼出番号データが見つかりません");
      }

      // 呼出履歴を取得（最新のものから順に）
      const callHistory = await this.prisma.callHistory.findMany({
        orderBy: {
          callNumber: 'desc',
        },
        take: 25, // 十分な履歴を取得（n=20の計算に必要な分）
      });

      // 履歴が十分にない場合の計算
      if (callHistory.length < 20) {
        if (callHistory.length < 1) {
          // 初回呼出の場合は待ち時間なし
          return 0;
        }
        else {
          // 2回目以降の場合は、一つ目のの呼出からの経過時間を履歴の数で割って計算
          const lastCall = callHistory[0];
          const firstCall = callHistory[callHistory.length - 1];
          const waitingtime = (lastCall.calledAt.getTime() - firstCall.calledAt.getTime()) / callHistory.length;
          return Math.ceil(waitingtime / (1000 * 60));
        }
      }

      // n値を固定（n=20）
      const n = 20;

      // 現在の呼出時間と、n個前の呼出時間を取得
      const currentCall = callHistory[0];
      const nCallsAgo = callHistory[n - 1];

      if (!currentCall || !nCallsAgo) {
        throw new Error("必要な呼出履歴が見つかりません");
      }

      // 時間差を計算（ミリ秒）
      const timeDifference = currentCall.calledAt.getTime() - nCallsAgo.calledAt.getTime();

      // n個の呼出に要した平均時間（ミリ秒）を計算
      const averageTimePerCall = timeDifference / n;

      // ユーザーの前にある呼出数を計算
      const callsAhead = callNumber.number - profile.id;

      // 待ち時間を計算（ミリ秒を分に変換）
      const waitTimeMinutes = (callsAhead * averageTimePerCall) / (1000 * 60);

      // 待ち時間を分単位で返す（小数点以下切り上げ、最小0分）
      return Math.max(0, Math.ceil(waitTimeMinutes));
    } catch (error) {
      console.error("❌ エラー: ", error.message);
      return null;
    }
  }

  // 呼出番号をインクリメントする関数
  async incrementCallNumber() {
    try {
      // トランザクションを使用して、呼出番号の更新と履歴の追加を一貫して行う
      return await this.prisma.$transaction(async (prisma) => {
        // 呼出番号をインクリメント
        const callNumber = await prisma.callNumber.upsert({
          where: { id: 1 },
          update: { number: { increment: 1 } },
          create: { id: 1, number: 1 },
        });

        // 呼出履歴に新しいレコードを追加
        await prisma.callHistory.create({
          data: {
            callNumber: callNumber.number,
            calledAt: new Date(),
          },
        });

        console.log("Updated Call Number:", callNumber.number);
        return callNumber.number;
      });
    } catch (error) {
      console.error("❌ 呼出番号インクリメントエラー:", error.message);
      throw error;
    }
  }
}

// クラスをエクスポート
module.exports = new calcUseCase();
