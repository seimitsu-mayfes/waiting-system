import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [callNumber, setCallNumber] = useState(0);
  const [loading, setLoading] = useState(false);

  // 現在の呼出番号を取得
  useEffect(() => {
    axios.get("/api/callNumber").then((res) => setCallNumber(res.data.number));
  }, []);

  // 呼出番号をインクリメント
  const incrementCallNumber = async () => {
    setLoading(true);
    try {
      const res = await axios.put(
        "/call",
        { incrementBy: 1 },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_ADMIN_TOKEN}`,
          },
        }
      );
      setCallNumber(res.data.newCallNumber);
    } catch (error) {
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>現在の呼出番号: {callNumber}</h1>
      <button onClick={incrementCallNumber} disabled={loading}>
        {loading ? "更新中..." : "次の番号を呼び出す"}
      </button>
    </div>
  );
};

export default AdminDashboard;
