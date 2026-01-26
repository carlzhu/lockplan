-- 标记第一个迁移为已应用
INSERT IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion)
VALUES ('20260121063925_InitialCreate', '8.0.0');

-- 查看当前迁移状态
SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId;
