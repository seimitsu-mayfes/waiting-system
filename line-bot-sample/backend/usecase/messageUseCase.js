const axios = require("axios");
const { PrismaClient } = require("../generated/prisma_client");

class messageUseCase {
  constructor() {
    this.prisma = new PrismaClient();
    this.LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // 環境変数から取得
  }

  // LINE にプッシュメッセージを送る関数(うまく動作しない可能性大)
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
      console.error(
        "メッセージ送信エラー:",
        error.response?.data || error.message
      );
    }
  }

  // 「整理券を使用する」メッセージを送る関数
  async sendTicketUsageMessage(userId) {
    const message = {
      to: userId,
      messages: [
        {
          type: "flex",
          altText: "整理券を使用する",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "整理券を使用しますか？",
                  weight: "bold",
                  size: "lg",
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "整理券を使用する",
                    data: `action=useTicket&userId=${userId}`,
                  },
                },
              ],
            },
          },
        },
      ],
    };

    try {
      const response = await axios.post(
        "https://api.line.me/v2/bot/message/push",
        message,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.LINE_ACCESS_TOKEN}`,
          },
        }
      );

      console.log("✅ メッセージ送信成功:", response.data);
    } catch (error) {
      console.error(
        "❌ メッセージ送信エラー:",
        error.response?.data || error.message
      );
    }
  }
}

// クラスをエクスポート
module.exports = new messageUseCase();
