import https from "https";
import express from "express";
const app = express();
const TOKEN = process.env.LINE_ACCESS_TOKEN;

import { MessageUseCase } from "../usecase/messageUseCase.js";
import { Repository } from "../usecase/messageUseCase.js";
import { Service } from "../usecase/messageUseCase.js";

//データベースが正常に接続されているか確認
import pool from "../infrastructure/database.js";
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection error", err);
  } else {
    console.log("✅ Database connected", res.rows);
  }
});

// ユースケースのインスタンスを生成
const messageUseCase = new MessageUseCase({
  repository: new Repository(),
  service: new Service(),
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.get("/", (req, res) => {
//   res.sendStatus(200);
// });

app.post("/webhook", function (req, res) {
  res.send("HTTP POST request sent to the webhook URL");
  // ユーザーがボットにメッセージを送った場合、応答メッセージを送る
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
      Authorization: "Bearer " + TOKEN,
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
