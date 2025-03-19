const express = require("express");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");
const messageUseCase = require("../usecase/messageUseCase");

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();

// 認証ミドルウェア
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token || token !== process.env.ADMIN_ACCESS_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// 呼出番号をインクリメントするAPI
router.put("/call", authenticate, async (req, res) => {
  try {
    const incrementBy = req.body.incrementBy || 1;

    // 現在の呼出番号を取得
    let callNumber = await prisma.callNumber.findUnique({ where: { id: 1 } });

    if (!callNumber) {
      callNumber = await prisma.callNumber.create({ data: { id: 1, number: 1 } });
    }

    // 呼出番号を更新
    const newCallNumber = callNumber.number + incrementBy;
    await prisma.callNumber.update({
      where: { id: 1 },
      data: { number: newCallNumber },
    });

    // 該当ユーザーを取得
    const profile = await prisma.profile.findUnique({
      where: { reservationNumber: newCallNumber },
    });

    // LINE通知を送信
    if (profile) {
      await messageUseCase.sendLinePushMessage(
        profile.userId,
        `呼び出し番号: ${newCallNumber} です。順番が来ました！`
      );
    }

    res.json({
      message: "呼出番号をインクリメントしました",
      newCallNumber,
    });
  } catch (error) {
    console.error("❌ API エラー:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
