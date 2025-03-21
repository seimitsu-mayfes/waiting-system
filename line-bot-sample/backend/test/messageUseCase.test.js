const messageUseCase = require("../usecase/messageUseCase.js");
const axios = require("axios");

// Axiosをモック化
jest.mock("axios");

// LINE_ACCESS_TOKENをモック
jest.mock("process", () => ({
    env: { LINE_ACCESS_TOKEN: "test-token" }
}));

describe("messageUseCase", () => {
    // 各テスト前にモックをリセット
    beforeEach(() => {
        jest.clearAllMocks();

        // LINE_ACCESS_TOKENを直接設定
        messageUseCase.LINE_ACCESS_TOKEN = "test-token";
    });

    describe("sendLinePushMessage", () => {
        test("正常にLINEプッシュメッセージを送信できる", async () => {
            // axiosのpostメソッドのモック実装
            axios.post.mockResolvedValue({
                data: { message: "success" },
                status: 200,
            });

            // テスト用のパラメータ
            const userId = "test-user-id";
            const message = "テストメッセージ";

            // 関数を実行
            await messageUseCase.sendLinePushMessage(userId, message);

            // axiosのpostメソッドが呼び出されたか検証
            expect(axios.post).toHaveBeenCalledTimes(1);

            // 呼び出し時の第1引数を検証
            expect(axios.post.mock.calls[0][0]).toBe("https://api.line.me/v2/bot/message/push");

            // 呼び出し時の第2引数を検証
            const messageObj = axios.post.mock.calls[0][1];
            expect(messageObj.to).toBe(userId);
            expect(messageObj.messages).toHaveLength(1);
            expect(messageObj.messages[0].type).toBe("text");
            expect(messageObj.messages[0].text).toBe(message);

            // 呼び出し時の第3引数（ヘッダー）を検証
            const headers = axios.post.mock.calls[0][2].headers;
            expect(headers["Content-Type"]).toBe("application/json");
            expect(headers.Authorization).toBe("Bearer test-token");
        });

        test("APIエラー時に例外をキャッチして処理を続行する", async () => {
            // axiosのpostメソッドがエラーを投げるようにモック
            const errorResponse = {
                response: {
                    data: { message: "Invalid request" },
                    status: 400,
                },
            };
            axios.post.mockRejectedValue(errorResponse);

            // コンソールエラーをスパイ
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();

            // テスト用のパラメータ
            const userId = "test-user-id";
            const message = "テストメッセージ";

            // 関数を実行（エラーが発生しても関数は例外をスローしない）
            await messageUseCase.sendLinePushMessage(userId, message);

            // コンソールエラーが呼び出されたか検証
            expect(consoleSpy).toHaveBeenCalled();

            // スパイをリストア
            consoleSpy.mockRestore();
        });
    });

    describe("sendTicketUsageMessage", () => {
        test("正常に整理券使用メッセージを送信できる", async () => {
            // axiosのpostメソッドのモック実装
            axios.post.mockResolvedValue({
                data: { message: "success" },
                status: 200,
            });

            // テスト用のパラメータ
            const userId = "test-user-id";

            // 関数を実行
            await messageUseCase.sendTicketUsageMessage(userId);

            // axiosのpostメソッドが呼び出されたか検証
            expect(axios.post).toHaveBeenCalledTimes(1);

            // 呼び出し時の第1引数を検証
            expect(axios.post.mock.calls[0][0]).toBe("https://api.line.me/v2/bot/message/push");

            // 呼び出し時の第2引数（メッセージオブジェクト）を検証
            const messageObj = axios.post.mock.calls[0][1];
            expect(messageObj.to).toBe(userId);
            expect(messageObj.messages).toHaveLength(1);
            expect(messageObj.messages[0].type).toBe("flex");
            expect(messageObj.messages[0].altText).toBe("整理券を使用する");

            // Flexメッセージの内容を検証
            const contents = messageObj.messages[0].contents;
            expect(contents.type).toBe("bubble");
            expect(contents.body.contents[0].text).toBe("整理券を使用しますか？");

            // フッターのボタンアクションを検証
            const action = contents.footer.contents[0].action;
            expect(action.type).toBe("postback");
            expect(action.label).toBe("整理券を使用する");
            expect(action.data).toBe(`action=useTicket&userId=${userId}`);

            // 呼び出し時の第3引数（ヘッダー）を検証
            const headers = axios.post.mock.calls[0][2].headers;
            expect(headers["Content-Type"]).toBe("application/json");
            expect(headers.Authorization).toBe("Bearer test-token");
        });

        test("APIエラー時に例外をキャッチして処理を続行する", async () => {
            // axiosのpostメソッドがエラーを投げるようにモック
            const errorResponse = {
                response: {
                    data: { message: "Invalid request" },
                    status: 400,
                },
            };
            axios.post.mockRejectedValue(errorResponse);

            // コンソールエラーをスパイ
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();

            // テスト用のパラメータ
            const userId = "test-user-id";

            // 関数を実行（エラーが発生しても関数は例外をスローしない）
            await messageUseCase.sendTicketUsageMessage(userId);

            // コンソールエラーが呼び出されたか検証
            expect(consoleSpy).toHaveBeenCalled();

            // スパイをリストア
            consoleSpy.mockRestore();
        });
    });
});
