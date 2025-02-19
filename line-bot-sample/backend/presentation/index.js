const https = require("https");
const express = require("express");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

//Prismaのインスタンスを生成
const prisma = new PrismaClient();

//dotenvを使用して環境変数を取得
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

//LINEのアクセストークンを環境変数から取得
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

//プロフィールを取得する関数
async function getUserProfile(userId) {
  try {
    const response = await axios.get(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ ユーザー情報の取得エラー:", error.message);
    return null;
  }
}

//プロフィールを作成する関数
async function createProfile(profile) {
  try {
    const newProfile = await prisma.profile.create({
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

//待ち時間を取得する関数
async function getEstimatedTime(userId) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new Error("ユーザーが見つかりません");
    }

    const callNumber = await prisma.callNumber.findUnique({
      where: { id: 1 },
      select: { number: true },
    });

    if (!callNumber) {
      throw new Error("呼出番号データが見つかりません");
    }

    const gain = 1.5;
    //20組前を呼び出した時間と現在の呼出番号を呼び出した時間の差を取る。
    //その差を20で割って、(callNumber.number - profile.id)を掛けることで、現在の待ち時間を算出する。
    const difference = Math.ceil((callNumber.number - profile.id) * gain);
    return Math.max(0, difference);
  } catch (error) {
    console.error("❌ エラー: ", error.message);
    return null;
  }
}

//expressのインスタンスを生成
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 関数をエクスポート
module.exports = {
  app,
  getEstimatedTime,
  getUserProfile,
  createProfile,
  LINE_ACCESS_TOKEN,
};

//ユースケースのインスタンスを生成
// const { MessageUseCase, Repository, Service } = require("../usecase/messageUseCase.js");
// const messageUseCase = new MessageUseCase({
//   repository: new Repository(),
//   service: new Service(),
// });

// テスト時は不要なデータベース接続チェックをスキップ
if (process.env.NODE_ENV !== "test") {
  const pool = require("../infrastructure/database.js");
  pool.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.error("❌ Database connection error", err);
    } else {
      console.log("✅ Database connected", res.rows);
    }
  });
}

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

//下の2つのappの統合版
app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events[0];

    if (event.type === "message") {
      const userId = event.source.userId;
      console.log(`📩 ユーザーID: ${userId}`);

      const userMessage = event.message.text;
      let reply_content;

      if (userMessage === "待ち時間を確認") {
        try {
          // ユーザーの待ち時間を取得
          const time = await getEstimatedTime(userId);

          if (time !== null) {
            reply_content = `現在の待ち時間は ${time} 分です。`;
          } else {
            reply_content = "整理券を発行してください。";
          }
        } catch (error) {
          console.error("❌ 待ち時間取得エラー:", error);
          reply_content = "待ち時間取得エラー";
        }
      } else if (userMessage === "整理券を発行") {
        // ユーザー情報を取得
        const profile = await getUserProfile(userId);
        console.log("👤 ユーザープロフィール:", profile);

        if (profile) {
          // ユーザーがすでに登録されているか確認
          const existingProfile = await prisma.profile.findUnique({
            where: { userId },
          });

          if (!existingProfile) {
            // 新規ユーザーならデータベースに保存
            await createProfile(profile);
            console.log("✅ プロフィールを保存しました");
            const reservationNumber = profile.id;
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
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhookエラー:", error);
    res.sendStatus(500);
  }
});

//呼出番号をインクリメントする関数
async function incrementCallNumber() {
  const callNumber = await prisma.callNumber.upsert({
    where: { id: 1 },
    update: { number: { increment: 1 } },
    create: { id: 1, number: 1 },
  });

  console.log("Updated Call Number:", callNumber.number);
  return callNumber.number;
}
