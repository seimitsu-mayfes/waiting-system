const express = require("express");
const axios = require("axios");
const https = require("https");
const { PrismaClient } = require("@prisma/client");

// Prismaのインスタンスを生成
const prisma = new PrismaClient();

// dotenvを使用して環境変数を取得
const dotenv = require("dotenv");
dotenv.config(); // ルートディレクトリの `.env` を読むように修正

const profileUseCase = require("../usecase/profileUseCase.js");
const messageUseCase = require("../usecase/messageUseCase.js");
const reservationUseCase = require("../usecase/reservationUseCase.js");

// expressのルーターを作成
const router = express.Router();

// 待ち時間の確認
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events[0];
    let reply_content;

    if (event.type === "message") {
      const userId = event.source.userId;
      console.log(`📩 ユーザーID: ${userId}`);

      const userMessage = event.message.text;

      if (userMessage === "待ち時間を確認") {
        try {
          const time = await reservationUseCase.getEstimatedTime(userId);
          reply_content =
            time !== null
              ? `現在の待ち時間は ${time} 分です。`
              : "整理券を発行してください。";
        } catch (error) {
          console.error("❌ 待ち時間取得エラー:", error);
          reply_content = "待ち時間取得エラー";
        }
      } else if (userMessage === "整理券を発行") {
        const profile = await profileUseCase.getUserProfile(userId);
        console.log("👤 ユーザープロフィール:", profile);

        if (profile) {
          const existingProfile = await prisma.profile.findUnique({
            where: { userId, validity: true },
          });

          if (!existingProfile) {
            await profileUseCase.createProfile(profile);
            console.log("✅ プロフィールを保存しました");
            reply_content = `予約を行いました。あなたの予約番号は ${profile.reservationNumber} です。`;
          } else {
            console.log("🔍 ユーザーはすでに登録済みです");
            reply_content = "すでに予約済みです。";
          }
        } else {
          reply_content = "ユーザー情報を取得できませんでした。";
        }
      } else {
        reply_content = "無効なメッセージです。";
      }
    }

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

// 呼び出し番号をインクリメント＆ユーザーに通知
router.put("/webhook", async (req, res) => {
  try {
    const callNumber = await reservationUseCase.incrementCallNumber();

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

// 整理券を使用済みにする
router.delete("/webhook", async (req, res) => {
  try {
    const userId = req.query.userId;
    const profile = await prisma.profile.findUnique({
      where: { userId, validity: true },
    });

    if (profile) {
      await profileUseCase.invalidateProfile(profile.reservationNumber);
    } else {
      messageUseCase.sendLinePushMessage(userId, "整理券は使用済みです。");
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhookエラー:", error);
    res.sendStatus(500);
  }
});

// ルーターをエクスポート
module.exports = router;
