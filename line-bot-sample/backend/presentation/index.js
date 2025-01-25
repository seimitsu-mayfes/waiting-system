import https from "https";
import express from "express";
import axios from "axios";
import { PrismaClient } from '@prisma/client';

//Prismaのインスタンスを生成
const prisma = new PrismaClient();

//expressのインスタンスを生成
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//dotenvを使用して環境変数を取得
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

//LINEのアクセストークンを環境変数から取得
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

//ユースケースのインスタンスを生成
import { MessageUseCase } from "../usecase/messageUseCase.js";
import { Repository } from "../usecase/messageUseCase.js";
import { Service } from "../usecase/messageUseCase.js";
const messageUseCase = new MessageUseCase({
  repository: new Repository(),
  service: new Service(),
});


//データベースが正常に接続されているか確認
import pool from "../infrastructure/database.js";
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection error", err);
  } else {
    console.log("✅ Database connected", res.rows);
  }
});

//メッセージを送信してきたユーザーの情報を取得し、データベース上に保存
//
//
app.post("/webhook", async (req, res) => {
  const events = req.body.events;
  for (const event of events) {
    if (event.type === "message") {
      const userId = event.source.userId;
      console.log(`📩 ユーザーID: ${userId}`);

      // ユーザー情報を取得
      const profile = await getUserProfile(userId);
      console.log("👤 ユーザープロフィール:", profile);

      // ユーザー情報をデータベースに保存
      if (profile) {
        await createProfile(profile);
      }
    }
  }
  res.sendStatus(200);
});

async function getUserProfile(userId) {
  try {
    const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("❌ ユーザー情報の取得エラー:", error.response ? error.response.data : error.message);
  }
}

async function createProfile(profile) {
  try {
    const newProfile = await prisma.profile.create({
      data: {
        displayName: profile.displayName,
        userId: profile.userId,
        language: profile.language || "en", // デフォルトは 'en'
        pictureUrl: profile.pictureUrl || "", // 画像URL
        statusMessage: profile.statusMessage || "", // ステータスメッセージ
      },
    });

    console.log("Profile created:", newProfile);
  } catch (error) {
    console.error("❌ プロフィール作成エラー:", error.message);
  }
}
//
//
//

// ユーザーがボットにメッセージを送信した場合、応答メッセージを送信する
//
//
app.post("/webhook", function (req, res) {
  res.send("HTTP POST request sent to the webhook URL");
  if (req.body.events[0].type === "message") {
    let reply_content;
    if (req.body.events[0].type.body === "待ち時間を確認") {
      reply_content = "現在の待ち時間は30分です。";
    } else if (req.body.events[0].type.body === "整理券を発行") {
      reply_content = "予約を行いました。あなたの予約番号は123456です。";
    } else {
      reply_content = "無効なメッセージです。";
    }
    // APIサーバーに送信する応答トークンとメッセージデータを文字列化する
    const dataString = JSON.stringify({
      // 応答トークンを定義
      replyToken: req.body.events[0].replyToken,
      // 返信するメッセージを定義
      messages: [{ type: "text", text: reply_content }],
    });

    // リクエストヘッダー。仕様についてはMessaging APIリファレンスを参照してください。
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
    };

    // Node.jsドキュメントのhttps.requestメソッドで定義されている仕様に従ったオプションを指定します。
    const webhookOptions = {
      hostname: "api.line.me",
      path: "/v2/bot/message/reply",
      method: "POST",
      headers: headers,
    };

    // messageタイプのHTTP POSTリクエストが/webhookエンドポイントに送信された場合、
    // 変数webhookOptionsで定義したhttps://api.line.me/v2/bot/message/replyに対して
    // HTTP POSTリクエストを送信します。

    // リクエストの定義
    const request = https.request(webhookOptions, (res) => {
      res.on("data", (d) => {
        process.stdout.write(d);
      });
    });

    // エラーをハンドリング
    // request.onは、APIサーバーへのリクエスト送信時に
    // エラーが発生した場合にコールバックされる関数です。
    request.on("error", (err) => {
      console.error(err);
    });

    // 最後に、定義したリクエストを送信
    request.write(dataString);
    request.end();
  }
});
//
//
//