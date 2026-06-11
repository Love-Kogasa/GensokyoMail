/**
 * CharacterDB —— 角色名数据库
 * 提供 O(1) 精确查找 + 模糊搜索建议
 */
export class CharacterDB {
  /** @type {Set<string>} */
  #nameSet = new Set();

  /** @type {Map<string, string>} 别名 → 中文名 */
  #aliasMap = new Map();

  /** @type {Array<Object>} 原始数据 */
  #rawData = [];

  /**
   * @param {Array<Object>} nameData - name.json 的数据
   */
  init(nameData) {
    this.#rawData = nameData;
    this.#nameSet = new Set();
    this.#aliasMap = new Map();

    for (const entry of nameData) {
      const cn = entry['中文名'];
      for (const key of Object.keys(entry)) {
        const name = entry[key];
        if (name) {
          this.#nameSet.add(name);
          if (name !== cn) {
            this.#aliasMap.set(name, cn);
          }
        }
      }
    }
  }

  /**
   * 精确匹配角色名
   * @param {string} name
   * @returns {boolean}
   */
  exists(name) {
    return this.#nameSet.has(name);
  }

  /**
   * 模糊搜索 —— 找出所有包含输入的角色名
   * @param {string} partial
   * @returns {string[]}
   */
  search(partial) {
    const results = [];
    const lower = partial.toLowerCase();
    for (const name of this.#nameSet) {
      if (name.toLowerCase().includes(lower)) {
        results.push(name);
      }
    }
    return results.slice(0, 10); // 最多返回10个
  }

  /**
   * 获取原始数据（给其他地方遍历用）
   */
  get rawData() {
    return this.#rawData;
  }
}
