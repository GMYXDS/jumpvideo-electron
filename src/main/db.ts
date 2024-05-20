import Database from 'better-sqlite3'

class DatabaseHelper {
  db: any
  constructor(databasePath) {
    this.db = new Database(databasePath,{})
    this.createInfosTable()
  }

  // 创建infos表
  createInfosTable() {
    const sql = `CREATE TABLE IF NOT EXISTS infos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        uuid CHAR(36) UNIQUE,
                        detail TEXT
                    )`
    return this.db.exec(sql)
  }

  // 插入一条记录
  insertInfo(uuid, detail) {
    const stmt = this.db.prepare(`INSERT INTO infos (uuid, detail) VALUES (?, ?)`)
    return stmt.run(uuid, detail)
  }

  // 根据uuid删除记录
  deleteInfoByUUID(uuid) {
    const stmt = this.db.prepare(`DELETE FROM infos WHERE uuid = ?`)
    return stmt.run(uuid)
  }

  // 根据uuid查询记录
  getInfoByUUID(uuid) {
    const stmt = this.db.prepare(`SELECT * FROM infos WHERE uuid = ?`)
    return stmt.get(uuid)
  }

  // 获取所有记录
  getAllInfos() {
    const stmt = this.db.prepare(`SELECT * FROM infos`)
    return stmt.all()
  }

  // 关闭数据库连接
  close() {
    this.db.close()
  }
}

export default DatabaseHelper
