import { UserDish } from '../../shared/types';
export declare const spinService: {
    /**
     * 执行一次转盘抽取
     * 策略：
     * 1. 查询用户启用菜品
     * 2. 排除今日已抽过的
     * 3. 套用偏好权重（如有画像数据）
     * 4. 随机选一
     * 5. 兜底：今日全部抽过则重置
     */
    spin(userId: number, method?: "wheel" | "random"): Promise<{
        dish: UserDish;
        category_name: string;
    }>;
    /** 写入历史记录 */
    saveHistory(userId: number, userDishId: number, aiText: string, method: string): Promise<number>;
};
