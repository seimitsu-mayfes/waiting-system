const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

class messageUseCase {
  constructor() {
    this.prisma = new PrismaClient();
    this.LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // 環境変数から取得
  }

  // LINE にプッシュメッセージを送る関数
  async sendLinePushMessage(userId, message) {
    try {
      const response = await axios.post(
        "https://api.line.me/v2/bot/message/push",
        {
          to: userId,
          messages: [{ type: "text", text: message }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.LINE_ACCESS_TOKEN}`,
          },
        }
      );

      console.log("メッセージ送信成功:", response.data);
    } catch (error) {
      console.error("メッセージ送信エラー:", error.response?.data || error.message);
    }
  }
}

// クラスをエクスポート
module.exports = messageUseCase;
