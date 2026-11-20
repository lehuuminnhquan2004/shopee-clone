export type Province = {
    id: number;
    code: string;
    name: string;
};

export type Ward = {
    id: number;
    provinceId: number;
    code: string;
    name: string;
};