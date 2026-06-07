import { UserDish } from '../../shared/types';
export declare const dishService: {
    /** 获取用户菜品列表（带分类名） */
    list(userId: number, categoryId?: number): Promise<any[]>;
    /** 添加自定义菜品 */
    create(userId: number, data: {
        name: string;
        category_id: number;
        emoji?: string;
    }): Promise<UserDish>;
    /** 更新菜品（仅自定义菜品可改名/改分类） */
    update(userId: number, dishId: number, data: {
        name?: string;
        category_id?: number;
        emoji?: string;
        is_enabled?: number;
    }): Promise<void>;
    /** 删除（软删除） */
    remove(userId: number, dishId: number): Promise<void>;
    /** 从系统菜品库导入 */
    importSystem(userId: number, systemDishId: number): Promise<UserDish>;
    /** 批量导入系统默认菜品（新用户注册时调用） */
    importAllSystem(userId: number): Promise<UserDish[]>;
};
