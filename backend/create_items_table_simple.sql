-- 创建 items 表（简化版，不依赖迁移）
CREATE TABLE IF NOT EXISTS `items` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `title` varchar(200) NOT NULL,
    `description` longtext NULL,
    `type` varchar(95) NOT NULL,
    `due_date` datetime(6) NULL,
    `event_time` datetime(6) NULL,
    `reminder_time` datetime(6) NULL,
    `is_completed` tinyint(1) NOT NULL DEFAULT 0,
    `completed_at` datetime(6) NULL,
    `priority` varchar(20) NULL,
    `category` varchar(50) NULL,
    `parent_id` bigint NULL,
    `user_id` varchar(95) NOT NULL,
    `raw_input_id` varchar(95) NULL,
    `original_input` longtext NULL,
    `created_at` datetime(6) NOT NULL,
    `updated_at` datetime(6) NULL,
    PRIMARY KEY (`id`),
    KEY `IX_items_parent_id` (`parent_id`),
    KEY `IX_items_type` (`type`),
    KEY `IX_items_user_id` (`user_id`),
    KEY `IX_items_user_id_type` (`user_id`, `type`),
    CONSTRAINT `FK_items_items_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `items` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_items_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建 item_tags 表
CREATE TABLE IF NOT EXISTS `item_tags` (
    `item_id` bigint NOT NULL,
    `tag_id` bigint NOT NULL,
    `created_at` datetime(6) NOT NULL,
    PRIMARY KEY (`item_id`, `tag_id`),
    KEY `IX_item_tags_tag_id` (`tag_id`),
    CONSTRAINT `FK_item_tags_items_item_id` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_item_tags_tags_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 标记迁移为已应用
INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260121063925_InitialCreate', '8.0.0');

INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260122080640_AddItemsTable', '8.0.0');

SELECT 'Items tables created successfully!' as message;
