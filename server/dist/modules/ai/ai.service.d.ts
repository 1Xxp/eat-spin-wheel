export declare const aiService: {
    /** 生成菜品推荐文案 */
    generateText(dishName: string, recentDishes?: string[], tone?: "funny" | "warm" | "poetic"): Promise<string>;
    /** 重新生成文案（清除缓存） */
    regenerate(dishName: string, recentDishes?: string[], tone?: "funny" | "warm" | "poetic"): Promise<string>;
};
export declare function generateLocalText(dishName: string, recentDishes?: string[], emoji?: string): string;
