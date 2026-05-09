/**
 * OTS 测试数据清理脚本
 *
 * 用途：删除调查表 survey_submissions 里的诊断/测试记录。
 *
 * 在 Mac 本地运行（不要部署到 FC）：
 *   1. 终端 cd 到 aliyun-fc/ 目录
 *   2. 准备一个有 OTS 写权限的 RAM 用户 AccessKey（或主账号 AK，仅本机临时使用）
 *   3. export ALIBABA_CLOUD_ACCESS_KEY_ID=xxx
 *      export ALIBABA_CLOUD_ACCESS_KEY_SECRET=xxx
 *      （子账号 AK 不需要 stsToken；如果你拿到的是 STS 临时凭证再加 ALIBABA_CLOUD_SECURITY_TOKEN）
 *   4. node clean_test_data.js
 *
 * 默认只清理下面 RECORD_IDS 里列的几条；不会删任何真实用户提交的数据。
 */

const TableStore = require("tablestore");

const ENDPOINT = "https://m026fekm931d.cn-hangzhou.ots.aliyuncs.com";
const INSTANCE_NAME = "m026fekm931d";
const TABLE_NAME = "survey_submissions";

// 只删这几条，确认无误后再扩
const RECORD_IDS = [
  "WF-TEST-001",       // 最早的端到端测试
  "WF-E2E-002",        // 部署后端到端验证
  "WF-1778296236140",  // 2026-05-09 排障时这次诊断写入的脏数据
];

(async () => {
  if (!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || !process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET) {
    console.error("❌ 缺少环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID / ALIBABA_CLOUD_ACCESS_KEY_SECRET");
    console.error("   先 export 再运行。详见本文件顶部注释。");
    process.exit(1);
  }

  const client = new TableStore.Client({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    stsToken: process.env.ALIBABA_CLOUD_SECURITY_TOKEN, // 可选
    endpoint: ENDPOINT,
    instancename: INSTANCE_NAME,
  });

  let ok = 0;
  let fail = 0;

  for (const id of RECORD_IDS) {
    try {
      // 先查一下，如果不存在就跳过
      const got = await client.getRow({
        tableName: TABLE_NAME,
        primaryKey: [{ record_id: id }],
        maxVersions: 1,
      });
      if (!got.row || !got.row.primaryKey) {
        console.log(`⏭️  ${id} 不存在，跳过`);
        continue;
      }

      await client.deleteRow({
        tableName: TABLE_NAME,
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null),
        primaryKey: [{ record_id: id }],
      });
      console.log(`✅ ${id} 已删除`);
      ok++;
    } catch (err) {
      console.error(`❌ ${id} 删除失败：${(err && err.message) || err}`);
      fail++;
    }
  }

  console.log(`\n汇总：成功 ${ok} / 失败 ${fail} / 共 ${RECORD_IDS.length}`);
  process.exit(fail > 0 ? 1 : 0);
})();
