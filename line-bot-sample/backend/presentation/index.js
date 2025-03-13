const express = require("express");
const axios = require("axios");
const https = require("https");
const { PrismaClient } = require("@prisma/client");

// Prismaのインスタンスを生成
const prisma = new PrismaClient();

// dotenvを使用して環境変数を取得
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const profileUseCase = require("../usecase/profileUseCase.js");
const messageUseCase = require("../usecase/messageUseCase.js");
const reservationUseCase = require("../usecase/reservationUseCase.js");

// expressのインスタンスを生成
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

module.exports = {
  app,
};

app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events[0];
    let reply_content;

    if (event.type === "message") {
      const userId = event.source.userId;
      console.log(`📩 ユーザーID: ${userId}`);

      const userMessage = event.message.text;

      if (userMessage === "待ち時間を確認") {
        try {
          // ユーザーの待ち時間を取得
          const time = await reservationUseCase.getEstimatedTime(userId);
          reply_content = time !== null ? `現在の待ち時間は ${time} 分です。` : "整理券を発行してください。";
        } catch (error) {
          console.error("❌ 待ち時間取得エラー:", error);
          reply_content = "待ち時間取得エラー";
        }
      } else if (userMessage === "整理券を発行") {
        // ユーザー情報を取得
        const profile = await profileUseCase.getUserProfile(userId);
        console.log("👤 ユーザープロフィール:", profile);

        if (profile) {
          // ユーザーがすでに登録されているか確認
          const existingProfile = await prisma.profile.findUnique({
            where: { userId },
          });

          if (!existingProfile) {
            // 新規ユーザーならデータベースに保存
            await profileUseCase.createProfile(profile);
            console.log("✅ プロフィールを保存しました");
            const reservationNumber = profile.reservationNumber;
            reply_content = `予約を行いました。あなたの予約番号は ${reservationNumber} です。`;
          } else {
            console.log("🔍 ユーザーはすでに登録済みです");
            reply_content = "あなたはすでに予約済みです。";
          }
        } else {
          reply_content = "ユーザー情報を取得できませんでした。";
        }
      } else {
        reply_content = "無効なメッセージです。";
      }
    }

    // await axios.post(
    //   "https://api.line.me/v2/bot/message/reply",
    //   {
    //     replyToken: event.replyToken,
    //     messages: [{ type: "text", text: reply_content }],
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
    //     },
    //   }
    // );
    // console.log("✅ LINE API レスポンス送信成功");

    // LINE API に返信を送信
    const dataString = JSON.stringify({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: reply_content }],
    });

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
    };

    const webhookOptions = {
      hostname: "api.line.me",
      path: "/v2/bot/message/reply",
      method: "POST",
      headers: headers,
    };

    const request = https.request(webhookOptions, (response) => {
      response.on("data", (d) => {
        console.log("LINE API Response:", d.toString());
      });
    });

    request.on("error", (err) => {
      console.error("❌ LINE API エラー:", err);
    });

    request.write(dataString);
    request.end();

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhookエラー:", error);
    res.sendStatus(500);
  }
});


//呼び出し番号をインクリメント＆呼出番号と同じ番号のユーザーに呼び出しメッセージを送信
app.put("/webhook", async (req, res) => {
  try {
    const callNumber = await reservationUseCase.incrementCallNumber();

    // ユーザーに呼び出しメッセージを送信
    const profile = await prisma.profile.findUnique({
      where: { reservationNumber: callNumber },
    });

    if (profile) {
      messageUseCase.sendLinePushMessage(
        profile.userId,
        `呼び出し番号: ${callNumber}`
      );
      console.log(`🔊 呼び出し番号: ${callNumber}`);
    } else {
      console.error("❌ プロフィールが見つかりません");
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhookエラー:", error);
    res.sendStatus(500);
  }
});

app.delete("/webhook", async (req, res) => {
  try {
    const userId = req.query.userId;
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });
    if(profile.validity === true){
      profileUseCase.invalidateProfile(profile.reservationNumber);
    } else {
      console.log("この整理券は使用済みです。");
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhookエラー:", error);
    res.sendStatus(500);
  }
});  