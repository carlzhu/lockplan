START TRANSACTION;

CREATE TABLE `items` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `description` longtext CHARACTER SET utf8mb4 NULL,
    `type` varchar(95) CHARACTER SET utf8mb4 NOT NULL,
    `due_date` datetime(6) NULL,
    `event_time` datetime(6) NULL,
    `reminder_time` datetime(6) NULL,
    `is_completed` tinyint(1) NOT NULL,
    `completed_at` datetime(6) NULL,
    `priority` varchar(20) CHARACTER SET utf8mb4 NULL,
    `category` varchar(50) CHARACTER SET utf8mb4 NULL,
    `parent_id` bigint NULL,
    `user_id` varchar(95) CHARACTER SET utf8mb4 NOT NULL,
    `raw_input_id` varchar(95) CHARACTER SET utf8mb4 NULL,
    `original_input` longtext CHARACTER SET utf8mb4 NULL,
    `created_at` datetime(6) NOT NULL,
    `updated_at` datetime(6) NULL,
    CONSTRAINT `PK_items` PRIMARY KEY (`id`),
    CONSTRAINT `FK_items_items_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `items` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_items_raw_inputs_raw_input_id` FOREIGN KEY (`raw_input_id`) REFERENCES `raw_inputs` (`id`),
    CONSTRAINT `FK_items_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `item_tags` (
    `item_id` bigint NOT NULL,
    `tag_id` bigint NOT NULL,
    `created_at` datetime(6) NOT NULL,
    CONSTRAINT `PK_item_tags` PRIMARY KEY (`item_id`, `tag_id`),
    CONSTRAINT `FK_item_tags_items_item_id` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_item_tags_tags_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_item_tags_tag_id` ON `item_tags` (`tag_id`);

CREATE INDEX `IX_items_parent_id` ON `items` (`parent_id`);

CREATE INDEX `IX_items_raw_input_id` ON `items` (`raw_input_id`);

CREATE INDEX `IX_items_type` ON `items` (`type`);

CREATE INDEX `IX_items_user_id` ON `items` (`user_id`);

CREATE INDEX `IX_items_user_id_type` ON `items` (`user_id`, `type`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260122080640_AddItemsTable', '8.0.0');

COMMIT;

