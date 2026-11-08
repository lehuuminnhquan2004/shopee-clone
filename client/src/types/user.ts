export type User={
    id:string;
    email:string|null;
    phone:string|null;
    username:string;
    avatarUrl:string|null;
    role:'buyer' | 'seller' | 'admin';
}