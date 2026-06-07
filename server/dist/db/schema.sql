-- ============================================================
-- 每日吃什么大转盘 - 数据库建表语句
-- 数据库: eat_spin_wheel
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    openid          VARCHAR(64)   NOT NULL UNIQUE COMMENT '微信openid(模拟登录用code)',
    nickname        VARCHAR(64)   NOT NULL DEFAULT '' COMMENT '用户昵称',
    avatar_url       VARCHAR(512)  NOT NULL DEFAULT '' COMMENT '头像URL',
    status          TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1-正常 0-禁用',
    last_login_at   DATETIME      NULL COMMENT '最后登录时间',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_openid (openid),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

CREATE TABLE IF NOT EXISTS dish_categories (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    user_id         BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '用户ID(NULL=系统预置)',
    name            VARCHAR(32)   NOT NULL COMMENT '分类名称：夜宵、减脂、情侣等',
    icon            VARCHAR(10)   NOT NULL DEFAULT '🍽️' COMMENT '分类图标emoji',
    sort_order      INT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '排序权重',
    is_system       TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '1-系统预置 0-用户自建',
    is_deleted      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '软删除',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user (user_id),
    INDEX idx_system (is_system),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品分类表';

CREATE TABLE IF NOT EXISTS system_dishes (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '菜品ID',
    category_id     BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
    name            VARCHAR(64)   NOT NULL COMMENT '菜品名称',
    emoji           VARCHAR(10)   NOT NULL DEFAULT '🍽️' COMMENT '图标emoji',
    tags            JSON          NULL COMMENT '标签JSON，如["辣","快手"]',
    calories        INT UNSIGNED  NULL COMMENT '预估热量(kcal)',
    cook_time       INT UNSIGNED  NULL COMMENT '烹饪时间(分钟)',
    difficulty      TINYINT UNSIGNED NULL COMMENT '难度：1-简单 2-中等 3-困难',
    is_deleted      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '软删除',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category_id),
    INDEX idx_calories (calories),
    FOREIGN KEY (category_id) REFERENCES dish_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统菜品库';

CREATE TABLE IF NOT EXISTS user_dishes (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    user_id           BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    system_dish_id    BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '来源系统菜品ID(NULL=自定义)',
    category_id       BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
    name              VARCHAR(64)   NOT NULL COMMENT '菜品名称',
    emoji             VARCHAR(10)   NOT NULL DEFAULT '🍽️' COMMENT '图标emoji',
    tags              JSON          NULL COMMENT '自定义标签',
    is_custom         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '1-用户自创 0-系统导入',
    is_enabled        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1-启用 0-暂不出现在转盘',
    is_deleted        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '软删除',
    last_selected_at  DATETIME      NULL COMMENT '最近被抽中时间',
    spin_count        INT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '累计被抽中次数',
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_category (user_id, category_id),
    INDEX idx_user_enabled (user_id, is_enabled),
    INDEX idx_last_selected (user_id, last_selected_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (system_dish_id) REFERENCES system_dishes(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES dish_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户菜品表';

CREATE TABLE IF NOT EXISTS spin_history (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    user_id           BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    user_dish_id      BIGINT UNSIGNED NOT NULL COMMENT '抽中的用户菜品ID',
    method            ENUM('wheel','voice','random','ai_recommend') NOT NULL DEFAULT 'wheel' COMMENT '抽取方式',
    ai_text           VARCHAR(255)   NOT NULL DEFAULT '' COMMENT 'AI趣味文案',
    user_rating       TINYINT        NULL COMMENT '用户评分1-5，用于AI推荐',
    spun_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '抽取时间',
    created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_spun (user_id, spun_at),
    INDEX idx_user_dish (user_id, user_dish_id),
    INDEX idx_method (method),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_dish_id) REFERENCES user_dishes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='抽取记录表';

CREATE TABLE IF NOT EXISTS user_taste_profile (
    id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id               BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    taste_prefs           JSON          NULL COMMENT '口味偏好["辣","咸鲜"]',
    avoid_tastes          JSON          NULL COMMENT '忌口["香菜","内脏"]',
    weight_quick          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '快速解决权重0-100',
    weight_healthy        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '健康轻食权重0-100',
    weight_indulgent      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '放纵享受权重0-100',
    weight_social         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '社交聚餐权重0-100',
    avg_calories_pref     INT UNSIGNED  NULL COMMENT '平均偏好热量',
    top_category_ids      JSON          NULL COMMENT '最常选分类Top3',
    top_tags              JSON          NULL COMMENT '最常选标签Top5',
    prefer_lunch_time     TIME          NULL COMMENT '偏好午餐时段',
    prefer_dinner_time    TIME          NULL COMMENT '偏好晚餐时段',
    profile_version       SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '画像版本号',
    last_calculated_at    DATETIME      NULL COMMENT '画像最近计算时间',
    created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI推荐用户画像表';

CREATE TABLE IF NOT EXISTS ai_text_cache (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    dish_name     VARCHAR(64)   NOT NULL COMMENT '菜品名称',
    ai_text       VARCHAR(255)  NOT NULL COMMENT 'AI生成文案',
    tone          VARCHAR(16)   NOT NULL DEFAULT 'funny' COMMENT '风格：funny/warm/poetic',
    source        ENUM('openai','claude','local') NOT NULL DEFAULT 'claude' COMMENT 'AI来源',
    expire_at     DATETIME      NOT NULL COMMENT '过期时间',
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_dish_tone (dish_name, tone),
    INDEX idx_expire (expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI文案缓存表';
