export declare const config: {
    port: number;
    env: string;
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    claude: {
        apiKey: string;
        model: string;
    };
    openai: {
        apiKey: string;
        model: string;
    };
    deepseek: {
        apiKey: string;
        model: string;
        baseURL: string;
    };
    aiText: {
        provider: "claude" | "openai" | "deepseek" | "local";
        cacheHours: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
};
