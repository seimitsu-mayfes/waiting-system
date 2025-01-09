const https = require("https");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;
const TOKEN = process.env.LINE_ACCESS_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendStatus(200);
});

app.post("/webhook", function (req, res) {
    res.send("HTTP POST request sent to the webhook URL!");

    const event = req.body.events[0];
    // ユーザーがボットにメッセージを送った場合、応答メッセージを送る
    if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;

        let replyMessage = {};
        if (userMessage === "待ち時間を確認") {
            // Flex Messageを定義
            replyMessage = {
                type: "flex",
                altText: "待ち時間情報",
                contents: {
                    type: "bubble",
                    hero: {
                        type: "image",
                        url: "https://example.com/waiting-time-image.png", // 画像URLを指定
                        size: "full",
                        aspectRatio: "20:13",
                        aspectMode: "cover",
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: "現在の待ち時間",
                                weight: "bold",
                                size: "xl",
                                align: "center",
                            },
                            {
                                type: "text",
                                text: "30分",
                                size: "lg",
                                align: "center",
                                margin: "md",
                                color: "#FF0000", // テキストの色
                            },
                        ],
                    },
                },
            };
        } else {
            // デフォルトのテキストメッセージ
            replyMessage = {
                type: "text",
                text: "Hello, user! May I help you?",
            };
        }

        // APIサーバーに送信する応答トークンとメッセージデータを文字列化する
        const dataString = JSON.stringify({
            // 応答トークンを定義
            replyToken: event.replyToken,
            // 返信するメッセージを定義
            messages: [replyMessage],
        });

        // リクエストヘッダー。仕様についてはMessaging APIリファレンスを参照してください。
        const headers = {
            "Content-Type": "application/json",
            Authorization: "Bearer " + TOKEN,
        };

        // Node.jsドキュメントのhttps.requestメソッドで定義されている仕様に従ったオプションを指定します。
        const reply = {
            hostname: "api.line.me",
            path: "/v2/bot/message/reply",
            method: "POST",
            headers: headers,
        };

        // messageタイプのHTTP POSTリクエストが/webhookエンドポイントに送信された場合、
        // 変数replyで定義したhttps://api.line.me/v2/bot/message/replyに対して
        // HTTP POSTリクエストを送信します。

        // リクエストの定義
        const request = https.request(reply, (res) => {
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

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});