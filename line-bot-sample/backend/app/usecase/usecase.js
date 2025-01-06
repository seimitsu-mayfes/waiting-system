// ユースケースの雛形
class UseCase {
  constructor({ repository, service }) {
    this.repository = repository; // データ層への依存
    this.service = service; // 外部サービスへの依存
  }

  /**
   * メインの処理を実行するメソッド
   * @param {Object} input - ユースケースへの入力
   * @returns {Object} - 実行結果
   */
  async execute(input) {
    try {
      // 1. 入力の検証
      this.validateInput(input);

      // 2. 必要なデータの取得
      const data = await this.repository.getData(input.id);

      // 3. ビジネスロジックの実行
      const result = this.service.performOperation(data);

      // 4. 必要に応じてデータの更新
      await this.repository.updateData(input.id, result);

      // 5. 結果を返却
      return { success: true, result };
    } catch (error) {
      console.error("UseCase execution failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 入力のバリデーションを行うメソッド
   * @param {Object} input - ユースケースへの入力
   */
  validateInput(input) {
    if (!input || typeof input.id !== "string") {
      throw new Error("Invalid input: id is required and should be a string.");
    }
  }
}

// サンプル: レポジトリの実装例
class Repository {
  async getData(id) {
    // データベースや外部APIからデータを取得する処理
    return { id, value: "example data" };
  }

  async updateData(id, data) {
    // データベースや外部APIにデータを更新する処理
    console.log(`Data with id ${id} updated to:`, data);
  }
}

// サンプル: サービスの実装例
class Service {
  performOperation(data) {
    // ビジネスロジックを実行
    return { ...data, value: data.value.toUpperCase() };
  }
}

// 使用例
(async () => {
  const repository = new Repository();
  const service = new Service();
  const useCase = new UseCase({ repository, service });

  const input = { id: "123" };
  const result = await useCase.execute(input);

  console.log("UseCase Result:", result);
})();
